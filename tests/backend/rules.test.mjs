import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGas } from '../../backend/mock-gas.mjs';
// More checks of backend/Code.gs (run against fake Google services). Run: npm run test:backend

let NOW = new Date('2026-11-04T06:00:00Z'); // Wed 11:30 IST
const now = () => NOW;
const OWNER = 'rameshjagarapu1993@gmail.com';
const SAT_0700 = '2026-11-07T01:30:00.000Z'; // Sat 07:00 IST
const req = (startIso, extra = {}) => ({ clientName: 'Asha', clientEmail: 'asha@example.com', topicTitle: 'AI', timeZone: 'Asia/Kolkata', startIso, ...extra });
const post = (g, body) => JSON.parse(g.ctx.doPost({ postData: { contents: JSON.stringify({ action: 'book', ...body }) } }).content);
const get = (g, parameter) => JSON.parse(g.ctx.doGet({ parameter }).content);

// ---- HTTP entry points ----

test('GET without action is a health check', () => {
  const r = get(loadGas(now), {});
  assert.equal(r.ok, true);
  assert.equal(r.service, 'ramesh-booking');
});

test('busy endpoint rejects bad dates and too-large ranges', () => {
  const g = loadGas(now);
  assert.equal(get(g, { action: 'busy', from: '2026/11/01', to: '2026-12-01' }).ok, false);
  assert.equal(get(g, { action: 'busy', from: '2026-11-01' }).ok, false);
  const big = get(g, { action: 'busy', from: '2026-01-01', to: '2026-12-31' });
  assert.equal(big.ok, false);
  assert.match(big.message, /Range too large/);
});

test('POST with unknown action or broken JSON returns an error, not a crash', () => {
  const g = loadGas(now);
  const unknown = JSON.parse(g.ctx.doPost({ postData: { contents: JSON.stringify({ action: 'hack' }) } }).content);
  assert.equal(unknown.error, 'UNKNOWN_ACTION');
  const quiet = console.error; console.error = () => {};
  try {
    const broken = JSON.parse(g.ctx.doPost({ postData: { contents: '{oops' } }).content);
    assert.equal(broken.error, 'SERVER_ERROR');
  } finally { console.error = quiet; }
  assert.equal(g.events.length, 0);
});

// ---- Booking validation ----

test('slots more than 120 days ahead are refused', () => {
  const g = loadGas(now);
  assert.equal(post(g, req('2027-02-27T01:30:00.000Z')).ok, true);          // Sat, ~115 days ahead
  const far = post(g, req('2027-03-06T01:30:00.000Z'));                      // Sat, ~122 days ahead
  assert.equal(far.error, 'INVALID');
  assert.match(far.message, /too far/);
});

test('a missing or garbage slot time is refused', () => {
  const g = loadGas(now);
  assert.equal(post(g, req('not-a-date')).error, 'INVALID');
  assert.equal(post(g, req(undefined)).error, 'INVALID');
  assert.equal(g.events.length, 0);
});

test('email is lower-cased and very long inputs are cut to safe lengths', () => {
  const g = loadGas(now);
  const r = post(g, req(SAT_0700, { clientName: 'A'.repeat(300), clientEmail: 'Big@Example.COM', notes: 'n'.repeat(5000) }));
  assert.equal(r.ok, true);
  const ev = g.events[0];
  assert.equal(ev.attendees[0].email, 'big@example.com');
  assert.equal(ev.attendees[0].displayName.length, 100);
  assert.ok(ev.description.length < 2000);
});

test('the event is a 20-minute Google Meet call in IST with the learner details saved', () => {
  const g = loadGas(now);
  post(g, req(SAT_0700, { company: 'Acme', timeZone: 'Europe/London' }));
  const ev = g.events[0];
  assert.equal(Date.parse(ev.end.dateTime) - Date.parse(ev.start.dateTime), 20 * 60 * 1000);
  assert.equal(ev.start.timeZone, 'Asia/Kolkata');
  assert.equal(ev.conferenceData.createRequest.conferenceSolutionKey.type, 'hangoutsMeet');
  const p = ev.extendedProperties.private;
  assert.equal(p.fdeBooking, '1');
  assert.equal(p.company, 'Acme');
  assert.equal(p.learnerTz, 'Europe/London');
});

// ---- What blocks a slot ----

test('all-day events (holidays, birthdays) do not block slots', () => {
  const g = loadGas(now);
  g.events.push({ id: 'h', allDay: true, start: { dateTime: '2026-11-06T18:30:00Z' }, end: { dateTime: '2026-11-07T18:30:00Z' } });
  assert.equal(post(g, req(SAT_0700)).ok, true);
});

test('events marked "Free" in Google Calendar do not block slots', () => {
  const g = loadGas(now);
  g.events.push({ id: 'f', transparency: 'TRANSPARENT', start: { dateTime: '2026-11-07T01:00:00Z' }, end: { dateTime: '2026-11-07T03:00:00Z' } });
  assert.equal(get(g, { action: 'busy', from: '2026-11-07', to: '2026-11-07' }).busy.length, 0);
  assert.equal(post(g, req(SAT_0700)).ok, true);
});

test('deleting the event in Google Calendar frees the slot and stops reminders', () => {
  const g = loadGas(now);
  assert.equal(post(g, req(SAT_0700)).ok, true);
  g.events[0].status = 'cancelled'; // Ramesh deleted it
  g.mails.length = 0;
  NOW = new Date(Date.parse(SAT_0700) - 50 * 60e3); // 50 min before = inside the 1-hour reminder window
  try {
    g.ctx.sendReminders();
    assert.equal(g.mails.length, 0);
  } finally { NOW = new Date('2026-11-04T06:00:00Z'); }
  assert.equal(post(g, req(SAT_0700, { clientEmail: 'next@example.com' })).ok, true);
});

test('an event right next to a slot does not block it (no overlap)', () => {
  const g = loadGas(now);
  // Busy 06:40-07:00 IST, then the 07:00 slot should still be free
  g.events.push({ id: 'b', start: { dateTime: '2026-11-07T01:10:00Z' }, end: { dateTime: '2026-11-07T01:30:00Z' } });
  assert.equal(post(g, req(SAT_0700)).ok, true);
});

// ---- Emails ----

test('learner email shows India time too when the learner is abroad', () => {
  const abroad = loadGas(now);
  post(abroad, req(SAT_0700, { timeZone: 'America/New_York' }));
  assert.ok(abroad.mails[0].htmlBody.includes('India time'));

  const india = loadGas(now);
  post(india, req(SAT_0700, { timeZone: 'Asia/Kolkata' }));
  assert.ok(!india.mails[0].htmlBody.includes('India time'));
});

test('replies go to the right person: learner -> Ramesh, Ramesh -> learner', () => {
  const g = loadGas(now);
  post(g, req(SAT_0700));
  const [learner, owner] = g.mails;
  assert.equal(learner.replyTo, OWNER);
  assert.equal(owner.replyTo, 'asha@example.com');
  assert.match(owner.subject, /^New booking: Asha/);
});

test('reminders are only sent for events made by the booking page', () => {
  const g = loadGas(now);
  // A personal meeting in the calendar with no booking marker
  g.events.push({ id: 'p', start: { dateTime: SAT_0700 }, end: { dateTime: '2026-11-07T02:00:00Z' } });
  NOW = new Date(Date.parse(SAT_0700) - 50 * 60e3);
  try {
    g.ctx.sendReminders();
    assert.equal(g.mails.length, 0);
  } finally { NOW = new Date('2026-11-04T06:00:00Z'); }
});

test('old "reminder sent" records are cleaned up after 3 days', () => {
  const g = loadGas(now);
  g.props.set('sent_old_1h', String(NOW.getTime() - 4 * 86400e3));
  g.props.set('sent_recent_1h', String(NOW.getTime() - 3600e3));
  g.props.set('other_setting', '1');
  g.ctx.sendReminders();
  assert.equal(g.props.has('sent_old_1h'), false);
  assert.equal(g.props.has('sent_recent_1h'), true);
  assert.equal(g.props.has('other_setting'), true);
});
