import { Booking, ConsultantProfile } from '../types';
import { generateGoogleMeetLink } from './calendarUtils';

const STORAGE_KEYS = {
  BOOKINGS: 'ramesh_fde_calendar_bookings',
  PROFILE: 'ramesh_fde_calendar_profile',
  EMAIL_DISPATCHES: 'ramesh_fde_calendar_dispatches',
};

export const DEFAULT_PROFILE: ConsultantProfile = {
  name: 'Ramesh J',
  title: 'Forward Deployed Engineer (FDE) Consultant & AI Corporate Trainer',
  roles: [
    'Forward Deployed Engineer (FDE) Consultant',
    'AI FDE Corporate Trainer',
    'Enterprise AI Architecture Mentor',
  ],
  bio: 'Specialized Forward Deployed Engineer & AI Corporate Trainer. I partner with enterprise teams and leaders to architect, build, and deploy production GenAI systems, high-leverage agent workflows, and upskill engineering teams with hands-on FDE methodologies.',
  email: 'rameshjagarapu1993@gmail.com',
  timeZone: 'Asia/Kolkata',
  slotDurationMinutes: 20,
  avatarUrl: '/assets/aistudio/WhatsApp_Image_2026-11-05_at_10.13.56_AM_86e8c355.jpeg',
  socials: {
    linkedin: 'https://linkedin.com/in/ramesh-j',
    github: 'https://github.com/ramesh-j',
  },
};

export const INITIAL_DEMO_BOOKINGS: Booking[] = [
  {
    id: 'bk-demo-01',
    slotId: '2026-11-04_07-20',
    dateString: '2026-11-04',
    startTime: '07:20',
    endTime: '07:40',
    formattedTime: '7:20 AM - 7:40 AM',
    timeZone: 'Asia/Kolkata',
    clientName: 'Deepak Sharma',
    clientEmail: 'deepak.s@fintech-enterprise.io',
    topic: 'fde-consulting',
    topicTitle: 'Forward Deployed Engineering Advisory',
    company: 'Fintech Solutions Ltd',
    notes: 'Discussion on structuring an internal FDE squad for client deployments.',
    googleMeetLink: generateGoogleMeetLink('deepak-fde'),
    createdAt: '2026-11-01T08:30:00Z',
    reminders: { reminder24h: true, reminder1h: true, reminder10m: true },
    status: 'confirmed',
  },
  {
    id: 'bk-demo-02',
    slotId: '2026-11-05_18-20',
    dateString: '2026-11-05',
    startTime: '18:20',
    endTime: '18:40',
    formattedTime: '6:20 PM - 6:40 PM',
    timeZone: 'Asia/Kolkata',
    clientName: 'Elena Rostova',
    clientEmail: 'elena@cloudscale.tech',
    topic: 'corporate-training',
    topicTitle: 'Corporate AI Training & Upskilling',
    company: 'CloudScale Global',
    notes: 'Planning a 3-day enterprise AI hands-on workshop for 40 senior engineers.',
    googleMeetLink: generateGoogleMeetLink('elena-training'),
    createdAt: '2026-11-01T14:15:00Z',
    reminders: { reminder24h: true, reminder1h: true, reminder10m: true },
    status: 'confirmed',
  },
];

export function getStoredProfile(): ConsultantProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      avatarUrl: parsed.avatarUrl || DEFAULT_PROFILE.avatarUrl,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: ConsultantProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile', err);
  }
}

export function getStoredBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_DEMO_BOOKINGS));
      return INITIAL_DEMO_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_BOOKINGS;
  }
}

export function saveBooking(booking: Booking): void {
  const existing = getStoredBookings();
  const updated = [booking, ...existing.filter((b) => b.id !== booking.id)];
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save booking', err);
  }
}

export function cancelBooking(bookingId: string): void {
  const existing = getStoredBookings();
  const updated = existing.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b));
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to cancel booking', err);
  }
}

export function deleteBooking(bookingId: string): void {
  const existing = getStoredBookings();
  const updated = existing.filter((b) => b.id !== bookingId);
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete booking', err);
  }
}

export interface EmailSettings {
  resendApiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  autoOpenGmailOnBooking: boolean;
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  resendApiKey: '',
  smtpHost: '',
  smtpPort: 587,
  smtpUser: 'rameshjagarapu1993@gmail.com',
  smtpPass: '',
  fromEmail: 'rameshjagarapu1993@gmail.com',
  autoOpenGmailOnBooking: true,
};

const EMAIL_SETTINGS_KEY = 'ramesh_fde_calendar_email_settings';

export function getStoredEmailSettings(): EmailSettings {
  try {
    const raw = localStorage.getItem(EMAIL_SETTINGS_KEY);
    if (!raw) return DEFAULT_EMAIL_SETTINGS;
    return { ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_EMAIL_SETTINGS;
  }
}

export function saveEmailSettings(settings: EmailSettings): void {
  try {
    localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save email settings', err);
  }
}

