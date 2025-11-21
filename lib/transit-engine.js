/**
 * Transit Engine - Core Transit Calculation and Database Persistence
 * 
 * This module implements the transit calculation engine as specified in the
 * Astrologic Transit Tracker Developer Specification.
 * 
 * Features:
 * - Calculate transits against natal charts
 * - Store transit records in database
 * - Detect aspect exactitude with interpolation
 * - Handle retrograde motion
 * - Calculate orbs and strength scores
 * - Batch processing for multiple users
 */

import * as Astronomy from 'astronomy-engine';
import { pool } from './db.js';
import crypto from 'crypto';

// =============================================================================
// CONFIGURATION
// =============================================================================

const ASPECTS = [
  { type: 'conjunction', angle: 0, orb: 8, weight: 1.0 },
  { type: 'opposition', angle: 180, orb: 8, weight: 0.9 },
  { type: 'trine', angle: 120, orb: 8, weight: 0.7 },
  { type: 'square', angle: 90, orb: 7, weight: 0.85 },
  { type: 'sextile', angle: 60, orb: 6, weight: 0.6 },
  { type: 'quincunx', angle: 150, orb: 3, weight: 0.5 }
];

const TRANSITING_BODIES = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Mars'];
const NATAL_POINTS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

const PLANET_WEIGHTS = {
  Sun: 10, Moon: 10, Mercury: 7, Venus: 7, Mars: 8,
  Jupiter: 9, Saturn: 10, Uranus: 8, Neptune: 7, Pluto: 9
};

const TRANSIT_WEIGHTS = {
  Jupiter: 1.0, Saturn: 1.2, Uranus: 1.1,
  Neptune: 1.0, Pluto: 1.3, Mars: 0.8
};

// Average daily motion in degrees (for peak date estimation)
const DAILY_MOTION = {
  Jupiter: 0.083, Saturn: 0.033, Uranus: 0.012,
  Neptune: 0.007, Pluto: 0.004, Mars: 0.5
};

// =============================================================================
// EPHEMERIS FUNCTIONS
// =============================================================================

/**
 * Get planetary positions at a specific time
 * @param {Date} datetime - The time to calculate positions for
 * @returns {Object} Planetary positions in degrees
 */
export function getPlanetaryPositions(datetime) {
  const time = Astronomy.MakeTime(datetime);
  const positions = {};

  // Sun
  const sunPos = Astronomy.SunPosition(time);
  positions.Sun = normalizeLongitude(sunPos.elon);

  // Other planets
  const planets = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  
  for (const planet of planets) {
    const geoVector = Astronomy.GeoVector(planet, time, false);
    const ecliptic = Astronomy.Ecliptic(geoVector);
    positions[planet] = normalizeLongitude(ecliptic.elon);
  }

  return positions;
}

/**
 * Cache planetary positions in database
 * @param {Date} datetime
 * @param {Object} positions
 */
export async function cacheEphemeris(datetime, positions) {
  try {
    await pool.query(
      `INSERT INTO ephemeris_cache (calculation_time, positions, source, version)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (calculation_time) DO UPDATE
       SET positions = $2, updated_at = NOW()`,
      [datetime, JSON.stringify(positions), 'astronomy-engine', '2.1.19']
    );
  } catch (error) {
    console.error('Error caching ephemeris:', error);
  }
}

/**
 * Get cached ephemeris or calculate if not cached
 * @param {Date} datetime
 * @returns {Object} Planetary positions
 */
export async function getOrCalculateEphemeris(datetime) {
  // Try to get from cache first
  const { rows } = await pool.query(
    'SELECT positions FROM ephemeris_cache WHERE calculation_time = $1',
    [datetime]
  );

  if (rows.length > 0) {
    return rows[0].positions;
  }

  // Calculate and cache
  const positions = getPlanetaryPositions(datetime);
  await cacheEphemeris(datetime, positions);
  return positions;
}

// =============================================================================
// ASPECT CALCULATION
// =============================================================================

/**
 * Normalize longitude to 0-360 range
 */
function normalizeLongitude(longitude) {
  let normalized = longitude % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate angular distance between two longitudes
 */
function calculateAngularDistance(long1, long2) {
  let diff = Math.abs(long1 - long2);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Find aspect between two positions
 * @param {number} transitLong - Transiting planet longitude
 * @param {number} natalLong - Natal point longitude
 * @returns {Object|null} Aspect details or null if no aspect
 */
export function findAspect(transitLong, natalLong) {
  const angle = calculateAngularDistance(transitLong, natalLong);

  for (const aspect of ASPECTS) {
    const diff = Math.abs(angle - aspect.angle);
    if (diff <= aspect.orb) {
      return {
        type: aspect.type,
        angle: aspect.angle,
        orb: diff,
        weight: aspect.weight,
        isExact: diff < 1.0
      };
    }
  }

  return null;
}

/**
 * Calculate exact time of aspect using linear interpolation
 * @param {string} transitBody
 * @param {number} natalLong
 * @param {number} aspectAngle
 * @param {Date} startDate
 * @param {number} windowDays
 * @returns {Date|null}
 */
export async function calculateExactTime(transitBody, natalLong, aspectAngle, startDate = new Date(), windowDays = 90) {
  const positions = [];
  const interval = 1; // 1 day intervals

  // Sample positions over the window
  for (let i = 0; i < windowDays; i += interval) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const pos = await getOrCalculateEphemeris(date);
    positions.push({ date, longitude: pos[transitBody] });
  }

  // Find closest approach to target angle
  let closestDate = null;
  let closestDiff = Infinity;

  for (let i = 0; i < positions.length - 1; i++) {
    const curr = positions[i];
    const next = positions[i + 1];

    const currAngle = calculateAngularDistance(curr.longitude, natalLong);
    const nextAngle = calculateAngularDistance(next.longitude, natalLong);

    const currDiff = Math.abs(currAngle - aspectAngle);
    const nextDiff = Math.abs(nextAngle - aspectAngle);

    if (currDiff < closestDiff) {
      closestDiff = currDiff;
      closestDate = curr.date;
    }

    if (nextDiff < closestDiff) {
      closestDiff = nextDiff;
      closestDate = next.date;
    }

    // Linear interpolation for sub-day precision
    if ((currDiff < 1 || nextDiff < 1) && closestDiff < 1) {
      const ratio = currDiff / (currDiff + nextDiff);
      const interpolatedDate = new Date(curr.date.getTime() + ratio * (next.date.getTime() - curr.date.getTime()));
      return interpolatedDate;
    }
  }

  return closestDate;
}

// =============================================================================
// STRENGTH & INTENSITY CALCULATION
// =============================================================================

/**
 * Calculate transit strength score (0-100)
 * @param {string} transitBody
 * @param {string} natalPoint
 * @param {Object} aspect
 * @returns {number} Strength score 0-100
 */
export function calculateStrengthScore(transitBody, natalPoint, aspect) {
  const transitWeight = TRANSIT_WEIGHTS[transitBody] || 1.0;
  const natalWeight = PLANET_WEIGHTS[natalPoint] || 5;
  const aspectWeight = aspect.weight;
  const orbFactor = Math.max(0, 1 - (aspect.orb / 8));

  // Calculate base strength
  const baseStrength = (natalWeight * transitWeight * aspectWeight * orbFactor) / 1.2;
  
  // Scale to 0-100
  const strength = Math.min(100, Math.max(0, Math.round(baseStrength * 10)));

  return strength;
}

/**
 * Determine aspect nature (challenging, beneficial, neutral)
 */
export function getAspectNature(aspectType) {
  const challenging = ['square', 'opposition'];
  const beneficial = ['trine', 'sextile'];
  
  if (challenging.includes(aspectType)) return 'challenging';
  if (beneficial.includes(aspectType)) return 'beneficial';
  return 'neutral';
}

// =============================================================================
// TRANSIT DETECTION
// =============================================================================

/**
 * Calculate all active transits for a natal chart
 * @param {Object} natalChart - Natal chart data
 * @param {Date} referenceDate - Date to calculate transits for
 * @returns {Array} Array of transit objects
 */
export async function calculateActiveTransits(natalChart, referenceDate = new Date()) {
  const currentPositions = await getOrCalculateEphemeris(referenceDate);
  const activeTransits = [];

  for (const transitBody of TRANSITING_BODIES) {
    const transitLong = currentPositions[transitBody];

    for (const natalPoint of NATAL_POINTS) {
      const natalPos = natalChart.natal_positions[natalPoint.toLowerCase()];
      if (!natalPos) continue;

      const natalLong = natalPos.longitude;
      const aspect = findAspect(transitLong, natalLong);

      if (aspect) {
        const strengthScore = calculateStrengthScore(transitBody, natalPoint, aspect);

        // Only include transits with strength >= 30
        if (strengthScore >= 30) {
          const transit = {
            transitingBody: transitBody,
            natalPoint: natalPoint,
            aspect: aspect.type,
            orb: aspect.orb,
            strengthScore: strengthScore,
            isExact: aspect.isExact,
            aspectNature: getAspectNature(aspect.type),
            transitLongitude: transitLong,
            natalLongitude: natalLong
          };

          activeTransits.push(transit);
        }
      }
    }
  }

  return activeTransits.sort((a, b) => b.strengthScore - a.strengthScore);
}

/**
 * Calculate transits for a time window and store in database
 * @param {UUID} userId
 * @param {UUID} natalChartId
 * @param {Object} natalChart
 * @param {Date} startDate
 * @param {number} windowDays
 */
export async function calculateAndStoreTransits(userId, natalChartId, natalChart, startDate = new Date(), windowDays = 90) {
  const startTime = Date.now();
  const transitsFound = [];

  try {
    // Log computation start
    const { rows: logRows } = await pool.query(
      `INSERT INTO transit_computation_log (user_id, computation_type, window_start, window_end, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, 'batch', startDate, new Date(startDate.getTime() + windowDays * 24 * 60 * 60 * 1000), 'running']
    );
    const logId = logRows[0].id;

    // Sample dates throughout the window
    const sampleInterval = 7; // Check every 7 days
    const samples = [];

    for (let i = 0; i < windowDays; i += sampleInterval) {
      const sampleDate = new Date(startDate);
      sampleDate.setDate(sampleDate.getDate() + i);
      samples.push(sampleDate);
    }

    // Calculate transits for each sample
    for (const sampleDate of samples) {
      const transits = await calculateActiveTransits(natalChart, sampleDate);

      for (const transit of transits) {
        // Calculate exact time
        const exactTime = await calculateExactTime(
          transit.transitingBody,
          transit.natalLongitude,
          ASPECTS.find(a => a.type === transit.aspect).angle,
          sampleDate,
          30
        );

        if (!exactTime) continue;

        // Determine status
        const now = new Date();
        let status = 'upcoming';
        if (exactTime < now) {
          const daysSince = (now - exactTime) / (1000 * 60 * 60 * 24);
          status = daysSince > 30 ? 'past' : 'active';
        }

        // Calculate start and end times (± orb days)
        const orbDays = Math.ceil(transit.orb);
        const startTime = new Date(exactTime);
        startTime.setDate(startTime.getDate() - orbDays);
        const endTime = new Date(exactTime);
        endTime.setDate(endTime.getDate() + orbDays);

        // Check if transit already exists
        const { rows: existingRows } = await pool.query(
          `SELECT id FROM transits 
           WHERE user_id = $1 
           AND natal_chart_id = $2
           AND transiting_body = $3
           AND natal_point = $4
           AND aspect = $5
           AND exact_time::date = $6::date`,
          [userId, natalChartId, transit.transitingBody, transit.natalPoint, transit.aspect, exactTime]
        );

        if (existingRows.length === 0) {
          // Insert new transit
          const { rows: insertRows } = await pool.query(
            `INSERT INTO transits (
              user_id, natal_chart_id, transiting_body, natal_point, aspect,
              start_time, exact_time, end_time, orb, strength_score, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id`,
            [
              userId, natalChartId, transit.transitingBody, transit.natalPoint, transit.aspect,
              startTime, exactTime, endTime, transit.orb, transit.strengthScore, status
            ]
          );

          transitsFound.push(insertRows[0].id);
        }
      }
    }

    // Update computation log
    const computationTimeMs = Date.now() - startTime;
    await pool.query(
      `UPDATE transit_computation_log
       SET status = $1, transits_found = $2, computation_time_ms = $3
       WHERE id = $4`,
      ['completed', transitsFound.length, computationTimeMs, logId]
    );

    return {
      success: true,
      transitsFound: transitsFound.length,
      computationTimeMs
    };

  } catch (error) {
    console.error('Error calculating and storing transits:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// =============================================================================
// TRANSIT RETRIEVAL
// =============================================================================

/**
 * Get active transits for a user from database
 * @param {UUID} userId
 * @param {number} limitDays - How many days ahead to include
 * @returns {Array} Array of transit records
 */
export async function getUserTransits(userId, limitDays = 30) {
  const { rows } = await pool.query(
    `SELECT * FROM transits
     WHERE user_id = $1
     AND status IN ('upcoming', 'active')
     AND exact_time <= NOW() + INTERVAL '${limitDays} days'
     ORDER BY strength_score DESC, exact_time ASC
     LIMIT 50`,
    [userId]
  );

  return rows;
}

/**
 * Get a specific transit by ID
 * @param {UUID} transitId
 * @returns {Object|null}
 */
export async function getTransitById(transitId) {
  const { rows } = await pool.query(
    'SELECT * FROM transits WHERE id = $1',
    [transitId]
  );

  return rows[0] || null;
}

/**
 * Update transit status based on current time
 */
export async function updateTransitStatuses() {
  const now = new Date();

  // Mark transits as active if within orb
  await pool.query(
    `UPDATE transits
     SET status = 'active'
     WHERE status = 'upcoming'
     AND start_time <= $1
     AND end_time >= $1`,
    [now]
  );

  // Mark transits as past if orb has passed
  await pool.query(
    `UPDATE transits
     SET status = 'past'
     WHERE status IN ('upcoming', 'active')
     AND end_time < $1`,
    [now]
  );
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate house for a given longitude
 * @param {number} longitude
 * @param {Object} houses
 * @returns {number} House number 1-12
 */
export function calculateHouse(longitude, houses) {
  if (!houses) return 1;

  for (let i = 1; i <= 12; i++) {
    if (houses[i]) {
      const houseStart = houses[i].longitude || 0;
      const houseEnd = houses[i + 1] ? (houses[i + 1].longitude || 0) : (houseStart + 30) % 360;

      if (longitude >= houseStart && longitude < houseEnd) {
        return i;
      }
    }
  }

  return 1;
}

/**
 * Generate notification hash for deduplication
 */
export function generateNotificationHash(userId, transitId, eventType) {
  const str = `${userId}-${transitId}-${eventType}`;
  return crypto.createHash('sha256').update(str).digest('hex');
}

const transitEngine = {
  getPlanetaryPositions,
  cacheEphemeris,
  getOrCalculateEphemeris,
  findAspect,
  calculateExactTime,
  calculateStrengthScore,
  getAspectNature,
  calculateActiveTransits,
  calculateAndStoreTransits,
  getUserTransits,
  getTransitById,
  updateTransitStatuses,
  calculateHouse,
  generateNotificationHash
};

export default transitEngine;



