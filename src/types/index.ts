export type DayType = 'weekday' | 'weekend';

export interface TimeSlot {
  id: string; // e.g. "2026-11-03_07-00"
  dateString: string; // "YYYY-MM-DD"
  startTime: string; // "07:00"
  endTime: string; // "07:20"
  formattedTime: string; // "7:00 AM - 7:20 AM"
  period: 'morning' | 'evening' | 'night';
  isWeekend: boolean;
  isBooked: boolean;
  isPast?: boolean;
}

export type SessionTopic = 
  | 'fde-consulting'
  | 'ai-architecture'
  | 'corporate-training'
  | 'career-mentorship'
  | 'other';

export interface Booking {
  id: string;
  slotId: string;
  dateString: string;
  startTime: string;
  endTime: string;
  formattedTime: string;
  timeZone: string;
  clientName: string;
  clientEmail: string;
  topic: SessionTopic;
  topicTitle: string;
  notes?: string;
  company?: string;
  googleMeetLink: string;
  createdAt: string;
  reminders: {
    reminder24h: boolean;
    reminder1h: boolean;
    reminder10m: boolean;
  };
  status: 'confirmed' | 'cancelled';
}

export interface ConsultantProfile {
  name: string;
  title: string;
  roles: string[];
  bio: string;
  email: string;
  timeZone: string;
  slotDurationMinutes: number;
  avatarUrl?: string;
  socials: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

export interface DayAvailabilityConfig {
  weekdays: {
    morning: { start: string; end: string }; // "07:00" - "08:00"
    evening: { start: string; end: string }; // "18:00" - "19:00"
  };
  weekends: {
    morning: { start: string; end: string }; // "06:00" - "09:00"
    evening: { start: string; end: string }; // "17:00" - "20:00"
    night: { start: string; end: string };   // "23:00" - "02:00" (spanning midnight)
  };
}
