import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGas } from '../../backend/mock-gas.mjs';
// Runs the real Code.gs against fake Google services. Run: npm run test:backend

let NOW = new Date('2026-11-04T06:00:00Z'); // Wed 11:30 IST
const now = () => NOW;
const req = (startIso, extra = {}) => ({ clientName: 'Asha', clientEmail: 'Asha@Example.com', topicTitle: 'AI Architecture', timeZone: 'America/New_York', startIso, ...extra });
const post = (g, body) => JSON.parse(g.ctx.doPost({ postData: { contents: JSON.stringify({ action: 'book', ...body }) } }).content);

test('valid slot: creates Meet event, invites learner, emails both', () => {
  const g = loadGas(now);
  const r = post(g, req('2026-11-07T01:30:00.000Z')); // Sat 07:00 IST
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.match(r.meetLink, /^https:\/\/meet\.google\.com\//);
  const ev = g.events[0];
  assert.equal(ev.attendees[0].email, 'asha@example.com');
  assert.equal(ev._sendUpdates, 'all');
  assert.equal(g.mails.length, 2);
  const [learner, owner] = g.mails;
  assert.equal(learner.to, 'asha@example.com');
  assert.equal(owner.to, 'rameshjagarapu1993@gmail.com');
  for (const m of g.mails) assert.ok(m.htmlBody.includes(r.meetLink), 'Meet link in email');
  assert.ok(learner.htmlBody.includes('Fri, 6 Nov 2026 at 8:30 PM (America/New_York)'), learner.htmlBody.match(/When.{0,200}/)?.[0]);
  assert.ok(owner.htmlBody.includes('Sat, 7 Nov 2026 at 7:00 AM (Asia/Kolkata)'));
  assert.equal(owner.replyTo, 'asha@example.com');
});

test('double booking is rejected', () => {
  const g = loadGas(now);
  assert.equal(post(g, req('2026-11-07T01:30:00.000Z')).ok, true);
  const r2 = post(g, req('2026-11-07T01:30:00.000Z', { clientEmail: 'b@x.com' }));
  assert.equal(r2.error, 'SLOT_TAKEN');
  assert.equal(g.mails.length, 2);
});

test('slot rules enforced server-side', () => {
  const g = loadGas(now);
  const cases = {
    '2026-11-09T01:30:00.000Z': true,   // Mon 07:00 IST weekday morning
    '2026-11-09T12:50:00.000Z': true,   // Mon 18:20 IST
    '2026-11-09T03:30:00.000Z': false,  // Mon 09:00 IST
    '2026-11-09T00:30:00.000Z': false,  // Mon 06:00 IST (weekend-only time)
    '2026-11-07T18:10:00.000Z': true,   // Sat 23:40 IST night owl
    '2026-11-07T19:10:00.000Z': true,   // Sun 00:40 IST (Sat night owl)
    '2026-11-08T20:10:00.000Z': true,   // Mon 01:40 IST (Sun night owl)
    '2026-11-09T19:10:00.000Z': false,  // Tue 00:40 IST (no Mon night owl)
    '2026-11-07T01:35:00.000Z': false,  // not on a 20-min boundary
    '2026-11-04T01:30:00.000Z': false,  // in the past
  };
  for (const [iso, ok] of Object.entries(cases)) assert.equal(post(g, req(iso)).ok, ok, iso);
});

test('validation of name and email', () => {
  const g = loadGas(now);
  assert.equal(post(g, req('2026-11-07T01:50:00.000Z', { clientEmail: 'nope' })).error, 'INVALID');
  assert.equal(post(g, req('2026-11-07T01:50:00.000Z', { clientName: ' ' })).error, 'INVALID');
});

test('existing calendar events block slots via busy endpoint', () => {
  const g = loadGas(now);
  g.events.push({ id: 'x', start: { dateTime: '2026-11-07T02:00:00Z' }, end: { dateTime: '2026-11-07T03:00:00Z' } });
  const busy = JSON.parse(g.ctx.doGet({ parameter: { action: 'busy', from: '2026-11-01', to: '2026-12-01' } }).content);
  assert.equal(busy.ok, true); assert.equal(busy.busy.length, 1);
  assert.equal(post(g, req('2026-11-07T02:10:00.000Z')).error, 'SLOT_TAKEN');
});

test('reminders: 24h, 1h, 10m sent exactly once each; respects opt-out', () => {
  const g = loadGas(now);
  post(g, req('2026-11-07T01:30:00.000Z'));
  post(g, req('2026-11-07T01:50:00.000Z', { clientEmail: 'c@x.com', reminders: { reminder24h: false, reminder1h: true, reminder10m: true } }));
  g.mails.length = 0;
  const start = new Date('2026-11-07T01:30:00Z').getTime();
  const sent = [];
  for (let t = start - 26 * 3600e3; t < start + 40 * 60e3; t += 5 * 60e3) {
    NOW = new Date(t); g.ctx.sendReminders();
  }
  const toAsha = g.mails.filter((m) => m.to === 'asha@example.com').map((m) => m.subject);
  const toC = g.mails.filter((m) => m.to === 'c@x.com').map((m) => m.subject);
  const toOwner = g.mails.filter((m) => m.to === 'rameshjagarapu1993@gmail.com').length;
  assert.deepEqual(toAsha.map((s) => s.replace(/.*starts /, '')), ['tomorrow', 'in 1 hour', 'in 10 minutes']);
  assert.deepEqual(toC.map((s) => s.replace(/.*starts /, '')), ['in 1 hour', 'in 10 minutes']);
  assert.equal(toOwner, 4);
  NOW = new Date('2026-11-04T06:00:00Z');
});

test('booking made 3h ahead does not get an instant "24h" reminder', () => {
  NOW = new Date('2026-11-07T10:00:00Z');
  const g = loadGas(now);
  assert.equal(post(g, req('2026-11-07T13:00:00.000Z')).ok, false); // Sat 18:30? not valid -> pick valid
  const r = post(g, req('2026-11-07T12:50:00.000Z')); // Sat 18:20 IST
  assert.equal(r.ok, true); g.mails.length = 0;
  g.ctx.sendReminders();
  assert.equal(g.mails.length, 0);
  NOW = new Date('2026-11-04T06:00:00Z');
});

test('HTML escaping of learner input', () => {
  const g = loadGas(now);
  post(g, req('2026-11-07T01:30:00.000Z', { clientName: '<script>x</script>', notes: '<img src=x onerror=1>' }));
  for (const m of g.mails) { assert.ok(!m.htmlBody.includes('<script>')); assert.ok(!m.htmlBody.includes('<img src=x')); }
});
