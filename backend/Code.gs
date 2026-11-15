/**
 * Ramesh J – Booking backend (Google Apps Script, runs on your own Google account)
 *
 * What it does when a learner books a slot:
 *   1. Locks the slot (no double bookings, even if two people click at once)
 *   2. Checks your real Google Calendar – any busy event blocks the slot
 *   3. Creates the event in YOUR Google Calendar with a REAL Google Meet link
 *   4. Adds the learner as a guest (Google also sends them a calendar invite)
 *   5. Emails BOTH you and the learner immediately, with the Meet link
 *   6. Sends reminder emails 24h, 1h and 10 min before (via a 5-minute trigger)
 *
 * Cancelling: just delete the event from your Google Calendar. The slot frees up
 * automatically and no further reminders are sent.
 *
 * Setup steps: see backend/SETUP.md
 */

// ===================== CONFIG =====================
const OWNER_NAME  = 'Ramesh J';
const OWNER_EMAIL = 'rameshjagarapu1993@gmail.com';
const OWNER_TITLE = 'Forward Deployed Engineer (FDE) Consultant & AI Corporate Trainer';
// Public URL of your photo, e.g. 'https://your-site.vercel.app/ramesh.jpg' (leave '' to show initials)
const PHOTO_URL   = '';
const CALENDAR_ID = 'primary';
const TZ          = 'Asia/Kolkata';
const SLOT_MINUTES = 20;
const MAX_DAYS_AHEAD = 120;
// ==================================================

/** IST availability windows in minutes-from-midnight, keyed by IST day of week (0=Sun). */
function allowedWindows_(dow) {
  const W = [];
  const weekday = dow >= 1 && dow <= 5;
  const weekend = dow === 0 || dow === 6;
  if (weekday) { W.push([7 * 60, 8 * 60], [18 * 60, 19 * 60]); }
  if (weekend) { W.push([6 * 60, 9 * 60], [17 * 60, 20 * 60], [23 * 60, 24 * 60]); }
  // 00:00–02:00 belongs to the previous night's weekend "Night Owl" session (Sat night -> Sun, Sun night -> Mon)
  if (dow === 0 || dow === 1) { W.push([0, 2 * 60]); }
  return W;
}

function isValidSlot_(start) {
  const dow = Number(Utilities.formatDate(start, TZ, 'u')) % 7; // 'u' = 1..7 (Mon..Sun)
  const hh = Number(Utilities.formatDate(start, TZ, 'H'));
  const mm = Number(Utilities.formatDate(start, TZ, 'm'));
  const mins = hh * 60 + mm;
  if (mm % SLOT_MINUTES !== 0) return false;
  return allowedWindows_(dow).some(([a, b]) => mins >= a && mins + SLOT_MINUTES <= b);
}

// ---------------- HTTP entry points ----------------

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.action === 'busy') return json_({ ok: true, busy: getBusy_(p.from, p.to) });
    return json_({ ok: true, service: 'ramesh-booking', time: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: 'SERVER_ERROR', message: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'book') return json_(book_(body));
    return json_({ ok: false, error: 'UNKNOWN_ACTION' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'SERVER_ERROR', message: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------- Availability ----------------

/** Returns busy intervals [{start,end}] (ISO UTC) from your calendar between two YYYY-MM-DD dates. */
function getBusy_(from, to) {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(from || '') || !re.test(to || '')) throw new Error('from/to must be YYYY-MM-DD');
  const start = new Date(from + 'T00:00:00+05:30');
  const end = new Date(new Date(to + 'T00:00:00+05:30').getTime() + 26 * 3600 * 1000); // include night-owl spillover
  if (end - start > 70 * 86400000) throw new Error('Range too large');
  return CalendarApp.getCalendarById(CALENDAR_ID).getEvents(start, end)
    .filter(isBlocking_)
    .map(ev => ({ start: ev.getStartTime().toISOString(), end: ev.getEndTime().toISOString() }));
}

function isBlocking_(ev) {
  if (ev.isAllDayEvent()) return false;
  try {
    if (ev.getMyStatus && ev.getMyStatus() === CalendarApp.GuestStatus.NO) return false;
    if (ev.getTransparency && ev.getTransparency() === CalendarApp.EventTransparency.TRANSPARENT) return false;
  } catch (e) { /* older runtimes */ }
  return true;
}

// ---------------- Booking ----------------

function book_(b) {
  const name = String(b.clientName || '').trim().slice(0, 100);
  const email = String(b.clientEmail || '').trim().toLowerCase().slice(0, 200);
  const company = String(b.company || '').trim().slice(0, 150);
  const topicTitle = String(b.topicTitle || 'Consultation').trim().slice(0, 150);
  const notes = String(b.notes || '').trim().slice(0, 1500);
  const learnerTz = String(b.timeZone || TZ).slice(0, 60);
  const reminders = b.reminders || { reminder24h: true, reminder1h: true, reminder10m: true };

  if (!name) return { ok: false, error: 'INVALID', message: 'Name is required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'INVALID', message: 'A valid email is required.' };

  const start = new Date(b.startIso);
  if (isNaN(start)) return { ok: false, error: 'INVALID', message: 'Invalid slot time.' };
  const end = new Date(start.getTime() + SLOT_MINUTES * 60000);
  const now = new Date();
  if (start <= now) return { ok: false, error: 'PAST', message: 'That slot has already started.' };
  if (start - now > MAX_DAYS_AHEAD * 86400000) return { ok: false, error: 'INVALID', message: 'Slot too far ahead.' };
  if (!isValidSlot_(start)) return { ok: false, error: 'INVALID', message: 'That time is outside the booking hours.' };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'BUSY', message: 'Server busy, please try again.' };
  try {
    const cal = CalendarApp.getCalendarById(CALENDAR_ID);
    const clash = cal.getEvents(start, end).filter(isBlocking_);
    if (clash.length) return { ok: false, error: 'SLOT_TAKEN', message: 'Sorry, that slot was just booked. Please pick another.' };

    const description = [
      'Topic: ' + topicTitle,
      'Learner: ' + name + ' <' + email + '>' + (company ? ' – ' + company : ''),
      notes ? 'Notes: ' + notes : '',
      '',
      'Booked via Ramesh J booking page.',
    ].filter(x => x !== null).join('\n');

    const event = Calendar.Events.insert({
      summary: '20-min call: ' + OWNER_NAME + ' × ' + name,
      description: description,
      start: { dateTime: start.toISOString(), timeZone: TZ },
      end: { dateTime: end.toISOString(), timeZone: TZ },
      attendees: [{ email: email, displayName: name }],
      conferenceData: {
        createRequest: { requestId: Utilities.getUuid(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
      reminders: { useDefault: false, overrides: [
        { method: 'popup', minutes: 60 }, { method: 'popup', minutes: 10 },
      ] },
      extendedProperties: { private: {
        fdeBooking: '1', learnerName: name, learnerEmail: email, learnerTz: learnerTz,
        topicTitle: topicTitle, company: company,
        r24: reminders.reminder24h === false ? '0' : '1',
        r1: reminders.reminder1h === false ? '0' : '1',
        r10: reminders.reminder10m === false ? '0' : '1',
      } },
    }, CALENDAR_ID, { conferenceDataVersion: 1, sendUpdates: 'all' });

    let meetLink = event.hangoutLink || '';
    for (let i = 0; !meetLink && i < 5; i++) {         // Meet room can take a moment to be created
      Utilities.sleep(800);
      meetLink = (Calendar.Events.get(CALENDAR_ID, event.id).hangoutLink) || '';
    }

    const info = { name, email, company, topicTitle, notes, start, end, learnerTz, meetLink, eventLink: event.htmlLink };
    sendEmail_(email, 'Confirmed: your 20-min session with ' + OWNER_NAME, learnerEmailHtml_(info, 'confirm'), OWNER_EMAIL);
    sendEmail_(OWNER_EMAIL, 'New booking: ' + name + ' – ' + fmt_(start, TZ), ownerEmailHtml_(info), email);

    return { ok: true, eventId: event.id, meetLink: meetLink, eventLink: event.htmlLink };
  } finally {
    lock.releaseLock();
  }
}

// ---------------- Reminders (runs every 5 minutes) ----------------

function sendReminders() {
  const now = new Date();
  const res = Calendar.Events.list(CALENDAR_ID, {
    timeMin: now.toISOString(),
    timeMax: new Date(now.getTime() + 25 * 3600000).toISOString(),
    singleEvents: true, privateExtendedProperty: 'fdeBooking=1', maxResults: 100,
  });
  const props = PropertiesService.getScriptProperties();
  (res.items || []).forEach(ev => {
    if (ev.status === 'cancelled') return;
    const p = (ev.extendedProperties && ev.extendedProperties.private) || {};
    const start = new Date(ev.start.dateTime);
    const minsLeft = (start - now) / 60000;
    let kind = null;
    if (p.r24 !== '0' && minsLeft <= 24 * 60 && minsLeft > 23 * 60) kind = '24h';
    else if (p.r1 !== '0' && minsLeft <= 60 && minsLeft > 45) kind = '1h';
    else if (p.r10 !== '0' && minsLeft <= 12 && minsLeft > 0) kind = '10m';
    if (!kind) return;
    const key = 'sent_' + ev.id + '_' + kind;
    if (props.getProperty(key)) return;
    const info = {
      name: p.learnerName, email: p.learnerEmail, company: p.company, topicTitle: p.topicTitle,
      start: start, end: new Date(ev.end.dateTime), learnerTz: p.learnerTz || TZ,
      meetLink: ev.hangoutLink || '', eventLink: ev.htmlLink,
    };
    const label = { '24h': 'tomorrow', '1h': 'in 1 hour', '10m': 'in 10 minutes' }[kind];
    sendEmail_(info.email, 'Reminder: your session with ' + OWNER_NAME + ' starts ' + label,
      learnerEmailHtml_(info, kind), OWNER_EMAIL);
    if (kind !== '24h') {
      sendEmail_(OWNER_EMAIL, 'Starting ' + label + ': ' + info.name, ownerEmailHtml_(info, label), info.email);
    }
    props.setProperty(key, String(Date.now()));
  });
  cleanupProps_(props);
}

function cleanupProps_(props) {
  const all = props.getProperties();
  const cutoff = Date.now() - 3 * 86400000;
  Object.keys(all).forEach(k => { if (k.indexOf('sent_') === 0 && Number(all[k]) < cutoff) props.deleteProperty(k); });
}

// ---------------- Email templates ----------------

function sendEmail_(to, subject, html, replyTo) {
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: html, name: OWNER_NAME, replyTo: replyTo });
}

function fmt_(d, tz) {
  return Utilities.formatDate(d, tz, "EEE, d MMM yyyy 'at' h:mm a") + ' (' + tz + ')';
}

function esc_(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function avatarHtml_() {
  return PHOTO_URL
    ? '<img src="' + esc_(PHOTO_URL) + '" width="56" height="56" alt="' + OWNER_NAME + '" style="border-radius:50%;display:block;object-fit:cover">'
    : '<div style="width:56px;height:56px;border-radius:50%;background:#4f46e5;color:#fff;font:700 20px Arial;line-height:56px;text-align:center">RJ</div>';
}

function shell_(inner) {
  return '<div style="background:#f1f5f9;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f172a">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">' +
    '<div style="background:#0f172a;padding:20px 24px"><table role="presentation"><tr><td>' + avatarHtml_() +
    '</td><td style="padding-left:14px;color:#fff"><div style="font-size:18px;font-weight:700">' + OWNER_NAME +
    '</div><div style="font-size:12px;color:#94a3b8">' + OWNER_TITLE + '</div></td></tr></table></div>' +
    '<div style="padding:24px">' + inner + '</div></div></div>';
}

function meetButton_(link) {
  if (!link) return '<p style="color:#b45309">The Google Meet link is in your Google Calendar invite.</p>';
  return '<p style="margin:22px 0"><a href="' + esc_(link) + '" style="background:#2563eb;color:#fff;text-decoration:none;' +
    'padding:12px 22px;border-radius:10px;font-weight:700;display:inline-block">Join Google Meet</a></p>' +
    '<p style="font-size:13px;color:#475569">Meet link: <a href="' + esc_(link) + '">' + esc_(link) + '</a></p>';
}

function detailsTable_(i, tz) {
  const row = (k, v) => '<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;white-space:nowrap">' + k +
    '</td><td style="padding:6px 0;font-size:14px;font-weight:600">' + v + '</td></tr>';
  return '<table role="presentation" style="border-collapse:collapse;margin-top:8px">' +
    row('When', esc_(fmt_(i.start, tz))) +
    (tz !== TZ ? row('India time', esc_(fmt_(i.start, TZ))) : '') +
    row('Duration', SLOT_MINUTES + ' minutes') +
    row('Topic', esc_(i.topicTitle)) + '</table>';
}

function learnerEmailHtml_(i, kind) {
  const heading = {
    confirm: 'Your session is confirmed',
    '24h': 'See you tomorrow',
    '1h': 'Your session starts in 1 hour',
    '10m': 'Starting in 10 minutes. Join now',
  }[kind];
  return shell_('<h2 style="margin:0 0 6px;font-size:20px">' + heading + '</h2>' +
    '<p style="margin:0;font-size:14px;color:#334155">Hi ' + esc_(i.name) + ', ' +
    (kind === 'confirm' ? 'thanks for booking a 20-minute 1-on-1 with ' + OWNER_NAME + '.' : 'a quick reminder about your call with ' + OWNER_NAME + '.') +
    '</p>' + detailsTable_(i, i.learnerTz) + meetButton_(i.meetLink) +
    (kind === 'confirm' ? '<p style="font-size:13px;color:#475569">You will also receive a Google Calendar invitation. ' +
      'Reminders will arrive 24 hours, 1 hour and 10 minutes before the call.<br>Need to reschedule? Just reply to this email.</p>' : ''));
}

function ownerEmailHtml_(i, label) {
  return shell_('<h2 style="margin:0 0 6px;font-size:20px">' + (label ? 'Starting ' + esc_(label) : 'New booking') + '</h2>' +
    '<p style="margin:0;font-size:14px"><b>' + esc_(i.name) + '</b> &lt;' + esc_(i.email) + '&gt;' +
    (i.company ? ' · ' + esc_(i.company) : '') + '</p>' + detailsTable_(i, TZ) +
    (i.learnerTz && i.learnerTz !== TZ ? '<p style="font-size:13px;color:#64748b">Learner\'s time zone: ' + esc_(i.learnerTz) + '</p>' : '') +
    (i.notes ? '<p style="font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px"><b>Notes:</b> ' + esc_(i.notes) + '</p>' : '') +
    meetButton_(i.meetLink) +
    (i.eventLink ? '<p style="font-size:13px"><a href="' + esc_(i.eventLink) + '">Open in Google Calendar</a> (delete the event there to cancel).</p>' : ''));
}

// ---------------- One-time setup & tests (run from the editor) ----------------

/** Run once: grants permissions and installs the 5-minute reminder trigger. */
function setup() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendReminders')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendReminders').timeBased().everyMinutes(5).create();
  CalendarApp.getCalendarById(CALENDAR_ID).getName();
  console.log('Setup complete. Remaining email quota today: ' + MailApp.getRemainingDailyQuota());
}

/** Run from the editor to see a real test booking end to end (creates an event next weekend; delete it after). */
function testBooking() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); // next Saturday
  const ymd = Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  const res = book_({
    clientName: 'Test Learner', clientEmail: OWNER_EMAIL, topicTitle: 'Test booking',
    startIso: new Date(ymd + 'T08:40:00+05:30').toISOString(), timeZone: TZ,
  });
  console.log(JSON.stringify(res, null, 2));
}
