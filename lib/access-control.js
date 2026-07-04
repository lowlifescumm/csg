import { createRequire } from "module";
const require = createRequire(import.meta.url);
const logger = require('./logger');
/**
 * Access Control & Credit Enforcement
 * Enforces the new subscription and credit model
 */

import { pool } from './db.js';
import { hasEnoughCredits, deductCredits } from './credits.js';
import { consumeCredits, getCreditBalance } from './credit-engine.js';
import { READING_COSTS } from './pricing.js';

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId) {
  try {
    const { rows } = await pool.query(
      'SELECT stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );
    
    return !!(rows[0]?.stripe_subscription_id);
  } catch (error) {
    logger.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Check if user can access a reading type
 * Returns { allowed: boolean, reason: string }
 * @param {string} userId - User ID
 * @param {string} readingType - Reading type key (e.g., 'TAROT_BASIC', 'TAROT_CUSTOM')
 * @param {number} cardCount - Optional card count for custom spreads (1-10)
 */
export async function canAccessReading(userId, readingType, cardCount = null) {
  // Calculate cost - for custom spreads, cost is 1 credit per card
  let cost = READING_COSTS[readingType];
  
  // Handle custom spread with dynamic card count
  if (readingType === 'TAROT_CUSTOM' && cardCount !== null && cardCount >= 1 && cardCount <= 10) {
    cost = cardCount; // 1 credit per card
  }
  
  // Check if user is admin - admins have full access
  const { rows: userRows } = await pool.query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );
  const isAdmin = userRows[0]?.role === 'admin';
  
  if (isAdmin) {
    return { allowed: true, reason: 'admin_access', cost: 0 };
  }
  
  // Daily horoscope is always free
  if (readingType === 'DAILY_HOROSCOPE') {
    return { allowed: true, reason: 'always_free', cost: 0 };
  }
  
  // Check if user has active subscription
  const hasActiveSub = await hasActiveSubscription(userId);
  
  // Transit Dashboard features are free for subscribers
  const transitFeatures = [
    'NATAL_CHART',
    'TRANSIT_TRACKING',
    'DAILY_FORECAST',
    'WEEKLY_FORECAST'
  ];
  
  if (hasActiveSub && transitFeatures.includes(readingType)) {
    return { allowed: true, reason: 'subscription_included', cost: 0 };
  }
  
  // Non-subscribers must use paid credits
  if (!hasActiveSub) {
    // Use new credit engine to check balance
    const balance = await getCreditBalance(userId);
    const canUseFree = await canUseFreeCredits(userId, readingType, cardCount);
    
    // Check if user has enough credits
    // If can use free credits, check total balance
    // Otherwise, check only purchased credits
    const availableBalance = canUseFree 
      ? balance.balance 
      : balance.breakdown.purchased + balance.breakdown.subscription;
    
    if (availableBalance < cost) {
      return {
        allowed: false,
        reason: 'insufficient_credits',
        cost,
        required: cost,
        available_balance: availableBalance
      };
    }
  }
  
  return { allowed: true, reason: 'has_credits', cost };
}

/**
 * Handle credit deduction for a reading
 * Returns { success: boolean, message: string }
 * 
 * Uses new credit engine for atomic consumption with ledger tracking
 * @param {string} userId - User ID
 * @param {string} readingType - Reading type key
 * @param {string|null} readingId - Optional reading ID for tracking
 * @param {number} cardCount - Optional card count for custom spreads (1-10)
 */
export async function consumeCreditsForReading(userId, readingType, readingId = null, cardCount = null) {
  // Calculate cost - for custom spreads, cost is 1 credit per card
  let cost = READING_COSTS[readingType];
  
  // Handle custom spread with dynamic card count
  if (readingType === 'TAROT_CUSTOM' && cardCount !== null && cardCount >= 1 && cardCount <= 10) {
    cost = cardCount; // 1 credit per card
  }
  
  // Check if user is admin - admins bypass all credit checks
  const { rows: userRows } = await pool.query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );
  const isAdmin = userRows[0]?.role === 'admin';
  
  if (isAdmin) {
    return { success: true, message: 'admin_access', cost: 0 };
  }
  
  // Daily horoscope is free
  if (readingType === 'DAILY_HOROSCOPE') {
    return { success: true, message: 'reading_is_free', cost: 0 };
  }
  
  // Check subscription status
  const hasActiveSub = await hasActiveSubscription(userId);
  
  const transitFeatures = [
    'NATAL_CHART',
    'TRANSIT_TRACKING',
    'DAILY_FORECAST',
    'WEEKLY_FORECAST'
  ];
  
  // Free for subscribers
  if (hasActiveSub && transitFeatures.includes(readingType)) {
    return { success: true, message: 'subscription_included', cost: 0 };
  }
  
  // Check if free credits can be used for this reading
  const canUseFree = await canUseFreeCredits(userId, readingType, cardCount);
  
  // Use new credit engine for atomic consumption
  // The engine will automatically prioritize purchased credits, then free credits if allowed
  const result = await consumeCredits(userId, cost, readingId, {
    reading_type: readingType,
    can_use_free: canUseFree
  });
  
  if (!result.success) {
    if (result.error_code === 'INSUFFICIENT_CREDITS') {
      return {
        success: false,
        message: 'insufficient_credits',
        cost,
        available_balance: result.available_balance,
        required: result.required
      };
    }
    // Log detailed error for debugging
    logger.error('[Access Control] Credit consumption failed:', {
      userId,
      readingType,
      cost,
      cardCount,
      error: result.error,
      error_code: result.error_code,
      details: result.details,
      breakdown: result.breakdown
    });
    
    // Return appropriate error message based on error code
    let errorMessage = 'credit_consumption_failed';
    if (result.error_code === 'USER_NOT_FOUND') {
      errorMessage = 'user_not_found';
    } else if (result.error_code === 'SNAPSHOT_NOT_FOUND') {
      errorMessage = 'snapshot_initialization_failed';
    } else if (result.error) {
      // Use the actual error message from the engine
      errorMessage = result.error.toLowerCase().replace(/\s+/g, '_');
    }
    
    return {
      success: false,
      message: errorMessage,
      cost,
      error_code: result.error_code,
      details: result.details,
      breakdown: result.breakdown
    };
  }
  
  return {
    success: true,
    message: 'credits_deducted',
    cost,
    new_balance: result.new_balance
  };
}

/**
 * Check if user can use free credits for this reading
 * Free credits can ONLY be used for basic Tarot (1 credit) or custom spread with 1 card
 * AND user must not have exceeded lifetime limit of 5 free readings
 * @param {string} userId - User ID
 * @param {string} readingType - Reading type key
 * @param {number} cardCount - Optional card count for custom spreads
 */
export async function canUseFreeCredits(userId, readingType, cardCount = null) {
  let cost = READING_COSTS[readingType];

  // Handle custom spread with dynamic card count
  if (readingType === 'TAROT_CUSTOM' && cardCount !== null && cardCount >= 1 && cardCount <= 10) {
    cost = cardCount; // 1 credit per card
  }

  // Free credits can only be used for basic tarot (1 credit) or custom spread with 1 card
  const isFreeEligible = (readingType === 'TAROT_BASIC' && cost === 1) ||
      (readingType === 'TAROT_CUSTOM' && cardCount === 1);

  if (!isFreeEligible) {
    return false;
  }

  // Check lifetime limit: max 5 free readings per user
  // This counts all free_daily credits ever issued to the user
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(delta), 0) as free_issued
       FROM credit_ledger
       WHERE user_id = $1 AND source = 'free_daily'`,
      [userId]
    );

    const freeCreditsEverIssued = parseInt(rows[0]?.free_issued || 0, 10);

    // If user has already received 5 or more free credits, they've hit the limit
    if (freeCreditsEverIssued >= 5) {
      return false;
    }
  } catch (error) {
    // Log error but DON'T block free credits - fail open for better UX
    // This prevents login loops when credit_ledger has issues
    logger.error('Error checking free credit limit (allowing free credits):', error);
    // Continue to return true below - don't fail here
  }

  return true;
}

/**
 * Handle free Natal Chart for new subscribers
 */
export async function claimFreeNatalChart(userId) {
  try {
    // Check if already claimed
    const { rows } = await pool.query(
      'SELECT free_natal_chart_used FROM users WHERE id = $1',
      [userId]
    );
    
    if (rows[0]?.free_natal_chart_used) {
      return { success: false, message: 'already_claimed' };
    }
    
    // Mark as claimed
    await pool.query(
      'UPDATE users SET free_natal_chart_used = true WHERE id = $1',
      [userId]
    );
    
    return { success: true, message: 'natal_chart_claimed' };
  } catch (error) {
    logger.error('Error claiming free natal chart:', error);
    return { success: false, message: 'error' };
  }
}
