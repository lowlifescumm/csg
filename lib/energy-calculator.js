import * as Astronomy from 'astronomy-engine';

/**
 * Calculate daily energy scores based on planetary transits
 * 
 * @param {Object} natalChart - The user's natal chart data
 *   Expected structure: {
 *     planets: {
 *       sun: { longitude: number, sign: string, ... },
 *       moon: { longitude: number, sign: string, ... },
 *       mars: { longitude: number, sign: string, ... },
 *       ... (other planets)
 *     },
 *     houses: { ... }
 *   }
 * @param {Date} date - The date to calculate energy for
 * @returns {Object} Energy scores: { physical: number, emotional: number, spiritual: number }
 */
export function calculateDailyEnergy(natalChart, date) {
  if (!natalChart || !natalChart.planets) {
    return { physical: 50, emotional: 50, spiritual: 50 };
  }

  // Ensure date is a Date object
  const targetDate = date instanceof Date ? date : new Date(date);
  
  // Calculate transiting positions for Mars, Moon, and Neptune
  const transitMars = getPlanetPosition('Mars', targetDate);
  const transitMoon = getPlanetPosition('Moon', targetDate);
  const transitNeptune = getPlanetPosition('Neptune', targetDate);

  // Get natal planets to check aspects against
  const natalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
  
  // Calculate physical energy (Mars aspects)
  let physicalScore = 50; // Base score
  for (const natalPlanet of natalPlanets) {
    const natalPos = natalChart.planets[natalPlanet];
    if (!natalPos || natalPos.longitude === undefined) continue;
    
    const aspect = calculateAspect(transitMars.longitude, natalPos.longitude);
    if (aspect.type !== 'none') {
      const contribution = scoreAspect(aspect, 'mars', natalPlanet);
      physicalScore += contribution;
    }
  }

  // Calculate emotional energy (Moon aspects)
  let emotionalScore = 50; // Base score
  for (const natalPlanet of natalPlanets) {
    const natalPos = natalChart.planets[natalPlanet];
    if (!natalPos || natalPos.longitude === undefined) continue;
    
    const aspect = calculateAspect(transitMoon.longitude, natalPos.longitude);
    if (aspect.type !== 'none') {
      const contribution = scoreAspect(aspect, 'moon', natalPlanet);
      emotionalScore += contribution;
    }
  }

  // Calculate spiritual energy (Neptune aspects)
  let spiritualScore = 50; // Base score
  for (const natalPlanet of natalPlanets) {
    const natalPos = natalChart.planets[natalPlanet];
    if (!natalPos || natalPos.longitude === undefined) continue;
    
    const aspect = calculateAspect(transitNeptune.longitude, natalPos.longitude);
    if (aspect.type !== 'none') {
      const contribution = scoreAspect(aspect, 'neptune', natalPlanet);
      spiritualScore += contribution;
    }
  }

  // Normalize scores to 0-100 range
  physicalScore = Math.max(0, Math.min(100, Math.round(physicalScore)));
  emotionalScore = Math.max(0, Math.min(100, Math.round(emotionalScore)));
  spiritualScore = Math.max(0, Math.min(100, Math.round(spiritualScore)));

  return {
    physical: physicalScore,
    emotional: emotionalScore,
    spiritual: spiritualScore
  };
}

/**
 * Get planetary position for a specific date
 * @param {string} planetName - Planet name (e.g., 'Mars', 'Moon', 'Neptune')
 * @param {Date} date - Date to calculate position for
 * @returns {Object} { longitude: number, sign: string }
 */
function getPlanetPosition(planetName, date) {
  const time = Astronomy.MakeTime(date);
  let geoVector;
  
  if (planetName === 'Sun') {
    const sunPos = Astronomy.SunPosition(time);
    const ecliptic = Astronomy.Ecliptic(sunPos);
    return {
      longitude: normalizeLongitude(ecliptic.elon),
      sign: getZodiacSign(ecliptic.elon)
    };
  } else {
    geoVector = Astronomy.GeoVector(planetName, time, true);
    const ecliptic = Astronomy.Ecliptic(geoVector);
    return {
      longitude: normalizeLongitude(ecliptic.elon),
      sign: getZodiacSign(ecliptic.elon)
    };
  }
}

/**
 * Normalize longitude to 0-360 range
 */
function normalizeLongitude(longitude) {
  let normalized = longitude % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Get zodiac sign from longitude
 */
function getZodiacSign(longitude) {
  const normalized = normalizeLongitude(longitude);
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const index = Math.floor(normalized / 30) % 12;
  return signs[index];
}

/**
 * Calculate aspect between two longitudes
 * @param {number} lon1 - First longitude
 * @param {number} lon2 - Second longitude
 * @returns {Object} { type: string, angle: number, orb: number }
 */
function calculateAspect(lon1, lon2) {
  let angle = Math.abs(lon1 - lon2);
  if (angle > 180) angle = 360 - angle;

  const aspects = [
    { type: 'conjunction', targetAngle: 0, orb: 8 },
    { type: 'opposition', targetAngle: 180, orb: 8 },
    { type: 'trine', targetAngle: 120, orb: 8 },
    { type: 'square', targetAngle: 90, orb: 7 },
    { type: 'sextile', targetAngle: 60, orb: 6 }
  ];

  for (const aspect of aspects) {
    const diff = Math.abs(angle - aspect.targetAngle);
    if (diff <= aspect.orb) {
      return {
        type: aspect.type,
        angle: angle,
        orb: diff
      };
    }
  }

  return { type: 'none', angle: 0, orb: 0 };
}

/**
 * Score an aspect's contribution to energy
 * @param {Object} aspect - Aspect object with type, angle, orb
 * @param {string} transitPlanet - Transiting planet ('mars', 'moon', 'neptune')
 * @param {string} natalPlanet - Natal planet being aspected
 * @returns {number} Score contribution (can be positive or negative)
 */
function scoreAspect(aspect, transitPlanet, natalPlanet) {
  // Planetary weights (importance of natal planet)
  const natalWeights = {
    sun: 10,
    moon: 10,
    mercury: 7,
    venus: 7,
    mars: 8,
    jupiter: 9,
    saturn: 10
  };

  // Transit planet weights
  const transitWeights = {
    mars: 1.0,    // Physical energy
    moon: 1.0,   // Emotional energy
    neptune: 0.9 // Spiritual energy (slightly less direct)
  };

  // Aspect weights (beneficial aspects boost, challenging aspects reduce)
  const aspectWeights = {
    conjunction: 0.8,   // Neutral to slightly positive
    trine: 1.2,         // Highly beneficial
    sextile: 1.0,       // Beneficial
    square: -0.8,       // Challenging (reduces energy)
    opposition: -0.6    // Challenging but less intense than square
  };

  const natalWeight = natalWeights[natalPlanet] || 5;
  const transitWeight = transitWeights[transitPlanet] || 1.0;
  const aspectWeight = aspectWeights[aspect.type] || 0;
  
  // Orb factor: tighter orbs = stronger influence
  const maxOrb = aspect.type === 'square' ? 7 : 8;
  const orbFactor = Math.max(0, 1 - (aspect.orb / maxOrb));
  
  // Calculate contribution
  const contribution = (natalWeight * transitWeight * aspectWeight * orbFactor) / 2;
  
  return contribution;
}

/**
 * Generate energy scores for today and the next 6 days (7 days total)
 * @param {Object} natalChart - The user's natal chart data
 * @returns {Array} Array of energy objects: [{ date: Date, physical: number, emotional: number, spiritual: number }, ...]
 */
export function generateWeeklyEnergy(natalChart) {
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  
  const weeklyEnergy = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const energy = calculateDailyEnergy(natalChart, date);
    
    weeklyEnergy.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      ...energy
    });
  }
  
  return weeklyEnergy;
}

