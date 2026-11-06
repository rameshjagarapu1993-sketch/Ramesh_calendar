import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSlotsForDate,
  formatTime12h,
  formatSlotRange,
  isWeekendDay
} from './slotGenerator';
import {
  generateGoogleMeetLink,
  generateIcsFileContent,
  createGoogleCalendarUrl,
  createGmailComposeUrl,
  createMailtoUrl,
} from './calendarUtils';
import { Booking } from '../types';
import { DEFAULT_EMAIL_SETTINGS } from './storage';

test('isWeekendDay detects weekdays and weekends correctly', () => {
  // 2026-11-02 is Monday (weekday)
  assert.equal(isWeekendDay('2026-11-02'), false);
  // 2026-11-06 is Friday (weekday)
  assert.equal(isWeekendDay('2026-11-06'), false);
  // 2026-11-07 is Saturday (weekend)
  assert.equal(isWeekendDay('2026-11-07'), true);
  // 2026-11-08 is Sunday (weekend)
  assert.equal(isWeekendDay('2026-11-08'), true);
});

test('Weekday slots: exactly 7-8 AM and 6-7 PM in 20-min intervals (total 6 slots)', () => {
  // Monday 2026-11-02
  const fixedNow = new Date('2026-11-01T00:00:00'); // past reference
  const slots = generateSlotsForDate('2026-11-02', [], fixedNow);

  assert.equal(slots.length, 6, 'Weekday must have exactly 6 twenty-minute slots');

  const morningSlots = slots.filter((s) => s.period === 'morning');
  const eveningSlots = slots.filter((s) => s.period === 'evening');

  assert.equal(morningSlots.length, 3, 'Morning must have 3 slots: 7:00-7:20, 7:20-7:40, 7:40-8:00');
  assert.equal(eveningSlots.length, 3, 'Evening must have 3 slots: 18:00-18:20, 18:20-18:40, 18:40-19:00');

  assert.equal(morningSlots[0].startTime, '07:00');
  assert.equal(morningSlots[0].endTime, '07:20');
  assert.equal(morningSlots[1].startTime, '07:20');
  assert.equal(morningSlots[1].endTime, '07:40');
  assert.equal(morningSlots[2].startTime, '07:40');
  assert.equal(morningSlots[2].endTime, '08:00');

  assert.equal(eveningSlots[0].startTime, '18:00');
  assert.equal(eveningSlots[0].endTime, '18:20');
  assert.equal(eveningSlots[1].startTime, '18:20');
  assert.equal(eveningSlots[1].endTime, '18:40');
  assert.equal(eveningSlots[2].startTime, '18:40');
  assert.equal(eveningSlots[2].endTime, '19:00');
});

test('Weekend slots: 6-9 AM, 5-8 PM, and 11 PM - 2 AM in 20-min intervals (total 27 slots)', () => {
  // Saturday 2026-11-07
  const fixedNow = new Date('2026-11-01T00:00:00');
  const slots = generateSlotsForDate('2026-11-07', [], fixedNow);

  // 6-9 AM is 3 hours = 9 slots
  // 5-8 PM (17-20) is 3 hours = 9 slots
  // 11 PM - 2 AM (23-02) is 3 hours = 9 slots
  // Total = 27 slots
  assert.equal(slots.length, 27, 'Weekend must have exactly 27 twenty-minute slots');

  const morning = slots.filter((s) => s.period === 'morning');
  const evening = slots.filter((s) => s.period === 'evening');
  const night = slots.filter((s) => s.period === 'night');

  assert.equal(morning.length, 9);
  assert.equal(evening.length, 9);
  assert.equal(night.length, 9);

  // Check first and last morning slot
  assert.equal(morning[0].startTime, '06:00');
  assert.equal(morning[0].endTime, '06:20');
  assert.equal(morning[8].startTime, '08:40');
  assert.equal(morning[8].endTime, '09:00');

  // Check first and last evening slot
  assert.equal(evening[0].startTime, '17:00');
  assert.equal(evening[0].endTime, '17:20');
  assert.equal(evening[8].startTime, '19:40');
  assert.equal(evening[8].endTime, '20:00');

  // Check night slots across midnight
  assert.equal(night[0].startTime, '23:00');
  assert.equal(night[0].endTime, '23:20');
  assert.equal(night[2].startTime, '23:40');
  assert.equal(night[2].endTime, '00:00');
  assert.equal(night[8].startTime, '01:40');
  assert.equal(night[8].endTime, '02:00');
});

test('Booking conflict detection marks slot as booked', () => {
  const dummyBooking: Booking = {
    id: 'bk-123',
    slotId: '2026-11-02_07-20',
    dateString: '2026-11-02',
    startTime: '07:20',
    endTime: '07:40',
    formattedTime: '7:20 AM - 7:40 AM',
    timeZone: 'Asia/Kolkata',
    clientName: 'Alex Mercer',
    clientEmail: 'alex@example.com',
    topic: 'fde-consulting',
    topicTitle: 'Forward Deployed Engineering Advisory',
    googleMeetLink: 'https://meet.google.com/abc-defg-hij',
    createdAt: '2026-11-01T10:00:00Z',
    reminders: {
      reminder24h: true,
      reminder1h: true,
      reminder10m: true
    },
    status: 'confirmed'
  };

  const slots = generateSlotsForDate('2026-11-02', [dummyBooking], new Date('2026-11-01T00:00:00'));
  
  const slot0700 = slots.find((s) => s.startTime === '07:00');
  const slot0720 = slots.find((s) => s.startTime === '07:20');

  assert.equal(slot0700?.isBooked, false);
  assert.equal(slot0720?.isBooked, true);
});

test('Google Meet link generation and ICS calendar output', () => {
  const meetLink = generateGoogleMeetLink('test-booking-id');
  assert.match(meetLink, /^https:\/\/meet\.google\.com\/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/);

  const sampleBooking: Booking = {
    id: 'test-ics-id',
    slotId: '2026-11-02_18-00',
    dateString: '2026-11-02',
    startTime: '18:00',
    endTime: '18:20',
    formattedTime: '6:00 PM - 6:20 PM',
    timeZone: 'Asia/Kolkata',
    clientName: 'Sarah Connor',
    clientEmail: 'sarah@skynet.ai',
    topic: 'ai-architecture',
    topicTitle: 'AI Architecture & Agentic Systems',
    company: 'Skynet Research',
    notes: 'Review LLM evaluation pipeline',
    googleMeetLink: meetLink,
    createdAt: '2026-11-01T12:00:00Z',
    reminders: { reminder24h: true, reminder1h: true, reminder10m: true },
    status: 'confirmed'
  };

  const ics = generateIcsFileContent(sampleBooking);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('SUMMARY:Consultation: Ramesh J & Sarah Connor'));
  assert.ok(ics.includes('LOCATION:' + meetLink));
  assert.ok(ics.includes('TRIGGER:-PT24H'));
  assert.ok(ics.includes('TRIGGER:-PT1H'));
  assert.ok(ics.includes('TRIGGER:-PT10M'));
  assert.ok(ics.includes('END:VCALENDAR'));

  const gcalUrl = createGoogleCalendarUrl(sampleBooking);
  assert.ok(gcalUrl.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
  assert.ok(gcalUrl.includes(encodeURIComponent(meetLink)));
  assert.ok(gcalUrl.includes(encodeURIComponent('sarah@skynet.ai')));

  // Test Gmail direct composer
  const gmailUrl = createGmailComposeUrl(sampleBooking);
  assert.ok(gmailUrl.startsWith('https://mail.google.com/mail/?view=cm'));
  assert.ok(gmailUrl.includes(encodeURIComponent('sarah@skynet.ai')));
  assert.ok(gmailUrl.includes(encodeURIComponent(meetLink)));

  // Test mailto URL
  const mailtoUrl = createMailtoUrl(sampleBooking);
  assert.ok(mailtoUrl.startsWith('mailto:sarah@skynet.ai'));
  assert.ok(mailtoUrl.includes(encodeURIComponent(meetLink)));
});

test('Email settings storage and defaults', () => {
  assert.strictEqual(DEFAULT_EMAIL_SETTINGS.smtpPort, 587);
  assert.strictEqual(DEFAULT_EMAIL_SETTINGS.smtpUser, 'rameshjagarapu1993@gmail.com');
  assert.strictEqual(DEFAULT_EMAIL_SETTINGS.autoOpenGmailOnBooking, true);
});

