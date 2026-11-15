# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-host booking calendar ("Ramesh J", AI FDE consultant) — React 19 + Vite + Tailwind v4 SPA, originally scaffolded in Google AI Studio (`metadata.json`, `.aistudio/`). Learners pick 20-minute slots; the host manages bookings in an admin dashboard. Deployed to Vercel (`vercel.json` rewrites everything except `/api/*` to `index.html`).

## Commands

- `npm run dev` — runs `server.ts` via `tsx`: an Express server on port 3000 that mounts Vite in middleware mode (dev) or serves `dist/` (when `NODE_ENV=production`). Use this rather than plain `vite`, since it also serves `/api/send-email` and `/api/health`.
- `npm run build` — `vite build` into `dist/`.
- `npm run lint` — type-check only (`tsc --noEmit`); there is no ESLint.
All tests live in `tests/` (Node's built-in `node:test` runner, no Jest/Vitest): `tests/frontend/` (src/utils logic, TS via `tsx`), `tests/server/` (the `api/send-email.ts` handler with a fake req/res), `tests/backend/` (`Code.gs` via the mock).
- `npm test` — frontend + server tests (`node --import tsx --test "tests/frontend/*.test.ts" "tests/server/*.test.ts"`).
- `npm run test:backend` — Apps Script tests (`node --test "tests/backend/*.test.mjs"`).
- `npm run test:all` — both.
- Single file: `node --import tsx --test tests/frontend/storage.test.ts`; single test: add `--test-name-pattern="double booking"`.
- Frontend tests that touch `localStorage` install an in-memory stub per test (see `tests/frontend/storage.test.ts`).
- Mock Apps Script backend over HTTP: `node backend/mock-gas.mjs serve` (listens on :4180). Run the site against it with `VITE_BOOKING_API_URL=http://localhost:4180/exec npm run dev`.
- `run-local.bat` = install + both test suites + `npm run dev` (for the non-developer owner).
- `npm start` is identical to `npm run dev`; to serve the built `dist/` you must set `NODE_ENV=production`.
- Use npm (`package-lock.json`, `run-local.bat`); the committed `bun.lock` is a leftover from AI Studio.

Tests never depend on the real clock: `generateSlotsForDate` takes a `referenceNow` argument and `loadGas(nowFn)` in the mock injects a fake time. Keep new time-dependent tests that way.

## Architecture

There are three backend paths in this repo, from different stages of the project; know which one you are touching:

1. **Google Apps Script backend (`backend/`) — the intended production backend.** `Code.gs` is deployed manually as an Apps Script web app (see `backend/SETUP.md`). `doGet?action=busy&from&to` returns busy intervals from the host's Google Calendar; `doPost` with `action: 'book'` validates the slot, rejects double-bookings, creates a Calendar event with a real Meet link, emails host + learner, and stores reminder state in Script Properties; a time-driven `sendReminders()` trigger sends 24h/1h/10m reminders. Changes to `Code.gs` only go live after the user re-pastes it and creates a new deployment version.
   - `backend/mock-gas.mjs` runs the real `Code.gs` inside a Node `vm` with fake `CalendarApp`/`MailApp`/`Utilities`/properties and a fake clock — that's how `tests/backend/` tests it. If `Code.gs` starts using a new Apps Script API, the mock must be extended too.
2. **Frontend client (`src/utils/api.ts`)** — talks to the Apps Script URL from `VITE_BOOKING_API_URL` (baked in at build time). `App.tsx` fetches busy intervals for the visible month; `BookingForm` POSTs the booking. POSTs deliberately use `Content-Type: text/plain` to avoid a CORS preflight Apps Script can't answer. Without the env var the app is in **demo mode** (amber banner, placeholder Meet links).
3. **Demo/local path** — `src/utils/storage.ts` persists bookings, email settings and host PIN in `localStorage` (bookings are always saved locally too, for the confirmation screen and admin list); `server.ts` and `api/send-email.ts` (Vercel function) send confirmation emails via Resend or SMTP, falling back to a payload for client-side Gmail compose. Bookings carry `emailStatus: 'sent' | 'demo'`; when `'sent'` (live mode) the UI must not send its own confirmation email or add calendar guests, because the backend already did.

### Availability rules

Slot rules are defined in **IST (`Asia/Kolkata`)** and are duplicated in two places that must stay in sync: `generateSlotsForDate` in `src/utils/slotGenerator.ts` (UI) and `allowedWindows_`/`isValidSlot_` in `backend/Code.gs` (server-side validation). Weekdays: 07:00–08:00 and 18:00–19:00. Weekends: 06:00–09:00, 17:00–20:00, and a 23:00–02:00 "night owl" window that crosses midnight (so 00:00–02:00 on Sun/Mon belongs to the previous night). Bookings are accepted up to 120 days ahead.

`TimeSlot`/`Booking` store `dateString` + `startTime`/`endTime`/`formattedTime` **in IST**. Always convert to a real instant with `parseSlotDateTime`/`parseSlotEnd` in `calendarUtils.ts` (never `new Date(y, m, d, h, mm)`, which uses the browser's zone), and show learner-facing times with `slotRangeInZone`/`bookingWhenLabel` in `booking.timeZone`. Night-owl slots with hour < 6 belong to the *next* calendar day of their `dateString`.

### UI

`src/App.tsx` is the single state controller (selected date/slot, booking step `select → form → confirmed`, active tab `booking | admin`, modals); components in `src/components/` are presentational. The admin tab is gated by a client-side PIN (`HostLoginModal`, default `1993`, stored in localStorage; `?pin=<pin>` also unlocks) — this is not real security; it only hides this browser's local data. `@` path alias maps to the repo root.

## Notes

- Keep `vite.config.ts`'s `DISABLE_HMR` handling as is; AI Studio relies on it.
- `.env*` is gitignored except `.env.example`; local config goes in `.env.local`.
- `server.ts` and `api/send-email.ts` duplicate the email logic; change both. User fields must go through `escapeHtml` before entering email HTML.
- `backend/SETUP.md` is the source of truth for how the live system is deployed.
- The owner's name/email are hardcoded across the frontend, `server.ts`, `api/send-email.ts` and the CONFIG block of `Code.gs` (no single config); grep for the email address when changing them.
- `Claude outputs/JRamesh_FDECalendar-updated.zip` is an older snapshot already merged into `src/`. Don't restore files from it — it lacks the host PIN login and email-server code.
