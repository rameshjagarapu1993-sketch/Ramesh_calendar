# Tests

All automated tests for the booking site. They use Node's built-in test runner, need no internet, and never send real emails or create real calendar events.

## How to run

| Command | What it runs |
|---|---|
| `npm run test:all` | Everything below |
| `npm test` | `frontend/` and `server/` tests |
| `npm run test:backend` | `backend/` tests |
| `node --import tsx --test tests/frontend/storage.test.ts` | One file |
| `node --import tsx --test --test-name-pattern="host PIN" tests/frontend/storage.test.ts` | One test by name |

`run-local.bat` runs all of them before starting the site.

## What each file checks

| File | Checks |
|---|---|
| `frontend/slotGenerator.test.ts` | Weekday/weekend slot rules, booked and past slots, Google Calendar busy times, IST time conversion |
| `frontend/calendarUtils.test.ts` | Calendar links, Gmail/mailto emails, `.ics` file, reminder times, labels for learners in other time zones, night-owl slots after midnight |
| `frontend/storage.test.ts` | Saving, cancelling and deleting bookings in the browser, host PIN and login, email settings, removal of old fake bookings, browsers that block storage |
| `frontend/api.test.ts` | Demo mode when `VITE_BOOKING_API_URL` is not set; date formatting for the backend |
| `server/sendEmail.test.ts` | The email endpoint (`api/send-email.ts`): only POST, required fields, bad email addresses, phishing links blocked |
| `backend/booking.test.mjs` | Apps Script backend: real Meet event and emails, double booking, slot hours, reminders, HTML escaping |
| `backend/rules.test.mjs` | Apps Script backend: 120-day limit, bad requests, all-day and "Free" events don't block, deleted events free the slot, reply-to addresses, cleanup |

The `backend/` tests run the real `backend/Code.gs` against fake Google services from `backend/mock-gas.mjs`, with a fixed fake clock.
