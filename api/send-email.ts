import nodemailer from 'nodemailer';

interface VercelRequestLike {
  method?: string;
  body: any;
}

interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (data: any) => void;
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    if (!payload?.to || !payload?.clientName || !payload?.formattedTime) {
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
    const text = `Hi ${payload.clientName},

Your 20-minute consultation with Ramesh J is confirmed!

SESSION DETAILS:
• Date: ${payload.dateString}
• Time: ${payload.formattedTime} (${payload.timeZone})
• Duration: 20 Minutes
• Topic: ${payload.topicTitle}
${payload.company ? `• Company: ${payload.company}\n` : ''}
• Google Meet Link: ${payload.googleMeetLink}

Join Google Meet at scheduled time:
${payload.googleMeetLink}

Best regards,
Ramesh J
Forward Deployed Engineer (FDE) Consultant & AI Corporate Trainer
rameshjagarapu1993@gmail.com
`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #334155; border-radius: 16px; overflow: hidden; padding: 24px;">
          <h2 style="color: #ffffff; margin-top: 0;">Ramesh J &bull; 20-Min Focus Session</h2>
          <p style="color: #a5b4fc; font-size: 13px;">Forward Deployed Engineer (FDE) Consultant & AI Corporate Trainer</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 16px 0;" />
          <p>Hi <strong>${payload.clientName}</strong>,</p>
          <p>Your 20-minute consultation is confirmed! Below are your session details:</p>
          <ul>
            <li><strong>Date:</strong> ${payload.dateString}</li>
            <li><strong>Time:</strong> ${payload.formattedTime} (${payload.timeZone})</li>
            <li><strong>Topic:</strong> ${payload.topicTitle}</li>
            <li><strong>Google Meet Link:</strong> <a href="${payload.googleMeetLink}" style="color: #60a5fa;">${payload.googleMeetLink}</a></li>
          </ul>
          <p style="margin-top: 24px;">
            <a href="${payload.googleMeetLink}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Join Google Meet Room
            </a>
          </p>
          <p style="font-size: 11px; color: #64748b; margin-top: 24px;">
            Sent by Ramesh J &middot; rameshjagarapu1993@gmail.com
          </p>
        </div>
      </div>
    `;

    // 1. Send via Resend
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
        return res.status(200).json({ success: true, provider: 'resend', id: data.id });
      }
    }

    // 2. Send via SMTP
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

      return res.status(200).json({ success: true, provider: 'smtp', messageId: info.messageId });
    }

    return res.status(200).json({
      success: true,
      provider: 'client-dispatch',
      isConfigured: false,
      message: 'Email ready for dispatch.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
