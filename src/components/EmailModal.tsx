import React, { useState } from 'react';
import { X, Mail, Video, Calendar, Bell, Send, Check, Sparkles, ExternalLink, Copy, HelpCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Booking } from '../types';
import { createGoogleCalendarUrl, createGmailComposeUrl, createMailtoUrl, getReminderTimeline } from '../utils/calendarUtils';
import { dispatchBookingEmail } from '../utils/emailService';

interface EmailModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ booking, onClose }) => {
  const [activeTab, setActiveTab] = useState<'confirmation' | 'reminder24h' | 'reminder1h' | 'reminder10m'>('confirmation');
  const [copiedText, setCopiedText] = useState(false);
  const [isSendingApi, setIsSendingApi] = useState(false);
  const [apiSentSuccess, setApiSentSuccess] = useState<string | null>(null);

  if (!booking) return null;

  const timeline = getReminderTimeline(booking.dateString, booking.startTime);
  const gcalUrl = createGoogleCalendarUrl(booking);
  const gmailUrl = createGmailComposeUrl(booking);
  const mailtoUrl = createMailtoUrl(booking);

  const handleCopyBody = () => {
    const text = 
      `Hi ${booking.clientName},\n\n` +
      `Your 20-minute consultation with Ramesh J is confirmed!\n\n` +
      `• Date & Time: ${booking.dateString} at ${booking.formattedTime} (${booking.timeZone})\n` +
      `• Topic: ${booking.topicTitle}\n` +
      (booking.company ? `• Organization: ${booking.company}\n` : '') +
      `• Google Meet Link: ${booking.googleMeetLink}\n\n` +
      `Join Google Meet at scheduled time: ${booking.googleMeetLink}\n\n` +
      `Best regards,\nRamesh J\nrameshjagarapu1993@gmail.com`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getSubject = () => {
    switch (activeTab) {
      case 'confirmation':
        return `Confirmed: 20-Min Consultation with Ramesh J (AI FDE) - ${booking.dateString} ${booking.formattedTime}`;
      case 'reminder24h':
        return `Reminder (Tomorrow): AI FDE Consultation with Ramesh J - ${booking.formattedTime}`;
      case 'reminder1h':
        return `Starting in 1 Hour: AI FDE Consultation with Ramesh J [Google Meet Link Inside]`;
      case 'reminder10m':
        return `Starting Now (10m): Join your Google Meet with Ramesh J`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Email Notification &amp; Dispatcher</h3>
              <p className="text-xs text-slate-400">
                Prepared for <strong className="text-indigo-300">{booking.clientEmail}</strong> &bull; CC: <strong className="text-slate-300">rameshjagarapu1993@gmail.com</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Email Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Stage Tabs */}
        <div className="flex items-center gap-1.5 p-3 border-b border-slate-800 bg-slate-950/30 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('confirmation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'confirmation'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Instant Confirmation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reminder24h')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'reminder24h'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            24h Prior Reminder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reminder1h')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'reminder1h'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            1h Prior Reminder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reminder10m')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'reminder10m'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            10m Prior Ping
          </button>
        </div>

        {/* Real-time Delivery Guidance Banner */}
        <div className="px-5 py-2.5 bg-amber-950/40 border-b border-amber-800/40 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Why no email arrived automatically?</strong> Background emails require an email API key (like Resend). Click <strong>"Send via Gmail (1-Click)"</strong> below to send right now!
            </span>
          </div>
        </div>

        {/* Email Metadata */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 text-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-300 w-16">From:</span>
            <span>Ramesh J &lt;rameshjagarapu1993@gmail.com&gt;</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-300 w-16">To:</span>
            <span className="text-white">{booking.clientName} &lt;{booking.clientEmail}&gt;</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-300 w-16">Bcc:</span>
            <span>rameshjagarapu1993@gmail.com (Consultant Copy)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 pt-1">
            <span className="font-semibold text-slate-300 w-16">Subject:</span>
            <span className="font-semibold text-indigo-300">{getSubject()}</span>
          </div>
        </div>

        {/* Email Body Preview */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/90 text-slate-200 text-xs leading-relaxed font-sans space-y-4">
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            {/* Brand Logo & Host Photo in Email */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_10.13.56_AM_86e8c355.jpeg"
                  alt="Ramesh J"
                  className="w-12 h-12 rounded-xl object-cover object-top border border-indigo-500/30 shadow-sm shrink-0"
                />
                <div>
                  <h4 className="text-base font-bold text-white">Ramesh J</h4>
                  <p className="text-[11px] text-indigo-400 font-medium">
                    Forward Deployed Engineer (FDE) Consultant &amp; AI Corporate Trainer
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded shrink-0">
                20-Min Focus Session
              </span>
            </div>

            <p className="text-sm text-white">
              Hi <strong className="text-white">{booking.clientName}</strong>,
            </p>

            {activeTab === 'confirmation' && (
              <p className="text-slate-300">
                Your 20-minute consultation is confirmed! Below are your session details, direct Google Meet link, and calendar invite.
              </p>
            )}

            {activeTab === 'reminder24h' && (
              <p className="text-slate-300">
                This is a friendly reminder that our 20-minute AI FDE strategy session is scheduled for tomorrow at <strong className="text-white">{booking.formattedTime}</strong>.
              </p>
            )}

            {activeTab === 'reminder1h' && (
              <p className="text-slate-300">
                Our session begins in 1 hour. Please ensure your microphone and camera are ready on Google Meet.
              </p>
            )}

            {activeTab === 'reminder10m' && (
              <p className="text-emerald-300 font-medium">
                Our meeting is starting in 10 minutes. Click the Google Meet link below to enter the room.
              </p>
            )}

            {/* Session Card */}
            <div className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Date &amp; Time:</span>
                <span className="font-bold text-white">
                  {booking.dateString} &bull; {booking.formattedTime}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Topic:</span>
                <span className="text-indigo-300 font-semibold">{booking.topicTitle}</span>
              </div>
              {booking.company && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Organization:</span>
                  <span className="text-slate-200">{booking.company}</span>
                </div>
              )}
              {booking.notes && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <strong className="text-slate-300">Agenda / Question:</strong> {booking.notes}
                </div>
              )}
            </div>

            {/* Meet Link Button */}
            <div className="my-5 text-center">
              <a
                href={booking.googleMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
              >
                <Video className="w-4 h-4" />
                <span>Join Google Meet Session</span>
              </a>
              <div className="text-[11px] text-slate-400 mt-2 font-mono">
                {booking.googleMeetLink}
              </div>
            </div>

            {/* Calendar links in email */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <span>Attached: <strong className="text-slate-300">invite.ics</strong></span>
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                Add to Google Calendar
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer with Real Send Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-t border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyBody}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={async () => {
                setIsSendingApi(true);
                const res = await dispatchBookingEmail(booking);
                setIsSendingApi(false);
                if (res.success) {
                  setApiSentSuccess(res.message || 'Dispatched!');
                  setTimeout(() => setApiSentSuccess(null), 3000);
                }
              }}
              disabled={isSendingApi}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSendingApi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{apiSentSuccess ? 'Dispatched!' : 'Send via API'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={mailtoUrl}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Mail App</span>
            </a>

            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-600/30"
            >
              <Mail className="w-4 h-4" />
              <span>Send via Gmail (1-Click)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
