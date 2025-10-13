// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

// A single, reusable function for sending emails
async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Cosmic Spiritual Guide <noreply@your-verified-domain.com>', // Must be a domain you verified with Resend
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend Error:", error);
      return { success: false, error };
    }
    
    console.log("Email sent successfully:", data);
    return { success: true, data };

  } catch (error) {
    console.error("Failed to send email:", error);
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
