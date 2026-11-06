import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FolderTree, FileCode, CheckCircle2, ExternalLink } from 'lucide-react';

interface VercelGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelGuideModal: React.FC<VercelGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copySnippet = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const folderStructure = `ramesh-j-calendar/
├── api/                       # Vercel Serverless Functions
│   ├── send-email.ts         # Automated email notifications (Resend / SendGrid)
│   └── schedule-reminder.ts  # CRON / QStash background email reminders
├── public/
│   ├── favicon.ico
│   └── og-banner.png
├── src/
│   ├── components/           # Modular React UI
│   │   ├── Header.tsx        # Ramesh J Profile, branding & timezone picker
│   │   ├── CalendarView.tsx  # Weekday & Weekend interactive date picker
│   │   ├── SlotPicker.tsx    # 20-min slot selector (morning/evening/night)
│   │   ├── BookingForm.tsx   # Client intake & reminder triggers
│   │   ├── BookingConfirmation.tsx # Confetti, Google Meet & .ics download
│   │   ├── AdminDashboard.tsx# Consultant view & appointment manager
│   │   ├── EmailModal.tsx    # Email preview & manual dispatch
│   │   └── ShareModal.tsx    # Public link sharing & embed generator
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces (slots, bookings, profile)
│   ├── utils/
│   │   ├── slotGenerator.ts  # Weekday (7-8 AM, 6-7 PM) & Weekend (6-9 AM, 5-8 PM, 11 PM-2 AM)
│   │   ├── calendarUtils.ts  # Google Meet links, .ics generation, GCal URLs
│   │   └── storage.ts        # Local / Database persistence adapter
│   ├── App.tsx               # Main entry with routing / view toggling
│   ├── main.tsx
│   └── index.css             # Tailwind CSS v4 styling
├── index.html
├── package.json
├── tsconfig.json
├── vercel.json               # Vercel SPA routing & serverless config
└── README.md`;

  const vercelJsonCode = `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}`;

  const serverlessEmailCode = `// api/send-email.ts (Deployable directly on Vercel Serverless)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientEmail, clientName, topicTitle, dateString, formattedTime, googleMeetLink, type } = req.body;

  // Use Resend, SendGrid, or nodemailer with your API key
  // e.g. const resend = new Resend(process.env.RESEND_API_KEY);
  
  console.log(\`[Email Trigger] \${type} dispatched to \${clientEmail} & rameshjagarapu1993@gmail.com\`);
  
  return res.status(200).json({
    success: true,
    message: \`Automated reminder email sent to \${clientEmail}\`,
    googleMeetLink,
  });
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Vercel Deployment Blueprint &amp; Folder Structure</h3>
              <p className="text-xs text-slate-400">Everything structured for instant push to Vercel</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Vercel Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Quick instructions */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4">
            <h4 className="text-emerald-300 font-bold text-sm mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              100% Vercel-Ready Architecture
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              This application has zero server locks and runs purely as a high-performance Single Page App with optional Vercel Serverless Functions for automated emails. You can push it directly to GitHub and deploy to Vercel with 1 click.
            </p>
          </div>

          {/* Folder structure */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-2 text-sm">
                <FolderTree className="w-4 h-4 text-indigo-400" />
                Recommended Folder Structure
              </span>
              <button
                type="button"
                onClick={() => copySnippet(folderStructure, 'tree')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                {copiedKey === 'tree' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'tree' ? 'Copied' : 'Copy Structure'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-slate-200 overflow-x-auto leading-tight">
              {folderStructure}
            </pre>
          </div>

          {/* vercel.json */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-2 text-sm">
                <FileCode className="w-4 h-4 text-indigo-400" />
                vercel.json (For Routing &amp; SPA Fallback)
              </span>
              <button
                type="button"
                onClick={() => copySnippet(vercelJsonCode, 'vercel')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                {copiedKey === 'vercel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'vercel' ? 'Copied' : 'Copy Config'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-slate-200 overflow-x-auto leading-tight">
              {vercelJsonCode}
            </pre>
          </div>

          {/* Serverless function template */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white flex items-center gap-2 text-sm">
                <FileCode className="w-4 h-4 text-emerald-400" />
                api/send-email.ts (Optional Serverless Reminder Function)
              </span>
              <button
                type="button"
                onClick={() => copySnippet(serverlessEmailCode, 'api')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                {copiedKey === 'api' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'api' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-tight">
              {serverlessEmailCode}
            </pre>
          </div>

          {/* Step by step deployment */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <h5 className="font-bold text-white mb-2 text-xs uppercase tracking-wider text-indigo-400">
              Quick 2-Minute Deployment Steps
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs">
              <li>Initialize git: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">git init && git add . && git commit -m "Initial commit"</code></li>
              <li>Push to your GitHub repository: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">git push origin main</code></li>
              <li>Go to <strong className="text-white">vercel.com/new</strong> and click "Import Project".</li>
              <li>Vercel automatically detects Vite/React and builds to <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">dist/</code>.</li>
              <li>Your personal booking calendar is live on your custom domain (e.g. <strong className="text-white">calendar.rameshj.dev</strong>)!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
