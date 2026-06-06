/**
 * Free Reading Storage
 * Handles temporary storage of readings for unauthenticated users
 */

import { pool } from './db.js';

/**
 * Save a free reading temporarily
 * These readings can be claimed by creating an account
 */
export async function saveFreeReading(readingData) {
  try {
    // Store in temporary readings table
    await pool.query(
      `INSERT INTO temp_readings (id, type, data, created_at, expires_at)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '7 days')
       ON CONFLICT (id) DO UPDATE SET
         data = EXCLUDED.data,
         created_at = EXCLUDED.created_at,
         expires_at = EXCLUDED.expires_at`,
      [readingData.id, readingData.type, JSON.stringify(readingData)]
    );
    
    return readingData;
  } catch (error) {
    // If table doesn't exist, return the reading data anyway
    // The reading just won't be recoverable if user leaves
    console.log('Note: temp_readings table may not exist, returning reading without persistence');
    return readingData;
  }
}

/**
 * Get a free reading by its temporary ID
 */
export async function getFreeReading(readingId) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM temp_readings WHERE id = $1 AND expires_at > NOW()',
      [readingId]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return {
      ...rows[0],
      data: typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data
    };
  } catch (error) {
    console.error('Error fetching free reading:', error);
    return null;
  }
}

/**
 * Claim a free reading for a new user account
 * Moves the reading from temp to permanent storage
 */
export async function claimFreeReading(readingId, userId) {
  try {
    const tempReading = await getFreeReading(readingId);
    
    if (!tempReading) {
      return { success: false, error: 'Reading not found or expired' };
    }
    
    const data = tempReading.data;
    
    // Save to permanent readings table
    const { saveReading } = await import('./db.js');
    const saved = await saveReading({
      userId: userId,
      type: data.type,
      question: data.question,
      cards: data.cards,
      interpretation: data.interpretation,
      spreadType: data.spreadType,
      summary: data.summary,
      rawText: data.interpretation,
      meta: data.meta
    });
    
    // Delete temp reading
    await pool.query('DELETE FROM temp_readings WHERE id = $1', [readingId]);
    
    return { success: true, reading: saved };
  } catch (error) {
    console.error('Error claiming free reading:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a user has used their free reading
 * Uses localStorage flag on frontend, but we can also track IP/session
 */
export async function hasUsedFreeReading(sessionId) {
  // This is primarily frontend-tracked via localStorage
  // But we could add server-side tracking if needed
  return false;
}

/**
 * Clean up expired temp readings
 */
export async function cleanupExpiredReadings() {
  try {
    await pool.query('DELETE FROM temp_readings WHERE expires_at < NOW()');
  } catch (error) {
    console.error('Error cleaning up expired readings:', error);
  }
}
