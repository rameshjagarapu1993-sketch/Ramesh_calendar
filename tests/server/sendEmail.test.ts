import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/send-email';

// The Vercel email function (api/send-email.ts). No email keys are set during tests,
// so nothing is really sent: a valid request returns provider "client-dispatch".

before(() => {
  for (const k of ['RESEND_API_KEY', 'SMTP_HOST', 'SMTP_PASS']) delete process.env[k];
});

async function call(method: string, body: any) {
  let status = 200;
  let json: any;
  const res = {
    status(code: number) { status = code; return res; },
    json(data: any) { json = data; },
  };
  await handler({ method, body }, res);
  return { status, json };
}

const valid = {
  to: 'asha@example.com',
  clientName: 'Asha',
  dateString: 'Sat, Nov 7',
  formattedTime: '7:00 AM - 7:20 AM',
  timeZone: 'Asia/Kolkata',
  topicTitle: 'AI',
  googleMeetLink: 'https://meet.google.com/abc-defg-hij',
};

test('only POST is allowed', async () => {
  const r = await call('GET', {});
  assert.equal(r.status, 405);
});

test('missing required fields are rejected with 400', async () => {
  for (const field of ['to', 'clientName', 'formattedTime']) {
    const body: any = { ...valid };
    delete body[field];
    const r = await call('POST', body);
    assert.equal(r.status, 400, field);
    assert.equal(r.json.success, false);
  }
  assert.equal((await call('POST', undefined)).status, 400);
});

test('an invalid recipient email is rejected', async () => {
  for (const to of ['not-an-email', 'a@b', 'two words@x.com']) {
    const r = await call('POST', { ...valid, to });
    assert.equal(r.status, 400, to);
    assert.match(r.json.error, /recipient/);
  }
});

test('only real Google Meet links are accepted (no phishing links)', async () => {
  for (const link of ['https://evil.example/meet', 'http://meet.google.com/abc', 'https://meet.google.com.evil.io/x', 'javascript:alert(1)']) {
    const r = await call('POST', { ...valid, googleMeetLink: link });
    assert.equal(r.status, 400, link);
    assert.match(r.json.error, /Meet link/);
  }
});

test('a valid request without email keys falls back to client dispatch', async () => {
  const r = await call('POST', valid);
  assert.equal(r.status, 200);
  assert.equal(r.json.success, true);
  assert.equal(r.json.provider, 'client-dispatch');
  assert.equal(r.json.isConfigured, false);
});
