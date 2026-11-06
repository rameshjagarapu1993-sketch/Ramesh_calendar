import React, { useState } from 'react';
import { Mail, User, Building, MessageSquare, Bell, Video, Calendar, ShieldAlert, Check, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { TimeSlot, SessionTopic, Booking } from '../types';
import { generateGoogleMeetLink } from '../utils/calendarUtils';

interface BookingFormProps {
  selectedSlot: TimeSlot;
  selectedDate: Date;
  timeZone: string;
  onSubmitBooking: (booking: Booking) => void;
  onCancel: () => void;
}

const TOPIC_OPTIONS: { id: SessionTopic; title: string; desc: string }[] = [
  {
    id: 'fde-consulting',
    title: 'Forward Deployed Engineering (FDE) Advisory',
    desc: 'Deploying high-impact client engineering, technical scoping & production readiness.',
  },
  {
    id: 'ai-architecture',
    title: 'AI Architecture & Agentic Workflows',
    desc: 'Production LLMs, tool-use agents, RAG pipelines, and enterprise deployment.',
  },
  {
    id: 'corporate-training',
    title: 'Corporate AI Training & Upskilling',
    desc: 'Custom enterprise hands-on curriculum for engineering organizations.',
  },
  {
    id: 'career-mentorship',
    title: 'FDE Career Mentorship & Guidance',
    desc: '1-on-1 career pathing, transitioning into FDE, and senior technical mentoring.',
  },
  {
    id: 'other',
    title: 'Custom Technical Consultation',
    desc: 'General inquiry, strategic partnerships, or tailored advisory session.',
  },
];

export const BookingForm: React.FC<BookingFormProps> = ({
  selectedSlot,
  selectedDate,
  timeZone,
  onSubmitBooking,
  onCancel,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [company, setCompany] = useState('');
  const [topic, setTopic] = useState<SessionTopic>('fde-consulting');
  const [notes, setNotes] = useState('');

  // Automated Email Reminders - pre-selected
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder1h, setReminder1h] = useState(true);
  const [reminder10m, setReminder10m] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStage, setSubmittingStage] = useState('');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!clientName.trim()) {
      errs.clientName = 'Full name is required';
    }
    if (!clientEmail.trim()) {
      errs.clientEmail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      errs.clientEmail = 'Please provide a valid email';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmittingStage('Scheduling Google Meet & Calendar Invite...');

    const bookingId = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const topicTitle = TOPIC_OPTIONS.find((t) => t.id === topic)?.title || 'Consultation Session';
    const meetLink = generateGoogleMeetLink(bookingId);

    const newBooking: Booking = {
      id: bookingId,
      slotId: selectedSlot.id,
      dateString: selectedSlot.dateString,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      formattedTime: selectedSlot.formattedTime,
      timeZone,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      topic,
      topicTitle,
      company: company.trim() || undefined,
      notes: notes.trim() || undefined,
      googleMeetLink: meetLink,
      createdAt: new Date().toISOString(),
      reminders: {
        reminder24h,
        reminder1h,
        reminder10m,
      },
      status: 'confirmed',
    };

    // Stage 2 feedback to assure user email & calendar trigger is actively processing
    setTimeout(() => {
      setSubmittingStage('Syncing Calendar & Email Dispatcher...');
    }, 450);

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitBooking(newBooking);
    }, 900);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 backdrop-blur-sm">
      {/* Session summary banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Booking Details
          </span>
          <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
            <span className="font-semibold text-emerald-400">{selectedSlot.formattedTime}</span>
            <span className="text-slate-500">&bull;</span>
            <span className="flex items-center gap-1 text-blue-400">
              <Video className="w-3.5 h-3.5" /> Google Meet (20 Mins)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-white underline self-start sm:self-center"
        >
          Change Slot
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Attendee Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="client-name" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Your Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="client-name"
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Alex Mercer"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                errors.clientName
                  ? 'border-rose-500 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/40'
              }`}
            />
            {errors.clientName && (
              <p className="text-rose-400 text-[11px] mt-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> {errors.clientName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="client-email" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              id="client-email"
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="alex@company.com"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                errors.clientEmail
                  ? 'border-rose-500 focus:ring-rose-500/50'
                  : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/40'
              }`}
            />
            {errors.clientEmail && (
              <p className="text-rose-400 text-[11px] mt-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> {errors.clientEmail}
              </p>
            )}
          </div>
        </div>

        {/* Company (Optional) */}
        <div>
          <label htmlFor="client-company" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            Company / Organization <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            id="client-company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme AI Labs or Independent"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </div>

        {/* Consultation Topic */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Session Focus / Topic <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {TOPIC_OPTIONS.map((opt) => {
              const isSelected = topic === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTopic(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950/40 hover:bg-slate-950/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      {opt.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes / Agenda */}
        <div>
          <label htmlFor="client-notes" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            Specific Questions or Context for Ramesh <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <textarea
            id="client-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share details on your stack, specific problem statement, or team background to optimize our 20 minutes..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 transition-all resize-none"
          />
        </div>

        {/* Automated Email Reminders Setup (User brief requested automated email reminders) */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Automated Calendar &amp; Email Reminders</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            You will receive instant calendar invites (.ics) &amp; Google Meet joining details. We'll automatically remind you:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={reminder24h}
                onChange={(e) => setReminder24h(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700"
              />
              <span className="text-slate-200 text-[11px] font-medium">24 Hours Prior</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={reminder1h}
                onChange={(e) => setReminder1h(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700"
              />
              <span className="text-slate-200 text-[11px] font-medium">1 Hour Prior</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={reminder10m}
                onChange={(e) => setReminder10m(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700"
              />
              <span className="text-slate-200 text-[11px] font-medium">10 Minutes Prior</span>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:flex-1 py-3.5 px-5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2.5 ${
              isSubmitting
                ? 'bg-indigo-700/80 text-indigo-100 shadow-indigo-900/40 cursor-not-allowed opacity-90'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                <span>{submittingStage || 'Scheduling Session & Email Dispatch...'}</span>
              </>
            ) : (
              <>
                <span>Confirm 20-Min Booking</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Live Feedback Indicator assuring the user that calendar and email processes are triggered */}
        {isSubmitting && (
          <div className="mt-3 p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/30 flex items-center justify-center gap-2 text-xs text-indigo-200 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Securing 20-min slot &middot; Syncing Google Meet &middot; Triggering automated email notifications</span>
          </div>
        )}
      </form>
    </div>
  );
};
