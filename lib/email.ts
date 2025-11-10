// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

/**
 * Sends an email using the Resend API.
 * @param {object} params - The email parameters.
 * @param {string} params.to - The recipient's email address.
 * @param {string} params.subject - The email subject.
 * @param {string} params.html - The HTML content of the email.
 * @returns {Promise<{success: boolean, data?: any, error?: any}>} An object indicating success or failure.
 */
async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Cosmic Spiritual Guide <noreply@cosmicspiritguide.com>',
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

/**
 * Sends a password reset email to a user.
 * @param {string} email - The user's email address.
 * @param {string} token - The password reset token.
 * @param {string} firstName - The user's first name.
 * @returns {Promise<object>} The result of the sendEmail call.
 */
export async function sendPasswordResetEmail(email: string, token: string, firstName: string) {
  const resetUrl = `${domain}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: 'Segoe UI', ...">
      ... Dear ${firstName || 'Spiritual Seeker'}, ...
      <a href="${resetUrl}" ...>🌟 Reset Your Cosmic Password 🌟</a>
      ...
    </div>
  `;

  return sendEmail({
    to: email,
    subject: '🔮 Your Spiritual Path Awaits - Password Reset',
    html,
  });
}

/**
 * Sends a confirmation email after a successful password reset.
 * @param {string} email - The user's email address.
 * @param {string} firstName - The user's first name.
 * @returns {Promise<object>} The result of the sendEmail call.
 */
export async function sendPasswordResetConfirmationEmail(email: string, firstName: string) {
  const html = `
    <div style="font-family: 'Segoe UI', ...">
      ... Dear ${firstName || 'Spiritual Seeker'}, ...
      <p>... The cosmic forces have successfully restored your spiritual sanctuary. ...</p>
      ...
    </div>
  `;

  return sendEmail({
    to: email,
    subject: '🔮 Your Spiritual Sanctuary Has Been Restored',
    html,
  });
}

/**
 * Sends a transit notification email to a user.
 * @param {string} email - The user's email address.
 * @param {string} firstName - The user's first name.
 * @param {string} subject - The email subject.
 * @param {string} body - The main content of the email.
 * @returns {Promise<object>} The result of the sendEmail call.
 */
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
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #667eea; font-size: 28px; margin: 0 0 10px 0;">
            ⚡ Transit Alert
          </h1>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Cosmic Spiritual Guide
          </p>
        </div>

        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          ${firstName ? `Hi ${firstName},` : 'Hello,'}
        </p>

        <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <div style="color: #374151; font-size: 15px; line-height: 1.8; white-space: pre-line;">
            ${body}
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; text-decoration: none; padding: 14px 32px; border-radius: 25px; 
                    font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            🔮 View Your Transit Dashboard
          </a>
        </div>

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
