import { pool } from './db.js';
import crypto from 'crypto';

// Constants
const DAILY_FREE_CREDITS = 3;
const REFERRAL_BONUS_CREDITS = 10;
const SIGNUP_CREDITS = 3;

/**
 * Initialize user credits on signup
 */
export async function initializeUserCreditsOnSignup(userId, referralCode = null) {
  try {
    console.log(`[Credits] Initializing credits for user ${userId}`);
    
    // Give signup bonus credits
    await addCredits(userId, SIGNUP_CREDITS, 'free', 'signup');
    console.log(`[Credits] Added ${SIGNUP_CREDITS} signup credits to user ${userId}`);
    
    // Set last refresh time
    await pool.query(
      'UPDATE users SET last_free_credit_refresh = NOW() WHERE id = $1',
      [userId]
    );
    
    // Handle referral if provided
    if (referralCode) {
      await processReferral(userId, referralCode);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user credits:', error);
    return false;
  }
}

/**
 * Refresh daily free credits for a user
 */
export async function refreshDailyCredits(userId) {
  try {
    // Check if credits need refreshing (daily reset)
    const { rows } = await pool.query(
      'SELECT last_free_credit_refresh FROM users WHERE id = $1',
      [userId]
    );
    
    if (rows.length === 0) return false;
    
    const lastRefresh = new Date(rows[0].last_free_credit_refresh);
    const now = new Date();
    const diffHours = (now - lastRefresh) / (1000 * 60 * 60);
    
    // Refresh if 24+ hours have passed
    if (diffHours >= 24) {
      // Remove old free credits that expire
      await pool.query(
        'DELETE FROM credits WHERE user_id = $1 AND credit_type = $2 AND expires_at IS NOT NULL AND expires_at < NOW()',
        [userId, 'free']
      );
      
      // Add new daily credits
      await addCredits(userId, DAILY_FREE_CREDITS, 'free', 'daily');
      
      // Update last refresh time
      await pool.query(
        'UPDATE users SET last_free_credit_refresh = NOW() WHERE id = $1',
        [userId]
      );
      
      console.log(`[Credits] Refreshed ${DAILY_FREE_CREDITS} daily credits for user ${userId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing daily credits:', error);
    return false;
  }
}

/**
 * Add credits to a user account
 */
export async function addCredits(userId, amount, type = 'free', source = 'unknown', expiresAt = null) {
  try {
    // For free credits, set expiration to end of day
    if (type === 'free' && !expiresAt) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      expiresAt = tomorrow;
    }
    
    await pool.query(
      `INSERT INTO credits (user_id, credits, credit_type, source, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         credits = credits.credits + $2,
         updated_at = NOW()`,
      [userId, amount, type, source, expiresAt]
    );
    
    return true;
  } catch (error) {
    console.error('Error adding credits:', error);
    return false;
  }
}

/**
 * Deduct credits from a user (prioritize paid credits, respect free credit restrictions)
 */
export async function deductCredits(userId, amount = 1, allowedToUseFree = false) {
  try {
    // Get current credits by type, prioritizing paid credits
    const { rows } = await pool.query(
      `SELECT id, credits, credit_type FROM credits WHERE user_id = $1 ORDER BY 
       CASE WHEN credit_type = 'paid' THEN 0 ELSE 1 END,
       CASE WHEN expires_at IS NULL OR expires_at > NOW() THEN 0 ELSE 1 END,
       expires_at ASC NULLS LAST`,
      [userId]
    );
    
    let remainingToDeduct = amount;
    
    for (const row of rows) {
      if (remainingToDeduct <= 0) break;
      
      // If this is a free credit and we're not allowed to use free credits, skip
      if (row.credit_type === 'free' && !allowedToUseFree) {
        continue;
      }
      
      const deductAmount = Math.min(remainingToDeduct, row.credits);
      
      await pool.query(
        'UPDATE credits SET credits = credits - $1 WHERE id = $2',
        [deductAmount, row.id]
      );
      
      remainingToDeduct -= deductAmount;
    }
    
    // Clean up zero-credit records
    await pool.query(
      'DELETE FROM credits WHERE user_id = $1 AND credits = 0',
      [userId]
    );
    
    return remainingToDeduct === 0;
  } catch (error) {
    console.error('Error deducting credits:', error);
    return false;
  }
}

/**
 * Get total credits for a user
 */
export async function getUserCredits(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT 
         SUM(CASE WHEN credit_type = 'paid' THEN credits ELSE 0 END) as paid_credits,
         SUM(CASE WHEN credit_type = 'free' AND (expires_at IS NULL OR expires_at > NOW()) THEN credits ELSE 0 END) as free_credits
       FROM credits 
       WHERE user_id = $1`,
      [userId]
    );
    
    const paid = parseInt(rows[0]?.paid_credits || 0);
    const free = parseInt(rows[0]?.free_credits || 0);
    
    return {
      total: paid + free,
      paid,
      free
    };
  } catch (error) {
    console.error('Error getting user credits:', error);
    return { total: 0, paid: 0, free: 0 };
  }
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(userId, amount = 1) {
  const credits = await getUserCredits(userId);
  return credits.total >= amount;
}

/**
 * Process referral code
 */
export async function processReferral(referredUserId, referralCode) {
  try {
    // Find the referrer
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE referral_code = $1 AND id != $2',
      [referralCode.toUpperCase(), referredUserId]
    );
    
    if (rows.length === 0) {
      console.log(`[Credits] Invalid referral code: ${referralCode}`);
      return false;
    }
    
    const referrerId = rows[0].id;
    
    // Check if this referral already exists
    const existing = await pool.query(
      'SELECT id FROM referral_redemptions WHERE referrer_id = $1 AND referred_id = $2',
      [referrerId, referredUserId]
    );
    
    if (existing.rows.length > 0) {
      console.log(`[Credits] Referral already processed for user ${referredUserId}`);
      return false;
    }
    
    // Create referral redemption record
    await pool.query(
      `INSERT INTO referral_redemptions (referrer_id, referred_id, referrer_rewarded, referred_rewarded)
       VALUES ($1, $2, false, false)`,
      [referrerId, referredUserId]
    );
    
    // Update referred_by field
    await pool.query(
      'UPDATE users SET referred_by = $1 WHERE id = $2',
      [referrerId, referredUserId]
    );
    
    // Award bonuses
    await addCredits(referrerId, REFERRAL_BONUS_CREDITS, 'paid', 'referral');
    await addCredits(referredUserId, REFERRAL_BONUS_CREDITS, 'paid', 'referral');
    
    // Mark as rewarded
    await pool.query(
      'UPDATE referral_redemptions SET referrer_rewarded = true, referred_rewarded = true WHERE referrer_id = $1 AND referred_id = $2',
      [referrerId, referredUserId]
    );
    
    console.log(`[Credits] Referral processed: ${referrerId} referred ${referredUserId}, both received ${REFERRAL_BONUS_CREDITS} credits`);
    
    return true;
  } catch (error) {
    console.error('Error processing referral:', error);
    return false;
  }
}

/**
 * Generate or get user's referral code
 */
export async function getOrCreateReferralCode(userId) {
  try {
    const { rows } = await pool.query(
      'SELECT referral_code FROM users WHERE id = $1',
      [userId]
    );
    
    if (rows.length > 0 && rows[0].referral_code) {
      return rows[0].referral_code;
    }
    
    // Generate new code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    await pool.query(
      'UPDATE users SET referral_code = $1 WHERE id = $2',
      [code, userId]
    );
    
    return code;
  } catch (error) {
    console.error('Error getting referral code:', error);
    return null;
  }
}
