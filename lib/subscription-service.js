const logger = require('./lib/logger');
import { pool } from './db.js';
import { SUBSCRIPTION_TIERS, getSubscriptionTierById } from './pricing.js';
import { issueSubscriptionCredits } from './credit-engine.js';

function getPeriodBounds(months = 1, anchor = new Date()) {
  const start = new Date(anchor);
  const end = new Date(anchor);
  end.setMonth(end.getMonth() + months);
  return { start, end };
}

function serializeStatus(row) {
  if (!row) return null;
  return {
    tier: row.subscription_tier,
    status: row.subscription_status || 'inactive',
    credits_per_month: row.tier_credits || null,
    rollover_days: row.tier_rollover || null,
    report_discount_percent: row.subscription_report_discount || 0,
    priority_access: !!row.subscription_priority,
    current_period_start: row.subscription_current_period_start,
    current_period_end: row.subscription_current_period_end,
    next_renewal_at: row.subscription_next_renewal_at,
    last_credit_issued_at: row.subscription_last_credit_issued_at,
  };
}

export async function getSubscriptionStatus(userId) {
  const { rows } = await pool.query(
    `SELECT
        u.subscription_tier,
        u.subscription_status,
        u.subscription_current_period_start,
        u.subscription_current_period_end,
        u.subscription_next_renewal_at,
        u.subscription_last_credit_issued_at,
        u.subscription_report_discount,
        u.subscription_priority,
        t.credits_per_month as tier_credits,
        t.rollover_days as tier_rollover
     FROM users u
     LEFT JOIN (
       VALUES
         ${Object.values(SUBSCRIPTION_TIERS)
           .map(
             (tier) =>
               `('${tier.id}', ${tier.creditsPerMonth}, ${tier.rolloverDays})`,
           )
           .join(', ')}
     ) AS t(id, credits_per_month, rollover_days)
       ON t.id = u.subscription_tier
     WHERE u.id = $1`,
    [userId],
  );

  return serializeStatus(rows[0]);
}

async function upsertSubscriptionRow(client, userId, tier, status, periodStart, periodEnd, tierConfig) {
  const manualId = `manual_${tier}_${Date.now()}`;
  await client.query(
    `INSERT INTO subscriptions (user_id, stripe_subscription_id, status, tier, current_period_start, current_period_end, rollover_days, report_discount, priority_access, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       status = EXCLUDED.status,
       tier = EXCLUDED.tier,
       current_period_start = EXCLUDED.current_period_start,
       current_period_end = EXCLUDED.current_period_end,
       rollover_days = EXCLUDED.rollover_days,
       report_discount = EXCLUDED.report_discount,
       priority_access = EXCLUDED.priority_access,
       updated_at = NOW()`,
    [
      userId,
      manualId,
      status,
      tier,
      periodStart,
      periodEnd,
      tierConfig.rolloverDays,
      tierConfig.reportDiscountPercent,
      tierConfig.priorityAccess,
    ],
  );
}

export async function activateSubscription(userId, tierId) {
  const tier = getSubscriptionTierById(tierId);
  if (!tier) {
    throw new Error('INVALID_TIER');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const now = new Date();
    const { start, end } = getPeriodBounds(1, now);

    const creditResult = await issueSubscriptionCredits(
      userId,
      tier.creditsPerMonth,
      tier.id,
      {
        period_start: start.toISOString(),
        period_end: end.toISOString(),
        rollover_days: tier.rolloverDays,
      },
      { expiresInDays: tier.rolloverDays },
    );

    if (!creditResult.success) {
      throw new Error(creditResult.error || 'CREDIT_ISSUANCE_FAILED');
    }

    await client.query(
      `UPDATE users SET
        subscription_tier = $2,
        subscription_status = 'active',
        subscription_current_period_start = $3,
        subscription_current_period_end = $4,
        subscription_next_renewal_at = $4,
        subscription_last_credit_issued_at = NOW(),
        subscription_report_discount = $5,
        subscription_priority = $6
       WHERE id = $1`,
      [
        userId,
        tier.id,
        start,
        end,
        tier.reportDiscountPercent,
        tier.priorityAccess,
      ],
    );

    await upsertSubscriptionRow(client, userId, tier.id, 'active', start, end, tier);

    await client.query('COMMIT');

    return {
      success: true,
      tier: tier.id,
      credits_issued: tier.creditsPerMonth,
      rollover_days: tier.rolloverDays,
      report_discount_percent: tier.reportDiscountPercent,
      priority_access: tier.priorityAccess,
      period_start: start,
      period_end: end,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function cancelSubscription(userId) {
  await pool.query(
    `UPDATE users SET
      subscription_status = 'canceled',
      subscription_tier = NULL,
      subscription_priority = FALSE,
      subscription_report_discount = 0,
      subscription_next_renewal_at = NULL
     WHERE id = $1`,
    [userId],
  );

  await pool.query(
    `UPDATE subscriptions
     SET status = 'canceled', updated_at = NOW()
     WHERE user_id = $1`,
    [userId],
  );

  return { success: true };
}

export async function renewDueSubscriptions(limit = 25) {
  const { rows } = await pool.query(
    `SELECT id, subscription_tier, subscription_next_renewal_at
     FROM users
     WHERE subscription_status = 'active'
       AND subscription_next_renewal_at IS NOT NULL
       AND subscription_next_renewal_at <= NOW()
     ORDER BY subscription_next_renewal_at ASC
     LIMIT $1`,
    [limit],
  );

  const processed = [];

  for (const row of rows) {
    const tier = getSubscriptionTierById(row.subscription_tier);
    if (!tier) continue;

    const nextStart = new Date(row.subscription_next_renewal_at);
    const { end: nextEnd } = getPeriodBounds(1, nextStart);

    const creditResult = await issueSubscriptionCredits(
      row.id,
      tier.creditsPerMonth,
      tier.id,
      {
        period_start: nextStart.toISOString(),
        period_end: nextEnd.toISOString(),
        rollover_days: tier.rolloverDays,
      },
      { expiresInDays: tier.rolloverDays },
    );

    if (!creditResult.success) {
      logger.error('[Subscription] Failed to issue monthly credits', creditResult.error);
      continue;
    }

    await pool.query(
      `UPDATE users SET
        subscription_current_period_start = $2,
        subscription_current_period_end = $3,
        subscription_next_renewal_at = $3,
        subscription_last_credit_issued_at = NOW(),
        subscription_report_discount = $4,
        subscription_priority = $5
       WHERE id = $1`,
      [row.id, nextStart, nextEnd, tier.reportDiscountPercent, tier.priorityAccess],
    );

    processed.push(row.id);
  }

  return processed;
}

