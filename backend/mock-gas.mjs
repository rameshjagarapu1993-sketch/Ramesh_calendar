// Runs backend/Code.gs in a VM with fake Google services, served over HTTP like an Apps Script web app.
import fs from 'fs';
import vm from 'vm';
import http from 'http';
import crypto from 'crypto';

export function loadGas(nowFn = () => new Date()) {
  const events = [];
  const mails = [];
  const props = new Map();
  let seq = 0;

  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(nowFn().getTime()); else super(...a); }
    static now() { return nowFn().getTime(); }
  }

  function parts(date, tz) {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'short', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' });
    const o = Object.fromEntries(f.formatToParts(date).map((p) => [p.type, p.value]));
    const H = Number(o.hour), m = Number(o.minute);
    const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(o.weekday) + 1;
    const monthNum = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(o.month) + 1;
    return { yyyy: o.year, MM: String(monthNum).padStart(2, '0'), MMM: o.month, dd: o.day.padStart(2, '0'), d: String(Number(o.day)), EEE: o.weekday, H: String(H), HH: String(H).padStart(2, '0'), h: String(H % 12 || 12), mm: String(m).padStart(2, '0'), m: String(m), a: H < 12 ? 'AM' : 'PM', u: String(wd) };
  }
  const Utilities = {
    formatDate(date, tz, pattern) {
      const p = parts(date, tz);
      return pattern.split(/('[^']*')/).map((chunk) => chunk.startsWith("'") ? chunk.slice(1, -1)
        : chunk.replace(/yyyy|MMM|MM|dd|EEE|HH|mm|[dHhmau]/g, (t) => p[t])).join('');
    },
    getUuid: () => crypto.randomUUID(),
    sleep: () => {},
  };

  const overlaps = (ev, s, e) => new RealDate(ev.start.dateTime) < e && new RealDate(ev.end.dateTime) > s;
  const wrap = (ev) => ({
    isAllDayEvent: () => !!ev.allDay,
    getStartTime: () => new RealDate(ev.start.dateTime),
    getEndTime: () => new RealDate(ev.end.dateTime),
    getMyStatus: () => 'OWNER',
    getTransparency: () => ev.transparency || 'OPAQUE',
  });
  const CalendarApp = {
    GuestStatus: { NO: 'NO' }, EventTransparency: { TRANSPARENT: 'TRANSPARENT' },
    getCalendarById: () => ({ getName: () => 'Ramesh', getEvents: (s, e) => events.filter((ev) => ev.status !== 'cancelled' && overlaps(ev, s, e)).map(wrap) }),
  };
  const Calendar = { Events: {
    insert(res, cal, opts) {
      if (!opts || opts.conferenceDataVersion !== 1) throw new Error('conferenceDataVersion must be 1 to get a Meet link');
      if (!res.conferenceData?.createRequest?.conferenceSolutionKey) throw new Error('missing Meet createRequest');
      const id = 'ev' + (++seq);
      const ev = { ...res, id, status: 'confirmed', htmlLink: 'https://calendar.google.com/event?eid=' + id, hangoutLink: `https://meet.google.com/rea-l${String(seq).padStart(3, '0')}-mtg`, _sendUpdates: opts.sendUpdates };
      events.push(ev); return ev;
    },
    get: (cal, id) => events.find((e) => e.id === id),
    list(cal, o) {
      const [k, v] = o.privateExtendedProperty.split('=');
      return { items: events.filter((ev) => ev.status !== 'cancelled' && ev.extendedProperties?.private?.[k] === v && overlaps(ev, new RealDate(o.timeMin), new RealDate(o.timeMax))) };
    },
  } };
  const ctx = {
    Date: FakeDate, JSON, Math, String, Number, Object, Array, Error, isNaN, console,
    Utilities, CalendarApp, Calendar,
    MailApp: { sendEmail: (m) => mails.push(m), getRemainingDailyQuota: () => 100 },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => props.get(k) ?? null, setProperty: (k, v) => props.set(k, v),
      getProperties: () => Object.fromEntries(props), deleteProperty: (k) => props.delete(k) }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ content: s, setMimeType() { return this; } }) },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create: () => {} }) }) }) },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(new URL('./Code.gs', import.meta.url), 'utf8'), ctx);
  return { ctx, events, mails, props };
}

// HTTP server mimicking Apps Script: /exec answers with a 302 to a one-time /echo URL.
if (process.argv[2] === 'serve') {
  const gas = loadGas();
  globalThis.__gas = gas;
  const echo = new Map();
  http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const cors = { 'Access-Control-Allow-Origin': '*' };
    if (req.method === 'OPTIONS') { res.writeHead(405); return res.end('Apps Script does not answer preflight'); }
    if (u.pathname === '/exec') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const out = req.method === 'POST'
          ? gas.ctx.doPost({ postData: { contents: body } })
          : gas.ctx.doGet({ parameter: Object.fromEntries(u.searchParams) });
        const id = crypto.randomUUID(); echo.set(id, out.content);
        res.writeHead(302, { ...cors, Location: `http://localhost:4180/echo?id=${id}` }); res.end();
      });
      return;
    }
    if (u.pathname === '/echo') { res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }); return res.end(echo.get(u.searchParams.get('id')) || '{}'); }
    if (u.pathname === '/__state') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ events: gas.events, mails: gas.mails })); }
    res.writeHead(404); res.end();
  }).listen(4180, () => console.log('mock GAS on :4180'));
}
