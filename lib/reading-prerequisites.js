import { createRequire } from "module";
const require = createRequire(import.meta.url);
const logger = require('./logger');
import { pool } from './db.js';
import { calculateBirthChart } from './astrology.js';
import {
  AUTO_FULFILL_READING_TYPES,
  DEPENDENCY_MATRIX_VERSION,
  READING_DEPENDENCY_MATRIX,
} from './reading-dependencies.js';

const LEGACY_BIRTH_CHART_LOOKUP = `
  SELECT id FROM birth_charts
  WHERE user_id = $1
  ORDER BY created_at DESC
  LIMIT 1
`;

function normalizeBirthData(raw = {}) {
  const errors = [];
  const date = raw.date || raw.birthDate;
  const time = raw.time || raw.birthTime;
  const location = raw.location || raw.locationName;
  const lat = raw.latitude ?? raw.lat;
  const lon = raw.longitude ?? raw.lon ?? raw.lng;
  const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
  const longitude = typeof lon === 'string' ? parseFloat(lon) : lon;
  const timezone = raw.timezone || raw.timeZone || 'UTC';
  const chartName = raw.chartName || raw.name || raw.label || null;

  if (!date) errors.push('birth_date_required');
  if (!time) errors.push('birth_time_required');
  if (!location) errors.push('location_required');
  if (latitude === undefined || Number.isNaN(latitude)) errors.push('latitude_required');
  if (longitude === undefined || Number.isNaN(longitude)) errors.push('longitude_required');

  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0
      ? { date, time, location, latitude, longitude, timezone, chartName }
      : null,
  };
}

async function hasPrimaryBirthChart(userId) {
  const { rows } = await pool.query(
    `SELECT id FROM natal_charts WHERE user_id = $1 AND is_primary = true ORDER BY updated_at DESC LIMIT 1`,
    [userId],
  );
  if (rows.length > 0) {
    return { satisfied: true, chartId: rows[0].id, source: 'natal_charts' };
  }

  const legacy = await pool.query(LEGACY_BIRTH_CHART_LOOKUP, [userId]);
  if (legacy.rows.length > 0) {
    return { satisfied: true, chartId: legacy.rows[0].id, source: 'birth_charts' };
  }

  return { satisfied: false, reason: 'missing_primary_birth_chart' };
}

async function hasSecondaryBirthChart(userId) {
  const { rows } = await pool.query(
    `SELECT id FROM natal_charts WHERE user_id = $1 AND is_primary = false ORDER BY updated_at DESC LIMIT 1`,
    [userId],
  );
  if (rows.length > 0) {
    return { satisfied: true, chartId: rows[0].id, source: 'natal_charts' };
  }
  return { satisfied: false, reason: 'missing_partner_chart' };
}

async function hasPartnerBirthChart(userId, context = {}) {
  if (context.partnerChartId) {
    const { rows } = await pool.query(
      `SELECT id FROM natal_charts WHERE id = $1 LIMIT 1`,
      [context.partnerChartId],
    );
    if (rows.length > 0) {
      return { satisfied: true, chartId: rows[0].id, source: 'natal_charts' };
    }
    return { satisfied: false, reason: 'partner_chart_not_found' };
  }

  if (context.partnerUserId) {
    const { rows } = await pool.query(
      `SELECT id FROM natal_charts WHERE user_id = $1 AND is_primary = true LIMIT 1`,
      [context.partnerUserId],
    );
    if (rows.length > 0) {
      return { satisfied: true, chartId: rows[0].id, source: 'partner_primary_chart' };
    }
    return { satisfied: false, reason: 'partner_user_missing_chart' };
  }

  const secondary = await hasSecondaryBirthChart(userId);
  if (secondary.satisfied) {
    return { satisfied: true, chartId: secondary.chartId, source: 'secondary_chart' };
  }

  return { satisfied: false, reason: 'partner_reference_missing' };
}

async function hasReadingHistory(userId, dependency) {
  const type = dependency.readingType || 'tarot';

  if (type === 'transit_tracking') {
    const { rows } = await pool.query(
      `SELECT id FROM transits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    return { satisfied: rows.length > 0 };
  }

  const timeframe = dependency.timeframeDays ? `${Math.max(1, dependency.timeframeDays)} days` : null;
  const params = [userId, type];
  let sql = `SELECT id FROM readings WHERE user_id = $1 AND type = $2`;
  if (timeframe) {
    sql += ` AND created_at >= NOW() - INTERVAL '${timeframe}'`;
  }
  sql += ' ORDER BY created_at DESC LIMIT 1';

  const { rows } = await pool.query(sql, params);
  return { satisfied: rows.length > 0 };
}

async function attemptAutoCreateBirthChart(userId, context, scope) {
  const birthData = scope === 'partner' ? context.partnerBirthData : context.birthData;
  if (!birthData) {
    return { attempted: true, success: false, reason: 'birth_data_missing' };
  }

  const { valid, errors, normalized } = normalizeBirthData(birthData);
  if (!valid) {
    return { attempted: true, success: false, reason: 'birth_data_incomplete', details: errors };
  }

  try {
    const chartData = calculateBirthChart(
      normalized.date,
      normalized.time,
      normalized.latitude,
      normalized.longitude,
    );

    const locationName = normalized.location || 'Unknown';
    const timezone = normalized.timezone || 'UTC';
    const chartName =
      normalized.chartName || (scope === 'partner' ? 'Partner Chart' : 'Auto Generated Chart');
    const birthDateTime = new Date(`${normalized.date}T${normalized.time}:00`);

    try {
      await pool.query(
        `INSERT INTO birth_charts 
          (user_id, birth_date, birth_time, location, latitude, longitude, chart_data, interpretation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          normalized.date,
          normalized.time,
          locationName,
          normalized.latitude,
          normalized.longitude,
          JSON.stringify(chartData),
          '',
        ],
      );
    } catch (error) {
      logger.warn('[Prerequisites] Legacy birth_charts insert skipped:', error.message);
    }

    // Prepare natal positions with premium data points
    const natalPositions = {};
    for (const [planet, data] of Object.entries(chartData.planets)) {
      natalPositions[planet] = {
        longitude: data.longitude,
        sign: data.sign,
        degree: data.degree,
        name: planet.charAt(0).toUpperCase() + planet.slice(1)
      };
    }
    // Add premium data points
    natalPositions._premium_data = {
      planetSignHouseCombinations: chartData.planetSignHouseCombinations || [],
      houseCuspsDetailed: chartData.houseCuspsDetailed || [],
      chartRulerLocation: chartData.chartRulerLocation || null,
      majorAspects: chartData.majorAspects || [],
      midpoints: chartData.midpoints || []
    };
    
    const insertResult = await pool.query(
      `INSERT INTO natal_charts (
        user_id, birth_date, birth_time, timezone, latitude, longitude,
        location_name, natal_positions, houses, ascendant, midheaven,
        chart_name, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        userId,
        birthDateTime,
        normalized.time,
        timezone,
        normalized.latitude,
        normalized.longitude,
        locationName,
        JSON.stringify(natalPositions), // Includes premium data
        JSON.stringify({
          ...chartData.houses,
          _cusps_detailed: chartData.houseCuspsDetailed || []
        }),
        JSON.stringify(chartData.ascendant),
        JSON.stringify(chartData.midheaven),
        chartName,
        scope !== 'partner',
      ],
    );

    return {
      attempted: true,
      success: true,
      chartId: insertResult.rows[0].id,
      details: { chartName, timezone },
    };
  } catch (error) {
    logger.error('[Prerequisites] Auto chart generation failed:', error);
    return {
      attempted: true,
      success: false,
      reason: 'auto_generation_failed',
      details: error.message,
    };
  }
}

async function evaluateDependency(userId, dependency, context, autoFulfillEnabled) {
  switch (dependency.type) {
    case 'BIRTH_CHART': {
      const result = await hasPrimaryBirthChart(userId);
      if (result.satisfied) return { satisfied: true, meta: result };

      if (dependency.autoCreate && autoFulfillEnabled) {
        const autoResult = await attemptAutoCreateBirthChart(userId, context, 'self');
        if (autoResult.success) {
          return {
            satisfied: true,
            autoCreated: {
              dependencyId: dependency.id,
              chartId: autoResult.chartId,
              scope: dependency.scope,
              details: autoResult.details,
            },
          };
        }
        return { satisfied: false, reason: autoResult.reason, details: autoResult.details };
      }

      return result;
    }
    case 'PARTNER_BIRTH_CHART': {
      return await hasPartnerBirthChart(userId, context);
    }
    case 'READING_HISTORY': {
      return await hasReadingHistory(userId, dependency);
    }
    default:
      return { satisfied: true };
  }
}

export async function validateReadingPrerequisites(userId, readingType, context = {}) {
  const config = READING_DEPENDENCY_MATRIX[readingType] || { required: [], recommended: [] };
  const autoFulfillEnabled =
    (AUTO_FULFILL_READING_TYPES.has(readingType) || config.autoFulfillRequired) &&
    context.allowAutoCreate !== false;

  const missingRequired = [];
  const missingRecommended = [];
  const autoCreated = [];

  for (const dependency of config.required || []) {
    const check = await evaluateDependency(userId, dependency, context, autoFulfillEnabled);
    if (!check.satisfied) {
      missingRequired.push({
        id: dependency.id,
        type: dependency.type,
        scope: dependency.scope,
        label: dependency.label,
        message: dependency.message,
        reason: check.reason || 'missing_dependency',
        details: check.details,
      });
    } else if (check.autoCreated) {
      autoCreated.push({
        id: dependency.id,
        label: dependency.label,
        scope: dependency.scope,
        chartId: check.autoCreated.chartId,
        details: check.autoCreated.details,
      });
    }
  }

  for (const dependency of config.recommended || []) {
    const check = await evaluateDependency(userId, dependency, context, false);
    if (!check.satisfied) {
      missingRecommended.push({
        id: dependency.id,
        type: dependency.type,
        label: dependency.label,
        message: dependency.message,
        upsell: dependency.upsell,
      });
    }
  }

  return {
    allowed: missingRequired.length === 0,
    missing_required: missingRequired,
    missing_recommended: missingRecommended,
    auto_created: autoCreated,
    dependency_version: DEPENDENCY_MATRIX_VERSION,
    reading_type: readingType,
    auto_fulfill_enabled: autoFulfillEnabled,
  };
}
