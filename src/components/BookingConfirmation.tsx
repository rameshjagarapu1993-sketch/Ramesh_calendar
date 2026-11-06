import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  Copy,
  Check,
  ExternalLink,
  Download,
  Mail,
  Bell,
  Sparkles,
  ArrowLeft,
  Eye,
  Loader2,
  Key,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Booking } from '../types';
import {
  createGoogleCalendarUrl,
  createGmailComposeUrl,
  createMailtoUrl,
  downloadIcsFile,
  getReminderTimeline,
} from '../utils/calendarUtils';
import { dispatchBookingEmail, SendEmailResult } from '../utils/emailService';
import { getStoredEmailSettings, saveEmailSettings, EmailSettings } from '../utils/storage';

interface BookingConfirmationProps {
  booking: Booking;
  onBookAnother: () => void;
  onPreviewEmail: (booking: Booking) => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onBookAnother,
  onPreviewEmail,
}) => {
  const [copied, setCopied] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<'sending' | 'delivered' | 'ready' | 'error'>('sending');
  const [dispatchResult, setDispatchResult] = useState<SendEmailResult | null>(null);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [resendKeyInput, setResendKeyInput] = useState('');
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(getStoredEmailSettings());
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Trigger celebratory confetti and attempt background email dispatch on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    let isMounted = true;
    const sendConfirmation = async () => {
      setDispatchStatus('sending');
      const result = await dispatchBookingEmail(booking);
      if (!isMounted) return;
      setDispatchResult(result);
      if (result.success && (result.provider === 'resend' || result.provider === 'smtp')) {
        setDispatchStatus('delivered');
      } else {
        setDispatchStatus('ready');
      }
    };

    sendConfirmation();

    return () => {
      isMounted = false;
    };
  }, [booking]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(booking.googleMeetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveResendKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendKeyInput.trim()) return;

    setIsSavingKey(true);
    const updated: EmailSettings = {
      ...emailSettings,
      resendApiKey: resendKeyInput.trim(),
    };
    saveEmailSettings(updated);
    setEmailSettings(updated);

    // Re-dispatch with new key
    setDispatchStatus('sending');
    const result = await dispatchBookingEmail(booking, updated);
    setDispatchResult(result);
    setIsSavingKey(false);
    setShowKeyConfig(false);

    if (result.success && result.provider === 'resend') {
      setDispatchStatus('delivered');
    }
  };

  const gcalUrl = createGoogleCalendarUrl(booking);
  const timeline = getReminderTimeline(booking.dateString, booking.startTime);

  return (
    <div className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 backdrop-blur-md">
      {/* Top success badge with Ramesh J Photo */}
      <div className="text-center pb-6 border-b border-slate-800">
        <div className="relative inline-block mb-3.5">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-11-05_at_10.13.56_AM_86e8c355.jpeg"
            alt="Ramesh J"
            className="w-20 h-20 rounded-2xl object-cover object-top border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/20 mx-auto"
          />
          <div className="absolute -bottom-2 -right-2 p-1 rounded-full bg-emerald-500 text-slate-950 border-2 border-slate-900 shadow-md">
            <CheckCircle2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Session Confirmed!
        </h2>
        <p className="text-sm text-slate-300 mt-1.5 max-w-lg mx-auto">
          Your 20-minute consultation with <strong className="text-white">Ramesh J</strong> has been scheduled and synchronized with Google Meet.
        </p>
      </div>

      {/* Date & Time Highlights */}
      <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Session Date</div>
            <div className="text-sm font-bold text-white">
              {new Date(`${booking.dateString}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Time (20 Minutes)</div>
            <div className="text-sm font-bold text-white">
              {booking.formattedTime}
            </div>
            <div className="text-[11px] text-slate-400">{booking.timeZone}</div>
          </div>
        </div>
      </div>

      {/* Google Meet Link Centerpiece */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-slate-950/80 border border-blue-500/30 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-white text-sm">Google Meet Video Room</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium self-start sm:self-auto">
            Ready to join on call day
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-blue-300 truncate select-all">
            {booking.googleMeetLink}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <a
              href={booking.googleMeetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-colors"
            >
              <span>Join Meet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Calendar Export Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <a
          href={gcalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>Add to Google Calendar (Invites Attendee)</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        <button
          type="button"
          onClick={() => downloadIcsFile(booking)}
          className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download .ics (Apple / Outlook)</span>
        </button>
      </div>

      {/* Direct Email Dispatch & Confirmation Status */}
      <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-5 mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Email Confirmation Dispatcher</h4>
              <p className="text-[11px] text-slate-400">
                To: <strong className="text-indigo-300">{booking.clientEmail}</strong> &bull; CC: <strong className="text-slate-300">rameshjagarapu1993@gmail.com</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPreviewEmail(booking)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Email Content</span>
            </button>
          </div>
        </div>

        {/* Live Delivery Status Banner */}
        <div className="mb-4 p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            {dispatchStatus === 'sending' && (
              <span className="flex items-center gap-2 text-blue-300 font-semibold">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span>Checking automated email dispatch...</span>
              </span>
            )}
            {dispatchStatus === 'delivered' && (
              <span className="flex items-center gap-2 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated Email Dispatched to {booking.clientEmail}!</span>
              </span>
            )}
            {dispatchStatus === 'ready' && (
              <span className="flex items-center gap-2 text-indigo-300 font-semibold">
                <Send className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Send confirmation directly to {booking.clientEmail} below:</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {dispatchStatus === 'delivered' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3" /> Delivered via {dispatchResult?.provider || 'API'}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowKeyConfig(!showKeyConfig)}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 underline cursor-pointer"
              >
                <Key className="w-3 h-3 text-indigo-400" />
                <span>{emailSettings.resendApiKey ? 'Change Resend Key' : 'Connect Resend API Key'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional inline Resend Key configuration */}
        {showKeyConfig && (
          <form onSubmit={handleSaveResendKey} className="mb-4 p-3.5 bg-slate-900/90 border border-indigo-500/40 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                Connect Free Resend API Key (Auto Background Sending)
              </span>
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                Get free key at resend.com <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              Resend gives 3,000 free emails per month. Paste your key below to send emails 100% in the background without needing to click anything.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="re_123456789..."
                value={resendKeyInput}
                onChange={(e) => setResendKeyInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSavingKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {isSavingKey ? 'Verifying...' : 'Save & Send Now'}
              </button>
            </div>
          </form>
        )}

        {/* 1-Click Send Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
          <a
            href={createGmailComposeUrl(booking)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/30 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Send Confirmation via Gmail (1-Click)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          <a
            href={createMailtoUrl(booking)}
            className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Open in Default Mail App</span>
          </a>
        </div>
      </div>

      {/* Reminder Schedule Timeline */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Automated Email Reminders &amp; Dispatch Timeline
            </h4>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {/* Instant Confirmation status row */}
          <div className="flex items-center justify-between text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dispatchStatus === 'delivered' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
              <span className="font-medium text-white">Instant Confirmation Email</span>
            </div>
            {dispatchStatus === 'delivered' ? (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Dispatched
              </span>
            ) : (
              <a
                href={createGmailComposeUrl(booking)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>Send via Gmail</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {booking.reminders.reminder24h && (
            <div className="flex items-center justify-between text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>24-Hour Reminder Alert</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Scheduled for {timeline.reminder24h.formatted}
              </span>
            </div>
          )}

          {booking.reminders.reminder1h && (
            <div className="flex items-center justify-between text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Hour Final Notice with Meet link</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Scheduled for {timeline.reminder1h.formatted}
              </span>
            </div>
          )}

          {booking.reminders.reminder10m && (
            <div className="flex items-center justify-between text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>10-Minute Immediate Join Ping</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Scheduled for {timeline.reminder10m.formatted}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBookAnother}
          className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Book Another Session</span>
        </button>

        <span className="text-xs text-slate-500 font-mono">
          Ref: {booking.id}
        </span>
      </div>
    </div>
  );
};
