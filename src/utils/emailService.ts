import { Booking } from '../types';
import { getStoredEmailSettings, EmailSettings } from './storage';

export interface SendEmailResult {
  success: boolean;
  provider?: string;
  id?: string;
  messageId?: string;
  isConfigured?: boolean;
  message?: string;
  error?: string;
}

/**
 * Dispatches an automated confirmation email for a confirmed booking.
 * Communicates with the /api/send-email endpoint (Express server or Vercel serverless).
 */
export async function dispatchBookingEmail(
  booking: Booking,
  customSettings?: EmailSettings
): Promise<SendEmailResult> {
  const settings = customSettings || getStoredEmailSettings();

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: booking.clientEmail,
        clientName: booking.clientName,
        dateString: booking.dateString,
        formattedTime: booking.formattedTime,
        timeZone: booking.timeZone,
        topicTitle: booking.topicTitle,
        googleMeetLink: booking.googleMeetLink,
        company: booking.company,
        notes: booking.notes,
        resendApiKey: settings.resendApiKey || undefined,
        smtpConfig:
          settings.smtpHost && settings.smtpPass
            ? {
                host: settings.smtpHost,
                port: settings.smtpPort || 587,
                user: settings.smtpUser || 'rameshjagarapu1993@gmail.com',
                pass: settings.smtpPass,
                fromEmail: settings.fromEmail || 'rameshjagarapu1993@gmail.com',
              }
            : undefined,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `HTTP error ${res.status}`,
      };
    }

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network request failed',
    };
  }
}

/**
 * Sends a live test email directly to the consultant's inbox
 */
export async function sendTestEmail(settings: EmailSettings): Promise<SendEmailResult> {
  const sampleBooking: Booking = {
    id: `test-${Date.now()}`,
    slotId: 'test-slot',
    dateString: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '07:20',
    formattedTime: '7:00 AM - 7:20 AM',
    timeZone: 'Asia/Kolkata',
    clientName: 'Ramesh J (Test Recipient)',
    clientEmail: 'rameshjagarapu1993@gmail.com',
    topic: 'fde-consulting',
    topicTitle: 'Forward Deployed Engineering Advisory (Test Dispatch)',
    googleMeetLink: 'https://meet.google.com/test-room',
    createdAt: new Date().toISOString(),
    reminders: { reminder24h: true, reminder1h: true, reminder10m: true },
    status: 'confirmed',
  };

  return dispatchBookingEmail(sampleBooking, settings);
}
