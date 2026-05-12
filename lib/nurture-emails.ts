const logger = require('./lib/logger');
// Email nurture sequence for CosmicSpiritGuide
// Sends 5-7 emails over 12+ days to convert signups to paying users

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://cosmicspiritguide.com';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Core send function
async function sendNurtureEmail({
  user,
  emailNumber,
  subject,
  html,
}: {
  user: User;
  emailNumber: number;
  subject: string;
  html: string;
}) {
  if (!resend) {
    logger.error('[NurtureEmail] RESEND_API_KEY not set');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Cosmic Spirit Guide <hello@cosmicspiritguide.com>',
      to: user.email,
      subject,
      html,
      tags: [
        { name: 'sequence', value: 'welcome_nurture' },
        { name: 'email_number', value: String(emailNumber) },
        { name: 'user_id', value: String(user.id) },
      ],
    });

    if (error) {
      logger.error(`[NurtureEmail] Email ${emailNumber} failed:`, error);
      return { success: false, error };
    }

    logger.info(`[NurtureEmail] Email ${emailNumber} sent to ${user.email}:`, data?.id);
    return { success: true, data };
  } catch (err) {
    logger.error(`[NurtureEmail] Email ${emailNumber} exception:`, err);
    return { success: false, error: err };
  }
}

// Email 1: Welcome (Immediate)
export async function sendWelcomeEmail(user: User) {
  const firstName = user.firstName || 'Spiritual Seeker';
  const dashboardUrl = `${domain}/dashboard`;
  const readingUrl = `${domain}/tarot`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Cosmic Spirit Guide</title>
</head>
<body style="margin: 0; padding: 0; background: #0f172a; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%);">
              <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Your Cosmic Journey Starts Now</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 16px;">Welcome to Cosmic Spirit Guide, ${firstName}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
                Hi ${firstName},
              </p>
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                I'm thrilled you've joined thousands of seekers who use Cosmic Spirit Guide to unlock the wisdom of the stars, cards, and ancient astrology.
              </p>
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
                To get you started, I've gifted you <strong style="color: #a855f7;">3 FREE credits</strong> — enough for your first tarot reading or birth chart exploration.
              </p>
              
              <!-- CTA Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 24px; text-align: center;">
                    <p style="color: #e2e8f0; font-size: 18px; margin: 0 0 8px; font-weight: 600;">🎁 Your Welcome Gift</p>
                    <p style="color: #a855f7; font-size: 36px; margin: 0; font-weight: 700;">3 FREE CREDITS</p>
                    <p style="color: #94a3b8; font-size: 14px; margin: 8px 0 20px;">Start your first reading now</p>
                    <a href="${readingUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 9999px; font-weight: 600; font-size: 15px; box-shadow: 0 10px 30px rgba(124,58,237,0.4);">🔮 Claim Your Free Reading</a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                Here's what you can do with your credits:
              </p>
              <ul style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 24px; padding-left: 24px;">
                <li style="margin-bottom: 8px;">✨ <strong>AI Tarot Reading</strong> — Ask anything, get personalized guidance</li>
                <li style="margin-bottom: 8px;">🌙 <strong>Birth Chart Analysis</strong> — Discover your cosmic blueprint</li>
                <li style="margin-bottom: 8px;">💕 <strong>Compatibility Report</strong> — See how the stars align between you and another</li>
                <li>📅 <strong>Daily Horoscope</strong> — Personalized daily insights</li>
              </ul>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0; padding-top: 24px; border-top: 1px solid rgba(148,163,184,0.2);">
                Questions? Just reply to this email — I read every message.<br><br>
                Welcome to the cosmos,<br>
                <strong style="color: #e2e8f0;">The Cosmic Spirit Guide Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: #0f172a; text-align: center; border-top: 1px solid rgba(148,163,184,0.1);">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Cosmic Spirit Guide &copy; ${new Date().getFullYear()}<br>
                <a href="${domain}/unsubscribe" style="color: #64748b; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendNurtureEmail({
    user,
    emailNumber: 1,
    subject: '✨ Your cosmic journey starts now — 3 free credits inside',
    html,
  });
}

// Email 2: First Reading (Day 2)
export async function sendFirstReadingEmail(user: User) {
  const firstName = user.firstName || 'there';
  const readingUrl = `${domain}/tarot`;
  const creditsUrl = `${domain}/credits`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ready for your first reading?</title>
</head>
<body style="margin: 0; padding: 0; background: #0f172a; font-family: 'Segoe UI', system-ui, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 32px 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 40px;">🔮</span>
              </div>
              
              <h1 style="color: #e2e8f0; font-size: 24px; margin: 0 0 20px; text-align: center;">Your Cards Are Waiting</h1>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                Hi ${firstName},
              </p>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                You joined Cosmic Spirit Guide 2 days ago with 3 free credits. Have you tried your first reading yet?
              </p>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
                If you're unsure where to start, here's what most people ask in their first reading:
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td style="background: rgba(168,85,247,0.1); border-radius: 12px; padding: 20px;">
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 16px; font-style: italic;">"What energy should I focus on this week?"</p>
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 16px; font-style: italic;">"What do the cards see for my career path?"</p>
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0; font-style: italic;">"What guidance do I need right now?"</p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.7; margin: 24px 0;">
                The cards respond to genuine curiosity. Ask what truly matters to you.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${readingUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 9999px; font-weight: 600; font-size: 15px;">Start Your Reading</a>
              </div>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
                <strong>How credits work:</strong><br>
                • 1 credit = 1 tarot reading<br>
                • 2 credits = 1 birth chart<br>
                • 3 credits = 1 compatibility report<br>
                <a href="${creditsUrl}" style="color: #a855f7; text-decoration: none;">View pricing →</a>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px 40px; background: #0f172a; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">Cosmic Spirit Guide &copy; ${new Date().getFullYear()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendNurtureEmail({
    user,
    emailNumber: 2,
    subject: '🔮 Ready for your first reading?',
    html,
  });
}

// Email 3: Birth Chart Deep Dive (Day 5)
export async function sendBirthChartEmail(user: User) {
  const firstName = user.firstName || 'there';
  const birthChartUrl = `${domain}/birth-chart`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your birth chart reveals your cosmic blueprint</title>
</head>
<body style="margin: 0; padding: 0; background: #0f172a; font-family: 'Segoe UI', system-ui, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #d946ef 100%); padding: 40px; text-align: center;">
              <span style="font-size: 48px;">🌟</span>
              <h1 style="color: #ffffff; font-size: 26px; margin: 16px 0 8px;">The 3 Most Important Things<br>in Your Birth Chart</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 15px;">Your cosmic blueprint decoded</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 32px 40px;">
              <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 20px;">Hi ${firstName},</p>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
                Your birth chart is like a fingerprint of the cosmos from the exact moment you were born. While most people only know their Sun sign, there are 3 placements that truly define your cosmic identity:
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                <!-- Sun Sign -->
                <tr>
                  <td style="padding: 20px; background: rgba(251,191,36,0.1); border-left: 4px solid #fbbf24; border-radius: 0 12px 12px 0; margin-bottom: 16px;">
                    <h3 style="color: #fbbf24; margin: 0 0 8px; font-size: 18px;">☀️ Sun Sign — Your Core Identity</h3>
                    <p style="color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.6;">This is your ego, your essence, what drives you at the deepest level. It's what you "are" in this lifetime.</p>
                  </td>
                </tr>
                <tr><td style="height: 16px;"></td></tr>
                
                <!-- Moon Sign -->
                <tr>
                  <td style="padding: 20px; background: rgba(168,85,247,0.1); border-left: 4px solid #a855f7; border-radius: 0 12px 12px 0;">
                    <h3 style="color: #a855f7; margin: 0 0 8px; font-size: 18px;">🌙 Moon Sign — Your Emotional Self</h3>
                    <p style="color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.6;">How you feel, what you need for security, your instinctive reactions. This is your private, emotional world.</p>
                  </td>
                </tr>
                <tr><td style="height: 16px;"></td></tr>
                
                <!-- Rising Sign -->
                <tr>
                  <td style="padding: 20px; background: rgba(59,130,246,0.1); border-left: 4px solid #3b82f6; border-radius: 0 12px 12px 0;">
                    <h3 style="color: #60a5fa; margin: 0 0 8px; font-size: 18px;">⬆️ Rising Sign — Your Outer Persona</h3>
                    <p style="color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.6;">The mask you wear, first impressions, how others see you. This is your "social self."</p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 24px 0;">
                Together, these three placements tell the story of <strong>who you are</strong>, <strong>what you need</strong>, and <strong>how you show up</strong> in the world.
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0; background: linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(219,39,119,0.2) 100%); border-radius: 12px;">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 16px; font-weight: 600;">Ready to see your complete birth chart?</p>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px;">Get your Sun, Moon, Rising & all 12 houses analyzed</p>
                    <a href="${birthChartUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 9999px; font-weight: 600; font-size: 15px;">Create Your Birth Chart</a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
                Most people are surprised by their Moon and Rising signs. What will yours reveal?
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px 40px; background: #0f172a; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">Cosmic Spirit Guide &copy; ${new Date().getFullYear()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendNurtureEmail({
    user,
    emailNumber: 3,
    subject: '🌟 The 3 most important things in your birth chart',
    html,
  });
}

// Email 4: Community Invite (Day 8)
export async function sendCommunityEmail(user: User) {
  const firstName = user.firstName || 'there';
  const dashboardUrl = `${domain}/dashboard`;
  const compatibilityUrl = `${domain}/compatibility`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're part of something cosmic</title>
</head>
<body style="margin: 0; padding: 0; background: #0f172a; font-family: 'Segoe UI', system-ui, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <span style="font-size: 48px;">🌌</span>
              <h1 style="color: #e2e8f0; font-size: 26px; margin: 16px 0 8px;">You're Part of the Cosmos</h1>
              <p style="color: #94a3b8; margin: 0; font-size: 15px;">Join thousands of seekers exploring together</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px 40px 32px;">
              <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 20px;">Hi ${firstName},</p>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                You've been with Cosmic Spirit Guide for over a week now. Whether you've done one reading or ten, you're now part of a community of spiritual seekers using ancient wisdom to navigate modern life.
              </p>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
                Here's what's waiting for you:
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 20px; background: rgba(124,58,237,0.1); border-radius: 12px; text-align: center;">
                    <span style="font-size: 32px;">💕</span>
                    <h3 style="color: #e2e8f0; font-size: 18px; margin: 12px 0 8px;">Compatibility Readings</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px;">See how your chart connects with friends, partners, or potential matches</p>
                    <a href="${compatibilityUrl}" style="color: #a855f7; text-decoration: none; font-weight: 600;">Try it →</a>
                  </td>
                </tr>
                <tr><td style="height: 16px;"></td></tr>
                <tr>
                  <td style="padding: 20px; background: rgba(59,130,246,0.1); border-radius: 12px; text-align: center;">
                    <span style="font-size: 32px;">📅</span>
                    <h3 style="color: #e2e8f0; font-size: 18px; margin: 12px 0 8px;">Daily Horoscope</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px;">Personalized daily guidance based on your unique chart</p>
                    <a href="${dashboardUrl}" style="color: #60a5fa; text-decoration: none; font-weight: 600;">View dashboard →</a>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background: linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(251,191,36,0.05) 100%); border-radius: 12px; border: 1px solid rgba(251,191,36,0.2);">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #fbbf24; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Coming Soon</p>
                    <p style="color: #e2e8f0; font-size: 16px; margin: 0; font-weight: 600;">Transit Notifications</p>
                    <p style="color: #94a3b8; font-size: 14px; margin: 8px 0 0;">Get alerted when important planets aspect your personal chart</p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0; text-align: center;">
                The cosmos speaks to those who listen.<br>
                Keep exploring.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px 40px; background: #0f172a; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">Cosmic Spirit Guide &copy; ${new Date().getFullYear()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendNurtureEmail({
    user,
    emailNumber: 4,
    subject: '🌌 You\'re part of something cosmic',
    html,
  });
}

// Email 5: Special Offer (Day 12)
export async function sendSpecialOfferEmail(user: User) {
  const firstName = user.firstName || 'there';
  const creditsUrl = `${domain}/credits`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>40% off your first premium reading</title>
</head>
<body style="margin: 0; padding: 0; background: #0f172a; font-family: 'Segoe UI', system-ui, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7c2d12 100%); padding: 40px; text-align: center;">
              <span style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 9999px; padding: 8px 16px; color: #ffffff; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 16px;">Limited Time</span>
              <h1 style="color: #ffffff; font-size: 36px; margin: 0 0 8px; font-weight: 700;">40% OFF</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0;">Your first premium reading</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 32px 40px;">
              <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 20px;">Hi ${firstName},</p>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                You've been exploring Cosmic Spirit Guide for almost two weeks. Maybe you've used your free credits. Maybe you're curious about what a deeper reading could reveal.
              </p>
              
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
                Here's my gift to you: <strong style="color: #fbbf24;">40% off your first credit purchase</strong>. Because the cosmos has more to tell you.
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td style="padding: 24px; background: rgba(251,191,36,0.1); border: 2px dashed #fbbf24; border-radius: 12px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 8px;">Use code at checkout:</p>
                    <p style="color: #fbbf24; font-size: 28px; margin: 0; font-weight: 700; letter-spacing: 0.1em;">COSMIC40</p>
                    <p style="color: #64748b; font-size: 12px; margin: 12px 0 0;">Valid for 48 hours only</p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td style="width: 48%; padding: 20px; background: rgba(124,58,237,0.1); border-radius: 12px; text-align: center;">
                    <p style="color: #a855f7; font-size: 24px; margin: 0 0 4px; font-weight: 700;">10</p>
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0;">Credits</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0; text-decoration: line-through;">$9.99</p>
                    <p style="color: #fbbf24; font-size: 18px; margin: 4px 0 0; font-weight: 700;">$5.99</p>
                  </td>
                  <td style="width: 4%;"></td>
                  <td style="width: 48%; padding: 20px; background: rgba(59,130,246,0.1); border-radius: 12px; text-align: center;">
                    <p style="color: #60a5fa; font-size: 24px; margin: 0 0 4px; font-weight: 700;">25</p>
                    <p style="color: #e2e8f0; font-size: 14px; margin: 0;">Credits</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0; text-decoration: line-through;">$19.99</p>
                    <p style="color: #fbbf24; font-size: 18px; margin: 4px 0 0; font-weight: 700;">$11.99</p>
                  </td>
                </tr>
              </table>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${creditsUrl}?code=COSMIC40" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 9999px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(220,38,38,0.4);">Claim Your 40% Off</a>
              </div>
              
              <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 24px 0 0; text-align: center;">
                Offer expires in 48 hours. Cannot be combined with other offers.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px 40px; background: #0f172a; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">Cosmic Spirit Guide &copy; ${new Date().getFullYear()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendNurtureEmail({
    user,
    emailNumber: 5,
    subject: '🎁 40% off — Your cosmic journey awaits',
    html,
  });
}

// Export all functions
export {
  sendNurtureEmail,
};
