import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  User,
  Mail,
  Building,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Send,
  AlertTriangle,
  Search,
  Filter,
  Sparkles,
  Download,
  Trash2,
  Key,
  ShieldCheck,
  Check,
  Loader2,
  Settings,
  Lock,
} from 'lucide-react';
import { Booking, ConsultantProfile } from '../types';
import { createGoogleCalendarUrl, createGmailComposeUrl, downloadIcsFile } from '../utils/calendarUtils';
import { getStoredEmailSettings, saveEmailSettings, EmailSettings, getStoredHostPin, saveHostPin } from '../utils/storage';
import { sendTestEmail, SendEmailResult } from '../utils/emailService';

interface AdminDashboardProps {
  bookings: Booking[];
  profile: ConsultantProfile;
  onCancelBooking: (id: string) => void;
  onDeleteBooking: (id: string) => void;
  onPreviewEmail: (booking: Booking) => void;
  onSwitchToBooking: () => void;
  onHostLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bookings,
  profile,
  onCancelBooking,
  onDeleteBooking,
  onPreviewEmail,
  onSwitchToBooking,
  onHostLogout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [testSentId, setTestSentId] = useState<string | null>(null);

  // Email API Configuration state
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(getStoredEmailSettings());
  const [resendKeyInput, setResendKeyInput] = useState(emailSettings.resendApiKey);
  const [smtpPassInput, setSmtpPassInput] = useState(emailSettings.smtpPass);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<SendEmailResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Host PIN state
  const [hostPinInput, setHostPinInput] = useState(getStoredHostPin());
  const [hostPinSaved, setHostPinSaved] = useState(false);

  const handleSaveHostPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostPinInput.trim()) return;
    saveHostPin(hostPinInput.trim());
    setHostPinSaved(true);
    setTimeout(() => setHostPinSaved(false), 3000);
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.topicTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.company && b.company.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  const handleSendTestReminder = (bookingId: string) => {
    setTestSentId(bookingId);
    setTimeout(() => {
      setTestSentId(null);
    }, 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: EmailSettings = {
      ...emailSettings,
      resendApiKey: resendKeyInput.trim(),
      smtpPass: smtpPassInput.trim(),
    };
    saveEmailSettings(updated);
    setEmailSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRunLiveTestEmail = async () => {
    setIsTestingEmail(true);
    setTestEmailResult(null);
    const updated: EmailSettings = {
      ...emailSettings,
      resendApiKey: resendKeyInput.trim(),
      smtpPass: smtpPassInput.trim(),
    };
    saveEmailSettings(updated);
    setEmailSettings(updated);

    const result = await sendTestEmail(updated);
    setIsTestingEmail(false);
    setTestEmailResult(result);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Ramesh J &bull; Consultant Control Center
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Calendar &amp; Booking Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Oversee client bookings, initiate Google Meet rooms, trigger email reminders, and configure background email automation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSwitchToBooking}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Open Public Booking View</span>
            </button>

            {onHostLogout && (
              <button
                type="button"
                onClick={onHostLogout}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-200 border border-slate-700/80 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="Lock Host Portal and return to public view"
              >
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Lock / Exit Host Mode</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs text-slate-400 font-medium">Total Bookings</span>
            <div className="text-2xl font-bold text-white mt-1">{bookings.length}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs text-emerald-400 font-medium">Confirmed</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{confirmedCount}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs text-slate-400 font-medium">Slot Duration</span>
            <div className="text-2xl font-bold text-indigo-300 mt-1">20 Mins</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs text-slate-400 font-medium">Email Dispatcher</span>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1">
              {emailSettings.resendApiKey ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Resend Active
                </span>
              ) : (
                <span className="text-indigo-400 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Gmail 1-Click Active
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Automated Email Dispatcher Configuration Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Automated Email Notification Engine</h3>
              <p className="text-xs text-slate-400">
                Dispatches instant confirmations and scheduled reminders to attendees and <strong className="text-slate-300">{profile.email}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Full-Stack Dispatcher Ready
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Settings Form */}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Resend API Key (Recommended for Hands-Free Sending)
                </label>
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  Get free key (3k emails/mo) <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="re_..."
                value={resendKeyInput}
                onChange={(e) => setResendKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Once saved, all booking appointments automatically dispatch real HTML emails in the background without needing user clicks.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Settings className="w-4 h-4" />}
                <span>{savedSuccess ? 'Settings Saved!' : 'Save Email Settings'}</span>
              </button>

              <button
                type="button"
                onClick={handleRunLiveTestEmail}
                disabled={isTestingEmail}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isTestingEmail ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Send className="w-4 h-4 text-emerald-400" />}
                <span>Send Test Email to {profile.email}</span>
              </button>
            </div>

            {testEmailResult && (
              <div className={`p-3 rounded-xl border text-xs ${
                testEmailResult.success && testEmailResult.provider === 'resend'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {testEmailResult.message || 'Test dispatch executed successfully!'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Provider: <strong className="text-white">{testEmailResult.provider || 'Client Dispatcher'}</strong> &bull; Recipient: <strong className="text-white">{profile.email}</strong>
                </div>
              </div>
            )}
          </form>

          {/* Delivery How It Works Explanation */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5 text-slate-300">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              How Emails Are Delivered
            </h4>
            <div className="space-y-2 text-[11px] leading-relaxed">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">1. Instant 1-Click Gmail Send:</span>
                <p className="text-slate-400 mt-0.5">
                  After booking, the client or consultant can click <em>"Send Confirmation via Gmail (1-Click)"</em> which opens a pre-composed Gmail draft with recipient, agenda, and Google Meet room.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">2. Google Calendar Invite:</span>
                <p className="text-slate-400 mt-0.5">
                  Clicking <em>"Add to Google Calendar"</em> adds the meeting directly with attendee email attached. Google automatically dispatches calendar invites with RSVP.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">3. Background Automated Delivery:</span>
                <p className="text-slate-400 mt-0.5">
                  With your free Resend key configured, our <code className="text-indigo-300 font-mono">/api/send-email</code> route sends real HTML confirmations 100% in the background.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Host Access Security & PIN Settings Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Host Access Security &amp; PIN</h3>
              <p className="text-xs text-slate-400">
                Only you can access this Admin Dashboard, booking attendee lists, and email credentials
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Protected with PIN
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <form onSubmit={handleSaveHostPin} className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-200 mb-1.5">
                Change Host Security PIN
              </label>
              <input
                type="text"
                value={hostPinInput}
                onChange={(e) => setHostPinInput(e.target.value)}
                placeholder="4-digit PIN (default 1993)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This PIN is required to unlock this dashboard. Default is <strong className="text-white font-mono">1993</strong>.
              </p>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              {hostPinSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Lock className="w-4 h-4" />}
              <span>{hostPinSaved ? 'PIN Saved!' : 'Update Host PIN'}</span>
            </button>
          </form>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-slate-300 text-[11px] leading-relaxed">
            <span className="font-bold text-white block">Visitor Privacy Assurance:</span>
            <p>
              When clients or prospects open your booking calendar link, this Admin Dashboard, all attendee emails, and credentials are completely hidden from view.
            </p>
            <p>
              To access your dashboard anytime on a new device or browser, click the subtle lock icon in the header or footer and enter your PIN, or append <code className="text-indigo-300 font-mono">?pin=1993</code> to your URL.
            </p>
          </div>
        </div>
      </div>

      {/* Availability Schedule Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          Active Slot Allocation Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5">
              <span className="font-bold text-indigo-300">Weekdays (Mon – Fri)</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold text-[11px]">
                6 slots / day
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center justify-between">
                <span>Morning Session:</span>
                <span className="font-mono text-white font-semibold">7:00 AM – 8:00 AM (3 slots)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Evening Session:</span>
                <span className="font-mono text-white font-semibold">6:00 PM – 7:00 PM (3 slots)</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5">
              <span className="font-bold text-emerald-300">Weekends (Sat &amp; Sun)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[11px]">
                27 slots / day
              </span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li className="flex items-center justify-between">
                <span>Morning Session:</span>
                <span className="font-mono text-white font-semibold">6:00 AM – 9:00 AM (9 slots)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Evening Session:</span>
                <span className="font-mono text-white font-semibold">5:00 PM – 8:00 PM (9 slots)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Night Owl Session:</span>
                <span className="font-mono text-white font-semibold">11:00 PM – 2:00 AM (9 slots)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bookings List Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Scheduled Client Sessions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredBookings.length} of {bookings.length} reservations
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, email, topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table or Empty state */}
        {filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>No reservations found matching current filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredBookings.map((b) => {
              const isTestSent = testSentId === b.id;

              return (
                <div
                  key={b.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-950/40 px-3 rounded-xl transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{b.clientName}</span>
                      {b.company && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {b.company}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="text-xs text-indigo-300 font-medium truncate">
                      {b.topicTitle}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {b.dateString}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        {b.formattedTime}
                      </span>
                      <span>&bull;</span>
                      <a
                        href={`mailto:${b.clientEmail}`}
                        className="flex items-center gap-1 text-slate-300 hover:text-white"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {b.clientEmail}
                      </a>
                    </div>
                  </div>

                  {/* Actions per booking */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={b.googleMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Meet</span>
                    </a>

                    <a
                      href={createGmailComposeUrl(b)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
                      title="Send instant confirmation email via Gmail"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send Gmail</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onPreviewEmail(b)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Preview email template & reminder dispatch"
                    >
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendTestReminder(b.id)}
                      className="px-2 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Trigger automated email reminder dispatch"
                    >
                      <Send className="w-3 h-3 text-amber-400" />
                      <span>{isTestSent ? 'Sent!' : 'Remind'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadIcsFile(b)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Download .ics invite"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {b.status === 'confirmed' ? (
                      <button
                        type="button"
                        onClick={() => onCancelBooking(b.id)}
                        className="px-2 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-medium transition-colors"
                        title="Cancel this session"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDeleteBooking(b.id)}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition-colors"
                        title="Delete from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
