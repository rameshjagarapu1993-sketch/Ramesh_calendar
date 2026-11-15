import test from 'node:test';
import assert from 'node:assert/strict';
import { isLiveMode, fetchBusy, toYmd, BOOKING_API_URL } from '../../src/utils/api';

// The client that talks to the Google Apps Script booking backend.
// In tests VITE_BOOKING_API_URL is not set, so the site is in demo mode.
// The full live flow (busy times, booking, double booking) is covered in tests/backend/.

test('without VITE_BOOKING_API_URL the site is in demo mode', () => {
  assert.equal(BOOKING_API_URL, '');
  assert.equal(isLiveMode(), false);
});

test('demo mode never calls the network for busy times', async () => {
  const realFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (async () => { called = true; throw new Error('should not be called'); }) as typeof fetch;
  try {
    assert.deepEqual(await fetchBusy('2026-11-01', '2026-12-01'), []);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('toYmd formats a local date as YYYY-MM-DD with zero padding', () => {
  assert.equal(toYmd(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(toYmd(new Date(2026, 10, 30)), '2026-11-30');
  assert.equal(toYmd(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
});
