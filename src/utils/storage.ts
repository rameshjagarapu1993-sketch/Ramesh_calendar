import { Booking, ConsultantProfile } from '../types';

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

// Old builds seeded fake demo bookings into every visitor's browser; purge them.
const LEGACY_DEMO_IDS = new Set(['bk-demo-01', 'bk-demo-02']);

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
    if (!raw) return [];
    const parsed: Booking[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((b) => !LEGACY_DEMO_IDS.has(b.id)) : [];
  } catch {
    return [];
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

const HOST_AUTH_KEY = 'ramesh_fde_calendar_host_authenticated';
const HOST_PIN_KEY = 'ramesh_fde_calendar_host_pin';
export const DEFAULT_HOST_PIN = '1993';

export function getStoredHostPin(): string {
  try {
    return localStorage.getItem(HOST_PIN_KEY) || DEFAULT_HOST_PIN;
  } catch {
    return DEFAULT_HOST_PIN;
  }
}

export function saveHostPin(pin: string): void {
  try {
    localStorage.setItem(HOST_PIN_KEY, pin.trim());
  } catch (err) {
    console.error('Failed to save host pin', err);
  }
}

export function getStoredHostAuth(): boolean {
  try {
    return localStorage.getItem(HOST_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setStoredHostAuth(authenticated: boolean): void {
  try {
    if (authenticated) {
      localStorage.setItem(HOST_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(HOST_AUTH_KEY);
    }
  } catch (err) {
    console.error('Failed to update host authentication state', err);
  }
}


