import React from 'react';
import { Calendar, Video, Clock, Globe, Share2, ShieldCheck, UserCheck, Sparkles, Terminal, Lock, LogOut } from 'lucide-react';
import { ConsultantProfile } from '../types';

interface HeaderProps {
  profile: ConsultantProfile;
  selectedTimeZone: string;
  onTimeZoneChange: (tz: string) => void;
  activeTab: 'booking' | 'admin';
  onTabChange: (tab: 'booking' | 'admin') => void;
  onOpenShareModal: () => void;
  onOpenVercelGuide: () => void;
  bookingCount: number;
  isHostAuthenticated: boolean;
  onHostLogout: () => void;
  onOpenHostLogin: () => void;
}

export const TIMEZONES = [
  { label: 'India (IST - UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'US Eastern (EST/EDT - UTC-5)', value: 'America/New_York' },
  { label: 'US Pacific (PST/PDT - UTC-8)', value: 'America/Los_Angeles' },
  { label: 'UK London (GMT/BST - UTC+0)', value: 'Europe/London' },
  { label: 'Singapore (SGT - UTC+8)', value: 'Asia/Singapore' },
  { label: 'Central Europe (CET/CEST - UTC+1)', value: 'Europe/Berlin' },
  { label: 'Dubai (GST - UTC+4)', value: 'Asia/Dubai' },
  { label: 'Australia (AEST - UTC+10)', value: 'Australia/Sydney' },
];

export const Header: React.FC<HeaderProps> = ({
  profile,
  selectedTimeZone,
  onTimeZoneChange,
  activeTab,
  onTabChange,
  onOpenShareModal,
  onOpenVercelGuide,
  bookingCount,
  isHostAuthenticated,
  onHostLogout,
  onOpenHostLogin,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top bar with quick navigation & actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover object-top rounded-[10px]"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-lg text-white">
                    RJ
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full" title="Online for bookings" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  {profile.name}
                  <ShieldCheck className="w-4 h-4 text-emerald-400 inline" aria-label="Verified Profile" />
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  FDE Consultant
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                AI FDE Corporate Trainer &middot; Enterprise Architect &middot; Mentor
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher: ONLY visible to authenticated Host (Ramesh J) */}
            {isHostAuthenticated && (
              <div className="bg-slate-900/90 p-1 rounded-xl border border-indigo-500/40 flex items-center shadow-sm">
                <button
                  type="button"
                  onClick={() => onTabChange('booking')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'booking'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Book Session</span>
                  <span className="xs:hidden">Book</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('admin')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Dashboard</span>
                  <span className="xs:hidden">Admin</span>
                  {bookingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                      {bookingCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Timezone Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300 max-w-[155px] sm:max-w-none">
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <label htmlFor="tz-select" className="sr-only">Timezone</label>
              <select
                id="tz-select"
                value={selectedTimeZone}
                onChange={(e) => onTimeZoneChange(e.target.value)}
                className="bg-transparent border-0 text-slate-200 text-xs font-medium focus:outline-none focus:ring-0 cursor-pointer pr-1 truncate"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value} className="bg-slate-900 text-slate-100">
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Share link button */}
            <button
              type="button"
              onClick={onOpenShareModal}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Get shareable link for end users"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Share</span>
            </button>

            {/* Host Controls: Vercel guide & Logout if authenticated, or subtle lock icon */}
            {isHostAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={onOpenVercelGuide}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Vercel deployment folder structure & guide"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vercel</span>
                </button>

                <button
                  type="button"
                  onClick={onHostLogout}
                  className="px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/50 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Lock & Exit Host Mode"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Lock Host</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenHostLogin}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-300 bg-slate-900/50 hover:bg-slate-800 border border-slate-800/60 transition-colors cursor-pointer"
                title="Host Portal Login (Ramesh J only)"
                aria-label="Host Login"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Highlight Banner */}
        <div className="pt-3 pb-1 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <strong className="text-white">20 Mins</strong> per focus session
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Video className="w-3.5 h-3.5 text-blue-400" />
              Auto-scheduled <strong className="text-white">Google Meet</strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Automated reminders: <span className="text-slate-300">24h &bull; 1h &bull; 10m</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              Weekdays: <span className="text-indigo-300 font-semibold">7-8 AM, 6-7 PM</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              Weekends: <span className="text-emerald-300 font-semibold">6-9 AM, 5-8 PM, 11 PM-2 AM</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
