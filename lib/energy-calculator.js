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
 * @returns {Object} EnergyPoint with scores, contributors, and summary_word
 */
export function calculateDailyEnergy(natalChart, date) {
  // Default return structure
  const defaultReturn = {
    date: date instanceof Date ? date.toISOString().split('T')[0] : new Date(date).toISOString().split('T')[0],
    scores: {
      physical: 50,
      emotional: 50,
      spiritual: 50
    },
    contributors: {
      physical: [],
      emotional: [],
      spiritual: []
    },
    summary_word: "Balanced"
  };

  if (!natalChart || !natalChart.planets) {
    return defaultReturn;
  }

  // Ensure date is a Date object
  const targetDate = date instanceof Date ? date : new Date(date);
  const dateStr = targetDate.toISOString().split('T')[0];
  
  // Calculate transiting positions for Mars, Moon, and Neptune
  const transitMars = getPlanetPosition('Mars', targetDate);
  const transitMoon = getPlanetPosition('Moon', targetDate);
  const transitNeptune = getPlanetPosition('Neptune', targetDate);

  // Get natal planets to check aspects against
  const natalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
  
  // Initialize scores and contributors
  let physicalScore = 50; // Base score
  let emotionalScore = 50; // Base score
  let spiritualScore = 50; // Base score
  const physicalContributors = [];
  const emotionalContributors = [];
  const spiritualContributors = [];
  
  let hasTransits = false;
  
  // Calculate physical energy (Mars aspects)
  for (const natalPlanet of natalPlanets) {
    const natalPos = natalChart.planets[natalPlanet];
    if (!natalPos || natalPos.longitude === undefined) continue;
    
    const aspect = calculateAspect(transitMars.longitude, natalPos.longitude);
    if (aspect.type !== 'none') {
      hasTransits = true;
      const result = scoreAspectWithDescription(aspect, 'mars', natalPlanet);
      physicalScore += result.contribution;
      if (Math.abs(result.contribution) > 0.5) { // Only add significant contributors
        physicalContributors.push(result.description);
      }
    }
  }

  // Calculate emotional energy (Moon aspects)
  for (const natalPlanet of natalPlanets) {
    const natalPos = natalChart.planets[natalPlanet];
    if (!natalPos || natalPos.longitude === undefined) continue;
    
    const aspect = calculateAspect(transitMoon.longitude, natalPos.longitude);
    if (aspect.type !== 'none') {
      hasTransits = true;
      const result = scoreAspectWithDescription(aspect, 'moon', natalPlanet);
      emotionalScore += result.contribution;
      if (Math.abs(result.contribution) > 0.5) { // Only add significant contributors
        emotionalContributors.push(result.description);
      }
    }
  }

  // Calculate spiritual energy (Neptune aspects)
  for (const natalPlanet of natalPlanets) {
    const natalPos = natalChart.planets[natalPlanet];
    if (!natalPos || natalPos.longitude === undefined) continue;
    
    const aspect = calculateAspect(transitNeptune.longitude, natalPos.longitude);
    if (aspect.type !== 'none') {
      hasTransits = true;
      const result = scoreAspectWithDescription(aspect, 'neptune', natalPlanet);
      spiritualScore += result.contribution;
      if (Math.abs(result.contribution) > 0.5) { // Only add significant contributors
        spiritualContributors.push(result.description);
      }
    }
  }

  // If no transits found, add small variance based on date hash to prevent flatline
  if (!hasTransits) {
    // Create a simple hash from the date string for consistent variance
    const dateHash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variance1 = (dateHash % 11) - 5; // -5 to +5
    const variance2 = ((dateHash * 3) % 11) - 5;
    const variance3 = ((dateHash * 7) % 11) - 5;
    
    physicalScore += variance1;
    emotionalScore += variance2;
    spiritualScore += variance3;
  }

  // Clamp scores to 10-95 range (prevent zero-flatline and extreme values)
  physicalScore = Math.max(10, Math.min(95, Math.round(physicalScore)));
  emotionalScore = Math.max(10, Math.min(95, Math.round(emotionalScore)));
  spiritualScore = Math.max(10, Math.min(95, Math.round(spiritualScore)));

  // Calculate summary_word based on highest score
  const summaryWord = calculateSummaryWord(physicalScore, emotionalScore, spiritualScore);

  const dailyEnergy = {
    date: dateStr,
    scores: {
      physical: physicalScore,
      emotional: emotionalScore,
      spiritual: spiritualScore
    },
    contributors: {
      physical: physicalContributors,
      emotional: emotionalContributors,
      spiritual: spiritualContributors
    },
    summary_word: summaryWord
  };

  // Debug log
  console.log('ENERGY SCORES:', JSON.stringify(dailyEnergy, null, 2));

  return dailyEnergy;
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
 * Score an aspect's contribution to energy and generate description
 * @param {Object} aspect - Aspect object with type, angle, orb
 * @param {string} transitPlanet - Transiting planet ('mars', 'moon', 'neptune')
 * @param {string} natalPlanet - Natal planet being aspected
 * @returns {Object} { contribution: number, description: string }
 */
function scoreAspectWithDescription(aspect, transitPlanet, natalPlanet) {
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
  
  // Generate description
  const transitPlanetName = capitalize(transitPlanet);
  const natalPlanetName = capitalize(natalPlanet);
  const aspectType = capitalize(aspect.type);
  const isPositive = contribution > 0;
  const effect = isPositive ? "+Boost" : "-Drain";
  
  const description = `${transitPlanetName} ${aspectType} ${natalPlanetName} (${effect})`;
  
  return {
    contribution,
    description
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use scoreAspectWithDescription instead
 */
function scoreAspect(aspect, transitPlanet, natalPlanet) {
  return scoreAspectWithDescription(aspect, transitPlanet, natalPlanet).contribution;
}

/**
 * Calculate summary word based on highest energy score
 * @param {number} physical - Physical energy score
 * @param {number} emotional - Emotional energy score
 * @param {number} spiritual - Spiritual energy score
 * @returns {string} Summary word describing the day's energy
 */
function calculateSummaryWord(physical, emotional, spiritual) {
  const scores = [
    { type: 'physical', value: physical },
    { type: 'emotional', value: emotional },
    { type: 'spiritual', value: spiritual }
  ];
  
  // Sort by score (highest first)
  scores.sort((a, b) => b.value - a.value);
  const highest = scores[0];
  const secondHighest = scores[1];
  
  // Determine summary word based on highest score and its value
  if (highest.value >= 75) {
    // Very high energy
    if (highest.type === 'physical') return "Dynamic";
    if (highest.type === 'emotional') return "Magnetic";
    if (highest.type === 'spiritual') return "Transcendent";
  } else if (highest.value >= 60) {
    // High energy
    if (highest.type === 'physical') return "Energetic";
    if (highest.type === 'emotional') return "Intuitive";
    if (highest.type === 'spiritual') return "Mystical";
  } else if (highest.value >= 45) {
    // Moderate energy
    if (highest.type === 'physical') return "Active";
    if (highest.type === 'emotional') return "Sensitive";
    if (highest.type === 'spiritual') return "Reflective";
  } else if (highest.value >= 30) {
    // Low energy
    if (highest.type === 'physical') return "Calm";
    if (highest.type === 'emotional') return "Subdued";
    if (highest.type === 'spiritual') return "Contemplative";
  } else {
    // Very low energy
    return "Sluggish";
  }
  
  // Fallback
  return "Balanced";
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generate energy scores for today and the next 6 days (7 days total)
 * @param {Object} natalChart - The user's natal chart data
 * @returns {Array} Array of EnergyPoint objects with scores, contributors, and summary_word
 */
export function generateWeeklyEnergy(natalChart) {
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  
  const weeklyEnergy = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const energy = calculateDailyEnergy(natalChart, date);
    weeklyEnergy.push(energy);
  }
  
  return weeklyEnergy;
}

