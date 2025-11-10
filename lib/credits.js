import { pool } from './db.js';
import crypto from 'crypto';

// Constants
const DAILY_FREE_CREDITS = 3;
const REFERRAL_BONUS_CREDITS = 10;
const SIGNUP_CREDITS = 3;

/**
 * Initializes a user's credits upon signup.
 * Grants a signup bonus and processes a referral if applicable.
 * @param {string} userId - The ID of the new user.
 * @param {string|null} [referralCode=null] - An optional referral code.
 * @returns {Promise<boolean>} True on success, false on failure.
 */
export async function initializeUserCreditsOnSignup(userId, referralCode = null) {
  try {
    console.log(`[Credits] Initializing credits for user ${userId}`);
    
    await addCredits(userId, SIGNUP_CREDITS, 'free', 'signup');
    console.log(`[Credits] Added ${SIGNUP_CREDITS} signup credits to user ${userId}`);
    
    try {
      await pool.query(
        'UPDATE users SET last_free_credit_refresh = NOW() WHERE id = $1',
        [userId]
      );
    } catch (error) {
      console.log('[Credits] last_free_credit_refresh column not found, skipping');
    }
    
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
 * Refreshes a user's daily free credits if 24 hours have passed.
 * @param {string} userId - The user's ID.
 * @returns {Promise<boolean>} True if credits were refreshed, false otherwise.
 */
export async function refreshDailyCredits(userId) {
  try {
    let rows = [];
    try {
      const result = await pool.query(
        'SELECT last_free_credit_refresh FROM users WHERE id = $1',
        [userId]
      );
      rows = result.rows;
    } catch (error) {
      console.log('[Credits] last_free_credit_refresh column not found, skipping daily refresh');
      return false;
    }
    
    if (rows.length === 0) return false;
    
    if (!rows[0].last_free_credit_refresh) {
      await addCredits(userId, DAILY_FREE_CREDITS, 'free', 'daily');
      try {
        await pool.query(
          'UPDATE users SET last_free_credit_refresh = NOW() WHERE id = $1',
          [userId]
        );
      } catch (error) {
        // Column might not exist
      }
      return true;
    }
    
    const lastRefresh = new Date(rows[0].last_free_credit_refresh);
    const now = new Date();
    const diffHours = (now - lastRefresh) / (1000 * 60 * 60);
    
    if (diffHours >= 24) {
      try {
        await pool.query(
          'DELETE FROM credits WHERE user_id = $1 AND credit_type = $2 AND expires_at IS NOT NULL AND expires_at < NOW()',
          [userId, 'free']
        );
      } catch (error) {
        // Columns might not exist
      }
      
      await addCredits(userId, DAILY_FREE_CREDITS, 'free', 'daily');
      
      try {
        await pool.query(
          'UPDATE users SET last_free_credit_refresh = NOW() WHERE id = $1',
          [userId]
        );
      } catch (error) {
        // Column might not exist
      }
      
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
 * Adds credits to a user's account.
 * Can handle different types and sources of credits.
 * @param {string} userId - The user's ID.
 * @param {number} amount - The number of credits to add.
 * @param {string} [type='free'] - The type of credit ('free' or 'paid').
 * @param {string} [source='unknown'] - The source of the credits (e.g., 'signup', 'daily').
 * @param {Date|null} [expiresAt=null] - An optional expiration date.
 * @returns {Promise<boolean>} True on success, false on failure.
 */
export async function addCredits(userId, amount, type = 'free', source = 'unknown', expiresAt = null) {
  try {
    if (type === 'free' && !expiresAt) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      expiresAt = tomorrow;
    }
    
    const { rows: existingCredits } = await pool.query(
      "SELECT credits FROM credits WHERE user_id = $1",
      [userId]
    );

    if (existingCredits.length > 0) {
      await pool.query(
        'UPDATE credits SET credits = GREATEST(0, credits + $1), updated_at = NOW() WHERE user_id = $2',
        [amount, userId]
      );
    } else {
      try {
        await pool.query(
          `INSERT INTO credits (user_id, credits, credit_type, source, expires_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [userId, amount, type, source, expiresAt]
        );
      } catch (error) {
        console.log('[Credits] Enhanced schema columns not found, using simple schema');
        
        await pool.query(
          'INSERT INTO credits (user_id, credits, created_at, updated_at) VALUES ($1, GREATEST(0, $2), NOW(), NOW())',
          [userId, amount]
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error adding credits:', error);
    return false;
  }
}

/**
 * Deducts credits from a user's account, prioritizing paid credits.
 * @param {string} userId - The user's ID.
 * @param {number} [amount=1] - The number of credits to deduct.
 * @param {boolean} [allowedToUseFree=false] - Whether free credits can be used.
 * @returns {Promise<boolean>} True if sufficient credits were deducted, false otherwise.
 */
export async function deductCredits(userId, amount = 1, allowedToUseFree = false) {
  try {
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
 * Retrieves a user's total, paid, and free credits.
 * @param {string} userId - The user's ID.
 * @returns {Promise<{total: number, paid: number, free: number}>} An object with credit balances.
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
 * Checks if a user has enough credits for an action.
 * @param {string} userId - The user's ID.
 * @param {number} [amount=1] - The number of credits required.
 * @returns {Promise<boolean>} True if the user has enough credits, false otherwise.
 */
export async function hasEnoughCredits(userId, amount = 1) {
  const credits = await getUserCredits(userId);
  return credits.total >= amount;
}

/**
 * Processes a referral code, awarding credits to both referrer and referred user.
 * @param {string} referredUserId - The ID of the user who was referred.
 * @param {string} referralCode - The referral code used.
 * @returns {Promise<boolean>} True on successful referral, false otherwise.
 */
export async function processReferral(referredUserId, referralCode) {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE referral_code = $1 AND id != $2',
      [referralCode.toUpperCase(), referredUserId]
    );
    
    if (rows.length === 0) {
      console.log(`[Credits] Invalid referral code: ${referralCode}`);
      return false;
    }
    
    const referrerId = rows[0].id;
    
    const existing = await pool.query(
      'SELECT id FROM referral_redemptions WHERE referrer_id = $1 AND referred_id = $2',
      [referrerId, referredUserId]
    );
    
    if (existing.rows.length > 0) {
      console.log(`[Credits] Referral already processed for user ${referredUserId}`);
      return false;
    }
    
    await pool.query(
      `INSERT INTO referral_redemptions (referrer_id, referred_id, referrer_rewarded, referred_rewarded)
       VALUES ($1, $2, false, false)`,
      [referrerId, referredUserId]
    );
    
    await pool.query(
      'UPDATE users SET referred_by = $1 WHERE id = $2',
      [referrerId, referredUserId]
    );
    
    await addCredits(referrerId, REFERRAL_BONUS_CREDITS, 'paid', 'referral');
    await addCredits(referredUserId, REFERRAL_BONUS_CREDITS, 'paid', 'referral');
    
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
 * Retrieves a user's referral code, generating one if it doesn't exist.
 * @param {string} userId - The user's ID.
 * @returns {Promise<string|null>} The user's referral code, or null on error.
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
