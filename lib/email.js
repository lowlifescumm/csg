// lib/email.ts
import nodemailer from 'nodemailer';

// Securely configure the transporter using environment variables
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 587,
  secure: false, // `false` for port 587, as it uses STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const domain = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

// A single, reusable function for sending emails
async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    const mailOptions = {
      from: `"Cosmic Spiritual Guide" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: (error as Error).message };
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
