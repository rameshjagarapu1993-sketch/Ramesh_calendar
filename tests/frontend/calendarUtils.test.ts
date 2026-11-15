import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOST_TIME_ZONE,
  parseSlotDateTime,
  parseSlotEnd,
  formatTimeInZone,
  formatDateInZone,
  slotRangeInZone,
  bookingWhenLabel,
  generateGoogleMeetLink,
  createGoogleCalendarUrl,
  createGmailComposeUrl,
  createMailtoUrl,
  generateIcsFileContent,
  getReminderTimeline,
} from '../../src/utils/calendarUtils';
import { Booking } from '../../src/types';

// Calendar links, .ics files, reminders and time-zone labels.
// All slot times are stored in IST (India); these tests check they become the right real moment.

const booking = (extra: Partial<Booking> = {}): Booking => ({
  id: 'bk-test-1',
  slotId: '2026-11-09_07-00',
  dateString: '2026-11-09', // Monday
  startTime: '07:00',
  endTime: '07:20',
  formattedTime: '7:00 AM - 7:20 AM',
  timeZone: 'America/New_York',
  clientName: 'Asha Rao',
  clientEmail: 'asha@example.com',
  topic: 'ai-architecture',
  topicTitle: 'AI Architecture',
  googleMeetLink: 'https://meet.google.com/abc-defg-hij',
  createdAt: '2026-11-01T00:00:00Z',
  reminders: { reminder24h: true, reminder1h: true, reminder10m: true },
  status: 'confirmed',
  ...extra,
});

test('host time zone is India', () => {
  assert.equal(HOST_TIME_ZONE, 'Asia/Kolkata');
});

test('night-owl slot crossing midnight: 23:40-00:00 ends 20 minutes later on the next day', () => {
  const start = parseSlotDateTime('2026-11-07', '23:40');
  const end = parseSlotEnd('2026-11-07', '23:40', '00:00');
  assert.equal(end.getTime() - start.getTime(), 20 * 60 * 1000);
  assert.equal(end.toISOString(), '2026-11-07T18:30:00.000Z'); // Sun 00:00 IST
});

test('night-owl slot after midnight: 01:40-02:00 is 20 minutes long', () => {
  const start = parseSlotDateTime('2026-11-07', '01:40');
  const end = parseSlotEnd('2026-11-07', '01:40', '02:00');
  assert.equal(end.getTime() - start.getTime(), 20 * 60 * 1000);
});

test('every slot of a weekend day lasts exactly 20 minutes', () => {
  const pairs = [['06:00', '06:20'], ['08:40', '09:00'], ['17:00', '17:20'], ['23:00', '23:20'], ['23:40', '00:00'], ['00:00', '00:20'], ['01:40', '02:00']];
  for (const [s, e] of pairs) {
    const ms = parseSlotEnd('2026-11-07', s, e).getTime() - parseSlotDateTime('2026-11-07', s).getTime();
    assert.equal(ms, 20 * 60 * 1000, `${s}-${e}`);
  }
});

test('time zone labels for learners around the world', () => {
  // Mon 07:00 IST = 01:30 UTC
  assert.equal(slotRangeInZone('2026-11-09', '07:00', '07:20', 'Europe/London'), '1:30 AM - 1:50 AM');
  assert.equal(slotRangeInZone('2026-11-09', '07:00', '07:20', 'America/Los_Angeles'), '5:30 PM - 5:50 PM');
  assert.equal(slotRangeInZone('2026-11-09', '07:00', '07:20', 'Asia/Singapore'), '9:30 AM - 9:50 AM');
  // A Monday-morning IST slot is still Sunday in the USA
  assert.equal(formatDateInZone(parseSlotDateTime('2026-11-09', '07:00'), 'America/New_York'), 'Sun, Nov 8');
  assert.equal(formatTimeInZone(new Date('2026-11-09T01:30:00Z'), 'Asia/Kolkata'), '7:00 AM');
});

test('bookingWhenLabel shows date, time and zone of the learner', () => {
  assert.equal(bookingWhenLabel(booking()), 'Sun, Nov 8 at 8:30 PM - 8:50 PM (America/New_York)');
  assert.equal(bookingWhenLabel(booking({ timeZone: 'Asia/Kolkata' })), 'Mon, Nov 9 at 7:00 AM - 7:20 AM (Asia/Kolkata)');
  // Missing zone falls back to India time
  assert.equal(bookingWhenLabel(booking({ timeZone: '' })), 'Mon, Nov 9 at 7:00 AM - 7:20 AM (Asia/Kolkata)');
});

test('demo Meet links look like real ones (xxx-yyyy-zzz)', () => {
  assert.match(generateGoogleMeetLink(), /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
  assert.equal(generateGoogleMeetLink('bk-1'), generateGoogleMeetLink('bk-1')); // same id -> same link
  assert.match(generateGoogleMeetLink('bk-1'), /^https:\/\/meet\.google\.com\/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/);
});

test('Google Calendar link contains title, Meet link and attendee', () => {
  const url = createGoogleCalendarUrl(booking());
  assert.ok(url.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
  const decoded = decodeURIComponent(url);
  assert.ok(decoded.includes('Asha Rao'));
  assert.ok(decoded.includes('https://meet.google.com/abc-defg-hij'));
  assert.ok(decoded.includes('asha@example.com,rameshjagarapu1993@gmail.com'));
});

test('mailto link goes to the learner with Ramesh in CC and the learner-zone time', () => {
  const url = createMailtoUrl(booking());
  assert.ok(url.startsWith('mailto:asha@example.com?cc=rameshjagarapu1993@gmail.com'));
  assert.ok(decodeURIComponent(url).includes('Sun, Nov 8 at 8:30 PM - 8:50 PM (America/New_York)'));
});

test('Gmail link includes company and notes when given', () => {
  const body = decodeURIComponent(createGmailComposeUrl(booking({ company: 'Acme', notes: 'RAG pipeline' })));
  assert.ok(body.includes('Organization: Acme'));
  assert.ok(body.includes('Agenda / Context: RAG pipeline'));
  const plain = decodeURIComponent(createGmailComposeUrl(booking()));
  assert.ok(!plain.includes('Organization:'));
});

test('.ics file is valid and uses UTC times with 3 reminders', () => {
  const ics = generateIcsFileContent(booking());
  const lines = ics.split('\r\n');
  assert.equal(lines[0], 'BEGIN:VCALENDAR');
  assert.equal(lines[lines.length - 1], 'END:VCALENDAR');
  assert.ok(lines.includes('DTSTART:20261109T013000Z'));
  assert.ok(lines.includes('DTEND:20261109T015000Z'));
  assert.ok(lines.includes('UID:bk-test-1@rameshj-consulting.com'));
  assert.ok(lines.includes('LOCATION:https://meet.google.com/abc-defg-hij'));
  for (const t of ['TRIGGER:-PT24H', 'TRIGGER:-PT1H', 'TRIGGER:-PT10M']) assert.ok(lines.includes(t), t);
  assert.equal(lines.filter((l) => l === 'BEGIN:VALARM').length, 3);
});

test('.ics for a night-owl slot ends on the next day', () => {
  const ics = generateIcsFileContent(booking({ dateString: '2026-11-07', startTime: '23:40', endTime: '00:00' }));
  assert.ok(ics.includes('DTSTART:20261107T181000Z'));
  assert.ok(ics.includes('DTEND:20261107T183000Z'));
});

test('reminder timeline is 24h, 1h and 10m before the session', () => {
  const t = getReminderTimeline('2026-11-09', '07:00');
  const start = Date.parse('2026-11-09T01:30:00Z');
  assert.equal(t.sessionTime.getTime(), start);
  assert.equal(t.reminder24h.time.getTime(), start - 24 * 3600e3);
  assert.equal(t.reminder1h.time.getTime(), start - 3600e3);
  assert.equal(t.reminder10m.time.getTime(), start - 10 * 60e3);
});
