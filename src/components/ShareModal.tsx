import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, MessageSquare, Linkedin, Code } from 'lucide-react';
import { ConsultantProfile } from '../types';

interface ShareModalProps {
  profile: ConsultantProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ profile, isOpen, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : 'https://rameshj.dev';
  const shareLink = `${currentUrl}?ref=direct`;

  const copyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const emailPitch = `Hi there,\n\nI'd be glad to discuss your project! You can book a 20-minute consultation directly on my calendar here:\n${shareLink}\n\nAvailable slots:\n• Weekdays: 7:00-8:00 AM & 6:00-7:00 PM\n• Weekends: 6:00-9:00 AM, 5:00-8:00 PM & 11:00 PM-2:00 AM\n\nLooking forward to speaking!\nBest regards,\nRamesh J\nForward Deployed Engineer (FDE) Consultant & AI Corporate Trainer`;

  const linkedinPost = `Looking to discuss Enterprise AI architecture, Forward Deployed Engineering (FDE) strategies, or Corporate AI workshops? Feel free to book a direct 20-minute focus session with me: ${shareLink}`;

  const embedCode = `<iframe src="${shareLink}" width="100%" height="750" frameborder="0" style="border-radius: 16px; border: 1px solid #334155;"></iframe>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Your Booking Calendar</h3>
              <p className="text-xs text-slate-400">Give this link to your clients and prospects</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close share modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Host Profile Info */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center gap-3">
            <img
              src={profile.avatarUrl || '/assets/aistudio/WhatsApp_Image_2026-11-05_at_10.13.56_AM_86e8c355.jpeg'}
              alt={profile.name}
              className="w-12 h-12 rounded-xl object-cover object-top border border-indigo-500/30 shadow-md shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                {profile.name}
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-[11px] text-indigo-300 truncate">
                {profile.title}
              </div>
              <div className="text-[10px] text-slate-400">
                20-Min Dedicated Google Meet Consultations
              </div>
            </div>
          </div>

          {/* Main Direct Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Personalized Calendar Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-indigo-300 truncate select-all">
                {shareLink}
              </div>
              <button
                type="button"
                onClick={() => copyText(shareLink, 'link')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
              >
                {copiedType === 'link' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedType === 'link' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Pre-written templates */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Pre-Formatted Email / DM Invite
                </span>
                <button
                  type="button"
                  onClick={() => copyText(emailPitch, 'email')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  {copiedType === 'email' ? 'Copied!' : 'Copy Template'}
                </button>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-300 text-[11px] whitespace-pre-line max-h-24 overflow-y-auto font-sans">
                {emailPitch}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                  LinkedIn / Social Snippet
                </span>
                <button
                  type="button"
                  onClick={() => copyText(linkedinPost, 'linkedin')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  {copiedType === 'linkedin' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-slate-300 text-[11px] font-sans">
                {linkedinPost}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  Website Embed (iFrame)
                </span>
                <button
                  type="button"
                  onClick={() => copyText(embedCode, 'embed')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  {copiedType === 'embed' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 font-mono text-[10px] text-slate-400 truncate">
                {embedCode}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
