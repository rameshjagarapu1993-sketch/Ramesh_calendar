import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getStoredBookings,
  saveBooking,
  cancelBooking,
  deleteBooking,
  getStoredProfile,
  DEFAULT_PROFILE,
  getStoredEmailSettings,
  saveEmailSettings,
  DEFAULT_EMAIL_SETTINGS,
  getStoredHostPin,
  saveHostPin,
  DEFAULT_HOST_PIN,
  getStoredHostAuth,
  setStoredHostAuth,
} from '../../src/utils/storage';
import { Booking } from '../../src/types';

// Browser storage (localStorage): bookings, host PIN/login and email settings.
// Node has no browser, so each test gets a fresh in-memory localStorage.

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });
});

const BOOKINGS_KEY = 'ramesh_fde_calendar_bookings';

const booking = (id: string, extra: Partial<Booking> = {}): Booking => ({
  id,
  slotId: `2026-11-09_07-00`,
  dateString: '2026-11-09',
  startTime: '07:00',
  endTime: '07:20',
  formattedTime: '7:00 AM - 7:20 AM',
  timeZone: 'Asia/Kolkata',
  clientName: 'Asha',
  clientEmail: 'asha@example.com',
  topic: 'other',
  topicTitle: 'Chat',
  googleMeetLink: 'https://meet.google.com/abc-defg-hij',
  createdAt: '2026-11-01T00:00:00Z',
  reminders: { reminder24h: true, reminder1h: true, reminder10m: true },
  status: 'confirmed',
  ...extra,
});

test('a new visitor has no bookings (no fake demo bookings)', () => {
  assert.deepEqual(getStoredBookings(), []);
});

test('old fake demo bookings are removed, real ones kept', () => {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify([booking('bk-demo-01'), booking('bk-demo-02'), booking('bk-real')]));
  assert.deepEqual(getStoredBookings().map((b) => b.id), ['bk-real']);
});

test('broken or wrong-shaped storage data does not crash the site', () => {
  localStorage.setItem(BOOKINGS_KEY, '{not json');
  assert.deepEqual(getStoredBookings(), []);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify({ not: 'an array' }));
  assert.deepEqual(getStoredBookings(), []);
});

test('save puts the newest booking first and replaces one with the same id', () => {
  saveBooking(booking('a'));
  saveBooking(booking('b'));
  assert.deepEqual(getStoredBookings().map((b) => b.id), ['b', 'a']);
  saveBooking(booking('a', { clientName: 'Changed' }));
  const all = getStoredBookings();
  assert.equal(all.length, 2);
  assert.equal(all[0].id, 'a');
  assert.equal(all[0].clientName, 'Changed');
});

test('cancel keeps the booking but marks it cancelled; delete removes it', () => {
  saveBooking(booking('a'));
  saveBooking(booking('b'));
  cancelBooking('a');
  assert.equal(getStoredBookings().find((b) => b.id === 'a')?.status, 'cancelled');
  assert.equal(getStoredBookings().find((b) => b.id === 'b')?.status, 'confirmed');
  deleteBooking('a');
  assert.deepEqual(getStoredBookings().map((b) => b.id), ['b']);
});

test('profile falls back to defaults and keeps the photo if a saved one has none', () => {
  assert.deepEqual(getStoredProfile(), DEFAULT_PROFILE);
  localStorage.setItem('ramesh_fde_calendar_profile', JSON.stringify({ title: 'New title', avatarUrl: '' }));
  const p = getStoredProfile();
  assert.equal(p.title, 'New title');
  assert.equal(p.avatarUrl, DEFAULT_PROFILE.avatarUrl);
  assert.equal(p.name, 'Ramesh J');
});

test('email settings: defaults, then saved values merged over defaults', () => {
  assert.equal(DEFAULT_EMAIL_SETTINGS.smtpPort, 587);
  assert.equal(DEFAULT_EMAIL_SETTINGS.smtpUser, 'rameshjagarapu1993@gmail.com');
  assert.deepEqual(getStoredEmailSettings(), DEFAULT_EMAIL_SETTINGS);
  saveEmailSettings({ ...DEFAULT_EMAIL_SETTINGS, resendApiKey: 're_test' });
  assert.equal(getStoredEmailSettings().resendApiKey, 're_test');
  assert.equal(getStoredEmailSettings().smtpPort, 587);
});

test('host PIN: default 1993, can be changed, spaces trimmed', () => {
  assert.equal(DEFAULT_HOST_PIN, '1993');
  assert.equal(getStoredHostPin(), '1993');
  saveHostPin('  4321 ');
  assert.equal(getStoredHostPin(), '4321');
});

test('host login state can be turned on and off', () => {
  assert.equal(getStoredHostAuth(), false);
  setStoredHostAuth(true);
  assert.equal(getStoredHostAuth(), true);
  setStoredHostAuth(false);
  assert.equal(getStoredHostAuth(), false);
});

test('when the browser blocks storage, everything falls back safely', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } },
  });
  const quiet = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(getStoredBookings(), []);
    assert.equal(getStoredHostPin(), DEFAULT_HOST_PIN);
    assert.equal(getStoredHostAuth(), false);
    assert.deepEqual(getStoredEmailSettings(), DEFAULT_EMAIL_SETTINGS);
    assert.doesNotThrow(() => saveBooking(booking('x')));
    assert.doesNotThrow(() => setStoredHostAuth(true));
  } finally {
    console.error = quiet;
  }
});
