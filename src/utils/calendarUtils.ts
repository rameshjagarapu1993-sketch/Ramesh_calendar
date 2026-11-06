import { Booking } from '../types';

/**
 * Generates a realistic unique Google Meet URL format.
 * Format: https://meet.google.com/xxx-yyyy-zzz
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

/**
 * Converts date and time string to Date object.
 */
export function parseSlotDateTime(dateString: string, time24: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = time24.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0);
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
}): string {
  const start = parseSlotDateTime(booking.dateString, booking.startTime);
  const end = parseSlotDateTime(booking.dateString, booking.endTime);

  // If slot ends on next day (e.g. nightowl 23:40 - 00:00 or 01:40 - 02:00)
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

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
  const guestList = [booking.clientEmail, 'rameshjagarapu1993@gmail.com'].filter(Boolean).join(',');
  const guests = encodeURIComponent(guestList);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&add=${guests}`;
}

/**
 * Creates a 1-click web Gmail composer URL with pre-filled recipient, CC, subject, and formatted email body.
 */
export function createGmailComposeUrl(booking: {
  topicTitle: string;
  clientName: string;
  clientEmail: string;
  dateString: string;
  formattedTime: string;
  timeZone: string;
  googleMeetLink: string;
  company?: string;
  notes?: string;
}): string {
  const to = encodeURIComponent(booking.clientEmail);
  const cc = encodeURIComponent('rameshjagarapu1993@gmail.com');
  const su = encodeURIComponent(
    `Confirmed: 20-Min Consultation with Ramesh J (AI FDE) - ${booking.dateString} ${booking.formattedTime}`
  );
  
  const bodyText = 
    `Hi ${booking.clientName},\n\n` +
    `Your 20-minute consultation with Ramesh J is confirmed!\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `SESSION DETAILS\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• Date & Time: ${booking.dateString} at ${booking.formattedTime} (${booking.timeZone})\n` +
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
  formattedTime: string;
  timeZone: string;
  googleMeetLink: string;
  company?: string;
  notes?: string;
}): string {
  const su = encodeURIComponent(
    `Confirmed: 20-Min Consultation with Ramesh J (AI FDE) - ${booking.dateString} ${booking.formattedTime}`
  );
  const bodyText = 
    `Hi ${booking.clientName},\n\n` +
    `Your 20-minute consultation with Ramesh J is confirmed!\n\n` +
    `• Date & Time: ${booking.dateString} at ${booking.formattedTime} (${booking.timeZone})\n` +
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
  const end = parseSlotDateTime(booking.dateString, booking.endTime);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

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
