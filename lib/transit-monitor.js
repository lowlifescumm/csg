/**
 * Transit Monitoring Service
 * 
 * Monitors active transit subscriptions and sends notifications when:
 * - Transit enters orb (start)
 * - Transit reaches exactitude (peak)
 * - Transit leaves orb (end)
 * 
 * This service should be run as a scheduled job (cron/worker)
 */

import { pool } from './db.js';
import {
  getUserTransits,
  updateTransitStatuses,
  generateNotificationHash
} from './transit-engine.js';
import { sendTransitNotificationEmail } from './email';

// =============================================================================
// MAIN MONITORING FUNCTION
// =============================================================================

/**
 * Check all active subscriptions and send notifications
 * Should be called hourly by a cron job
 */
export async function monitorAllTransitSubscriptions() {
  console.log('[Transit Monitor] Starting monitoring cycle...');
  
  try {
    // Update all transit statuses first
    await updateTransitStatuses();

    // Get all active subscriptions that need checking
    const { rows: subscriptions } = await pool.query(
      `SELECT ts.*, nc.natal_positions, nc.houses, u.email, u.first_name
       FROM transit_subscriptions ts
       JOIN natal_charts nc ON ts.natal_chart_id = nc.id
       JOIN users u ON ts.user_id = u.id
       WHERE ts.is_active = true
       AND (ts.next_check IS NULL OR ts.next_check <= NOW())
       ORDER BY ts.next_check ASC NULLS FIRST
       LIMIT 100`
    );

    console.log(`[Transit Monitor] Found ${subscriptions.length} subscriptions to check`);

    let notificationsSent = 0;
    let errors = 0;

    for (const subscription of subscriptions) {
      try {
        const sent = await checkSubscription(subscription);
        notificationsSent += sent;

        // Update last_check and next_check
        const nextCheck = new Date();
        nextCheck.setHours(nextCheck.getHours() + 1); // Check again in 1 hour

        await pool.query(
          `UPDATE transit_subscriptions
           SET last_check = NOW(), next_check = $1
           WHERE id = $2`,
          [nextCheck, subscription.id]
        );

      } catch (error) {
        console.error(`[Transit Monitor] Error checking subscription ${subscription.id}:`, error);
        errors++;
      }
    }

    console.log(`[Transit Monitor] Cycle complete. Sent ${notificationsSent} notifications. Errors: ${errors}`);

    return {
      success: true,
      subscriptionsChecked: subscriptions.length,
      notificationsSent,
      errors
    };

  } catch (error) {
    console.error('[Transit Monitor] Fatal error in monitoring cycle:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// =============================================================================
// SUBSCRIPTION CHECKING
// =============================================================================

/**
 * Check a single subscription and send notifications if needed
 * @param {Object} subscription - Subscription record with user and chart data
 * @returns {number} Number of notifications sent
 */
async function checkSubscription(subscription) {
  const {
    id: subscriptionId,
    user_id: userId,
    natal_chart_id: natalChartId,
    transiting_bodies,
    natal_points,
    aspects,
    min_strength,
    notify_email,
    notify_push,
    notify_webhook,
    webhook_url,
    email,
    first_name
  } = subscription;

  // Get user's transits from database
  const transits = await getUserTransits(userId, 7); // Next 7 days

  // Filter transits based on subscription preferences
  const relevantTransits = transits.filter(transit => {
    return (
      transiting_bodies.includes(transit.transiting_body) &&
      natal_points.includes(transit.natal_point) &&
      aspects.includes(transit.aspect) &&
      transit.strength_score >= min_strength
    );
  });

  let notificationsSent = 0;

  for (const transit of relevantTransits) {
    // Determine event type based on timing
    const eventType = determineEventType(transit);
    if (!eventType) continue; // No event to notify about

    // Check if notification already sent (deduplication)
    const notifHash = generateNotificationHash(userId, transit.id, eventType);
    const { rows: existingNotif } = await pool.query(
      'SELECT id FROM transit_notifications WHERE notification_hash = $1',
      [notifHash]
    );

    if (existingNotif.length > 0) {
      continue; // Already sent this notification
    }

    // Send notifications based on preferences
    const notificationsSentForTransit = await sendNotifications({
      transit,
      subscription,
      eventType,
      email,
      firstName: first_name,
      notifyEmail: notify_email,
      notifyPush: notify_push,
      notifyWebhook: notify_webhook,
      webhookUrl: webhook_url,
      notificationHash: notifHash
    });

    notificationsSent += notificationsSentForTransit;
  }

  return notificationsSent;
}

/**
 * Determine what type of event is happening with this transit
 * @param {Object} transit - Transit record
 * @returns {string|null} Event type or null
 */
function determineEventType(transit) {
  const now = new Date();
  const startTime = new Date(transit.start_time);
  const exactTime = new Date(transit.exact_time);
  const endTime = new Date(transit.end_time);

  // Check if exact time is within the next 24 hours
  const hoursUntilExact = (exactTime - now) / (1000 * 60 * 60);
  if (hoursUntilExact >= 0 && hoursUntilExact <= 24) {
    return 'exact';
  }

  // Check if just entered orb (within last 24 hours)
  const hoursSinceStart = (now - startTime) / (1000 * 60 * 60);
  if (hoursSinceStart >= 0 && hoursSinceStart <= 24) {
    return 'entering';
  }

  // Check if leaving orb soon (within next 24 hours)
  const hoursUntilEnd = (endTime - now) / (1000 * 60 * 60);
  if (hoursUntilEnd >= 0 && hoursUntilEnd <= 24) {
    return 'leaving';
  }

  return null;
}

// =============================================================================
// NOTIFICATION SENDING
// =============================================================================

/**
 * Send all configured notification types for a transit event
 */
async function sendNotifications({
  transit,
  subscription,
  eventType,
  email,
  firstName,
  notifyEmail,
  notifyPush,
  notifyWebhook,
  webhookUrl,
  notificationHash
}) {
  let sent = 0;

  const notificationData = {
    transit: {
      transitingBody: transit.transiting_body,
      natalPoint: transit.natal_point,
      aspect: transit.aspect,
      exactTime: transit.exact_time,
      strengthScore: transit.strength_score,
      orb: transit.orb
    },
    eventType,
    timestamp: new Date().toISOString()
  };

  // Email notification
  if (notifyEmail && email) {
    try {
      await sendEmailNotification({
        email,
        firstName,
        transit,
        eventType
      });

      await logNotification(
        subscription.user_id,
        transit.id,
        subscription.id,
        'email',
        eventType,
        notificationHash,
        notificationData,
        true
      );

      sent++;
    } catch (error) {
      console.error('[Transit Monitor] Email notification failed:', error);
      await logNotification(
        subscription.user_id,
        transit.id,
        subscription.id,
        'email',
        eventType,
        notificationHash,
        notificationData,
        false,
        error.message
      );
    }
  }

  // Push notification
  if (notifyPush) {
    try {
      // NOTE: Push notifications are planned but not yet implemented.
      // This feature will use the Web Push API to send browser notifications
      // when important transits occur. Implementation requires:
      // 1. Service worker registration
      // 2. Push subscription management
      // 3. VAPID key configuration
      // 4. Notification permission handling
      console.log('[Transit Monitor] Push notifications not yet implemented');
    } catch (error) {
      console.error('[Transit Monitor] Push notification failed:', error);
    }
  }

  // Webhook notification
  if (notifyWebhook && webhookUrl) {
    try {
      await sendWebhookNotification(webhookUrl, notificationData);

      await logNotification(
        subscription.user_id,
        transit.id,
        subscription.id,
        'webhook',
        eventType,
        notificationHash + '-webhook',
        notificationData,
        true
      );

      sent++;
    } catch (error) {
      console.error('[Transit Monitor] Webhook notification failed:', error);
      await logNotification(
        subscription.user_id,
        transit.id,
        subscription.id,
        'webhook',
        eventType,
        notificationHash + '-webhook',
        notificationData,
        false,
        error.message
      );
    }
  }

  return sent;
}

/**
 * Send email notification
 */
async function sendEmailNotification({ email, firstName, transit, eventType }) {
  const subject = getEmailSubject(transit, eventType);
  const body = getEmailBody(firstName, transit, eventType);

  // Use existing email service
  await sendTransitNotificationEmail(email, firstName, subject, body);
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(webhookUrl, data) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Cosmic-Transit-Monitor/1.0'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Log notification to database
 */
async function logNotification(
  userId,
  transitId,
  subscriptionId,
  notificationType,
  eventType,
  notificationHash,
  payload,
  delivered,
  errorMessage = null
) {
  await pool.query(
    `INSERT INTO transit_notifications (
      user_id, transit_id, subscription_id, notification_type, event_type,
      notification_hash, payload, delivered, delivery_status, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      userId,
      transitId,
      subscriptionId,
      notificationType,
      eventType,
      notificationHash,
      JSON.stringify(payload),
      delivered,
      delivered ? 'success' : 'failed',
      errorMessage
    ]
  );
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

function getEmailSubject(transit, eventType) {
  const eventLabels = {
    exact: 'Exact Transit Alert',
    entering: 'New Transit Beginning',
    leaving: 'Transit Ending'
  };

  const label = eventLabels[eventType] || 'Transit Update';
  
  return `${label}: ${transit.transiting_body} ${transit.aspect} ${transit.natal_point}`;
}

function getEmailBody(firstName, transit, eventType) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,';
  
  const eventMessages = {
    exact: `An important transit is reaching **exactitude** today!`,
    entering: `A new transit is beginning and entering its influence orb.`,
    leaving: `A transit that has been active is now leaving its orb of influence.`
  };

  const message = eventMessages[eventType] || 'A transit update for you.';

  return `
${greeting}

${message}

**Transit Details:**
- ${transit.transiting_body} ${transit.aspect} your natal ${transit.natal_point}
- Strength: ${transit.strength_score}/100
- Exact Time: ${new Date(transit.exact_time).toLocaleString()}
- Orb: ${parseFloat(transit.orb).toFixed(2)}°

Visit your dashboard to view the full interpretation and guidance for navigating this transit.

Best regards,
Cosmic Spiritual Guide
  `.trim();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get notification statistics for a user
 */
export async function getUserNotificationStats(userId, days = 30) {
  const { rows } = await pool.query(
    `SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE delivered = true) as delivered,
      COUNT(*) FILTER (WHERE delivered = false) as failed,
      notification_type,
      event_type
     FROM transit_notifications
     WHERE user_id = $1
     AND created_at > NOW() - INTERVAL '${days} days'
     GROUP BY notification_type, event_type`,
    [userId]
  );

  return rows;
}

/**
 * Cleanup old notification logs (keep last 90 days)
 */
export async function cleanupOldNotifications() {
  const { rowCount } = await pool.query(
    `DELETE FROM transit_notifications
     WHERE created_at < NOW() - INTERVAL '90 days'`
  );

  console.log(`[Transit Monitor] Cleaned up ${rowCount} old notification records`);
  return rowCount;
}

const transitMonitor = {
  monitorAllTransitSubscriptions,
  getUserNotificationStats,
  cleanupOldNotifications
};

export default transitMonitor;




