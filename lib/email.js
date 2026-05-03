/**
 * Email Service
 * Handles all transactional emails using Resend
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = 'Cosmic Spiritual Guide <noreply@cosmicspiritguide.com>';

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, firstName, resetToken) {
  if (!resend) {
    console.log('[Email] Resend not configured, would send password reset to:', email);
    return { success: false, error: 'RESEND_NOT_CONFIGURED' };
  }

  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cosmicspiritguide.com'}/reset-password?token=${resetToken}`;
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset Your Password - Cosmic Spirit Guide',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Reset Your Password</h1>
            </div>
            <p>Hi ${firstName || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <div class="footer">
              <p>Cosmic Spirit Guide 🌟</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('[Email] Failed to send password reset:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset confirmation email
 */
export async function sendPasswordResetConfirmationEmail(email, firstName) {
  if (!resend) {
    console.log('[Email] Resend not configured, would send password reset confirmation to:', email);
    return { success: false, error: 'RESEND_NOT_CONFIGURED' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Password Successfully Reset - Cosmic Spirit Guide',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Successful</h1>
            </div>
            <p>Hi ${firstName || 'there'},</p>
            <p>Your password has been successfully reset. You can now log in with your new password.</p>
            <p>If you didn't make this change, please contact support immediately.</p>
            <div class="footer">
              <p>Cosmic Spirit Guide 🌟</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('[Email] Failed to send password reset confirmation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send transit notification email
 */
export async function sendTransitNotificationEmail(email, firstName, subject, body) {
  if (!resend) {
    console.log('[Email] Resend not configured, would send transit notification to:', email);
    return { success: false, error: 'RESEND_NOT_CONFIGURED' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: subject || '🌟 Cosmic Update - Your Transit Alert',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌟 Cosmic Transit Alert</h1>
            </div>
            <p>Hi ${firstName || 'there'},</p>
            <div class="content">
              ${body || 'A significant transit is occurring in your chart.'}
            </div>
            <p style="margin-top: 20px;">Log in to your dashboard for full details.</p>
            <div class="footer">
              <p>Cosmic Spirit Guide 🌟</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('[Email] Failed to send transit notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send newsletter lead magnet email
 */
export async function sendNewsletterLeadMagnetEmail(email, firstName) {
  if (!resend) {
    console.log('[Email] Resend not configured, would send newsletter to:', email);
    return { success: false, error: 'RESEND_NOT_CONFIGURED' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '🌟 Welcome to Cosmic Spirit Guide - Your Free Daily Credits',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
            .features { list-style: none; padding: 0; }
            .features li { padding: 10px 0; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Welcome to Cosmic Spirit Guide!</h1>
            </div>
            <p>Hi ${firstName || 'there'},</p>
            <p>Thank you for joining us on this cosmic journey. Here are your starting benefits:</p>
            <ul class="features">
              <li>🌙 <strong>3 Free Credits Daily</strong> - Start your day with guided tarot readings</li>
              <li>🔮 <strong>AI-Powered Insights</strong> - Personalized readings based on your birth chart</li>
              <li>📊 <strong>Transit Tracking</strong> - Stay aligned with celestial movements</li>
              <li>💫 <strong>Moon Readings</strong> - Deep emotional and energetic guidance</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cosmicspiritguide.com'}/dashboard" class="button">Start Your Journey</a>
            </p>
            <div class="footer">
              <p>Cosmic Spirit Guide 🌟</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('[Email] Failed to send newsletter:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email, firstName) {
  return sendNewsletterLeadMagnetEmail(email, firstName);
}