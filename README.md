# Ramesh J - AI FDE & Corporate Trainer Calendar

A personalized, high-performance booking calendar for **Ramesh J** — Forward Deployed Engineer (FDE) Consultant, AI FDE Corporate Trainer, Enterprise Architect, and Mentor.

---

## ⚡ Key Features

- **20-Minute Focus Slots**: Precision time blocks tailored for high-leverage consulting.
- **Weekday Availability (Mon – Fri)**:
  - Morning Session: **7:00 AM – 8:00 AM** (3 slots: `07:00-07:20`, `07:20-07:40`, `07:40-08:00`)
  - Evening Session: **6:00 PM – 7:00 PM** (3 slots: `18:00-18:20`, `18:20-18:40`, `18:40-19:00`)
- **Weekend Availability (Sat & Sun)**:
  - Morning Session: **6:00 AM – 9:00 AM** (9 slots)
  - Evening Session: **5:00 PM – 8:00 PM** (9 slots)
  - Night Owl Session: **11:00 PM – 2:00 AM** (9 slots across midnight)
- **Direct Google Meet Scheduling**:
  - Automatically generates unique Google Meet video links (`meet.google.com/xxx-yyyy-zzz`).
  - 1-click **Join Google Meet** button.
  - 1-click **Add to Google Calendar** URL with pre-filled metadata.
  - 1-click **Download .ics (iCalendar)** file conforming to RFC 5545 (for Apple Calendar, Outlook, Google).
- **Automated Email Reminders**:
  - Instant booking confirmation to attendee and `rameshjagarapu1993@gmail.com`.
  - Scheduled reminder triggers for **24 hours prior**, **1 hour prior**, and **10 minutes prior**.
  - Interactive email preview modal with test dispatch simulation.
- **Ramesh's Dashboard (Admin Mode)**:
  - View all upcoming sessions with attendee details, company, topic, and notes.
  - Launch Google Meet room directly.
  - Send on-demand test email reminders.
  - Cancel or delete bookings with automatic slot freeing.
- **Shareable Links & Embeds**:
  - 1-click shareable booking URL (`/book/ramesh-j`).
  - Pre-formatted email and LinkedIn outreach templates.
  - Responsive website `<iframe>` embed snippet.
- **Vercel Ready**:
  - Includes `vercel.json` with SPA routing and serverless function template.

---

## 📁 Project Folder Structure

\`\`\`
ramesh-j-calendar/
├── api/                             # Optional Vercel Serverless Functions
│   └── send-email.ts               # Serverless handler for Resend / SendGrid
├── public/
│   └── favicon.ico
├── src/
│   ├── components/                 # Modular UI Components
│   │   ├── Header.tsx              # Brand banner, title, badges, timezone picker
│   │   ├── CalendarView.tsx        # Month grid with weekday/weekend highlights
│   │   ├── SlotPicker.tsx          # 20-min slot chips (Morning, Evening, Night)
│   │   ├── BookingForm.tsx         # Attendee intake & reminder preferences
│   │   ├── BookingConfirmation.tsx # Confetti celebration & Google Meet hub
│   │   ├── AdminDashboard.tsx      # Ramesh's appointment management center
│   │   ├── EmailModal.tsx          # Simulated automated email previewer
│   │   ├── ShareModal.tsx          # Shareable links, email blurbs, embed code
│   │   └── VercelGuideModal.tsx    # Interactive Vercel deployment blueprint
│   ├── types/
│   │   └── index.ts                # TypeScript types & interfaces
│   ├── utils/
│   │   ├── slotGenerator.ts        # 20-min slot algorithms & schedule rules
│   │   ├── slotGenerator.test.ts   # Node test runner unit tests
│   │   ├── calendarUtils.ts        # Google Meet, GCal URLs, and .ics generator
│   │   └── storage.ts              # LocalStorage persistence manager
│   ├── App.tsx                     # Main application controller
│   ├── main.tsx                    # React DOM root entry
│   └── index.css                   # Tailwind CSS styling & animations
├── index.html                      # HTML entry with synced SEO metadata
├── metadata.json                   # AI Studio applet configuration
├── package.json
├── tsconfig.json
├── vercel.json                     # Vercel deployment configuration
└── README.md
\`\`\`

---

## 🚀 Deploying to Vercel

1. Push your repository to GitHub:
   \`\`\`bash
   git init
   git add .
   git commit -m "feat: personalized booking calendar for Ramesh J"
   git remote add origin https://github.com/your-username/ramesh-calendar.git
   git push -u origin main
   \`\`\`
2. Open [Vercel](https://vercel.com/new) and click **Import Project**.
3. Vercel automatically detects the Vite framework and builds into `dist/`.
4. Deploy! Your calendar is live on `https://your-domain.vercel.app`.
