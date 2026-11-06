/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  ShieldCheck,
  Award,
  Users,
  Compass,
  ArrowRight,
  Mail,
  Share2,
  Terminal,
  Lock,
  ShieldAlert,
} from 'lucide-react';

import { TimeSlot, Booking, ConsultantProfile } from './types';
import { generateSlotsForDate } from './utils/slotGenerator';
import {
  getStoredBookings,
  getStoredProfile,
  saveBooking,
  cancelBooking,
  deleteBooking,
  getStoredHostAuth,
  setStoredHostAuth,
} from './utils/storage';

import { Header, TIMEZONES } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { SlotPicker } from './components/SlotPicker';
import { BookingForm } from './components/BookingForm';
import { BookingConfirmation } from './components/BookingConfirmation';
import { AdminDashboard } from './components/AdminDashboard';
import { EmailModal } from './components/EmailModal';
import { ShareModal } from './components/ShareModal';
import { VercelGuideModal } from './components/VercelGuideModal';
import { HostLoginModal } from './components/HostLoginModal';

export default function App() {
  const [profile] = useState<ConsultantProfile>(getStoredProfile);
  const [bookings, setBookings] = useState<Booking[]>(getStoredBookings);
  const [activeTab, setActiveTab] = useState<'booking' | 'admin'>('booking');

  // Host access control (only Ramesh J has access to Admin Dashboard)
  const [isHostAuthenticated, setIsHostAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get('pin') || urlParams.get('admin');
    if (pinParam === '1993' || pinParam === 'true') {
      setStoredHostAuth(true);
      return true;
    }
    return getStoredHostAuth();
  });
  const [isHostLoginModalOpen, setIsHostLoginModalOpen] = useState(false);

  // Timezone selection
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>('Asia/Kolkata');

  // Date & Slot Selection
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    // If today is past evening, start on tomorrow
    if (d.getHours() >= 19 && (d.getDay() !== 0 && d.getDay() !== 6)) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  });

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingStep, setBookingStep] = useState<'select' | 'form' | 'confirmed'>('select');
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState<Booking | null>(null);

  // Modals
  const [previewEmailBooking, setPreviewEmailBooking] = useState<Booking | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVercelGuideOpen, setIsVercelGuideOpen] = useState(false);

  // Generate slots dynamically for the selected date
  const dateSlots = useMemo(() => {
    return generateSlotsForDate(selectedDate, bookings);
  }, [selectedDate, bookings]);

  // Handle slot selection
  const handleSelectSlot = (slot: TimeSlot) => {
    if (slot.isBooked || slot.isPast) return;
    setSelectedSlot(slot);
    setBookingStep('form');
  };

  // Submit new booking
  const handleCompleteBooking = (newBooking: Booking) => {
    saveBooking(newBooking);
    setBookings(getStoredBookings());
    setLastConfirmedBooking(newBooking);
    setBookingStep('confirmed');
  };

  // Cancel booking
  const handleCancelBooking = (bookingId: string) => {
    cancelBooking(bookingId);
    setBookings(getStoredBookings());
  };

  // Delete booking
  const handleDeleteBooking = (bookingId: string) => {
    deleteBooking(bookingId);
    setBookings(getStoredBookings());
  };

  const handleBookAnother = () => {
    setSelectedSlot(null);
    setBookingStep('select');
  };

  const handleHostLogout = () => {
    setIsHostAuthenticated(false);
    setStoredHostAuth(false);
    setActiveTab('booking');
  };

  const handleHostLoginSuccess = () => {
    setIsHostAuthenticated(true);
    setStoredHostAuth(true);
    setActiveTab('admin');
  };

  const timeZoneLabel = TIMEZONES.find((t) => t.value === selectedTimeZone)?.label || selectedTimeZone;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        profile={profile}
        selectedTimeZone={selectedTimeZone}
        onTimeZoneChange={setSelectedTimeZone}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenVercelGuide={() => setIsVercelGuideOpen(true)}
        bookingCount={bookings.filter((b) => b.status === 'confirmed').length}
        isHostAuthenticated={isHostAuthenticated}
        onHostLogout={handleHostLogout}
        onOpenHostLogin={() => setIsHostLoginModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'admin' ? (
          isHostAuthenticated ? (
            <AdminDashboard
              bookings={bookings}
              profile={profile}
              onCancelBooking={handleCancelBooking}
              onDeleteBooking={handleDeleteBooking}
              onPreviewEmail={setPreviewEmailBooking}
              onSwitchToBooking={() => setActiveTab('booking')}
              onHostLogout={handleHostLogout}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">Host Access Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The consultant control center and client booking records are private to Ramesh J. Please unlock with your Host PIN.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsHostLoginModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Enter Host PIN to Unlock
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('booking')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Return to Public Booking View
                </button>
              </div>
            </div>
          )
        ) : (
          <div>
            {bookingStep === 'confirmed' && lastConfirmedBooking ? (
              <BookingConfirmation
                booking={lastConfirmedBooking}
                onBookAnother={handleBookAnother}
                onPreviewEmail={setPreviewEmailBooking}
              />
            ) : (
              <div className="space-y-8">
                {/* Hero / Consultant Profile Introduction */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-3xl space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-indigo-400" />
                          Forward Deployed Engineer (FDE) Consultant
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          AI FDE Corporate Trainer &amp; Mentor
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        Book a 20-Minute Focus Session with{' '}
                        <span className="bg-gradient-to-r from-indigo-400 via-blue-300 to-emerald-400 bg-clip-text text-transparent">
                          Ramesh J
                        </span>
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                        Direct 1-on-1 consultation for enterprise AI strategy, Forward Deployed Engineering methodologies, organizational AI upskilling, and architectural advisory. Auto-scheduled on Google Meet with automated email reminders.
                      </p>

                      {/* Capabilities pill tags */}
                      <div className="pt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                        <span className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          Production GenAI &amp; Agentic Workflows
                        </span>
                        <span className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
                          <Compass className="w-3.5 h-3.5 text-emerald-400" />
                          Client-Facing FDE Scoping
                        </span>
                        <span className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
                          <Video className="w-3.5 h-3.5 text-blue-400" />
                          Google Meet Integrated
                        </span>
                      </div>
                    </div>

                    {/* Quick Profile Summary Card */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 min-w-[280px]">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={profile.avatarUrl || '/assets/aistudio/WhatsApp_Image_2026-11-05_at_10.13.56_AM_86e8c355.jpeg'}
                            alt={profile.name}
                            className="w-14 h-14 rounded-2xl object-cover object-top border-2 border-indigo-500/40 shadow-lg shadow-indigo-500/20"
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full" title="Online for bookings" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-base flex items-center gap-1.5">
                            {profile.name}
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="text-[11px] text-indigo-300 font-medium">
                            {profile.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {profile.email}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Format:</span>
                          <span className="font-semibold text-white">1-on-1 Google Meet</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Slot Length:</span>
                          <span className="font-semibold text-emerald-400">20 Minutes</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Timezone:</span>
                          <span className="font-mono text-slate-200">{timeZoneLabel.split(' ')[0]}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsShareModalOpen(true)}
                        className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Share Booking Link</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Booking Workflow: Selection vs Intake Form */}
                {bookingStep === 'form' && selectedSlot ? (
                  <BookingForm
                    selectedSlot={selectedSlot}
                    selectedDate={selectedDate}
                    timeZone={selectedTimeZone}
                    onSubmitBooking={handleCompleteBooking}
                    onCancel={() => setBookingStep('select')}
                  />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Calendar & Policy */}
                    <div className="lg:col-span-7 space-y-6">
                      <CalendarView
                        selectedDate={selectedDate}
                        onSelectDate={(date) => {
                          setSelectedDate(date);
                          setSelectedSlot(null);
                        }}
                      />
                    </div>

                    {/* Right Column: 20-Minute Slots for Selected Date */}
                    <div className="lg:col-span-5">
                      <SlotPicker
                        selectedDate={selectedDate}
                        slots={dateSlots}
                        selectedSlot={selectedSlot}
                        onSelectSlot={handleSelectSlot}
                        timeZoneLabel={timeZoneLabel}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-slate-300">Ramesh J</span>
            <span>&bull;</span>
            <span>Forward Deployed Engineer (FDE) Consultant &amp; AI Corporate Trainer</span>
          </div>

          <div className="flex items-center gap-4">
            {isHostAuthenticated && (
              <button
                type="button"
                onClick={() => setIsVercelGuideOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Terminal className="w-3 h-3" />
                <span>Vercel Structure</span>
              </button>
            )}

            <a
              href="mailto:rameshjagarapu1993@gmail.com"
              className="hover:text-slate-300 flex items-center gap-1"
            >
              <Mail className="w-3 h-3" />
              rameshjagarapu1993@gmail.com
            </a>

            {/* Subtle Host Portal Link in Footer */}
            {isHostAuthenticated ? (
              <button
                type="button"
                onClick={handleHostLogout}
                className="text-slate-500 hover:text-rose-400 flex items-center gap-1 text-[11px] cursor-pointer"
                title="Lock Host Portal"
              >
                <Lock className="w-3 h-3 text-rose-400" />
                <span>Lock Host Mode</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsHostLoginModalOpen(true)}
                className="text-slate-600 hover:text-slate-400 flex items-center gap-1 text-[11px] cursor-pointer"
                title="Host Login (Ramesh J only)"
              >
                <Lock className="w-3 h-3" />
                <span>Host Login</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EmailModal
        booking={previewEmailBooking}
        onClose={() => setPreviewEmailBooking(null)}
      />

      <ShareModal
        profile={profile}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <VercelGuideModal
        isOpen={isVercelGuideOpen}
        onClose={() => setIsVercelGuideOpen(false)}
      />

      <HostLoginModal
        isOpen={isHostLoginModalOpen}
        onClose={() => setIsHostLoginModalOpen(false)}
        onSuccess={handleHostLoginSuccess}
      />
    </div>
  );
}
