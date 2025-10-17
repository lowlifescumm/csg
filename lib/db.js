// /lib/db.js
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export { pool };

// Basic helpers
export async function saveReading({ userId, type, question, cards, interpretation, spreadType, summary, rawText, meta }) {
  const text = `
    INSERT INTO readings (user_id, type, question, result, reading_type, raw_text, summary, meta)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, created_at
  `;
  const result = { cards, interpretation, spreadType };
  const { rows } = await pool.query(text, [userId, type, question, result, spreadType, rawText ?? interpretation, summary ?? null, meta ?? {}]);
  return rows[0];
}

export async function checkUserCredits(userId) {
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
}

export async function getReadingById(id) {
  const { rows } = await pool.query("SELECT * FROM readings WHERE id=$1", [id]);
  return rows[0] || null;
}

export async function getUserReadings(userId) {
  const { rows } = await pool.query(
    "SELECT id, type, question, result, created_at FROM readings WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

export async function getUserBirthCharts(userId) {
  const { rows } = await pool.query(
    "SELECT id, birth_date, birth_time, location, latitude, longitude, chart_data, interpretation, created_at FROM birth_charts WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

export async function getUserStats(userId) {
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
}

export async function getUserById(userId) {
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
}

export async function updateUserStripeInfo(userId, stripeCustomerId, stripeSubscriptionId) {
  const { rows } = await pool.query(
    `UPDATE users 
     SET stripe_customer_id = $1, stripe_subscription_id = $2, updated_at = NOW() 
     WHERE id = $3
     RETURNING id, stripe_customer_id, stripe_subscription_id`,
    [stripeCustomerId, stripeSubscriptionId, userId]
  );
  return rows[0];
}
