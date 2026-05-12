const logger = require('./logger');
// lib/email.ts
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const domain = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

// A single, reusable function for sending emails
async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    if (!resend) {
      logger.error("[Email] RESEND_API_KEY is not set. Email cannot be sent.", {
        to,
        subject,
      });
      return { success: false, error: new Error("Email service not configured") };
    }

    const { data, error } = await resend.emails.send({
      from: 'Cosmic Spiritual Guide <noreply@cosmicspiritguide.com>', // Must be a domain you verified with Resend
      to,
      subject,
      html,
    });

    if (error) {
      logger.error("Resend Error:", error);
      return { success: false, error };
    }
    
    logger.info("Email sent successfully:", data);
    return { success: true, data };

  } catch (error) {
    logger.error("Failed to send email:", error);
    return { success: false, error };
  }
}

// Function to send the password reset email
export async function sendPasswordResetEmail(email: string, token: string, firstName: string) {
  const resetUrl = `${domain}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: 'Segoe UI', ...">
      ... Dear ${firstName || 'Spiritual Seeker'}, ...
      <a href="${resetUrl}" ...>🌟 Reset Your Cosmic Password 🌟</a>
      ...
    </div>
  `; // (Your full, beautiful HTML from before)

  return sendEmail({
    to: email,
    subject: '🔮 Your Spiritual Path Awaits - Password Reset',
    html,
  });
}

// Function to send the confirmation email after a successful reset
export async function sendPasswordResetConfirmationEmail(email: string, firstName: string) {
  const html = `
    <div style="font-family: 'Segoe UI', ...">
      ... Dear ${firstName || 'Spiritual Seeker'}, ...
      <p>... The cosmic forces have successfully restored your spiritual sanctuary. ...</p>
      ...
    </div>
  `; // (Your full, beautiful HTML from before)

  return sendEmail({
    to: email,
    subject: '🔮 Your Spiritual Sanctuary Has Been Restored',
    html,
  });
}

// Function to send a newsletter / lead magnet email with a download link
export async function sendNewsletterLeadMagnetEmail(
  email: string,
  firstName?: string,
  downloadUrl?: string
) {
  const safeName = firstName || 'Spiritual Seeker';
  const link = downloadUrl || 'https://drive.google.com/file/d/15jFmzSH2aj6h4Kl7lPNazFZ9j3gLY5j-/view?usp=sharing';

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; background: radial-gradient(circle at top, #0f172a 0, #020617 55%, #000 100%); padding: 32px 20px;">
      <div style="background: rgba(15,23,42,0.96); border-radius: 18px; padding: 28px 24px; border: 1px solid rgba(148,163,184,0.5); box-shadow: 0 24px 60px rgba(15,23,42,0.85);">
        <div style="text-align:center; margin-bottom: 24px;">
          <div style="display:inline-flex; align-items:center; justify-content:center; width:56px; height:56px; border-radius:18px; background:linear-gradient(135deg,#a855f7,#ec4899); box-shadow:0 12px 30px rgba(168,85,247,0.6);">
            <span style="font-size:28px;">✨</span>
          </div>
          <h1 style="color:#e5e7eb; font-size:26px; margin:18px 0 4px; letter-spacing:0.02em;">
            Your Cosmic Gift Has Arrived
          </h1>
          <p style="color:#9ca3af; font-size:14px; margin:0;">
            Thank you for joining the Cosmic Spirit Guide newsletter
          </p>
        </div>

        <p style="color:#e5e7eb; font-size:15px; line-height:1.7; margin-bottom:18px;">
          Hi ${safeName},
        </p>

        <p style="color:#cbd5f5; font-size:14px; line-height:1.8; margin-bottom:18px;">
          As promised, here is your exclusive download from <strong>Cosmic Spirit Guide</strong>. 
          This guide is designed to help you deepen your spiritual practice and receive clearer messages from the universe.
        </p>

        <div style="margin:24px 0; text-align:center;">
          <a href="${link}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block; padding:14px 28px; border-radius:999px; border:1px solid rgba(248,250,252,0.35);
                   background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899); color:#f9fafb; text-decoration:none;
                   font-weight:600; font-size:14px; letter-spacing:0.03em; text-transform:uppercase;
                   box-shadow:0 18px 40px rgba(129,140,248,0.7);">
            📥 Download Your Cosmic Guide
          </a>
          <p style="color:#9ca3af; font-size:12px; margin-top:10px;">
            If the button doesn’t work, copy and paste this link into your browser:<br/>
            <span style="color:#e5e7eb; word-break:break-all;">${link}</span>
          </p>
        </div>

        <div style="margin-top:16px; padding:16px 14px; border-radius:14px; background:rgba(15,23,42,0.9); border:1px solid rgba(79,70,229,0.6);">
          <p style="color:#e5e7eb; font-size:13px; margin:0 0 4px;">
            🌙 What to expect next
          </p>
          <ul style="color:#9ca3af; font-size:12px; line-height:1.7; padding-left:18px; margin:4px 0;">
            <li>Occasional emails with soulful guidance & practical rituals</li>
            <li>Early access to new tools, readings, and spiritual resources</li>
            <li>No spam, ever — only aligned, high-quality insights</li>
          </ul>
        </div>

        <p style="color:#6b7280; font-size:11px; margin-top:24px; text-align:center;">
          You’re receiving this because you subscribed to the Cosmic Spirit Guide newsletter.<br/>
          If this wasn’t you, you can safely ignore this email.
        </p>

        <p style="color:#4b5563; font-size:11px; margin-top:10px; text-align:center;">
          Cosmic Spirit Guide &copy; ${new Date().getFullYear()}
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "✨ Your Cosmic Spirit Guide Download",
    html,
  });
}

// Function to send transit notification email
export async function sendTransitNotificationEmail(
  email: string, 
  firstName: string, 
  subject: string, 
  body: string
) {
  const dashboardUrl = `${domain}/transits`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 16px;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #667eea; font-size: 28px; margin: 0 0 10px 0;">
            ⚡ Transit Alert
          </h1>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Cosmic Spiritual Guide
          </p>
        </div>

        <!-- Greeting -->
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          ${firstName ? `Hi ${firstName},` : 'Hello,'}
        </p>

        <!-- Message Body -->
        <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <div style="color: #374151; font-size: 15px; line-height: 1.8; white-space: pre-line;">
            ${body}
          </div>
        </div>

        <!-- Call to Action -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; text-decoration: none; padding: 14px 32px; border-radius: 25px; 
                    font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            🔮 View Your Transit Dashboard
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 13px; margin: 5px 0;">
            The universe is speaking to you
          </p>
          <p style="color: #d1d5db; font-size: 12px; margin: 15px 0 5px 0;">
            You received this email because you have an active transit monitoring subscription.
          </p>
          <p style="color: #d1d5db; font-size: 12px; margin: 0;">
            Cosmic Spiritual Guide &copy; ${new Date().getFullYear()}
          </p>
        </div>

      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}