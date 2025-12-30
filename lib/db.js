// /lib/db.js
import { Pool } from "pg";

const connectionString =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "";

let pool;

if (!connectionString) {
  const error = new Error(
    "DATABASE_URL is not configured. Set TEST_DATABASE_URL for tests or DATABASE_URL for runtime."
  );

  const createError = () => Promise.reject(error);

  pool = {
    query: createError,
    connect: createError,
    end: async () => {},
  };
} else {
  const isLocalConnection = /localhost|127\.0\.0\.1/.test(connectionString);
  const hasSslMode = /sslmode=/i.test(connectionString);

  pool = new Pool({
    connectionString,
    ssl: !isLocalConnection && !hasSslMode ? { rejectUnauthorized: false } : false,
    max: 18, // Reduced from 20 to leave room for Prisma pool (total: 33 connections)
    min: 2, // Keep minimum connections alive for connection reuse
    connectionTimeoutMillis: 10000, // 10 seconds to establish new connection
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    // Note: statement_timeout is set per-connection via SQL, not pool config
  });
}

export { pool };

// Basic helpers
export async function saveReading({ userId, type, question, cards, interpretation, spreadType, summary, rawText, meta }) {
  try {
    const text = `
      INSERT INTO readings (user_id, type, question, result, reading_type, raw_text, summary, meta)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `;
    const result = { cards, interpretation, spreadType };
    const { rows } = await pool.query(text, [userId, type, question, result, spreadType, rawText ?? interpretation, summary ?? null, meta ?? {}]);
    return rows[0];
  } catch (error) {
    console.error('Error saving reading:', error);
    throw new Error('Failed to save reading. Please try again.');
  }
}

export async function checkUserCredits(userId) {
  try {
    const { rows: userRows } = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [userId]
    );
    const userRole = userRows[0]?.role || 'user';
    const isAdmin = userRole === 'admin';

    if (isAdmin) {
      return true;
    }

    const { rows: credRows } = await pool.query(
      "SELECT credits FROM credits WHERE user_id=$1",
      [userId]
    );
    const credits = credRows[0]?.credits ?? 0;

    const { rows: subRows } = await pool.query(
      "SELECT status FROM subscriptions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    const active = ["active", "trialing", "past_due"].includes(subRows[0]?.status);

    if (credits > 0) {
      await pool.query(
        "UPDATE credits SET credits = credits - 1, updated_at = NOW() WHERE user_id=$1",
        [userId]
      );
      return true;
    }
    return !!active;
  } catch (error) {
    console.error('Error checking user credits:', error);
    throw new Error('Failed to check credits. Please try again.');
  }
}

export async function getReadingById(id) {
  try {
    const { rows } = await pool.query("SELECT * FROM readings WHERE id=$1", [id]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching reading by ID:', error);
    throw new Error('Failed to retrieve reading. Please try again.');
  }
}

export async function getUserReadings(userId) {
  try {
    const { rows } = await pool.query(
      "SELECT id, type, question, result, created_at FROM readings WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching user readings:', error);
    throw new Error('Failed to retrieve readings. Please try again.');
  }
}

export async function getUserBirthCharts(userId) {
  try {
    const { rows } = await pool.query(
      "SELECT id, birth_date, birth_time, location, latitude, longitude, chart_data, interpretation, created_at FROM birth_charts WHERE user_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching user birth charts:', error);
    throw new Error('Failed to retrieve birth charts. Please try again.');
  }
}

export async function getUserStats(userId) {
  try {
    const { rows: creditRows } = await pool.query(
      "SELECT credits FROM credits WHERE user_id=$1",
      [userId]
    );
    const credits = creditRows[0]?.credits ?? 0;

    const { rows: readingRows } = await pool.query(
      "SELECT COUNT(*) as count FROM readings WHERE user_id=$1",
      [userId]
    );
    const readingCount = parseInt(readingRows[0]?.count ?? 0);

    const { rows: chartRows } = await pool.query(
      "SELECT COUNT(*) as count FROM birth_charts WHERE user_id=$1",
      [userId]
    );
    const chartCount = parseInt(chartRows[0]?.count ?? 0);

    const { rows: subRows } = await pool.query(
      "SELECT status FROM subscriptions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    const status = ["active", "trialing", "past_due"].includes(subRows[0]?.status) ? "Premium" : "Free";

    const { rows: userRows } = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [userId]
    );
    const isAdmin = userRows[0]?.role === 'admin';

    return {
      credits,
      readingCount,
      chartCount,
      status: isAdmin ? "Admin" : status
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw new Error('Failed to retrieve user statistics. Please try again.');
  }
}

export async function getUserById(userId) {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, first_name, last_name, role, stripe_customer_id, stripe_subscription_id FROM users WHERE id=$1",
      [userId]
    );
    const user = rows[0];
    if (user) {
      user.name = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.first_name || user.last_name || user.email;
    }
    return user || null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error('Failed to retrieve user information. Please try again.');
  }
}

export async function updateUserStripeInfo(userId, stripeCustomerId, stripeSubscriptionId) {
  try {
    const { rows } = await pool.query(
      `UPDATE users 
       SET stripe_customer_id = $1, stripe_subscription_id = $2, updated_at = NOW() 
       WHERE id = $3
       RETURNING id, stripe_customer_id, stripe_subscription_id`,
      [stripeCustomerId, stripeSubscriptionId, userId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error updating user Stripe info:', error);
    throw new Error('Failed to update payment information. Please try again.');
  }
}
