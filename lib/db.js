import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || '';
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

/**
 * PostgreSQL connection pool.
 * @type {Pool}
 */
export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

/**
 * Saves a tarot or astrology reading to the database.
 * @param {object} readingData - The data for the reading.
 * @param {string} readingData.userId - The user's ID.
 * @param {string} readingData.type - The type of reading (e.g., 'tarot', 'astrology').
 * @param {string} readingData.question - The user's question.
 * @param {object} readingData.cards - The cards drawn in the reading.
 * @param {string} readingData.interpretation - The AI-generated interpretation.
 * @param {string} readingData.spreadType - The type of spread used.
 * @param {string} readingData.summary - A summary of the reading.
 * @param {string} readingData.rawText - The raw text from the AI.
 * @param {object} readingData.meta - Additional metadata.
 * @returns {Promise<{id: string, created_at: Date}>} The ID and creation date of the new reading.
 */
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

/**
 * Checks if a user has sufficient credits or an active subscription for an action.
 * Deducts one credit if available.
 * @param {string} userId - The user's ID.
 * @returns {Promise<boolean>} True if the user can proceed, false otherwise.
 */
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

/**
 * Retrieves a reading from the database by its ID.
 * @param {string} id - The ID of the reading.
 * @returns {Promise<object|null>} The reading object, or null if not found.
 */
export async function getReadingById(id) {
  const { rows } = await pool.query("SELECT * FROM readings WHERE id=$1", [id]);
  return rows[0] || null;
}

/**
 * Retrieves all readings for a specific user.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Array<object>>} A list of the user's readings.
 */
export async function getUserReadings(userId) {
  const { rows } = await pool.query(
    "SELECT id, type, question, result, created_at FROM readings WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

/**
 * Retrieves all birth charts for a specific user.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Array<object>>} A list of the user's birth charts.
 */
export async function getUserBirthCharts(userId) {
  const { rows } = await pool.query(
    "SELECT id, birth_date, birth_time, location, latitude, longitude, chart_data, interpretation, created_at FROM birth_charts WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

/**
 * Retrieves statistics for a user, including credits, reading counts, and subscription status.
 * @param {string} userId - The user's ID.
 * @returns {Promise<object>} An object with user statistics.
 */
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

/**
 * Retrieves a user's profile from the database by their ID.
 * @param {string} userId - The user's ID.
 * @returns {Promise<object|null>} The user object, or null if not found.
 */
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

/**
 * Updates a user's Stripe customer and subscription IDs in the database.
 * @param {string} userId - The user's ID.
 * @param {string} stripeCustomerId - The Stripe customer ID.
 * @param {string} stripeSubscriptionId - The Stripe subscription ID.
 * @returns {Promise<object>} The updated user object.
 */
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
