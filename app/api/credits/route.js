import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifyToken } from '@/lib/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

// Credit allocations per month for premium users
const MONTHLY_CREDIT_ALLOCATION = {
  'compatibility': 2,
  'birth_chart': 2,
  'moon_reading': 4
};

// Initialize or reset user credits for premium subscribers
export async function initializeUserCredits(userId) {
  try {
    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    nextResetDate.setDate(1);
    nextResetDate.setHours(0, 0, 0, 0);

    for (const [creditType, amount] of Object.entries(MONTHLY_CREDIT_ALLOCATION)) {
      await pool.query(
        `INSERT INTO user_credits (user_id, credit_type, credits_remaining, credits_used, reset_date)
         VALUES ($1, $2, $3, 0, $4)
         ON CONFLICT (user_id, credit_type) 
         DO UPDATE SET 
           credits_remaining = $3,
           credits_used = 0,
           reset_date = $4,
           updated_at = NOW()`,
        [userId, creditType, amount, nextResetDate]
      );

      // Log the credit addition
      await pool.query(
        `INSERT INTO credit_usage_history (user_id, credit_type, action, amount, description)
         VALUES ($1, $2, 'added', $3, 'Monthly credit allocation')`,
        [userId, creditType, amount]
      );
    }
    return true;
  } catch (error) {
    console.error('Error initializing user credits:', error);
    return false;
  }
}

// Check if user has available credits
export async function checkUserCredits(userId, creditType) {
  try {
    const result = await pool.query(
      `SELECT credits_remaining, reset_date FROM user_credits 
       WHERE user_id = $1 AND credit_type = $2`,
      [userId, creditType]
    );

    if (result.rows.length === 0) {
      return { hasCredits: false, creditsRemaining: 0 };
    }

    const { credits_remaining, reset_date } = result.rows[0];
    
    // Check if credits need to be reset (monthly reset)
    if (new Date() >= new Date(reset_date)) {
      await resetUserCredits(userId, creditType);
      return { hasCredits: true, creditsRemaining: MONTHLY_CREDIT_ALLOCATION[creditType] };
    }

    return { 
      hasCredits: credits_remaining > 0, 
      creditsRemaining: credits_remaining,
      resetDate: reset_date 
    };
  } catch (error) {
    console.error('Error checking user credits:', error);
    return { hasCredits: false, creditsRemaining: 0 };
  }
}

// Deduct credits when used
export async function deductUserCredit(userId, creditType, relatedId = null, description = null) {
  try {
    // First check if user has credits
    const { hasCredits, creditsRemaining } = await checkUserCredits(userId, creditType);
    
    if (!hasCredits) {
      return { success: false, error: 'No credits available' };
    }

    // Deduct the credit
    const result = await pool.query(
      `UPDATE user_credits 
       SET credits_remaining = credits_remaining - 1,
           credits_used = credits_used + 1,
           updated_at = NOW()
       WHERE user_id = $1 AND credit_type = $2 AND credits_remaining > 0
       RETURNING credits_remaining`,
      [userId, creditType]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Failed to deduct credit' };
    }

    // Log the credit usage
    await pool.query(
      `INSERT INTO credit_usage_history (user_id, credit_type, action, amount, description, related_id)
       VALUES ($1, $2, 'consumed', 1, $3, $4)`,
      [userId, creditType, description || `Used ${creditType} credit`, relatedId]
    );

    return { 
      success: true, 
      creditsRemaining: result.rows[0].credits_remaining 
    };
  } catch (error) {
    console.error('Error deducting user credit:', error);
    return { success: false, error: error.message };
  }
}

// Reset user credits (monthly reset)
async function resetUserCredits(userId, creditType) {
  try {
    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    nextResetDate.setDate(1);
    nextResetDate.setHours(0, 0, 0, 0);

    const amount = MONTHLY_CREDIT_ALLOCATION[creditType];

    await pool.query(
      `UPDATE user_credits 
       SET credits_remaining = $3,
           credits_used = 0,
           reset_date = $4,
           updated_at = NOW()
       WHERE user_id = $1 AND credit_type = $2`,
      [userId, creditType, amount, nextResetDate]
    );

    // Log the reset
    await pool.query(
      `INSERT INTO credit_usage_history (user_id, credit_type, action, amount, description)
       VALUES ($1, $2, 'reset', $3, 'Monthly credit reset')`,
      [userId, creditType, amount]
    );

    return true;
  } catch (error) {
    console.error('Error resetting user credits:', error);
    return false;
  }
}

// GET endpoint to check user's credits
export async function GET(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = decoded.userId;
    
    // Check if user is premium
    const userResult = await pool.query(
      'SELECT stripe_subscription_id, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPremium = userResult.rows[0].stripe_subscription_id && 
                     userResult.rows[0].stripe_subscription_id.length > 0;

    if (!isPremium) {
      return NextResponse.json({ 
        isPremium: false,
        credits: {},
        history: [],
        stats: {
          totalAvailable: 0,
          totalUsedThisMonth: 0,
          monthlyAllocation: 8
        }
      });
    }

    // Get all credit types for user
    const creditsResult = await pool.query(
      `SELECT credit_type, credits_remaining, credits_used, reset_date 
       FROM user_credits 
       WHERE user_id = $1`,
      [userId]
    );

    // If no credits found, initialize them
    if (creditsResult.rows.length === 0) {
      await initializeUserCredits(userId);
      
      // Fetch again after initialization
      const newCreditsResult = await pool.query(
        `SELECT credit_type, credits_remaining, credits_used, reset_date 
         FROM user_credits 
         WHERE user_id = $1`,
        [userId]
      );
      
      const credits = {};
      let totalAvailable = 0;
      let totalUsedThisMonth = 0;
      
      for (const row of newCreditsResult.rows) {
        credits[row.credit_type] = {
          remaining: row.credits_remaining,
          used: row.credits_used,
          total: MONTHLY_CREDIT_ALLOCATION[row.credit_type],
          resetDate: row.reset_date
        };
        totalAvailable += row.credits_remaining;
        totalUsedThisMonth += row.credits_used;
      }

      return NextResponse.json({ 
        isPremium: true,
        credits,
        history: [],
        stats: {
          totalAvailable,
          totalUsedThisMonth,
          monthlyAllocation: 8,
          daysUntilRenewal: Math.ceil((new Date(newCreditsResult.rows[0].reset_date) - new Date()) / (1000 * 60 * 60 * 24))
        }
      });
    }

    // Check if any credits need resetting
    const credits = {};
    let totalAvailable = 0;
    let totalUsedThisMonth = 0;
    
    for (const row of creditsResult.rows) {
      if (new Date() >= new Date(row.reset_date)) {
        await resetUserCredits(userId, row.credit_type);
        credits[row.credit_type] = {
          remaining: MONTHLY_CREDIT_ALLOCATION[row.credit_type],
          used: 0,
          total: MONTHLY_CREDIT_ALLOCATION[row.credit_type],
          resetDate: row.reset_date
        };
        totalAvailable += MONTHLY_CREDIT_ALLOCATION[row.credit_type];
      } else {
        credits[row.credit_type] = {
          remaining: row.credits_remaining,
          used: row.credits_used,
          total: MONTHLY_CREDIT_ALLOCATION[row.credit_type],
          resetDate: row.reset_date
        };
        totalAvailable += row.credits_remaining;
        totalUsedThisMonth += row.credits_used;
      }
    }

    // Get recent usage history (last 5 uses)
    const historyResult = await pool.query(
      `SELECT credit_type, action, amount, description, created_at 
       FROM credit_usage_history 
       WHERE user_id = $1 AND action = 'consumed'
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    const history = historyResult.rows.map(row => ({
      type: row.credit_type,
      description: row.description,
      date: row.created_at,
      amount: row.amount
    }));

    const daysUntilRenewal = creditsResult.rows.length > 0 
      ? Math.ceil((new Date(creditsResult.rows[0].reset_date) - new Date()) / (1000 * 60 * 60 * 24))
      : 30;

    return NextResponse.json({ 
      isPremium: true,
      credits,
      history,
      stats: {
        totalAvailable,
        totalUsedThisMonth,
        monthlyAllocation: 8,
        daysUntilRenewal
      }
    });

  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}