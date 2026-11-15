import { Booking } from '../types';

/**
 * DEMO ONLY: builds a Meet-style URL. These are NOT real meeting rooms.
 * Real Meet links come from the booking backend (backend/Code.gs), which creates
 * a Google Calendar event with a genuine Meet conference.
 */
export function generateGoogleMeetLink(bookingId?: string): string {
  if (bookingId) {
    // Generate deterministic 3-4-3 slug from id
    const clean = bookingId.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const p1 = (clean.slice(0, 3) || 'fdm').padEnd(3, 'x');
    const p2 = (clean.slice(3, 7) || 'tech').padEnd(4, 'y');
    const p3 = (clean.slice(7, 10) || 'fde').padEnd(3, 'z');
    return `https://meet.google.com/${p1}-${p2}-${p3}`;
  }

  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const randPart = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${randPart(3)}-${randPart(4)}-${randPart(3)}`;
}

/** Ramesh's home time zone. All slot times are defined in IST. */
export const HOST_TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET = '+05:30';

/**
 * Converts a slot's date + IST time into the exact moment in time (a Date).
 * Correct in every browser time zone (a learner in New York gets the same instant).
 * Night Owl slots that start after midnight (00:00–01:40) belong to the previous
 * evening's session, so they roll over to the next calendar day.
 */
export function parseSlotDateTime(dateString: string, time24: string): Date {
  const d = new Date(`${dateString}T${time24}:00${IST_OFFSET}`);
  const hour = Number(time24.split(':')[0]);
  if (hour < 6) d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
  return d;
}

/** End instant of a slot (handles 23:40 → 00:00 crossing midnight). */
export function parseSlotEnd(dateString: string, startTime: string, endTime: string): Date {
  const start = parseSlotDateTime(dateString, startTime);
  let end = parseSlotDateTime(dateString, endTime);
  if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  return end;
}

/** Formats an instant in a given IANA time zone, e.g. "7:00 AM". */
export function formatTimeInZone(date: Date, timeZone: string): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
}

/** "7:00 AM - 7:20 AM" for a slot, shown in the given time zone. */
export function slotRangeInZone(dateString: string, startTime: string, endTime: string, timeZone: string): string {
  const start = parseSlotDateTime(dateString, startTime);
  const end = parseSlotEnd(dateString, startTime, endTime);
  return `${formatTimeInZone(start, timeZone)} - ${formatTimeInZone(end, timeZone)}`;
}

/** Formats an instant's date in a given time zone, e.g. "Sat, Nov 7". */
export function formatDateInZone(date: Date, timeZone: string): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone });
}

/** "Mon, Nov 9 at 8:30 PM - 8:50 PM (America/New_York)" – the booking's time in the learner's own zone. */
export function bookingWhenLabel(b: { dateString: string; startTime: string; endTime: string; timeZone: string }): string {
  const tz = b.timeZone || HOST_TIME_ZONE;
  const start = parseSlotDateTime(b.dateString, b.startTime);
  return `${formatDateInZone(start, tz)} at ${slotRangeInZone(b.dateString, b.startTime, b.endTime, tz)} (${tz})`;
}

/**
 * Formats a Date object to Google Calendar URL UTC timestamp string: YYYYMMDDTHHmmssZ
 */
function toGCalTimeString(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates a pre-filled direct Google Calendar web URL.
 */
export function createGoogleCalendarUrl(booking: {
  topicTitle: string;
  clientName: string;
  clientEmail?: string;
  dateString: string;
  startTime: string;
  endTime: string;
  googleMeetLink: string;
  notes?: string;
  company?: string;
  /** 'sent' = the backend already sent real invites, so don't add guests again */
  emailStatus?: 'sent' | 'demo';
}): string {
  const start = parseSlotDateTime(booking.dateString, booking.startTime);
  const end = parseSlotEnd(booking.dateString, booking.startTime, booking.endTime);

  const title = encodeURIComponent(
    `Consultation: Ramesh J (AI FDE) & ${booking.clientName}`
  );
  const dates = `${toGCalTimeString(start)}/${toGCalTimeString(end)}`;
  
  const details = encodeURIComponent(
    `Meeting Topic: ${booking.topicTitle}\n` +
    `Consultant: Ramesh J (AI FDE Consultant & Corporate Trainer)\n` +
    `Client: ${booking.clientName}${booking.company ? ` (${booking.company})` : ''}\n` +
    `Join Google Meet: ${booking.googleMeetLink}\n\n` +
    (booking.notes ? `Agenda / Notes: ${booking.notes}\n\n` : '') +
    `20-Minute Focus Session. Automated reminders scheduled for 24h, 1h, and 10m before call.`
  );

  const location = encodeURIComponent(booking.googleMeetLink);
  // Adding guests parameter so Google Calendar automatically invites the attendee via email
  const base = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  if (booking.emailStatus === 'sent') return base;
  const guestList = [booking.clientEmail, 'rameshjagarapu1993@gmail.com'].filter(Boolean).join(',');
  return `${base}&add=${encodeURIComponent(guestList)}`;
}

/**
 * Creates a 1-click web Gmail composer URL with pre-filled recipient, CC, subject, and formatted email body.
 */
export function createGmailComposeUrl(booking: {
  topicTitle: string;
  clientName: string;
  clientEmail: string;
  dateString: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  googleMeetLink: string;
  company?: string;
  notes?: string;
}): string {
  const when = bookingWhenLabel(booking);
  const to = encodeURIComponent(booking.clientEmail);
  const cc = encodeURIComponent('rameshjagarapu1993@gmail.com');
  const su = encodeURIComponent(
    `Confirmed: 20-Min Consultation with Ramesh J (AI FDE) - ${when}`
  );
  
  const bodyText = 
    `Hi ${booking.clientName},\n\n` +
    `Your 20-minute consultation with Ramesh J is confirmed!\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `SESSION DETAILS\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• Date & Time: ${when}\n` +
    `• Topic: ${booking.topicTitle}\n` +
    (booking.company ? `• Organization: ${booking.company}\n` : '') +
    `• Google Meet Link: ${booking.googleMeetLink}\n` +
    (booking.notes ? `• Agenda / Context: ${booking.notes}\n` : '') +
    `\nJoin the Google Meet room at the scheduled time: ${booking.googleMeetLink}\n\n` +
    `Best regards,\n` +
    `Ramesh J\n` +
    `Forward Deployed Engineer (FDE) Consultant & AI Corporate Trainer\n` +
    `Email: rameshjagarapu1993@gmail.com\n`;

  const body = encodeURIComponent(bodyText);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&cc=${cc}&su=${su}&body=${body}`;
}

/**
 * Creates a standard native mailto: link for default desktop mail applications.
 */
export function createMailtoUrl(booking: {
  topicTitle: string;
  clientName: string;
  clientEmail: string;
  dateString: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  googleMeetLink: string;
  company?: string;
  notes?: string;
}): string {
  const when = bookingWhenLabel(booking);
  const su = encodeURIComponent(
    `Confirmed: 20-Min Consultation with Ramesh J (AI FDE) - ${when}`
  );
  const bodyText = 
    `Hi ${booking.clientName},\n\n` +
    `Your 20-minute consultation with Ramesh J is confirmed!\n\n` +
    `• Date & Time: ${when}\n` +
    `• Topic: ${booking.topicTitle}\n` +
    `• Google Meet Link: ${booking.googleMeetLink}\n\n` +
    `Best regards,\nRamesh J\nrameshjagarapu1993@gmail.com`;

  const body = encodeURIComponent(bodyText);
  return `mailto:${booking.clientEmail}?cc=rameshjagarapu1993@gmail.com&subject=${su}&body=${body}`;
}

/**
 * Generates an RFC 5545 compliant .ics (iCalendar) file string.
 */
export function generateIcsFileContent(booking: Booking): string {
  const start = parseSlotDateTime(booking.dateString, booking.startTime);
  const end = parseSlotEnd(booking.dateString, booking.startTime, booking.endTime);

  const dtStart = toGCalTimeString(start);
  const dtEnd = toGCalTimeString(end);
  const dtStamp = toGCalTimeString(new Date());

  const summary = `Consultation: Ramesh J & ${booking.clientName} [AI FDE / 20-min]`;
  const description = [
    `Topic: ${booking.topicTitle}`,
    `Consultant: Ramesh J (Forward Deployed Engineer Consultant & AI Corporate Trainer)`,
    `Google Meet: ${booking.googleMeetLink}`,
    `Attendee: ${booking.clientName} <${booking.clientEmail}>`,
    booking.company ? `Company: ${booking.company}` : '',
    booking.notes ? `Client Notes: ${booking.notes}` : '',
    `Automated Reminders: 24 hours, 1 hour, and 10 minutes prior.`
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ramesh J Consulting//AI FDE Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${booking.id}@rameshj-consulting.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${booking.googleMeetLink}`,
    'STATUS:CONFIRMED',
    // 24 Hour Alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: AI FDE Consultation with Ramesh J in 24 hours',
    'END:VALARM',
    // 1 Hour Alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: AI FDE Consultation with Ramesh J in 1 hour',
    'END:VALARM',
    // 10 Minute Alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT10M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: AI FDE Consultation with Ramesh J starting in 10 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Triggers a client-side download of the .ics file.
 */
export function downloadIcsFile(booking: Booking): void {
  const icsData = generateIcsFileContent(booking);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `consultation-ramesh-j-${booking.dateString}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculates reminder dispatch time details.
 */
export function getReminderTimeline(dateString: string, startTime: string) {
  const sessionDate = parseSlotDateTime(dateString, startTime);
  
  const time24hBefore = new Date(sessionDate.getTime() - 24 * 60 * 60 * 1000);
  const time1hBefore = new Date(sessionDate.getTime() - 60 * 60 * 1000);
  const time10mBefore = new Date(sessionDate.getTime() - 10 * 60 * 1000);

  return {
    sessionTime: sessionDate,
    reminder24h: {
      time: time24hBefore,
      formatted: time24hBefore.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      label: '24 Hours Before',
    },
    reminder1h: {
      time: time1hBefore,
      formatted: time1hBefore.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      label: '1 Hour Before',
    },
    reminder10m: {
      time: time10mBefore,
      formatted: time10mBefore.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      label: '10 Minutes Before',
    },
  };
}
