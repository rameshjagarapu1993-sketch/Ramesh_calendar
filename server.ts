import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

interface EmailPayload {
  to: string;
  clientName: string;
  dateString: string;
  formattedTime: string;
  timeZone: string;
  topicTitle: string;
  googleMeetLink: string;
  company?: string;
  notes?: string;
  resendApiKey?: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail?: string;
  };
}

function buildEmailHtml(data: EmailPayload): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; margin: 0; }
    .card { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #334155; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 24px; text-align: center; border-bottom: 1px solid #3730a3; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; color: #a5b4fc; font-size: 13px; }
    .content { padding: 28px 24px; }
    .greeting { font-size: 16px; color: #ffffff; margin-bottom: 16px; }
    .summary-box { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .label { color: #94a3b8; font-weight: 500; }
    .value { color: #f8fafc; font-weight: 600; text-align: right; }
    .meet-btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 18px 0; text-align: center; }
    .meet-box { text-align: center; margin: 24px 0; }
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; background: #090d16; }
    .note { font-size: 12px; color: #94a3b8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Ramesh J</h1>
      <p>Forward Deployed Engineer (FDE) Consultant &middot; AI Corporate Trainer</p>
    </div>
    <div class="content">
      <div class="greeting">Hi <strong>${data.clientName}</strong>,</div>
      <p class="note">Your 20-minute consultation is confirmed! Below are your session details and Google Meet room link.</p>
      
      <div class="summary-box">
        <div class="row"><span class="label">Consultant:</span><span class="value">Ramesh J</span></div>
        <div class="row"><span class="label">Date:</span><span class="value">${data.dateString}</span></div>
        <div class="row"><span class="label">Time:</span><span class="value">${data.formattedTime} (${data.timeZone})</span></div>
        <div class="row"><span class="label">Duration:</span><span class="value">20 Minutes</span></div>
        <div class="row"><span class="label">Topic:</span><span class="value">${data.topicTitle}</span></div>
        ${data.company ? `<div class="row"><span class="label">Company:</span><span class="value">${data.company}</span></div>` : ''}
      </div>

      <div class="meet-box">
        <a href="${data.googleMeetLink}" class="meet-btn" target="_blank">Join Google Meet Session</a>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Direct link: <a href="${data.googleMeetLink}" style="color: #60a5fa;">${data.googleMeetLink}</a></p>
      </div>

      <p class="note">
        <strong>Automated Reminders:</strong> You will receive notifications 24 hours prior, 1 hour prior, and 10 minutes prior to the session start.
      </p>
    </div>
    <div class="footer">
      Sent on behalf of Ramesh J &middot; rameshjagarapu1993@gmail.com<br/>
      Calendar &amp; Scheduling Engine powered by Ramesh J FDE Advisory
    </div>
  </div>
</body>
</html>
  `;
}

function buildEmailText(data: EmailPayload): string {
  return `Hi ${data.clientName},

Your 20-minute consultation with Ramesh J is confirmed!

SESSION DETAILS:
• Date: ${data.dateString}
• Time: ${data.formattedTime} (${data.timeZone})
• Duration: 20 Minutes
• Topic: ${data.topicTitle}
${data.company ? `• Company: ${data.company}\n` : ''}
• Google Meet Link: ${data.googleMeetLink}

Please join the Google Meet link at the scheduled time:
${data.googleMeetLink}

Best regards,
Ramesh J
Forward Deployed Engineer (FDE) Consultant & AI Corporate Trainer
rameshjagarapu1993@gmail.com
`;
}

// POST /api/send-email
app.post('/api/send-email', async (req: Request, res: Response) => {
  try {
    const payload = req.body as EmailPayload;
    if (!payload.to || !payload.clientName || !payload.formattedTime) {
      return res.status(400).json({ success: false, error: 'Missing required booking fields (to, clientName, formattedTime)' });
    }

    const resendKey = payload.resendApiKey || process.env.RESEND_API_KEY;
    const smtpConfig = payload.smtpConfig || (process.env.SMTP_HOST && process.env.SMTP_PASS ? {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || 'rameshjagarapu1993@gmail.com',
      pass: process.env.SMTP_PASS,
      fromEmail: process.env.SMTP_FROM || 'rameshjagarapu1993@gmail.com',
    } : null);

    const subject = `Confirmed: 20-Min Consultation with Ramesh J (AI FDE) - ${payload.dateString} ${payload.formattedTime}`;
    const html = buildEmailHtml(payload);
    const text = buildEmailText(payload);

    // 1. Send via Resend if available
    if (resendKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Ramesh J Booking <onboarding@resend.dev>',
          to: [payload.to],
          bcc: ['rameshjagarapu1993@gmail.com'],
          subject,
          html,
          text,
        }),
      });

      if (resendRes.ok) {
        const data = await resendRes.json();
        return res.json({
          success: true,
          provider: 'resend',
          id: data.id,
          message: `Email confirmation successfully sent to ${payload.to}`,
        });
      } else {
        const errText = await resendRes.text();
        console.error('Resend error:', errText);
      }
    }

    // 2. Send via SMTP / Nodemailer if configured
    if (smtpConfig && smtpConfig.host && smtpConfig.pass) {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Ramesh J" <${smtpConfig.fromEmail || smtpConfig.user}>`,
        to: payload.to,
        bcc: 'rameshjagarapu1993@gmail.com',
        subject,
        text,
        html,
      });

      return res.json({
        success: true,
        provider: 'smtp',
        messageId: info.messageId,
        message: `Email confirmation successfully dispatched to ${payload.to} via SMTP`,
      });
    }

    // 3. Fallback: No external key configured yet on server
    // Return structured payload so the client can show status and trigger direct 1-click fallback
    return res.json({
      success: true,
      provider: 'client-dispatch',
      isConfigured: false,
      message: 'Email ready for dispatch. Connect a Resend API key or use 1-Click Gmail Send for instant delivery.',
      emailDetails: {
        to: payload.to,
        bcc: 'rameshjagarapu1993@gmail.com',
        subject,
        text,
      },
    });
  } catch (error: any) {
    console.error('Error handling /api/send-email:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while sending email',
    });
  }
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Ramesh J Calendar & Email Dispatcher',
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    hasSmtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_PASS),
  });
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ramesh J Calendar server running at http://localhost:${PORT}`);
  });
}

startServer();
