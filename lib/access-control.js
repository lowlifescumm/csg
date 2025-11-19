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
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Check if user can access a reading type
 * Returns { allowed: boolean, reason: string }
 */
export async function canAccessReading(userId, readingType) {
  const cost = READING_COSTS[readingType];
  
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
    const canUseFree = await canUseFreeCredits(userId, readingType);
    
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
 */
export async function consumeCreditsForReading(userId, readingType, readingId = null) {
  const cost = READING_COSTS[readingType];
  
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
  const canUseFree = await canUseFreeCredits(userId, readingType);
  
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
    return {
      success: false,
      message: result.error || 'credit_consumption_failed',
      cost
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
 * Free credits can ONLY be used for basic Tarot (1 credit)
 */
export async function canUseFreeCredits(userId, readingType) {
  const cost = READING_COSTS[readingType];
  
  // Free credits can only be used for basic tarot (1 credit)
  if (readingType === 'TAROT_BASIC' && cost === 1) {
    return true;
  }
  
  return false;
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
    console.error('Error claiming free natal chart:', error);
    return { success: false, message: 'error' };
  }
}
