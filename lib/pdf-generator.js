/**
 * PDF Generation Service
 * Generates professionally formatted PDF reports from reading results
 */

import { generateText } from './openai.js';
import { formatOrdinal, calculateBirthChart, degreesToSign } from './astrology.js';

/**
 * Validation function for NatalChartData before PDF generation
 * Aborts generation if any assertion fails
 * 
 * @param {Object} natalChartData - The NatalChartData object to validate
 * @throws {Error} If any validation fails
 */
export function validateNatalChartData(natalChartData) {
  console.log('DEBUG CHART DATA:', JSON.stringify(natalChartData, null, 2));
  const errors = [];
  
  if (!natalChartData) {
    throw new Error('[Validation] NatalChartData is required');
  }
  
  // 1. Validate Sun Sign matches birth date (rough check)
  const birthDate = natalChartData.birth_date || natalChartData.birthDate;
  if (!birthDate) {
    errors.push('[Validation] birth_date is required in NatalChartData');
  } else {
    const sunSign = natalChartData.planets?.sun?.sign || 
                    natalChartData.sun?.sign || 
                    natalChartData.planets?.Sun?.sign;
    
    if (!sunSign) {
      errors.push('[Validation] Sun sign is missing in NatalChartData');
    } else {
      // Calculate expected sun sign from birth date (rough check)
      const expectedSunSign = calculateSunSignFromDate(birthDate);
      
      if (expectedSunSign && sunSign !== expectedSunSign) {
        errors.push(
          `[Validation] Sun sign mismatch: Expected ${expectedSunSign} based on birth date ${birthDate}, ` +
          `but found ${sunSign} in chart data`
        );
      }
    }
  }
  
  // 2. Validate house numbers are integers between 1-12
  const houses = natalChartData.houses || natalChartData.houseCuspsDetailed;
  if (houses) {
    for (const [houseNum, houseData] of Object.entries(houses)) {
      const houseNumber = typeof houseNum === 'string' ? parseInt(houseNum, 10) : houseNum;
      
      // Check if it's a valid house number (1-12)
      if (isNaN(houseNumber) || houseNumber < 1 || houseNumber > 12) {
        errors.push(
          `[Validation] Invalid house number: ${houseNum} (must be integer between 1-12)`
        );
      }
      
      // Check if house number is an integer
      if (!Number.isInteger(houseNumber)) {
        errors.push(
          `[Validation] House number must be an integer: ${houseNum}`
        );
      }
    }
  }
  
  // Also check planetHouses if present
  const planetHouses = natalChartData.planetHouses || natalChartData.planetSignHouseCombinations;
  if (planetHouses) {
    if (Array.isArray(planetHouses)) {
      // Check planetSignHouseCombinations array
      for (const combo of planetHouses) {
        if (combo.house !== undefined && combo.house !== null) {
          const houseNum = typeof combo.house === 'string' ? parseInt(combo.house, 10) : combo.house;
          if (isNaN(houseNum) || houseNum < 1 || houseNum > 12 || !Number.isInteger(houseNum)) {
            errors.push(
              `[Validation] Invalid house number in planetSignHouseCombinations: ${combo.planet} has house ${combo.house} ` +
              `(must be integer between 1-12)`
            );
          }
        }
      }
    } else if (typeof planetHouses === 'object') {
      // Check planetHouses object
      for (const [planet, houseNum] of Object.entries(planetHouses)) {
        if (houseNum !== undefined && houseNum !== null) {
          const house = typeof houseNum === 'string' ? parseInt(houseNum, 10) : houseNum;
          if (isNaN(house) || house < 1 || house > 12 || !Number.isInteger(house)) {
            errors.push(
              `[Validation] Invalid house number for ${planet}: ${houseNum} (must be integer between 1-12)`
            );
          }
        }
      }
    }
  }
  
  // 3. Validate user age matches birth year vs current year
  if (birthDate) {
    const calculatedAge = calculateAge(birthDate);
    if (calculatedAge === null) {
      errors.push('[Validation] Could not calculate age from birth_date');
    } else {
      // Parse birth date to get year
      let birthYear;
      if (typeof birthDate === 'string') {
        const parts = birthDate.split('-');
        if (parts.length >= 1) {
          birthYear = parseInt(parts[0], 10);
        }
      } else if (birthDate instanceof Date) {
        birthYear = birthDate.getFullYear();
      }
      
      if (birthYear) {
        const currentYear = new Date().getFullYear();
        const expectedAge = currentYear - birthYear;
        
        // Allow ±1 year tolerance for age calculation (due to month/day differences)
        if (Math.abs(calculatedAge - expectedAge) > 1) {
          errors.push(
            `[Validation] Age mismatch: Calculated age ${calculatedAge} does not match expected age ` +
            `from birth year ${birthYear} (expected approximately ${expectedAge} years old)`
          );
        }
      }
    }
  }
  
  // If any errors, abort and throw
  if (errors.length > 0) {
    const errorMessage = `[Validation] PDF generation ABORTED due to validation failures:\n${errors.join('\n')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Calculate expected sun sign from birth date (rough check)
 * This is a simplified calculation for validation purposes
 * 
 * @param {string|Date} birthDate - Birth date
 * @returns {string|null} Expected sun sign or null if cannot determine
 */
function calculateSunSignFromDate(birthDate) {
  if (!birthDate) return null;
  
  let date;
  if (typeof birthDate === 'string') {
    const parts = birthDate.split('-');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      date = new Date(birthDate);
    }
  } else if (birthDate instanceof Date) {
    date = birthDate;
  } else {
    return null;
  }
  
  if (isNaN(date.getTime())) return null;
  
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();
  
  // Rough sun sign calculation based on month and day
  // This is approximate - actual sun sign depends on exact date and can vary by year
  const sunSignRanges = [
    { sign: 'Capricorn', start: [12, 22], end: [1, 19] },
    { sign: 'Aquarius', start: [1, 20], end: [2, 18] },
    { sign: 'Pisces', start: [2, 19], end: [3, 20] },
    { sign: 'Aries', start: [3, 21], end: [4, 19] },
    { sign: 'Taurus', start: [4, 20], end: [5, 20] },
    { sign: 'Gemini', start: [5, 21], end: [6, 20] },
    { sign: 'Cancer', start: [6, 21], end: [7, 22] },
    { sign: 'Leo', start: [7, 23], end: [8, 22] },
    { sign: 'Virgo', start: [8, 23], end: [9, 22] },
    { sign: 'Libra', start: [9, 23], end: [10, 22] },
    { sign: 'Scorpio', start: [10, 23], end: [11, 21] },
    { sign: 'Sagittarius', start: [11, 22], end: [12, 21] }
  ];
  
  for (const range of sunSignRanges) {
    const [startMonth, startDay] = range.start;
    const [endMonth, endDay] = range.end;
    
    // Handle year wrap-around (Capricorn spans Dec 22 - Jan 19)
    if (startMonth > endMonth) {
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return range.sign;
      }
    } else {
      if ((month === startMonth && day >= startDay) || 
          (month > startMonth && month < endMonth) ||
          (month === endMonth && day <= endDay)) {
        return range.sign;
      }
    }
  }
  
  return null; // Could not determine
}

/**
 * Calculate NatalChartData from birth information
 * CRITICAL: This function calculates the chart FIRST before any prompt generation
 * The returned data contains pre-calculated signs and positions - NO birth dates
 * 
 * @param {string|Date} birthDate - Birth date
 * @param {string} birthTime - Birth time (HH:MM format)
 * @param {number} latitude - Birth latitude
 * @param {number} longitude - Birth longitude
 * @returns {Object} NatalChartData object with pre-calculated chart data (NO birth dates)
 */
function calculateNatalChartData(birthDate, birthTime, latitude, longitude) {
  if (!birthDate || !birthTime || latitude === undefined || longitude === undefined) {
    throw new Error('Missing required birth data: birthDate, birthTime, latitude, longitude');
  }
  
  // Calculate the chart using astronomy-engine (or sweph-wasm if preferred)
  const chartData = calculateBirthChart(birthDate, birthTime, latitude, longitude);
  
  // Extract and format the data for prompts - ensure signs are already calculated
  const natalChartData = {
    // Core planetary positions with signs already determined
    sun: {
      sign: chartData.planets.sun.sign,
      degree: chartData.planets.sun.degree,
      house: chartData.planetHouses?.sun || null
    },
    moon: {
      sign: chartData.planets.moon.sign,
      degree: chartData.planets.moon.degree,
      house: chartData.planetHouses?.moon || null
    },
    mercury: {
      sign: chartData.planets.mercury.sign,
      degree: chartData.planets.mercury.degree,
      house: chartData.planetHouses?.mercury || null
    },
    venus: {
      sign: chartData.planets.venus.sign,
      degree: chartData.planets.venus.degree,
      house: chartData.planetHouses?.venus || null
    },
    mars: {
      sign: chartData.planets.mars.sign,
      degree: chartData.planets.mars.degree,
      house: chartData.planetHouses?.mars || null
    },
    jupiter: {
      sign: chartData.planets.jupiter.sign,
      degree: chartData.planets.jupiter.degree,
      house: chartData.planetHouses?.jupiter || null
    },
    saturn: {
      sign: chartData.planets.saturn.sign,
      degree: chartData.planets.saturn.degree,
      house: chartData.planetHouses?.saturn || null
    },
    uranus: {
      sign: chartData.planets.uranus.sign,
      degree: chartData.planets.uranus.degree,
      house: chartData.planetHouses?.uranus || null
    },
    neptune: {
      sign: chartData.planets.neptune.sign,
      degree: chartData.planets.neptune.degree,
      house: chartData.planetHouses?.neptune || null
    },
    pluto: {
      sign: chartData.planets.pluto.sign,
      degree: chartData.planets.pluto.degree,
      house: chartData.planetHouses?.pluto || null
    },
    // Ascendant and Midheaven
    rising: chartData.ascendant,
    midheaven: chartData.midheaven,
    // Houses
    houses: chartData.houses,
    // Aspects
    aspects: chartData.aspects,
    // Premium data points
    planetSignHouseCombinations: chartData.planetSignHouseCombinations,
    houseCuspsDetailed: chartData.houseCuspsDetailed,
    chartRulerLocation: chartData.chartRulerLocation,
    majorAspects: chartData.majorAspects,
    midpoints: chartData.midpoints,
    // Additional chart data
    chartRuler: chartData.chartRuler,
    partOfFortune: chartData.partOfFortune,
    moonPhase: chartData.moonPhase,
    chartPatterns: chartData.chartPatterns,
    // Full chart data for compatibility
    planets: chartData.planets,
    planetHouses: chartData.planetHouses
  };
  
  // CRITICAL: Remove any birth date information
  // The prompt should NEVER receive birth dates
  return natalChartData;
}

/**
 * Section Orchestrator
 * Determines which section to include in the report based on age from NatalChartData
 * 
 * @param {Object} natalChartData - The NatalChartData object (must contain birth_date)
 * @returns {Object} Section configuration with type, title, and reportType
 */
export function SectionOrchestrator(natalChartData) {
  if (!natalChartData) {
    throw new Error('[SectionOrchestrator] NatalChartData is required');
  }
  
  // Extract birth date from NatalChartData
  const birthDate = natalChartData.birth_date || natalChartData.birthDate;
  if (!birthDate) {
    throw new Error('[SectionOrchestrator] birth_date is required in NatalChartData');
  }
  
  // Calculate age
  const age = calculateAge(birthDate);
  
  if (age === null) {
    // If age cannot be determined, default to Annual Forecast
    return {
      type: 'annual_forecast',
      title: 'Annual Forecast',
      reportType: 'transit_forecast_extended',
      description: 'Annual forecast based on current transits'
    };
  }
  
  // Determine section based on age
  if ((age >= 28 && age <= 30) || (age >= 58 && age <= 60)) {
    // Saturn Return
    return {
      type: 'saturn_return',
      title: 'Saturn Return',
      reportType: 'destiny_path',
      description: 'Saturn Return cycle analysis',
      ageRange: age >= 28 && age <= 30 ? '28-30' : '58-60'
    };
  } else if (age >= 40 && age <= 44) {
    // Midlife Transits
    return {
      type: 'midlife_transits',
      title: 'Midlife Transits',
      reportType: 'destiny_path',
      description: 'Midlife transit analysis (Saturn Opposition)',
      ageRange: '40-44'
    };
  } else {
    // Annual Forecast
    return {
      type: 'annual_forecast',
      title: 'Annual Forecast',
      reportType: 'transit_forecast_extended',
      description: 'Annual forecast based on current transits'
    };
  }
}

/**
 * Calculate age from birth date
 * @param {string|Date} birthDate - Birth date as string (YYYY-MM-DD) or Date object
 * @returns {number|null} Age in years, or null if invalid
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
  
  let date;
  if (typeof birthDate === 'string') {
    // Parse YYYY-MM-DD format
    const parts = birthDate.split('-');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      date = new Date(birthDate);
    }
  } else if (birthDate instanceof Date) {
    date = birthDate;
  } else {
    return null;
  }
  
  if (isNaN(date.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Extract key points from report content for closing blessing
 */
function extractKeyPoints(content, reportType) {
  if (!content || typeof content !== 'string') return '';
  
  // Extract first 300 characters as summary
  const preview = content.substring(0, 300).trim();
  
  // Try to extract specific elements based on report type
  if (reportType === 'tarot') {
    // Extract card names if mentioned
    const cardMatches = content.match(/\*\*([^*]+)\*\*/g);
    if (cardMatches) {
      return `Cards drawn: ${cardMatches.slice(0, 3).map(c => c.replace(/\*\*/g, '')).join(', ')}. ${preview}`;
    }
  } else if (reportType === 'moon') {
    // Extract moon phase if mentioned
    const moonPhaseMatch = content.match(/(Waxing|Waning|New|Full) (Crescent|Gibbous|Moon)/i);
    if (moonPhaseMatch) {
      return `Moon Phase: ${moonPhaseMatch[0]}. ${preview}`;
    }
  } else if (reportType === 'transit') {
    // Extract transit aspects if mentioned
    const transitMatches = content.match(/(Mars|Venus|Mercury|Jupiter|Saturn|Uranus|Neptune|Pluto|Sun|Moon)\s+(trine|square|conjunct|opposition|sextile)/gi);
    if (transitMatches) {
      return `Key transits: ${transitMatches.slice(0, 3).join(', ')}. ${preview}`;
    }
  }
  
  return preview;
}

/**
 * Enrich chart data with all premium data points
 * Extracts premium data from database JSONB structures or recalculates if missing
 */
async function enrichBirthChartData(rawData) {
  if (!rawData) return null;
  
  // If data already has premium points at top level, return as-is
  if (rawData.planetSignHouseCombinations && rawData.houseCuspsDetailed) {
    return rawData;
  }
  
  // Try to extract from nested structures (database format)
  let premiumData = {};
  
  // Extract from _premium_data if present
  if (rawData.planets?._premium_data) {
    premiumData = rawData.planets._premium_data;
  } else if (rawData._premium_data) {
    premiumData = rawData._premium_data;
  } else if (rawData.natal_positions?._premium_data) {
    premiumData = rawData.natal_positions._premium_data;
  }
  
  // Extract from houses JSONB
  if (!premiumData.houseCuspsDetailed) {
    if (rawData.houses?._cusps_detailed) {
      premiumData.houseCuspsDetailed = rawData.houses._cusps_detailed;
    }
  }
  
  // Extract from aspects JSONB
  if (!premiumData.majorAspects) {
    if (rawData.aspects?.major) {
      premiumData.majorAspects = rawData.aspects.major;
    } else if (Array.isArray(rawData.aspects)) {
      premiumData.majorAspects = rawData.aspects;
    }
  }
  
  // Extract from planet_houses JSONB
  if (!premiumData.planetSignHouseCombinations) {
    if (rawData.planet_houses?._combinations) {
      premiumData.planetSignHouseCombinations = rawData.planet_houses._combinations;
    }
  }
  
  // Normalize chart structure for recalculation
  const normalizedPlanets = rawData.planets || rawData.natal_positions || {};
  const normalizedHouses = rawData.houses || {};
  
  // Check if planetSignHouseCombinations is missing or incomplete (missing Moon, Saturn, or Nodes)
  const hasMoon = premiumData.planetSignHouseCombinations?.some(c => 
    c.planet === 'Moon' || c.planet?.toLowerCase() === 'moon'
  );
  const hasSaturn = premiumData.planetSignHouseCombinations?.some(c => 
    c.planet === 'Saturn' || c.planet?.toLowerCase() === 'saturn'
  );
  const hasNorthNode = premiumData.planetSignHouseCombinations?.some(c => 
    c.planet === 'North Node' || c.planet === 'True Node' || c.planet?.toLowerCase() === 'north node'
  );
  const hasSouthNode = premiumData.planetSignHouseCombinations?.some(c => 
    c.planet === 'South Node' || c.planet?.toLowerCase() === 'south node'
  );
  
  const isIncomplete = !premiumData.planetSignHouseCombinations || 
    !hasMoon || !hasSaturn || !hasNorthNode || !hasSouthNode;
  
  // If still missing or incomplete, recalculate from raw chart data
  if (!premiumData.planetSignHouseCombinations || !premiumData.houseCuspsDetailed || isIncomplete) {
    try {
      const { calculateBirthChart } = await import('./astrology.js');
      
      // Need birth date/time/location to recalculate
      if (rawData.birth_date && rawData.birth_time && rawData.latitude !== undefined && rawData.longitude !== undefined) {
        const recalculated = calculateBirthChart(
          rawData.birth_date,
          rawData.birth_time,
          rawData.latitude,
          rawData.longitude
        );
        
        premiumData.planetSignHouseCombinations = recalculated.planetSignHouseCombinations || [];
        premiumData.houseCuspsDetailed = recalculated.houseCuspsDetailed || [];
        premiumData.chartRulerLocation = recalculated.chartRulerLocation || null;
        premiumData.majorAspects = recalculated.majorAspects || [];
        premiumData.midpoints = recalculated.midpoints || [];
      } else if (normalizedPlanets && normalizedHouses && Object.keys(normalizedPlanets).length > 0) {
        // If we have planets and houses but no birth data, try to build combinations manually
        const { buildPlanetSignHouseCombinations, assignPlanetsToHouses } = await import('./astrology.js');
        
        // Assign planets to houses
        const planetHouses = assignPlanetsToHouses(normalizedPlanets, normalizedHouses);
        
        // Build combinations
        premiumData.planetSignHouseCombinations = buildPlanetSignHouseCombinations(normalizedPlanets, planetHouses) || [];
      }
    } catch (error) {
      console.error('[Data Enrichment] Error recalculating chart:', error);
    }
  }
  
  // Verify all critical planets are present in combinations
  const finalCombinations = premiumData.planetSignHouseCombinations || [];
  const hasAllCritical = finalCombinations.some(c => c.planet === 'Moon') &&
    finalCombinations.some(c => c.planet === 'Saturn') &&
    (finalCombinations.some(c => c.planet === 'North Node') || finalCombinations.some(c => c.planet === 'True Node')) &&
    finalCombinations.some(c => c.planet === 'South Node');
  
  if (!hasAllCritical && normalizedPlanets && normalizedHouses) {
    console.warn('[Data Enrichment] Missing critical planets in combinations, attempting manual build');
    try {
      const { buildPlanetSignHouseCombinations, assignPlanetsToHouses } = await import('./astrology.js');
      const planetHouses = assignPlanetsToHouses(normalizedPlanets, normalizedHouses);
      const manualCombinations = buildPlanetSignHouseCombinations(normalizedPlanets, planetHouses) || [];
      
      // Merge with existing, prioritizing manual build
      const existingPlanets = new Set(finalCombinations.map(c => c.planet));
      const newCombinations = manualCombinations.filter(c => !existingPlanets.has(c.planet));
      premiumData.planetSignHouseCombinations = [...finalCombinations, ...newCombinations];
    } catch (error) {
      console.error('[Data Enrichment] Error building combinations manually:', error);
    }
  }
  
  // Merge enriched data with original
  return {
    ...rawData,
    // Ensure premium data points are at top level for prompts
    planetSignHouseCombinations: premiumData.planetSignHouseCombinations || [],
    houseCuspsDetailed: premiumData.houseCuspsDetailed || [],
    chartRulerLocation: premiumData.chartRulerLocation || null,
    majorAspects: premiumData.majorAspects || [],
    midpoints: premiumData.midpoints || [],
    // Ensure planets, houses, aspects are accessible
    planets: normalizedPlanets,
    houses: normalizedHouses,
    aspects: rawData.aspects || {},
    sun: normalizedPlanets.sun || rawData.sun,
    moon: normalizedPlanets.moon || rawData.moon,
    rising: rawData.ascendant || rawData.rising,
  };
}

/**
 * Enrich compatibility data with premium synastry points
 */
async function enrichCompatibilityData(rawData) {
  if (!rawData) return null;
  
  // If already has premium data, return as-is
  if (rawData.synastryAspects && rawData.houseOverlays && rawData.compositeChart) {
    return rawData;
  }
  
  // Extract from scores JSONB (database format)
  let premiumData = {};
  if (rawData.scores?._premium_data) {
    premiumData = rawData.scores._premium_data;
  } else if (rawData._premium_data) {
    premiumData = rawData._premium_data;
  }
  
  // Normalize chart1 and chart2 structures
  let chart1 = rawData.chart1 || rawData.user;
  let chart2 = rawData.chart2 || rawData.partner;
  
  // If charts are in database format, extract planets and houses
  if (chart1 && (chart1.natal_positions || chart1.planets)) {
    chart1 = {
      planets: chart1.planets || chart1.natal_positions || {},
      houses: chart1.houses || {},
    };
  }
  if (chart2 && (chart2.natal_positions || chart2.planets)) {
    chart2 = {
      planets: chart2.planets || chart2.natal_positions || {},
      houses: chart2.houses || {},
    };
  }
  
  // If missing, try to calculate from chart1 and chart2
  if ((!premiumData.synastryAspects || !premiumData.houseOverlays || !premiumData.compositeChart) 
      && chart1 && chart2 && chart1.planets && chart2.planets) {
    try {
      const { generateCompatibilityReport } = await import('./compatibility.js');
      const result = generateCompatibilityReport(
        chart1,
        chart2,
        rawData.user_name || rawData.person1Name || rawData.name || 'User',
        rawData.partner_name || rawData.person2Name || 'Partner'
      );
      
      premiumData.synastryAspects = result.synastryAspects || [];
      premiumData.houseOverlays = result.houseOverlays || [];
      premiumData.compositeChart = result.compositeChart || null;
    } catch (error) {
      console.error('[Data Enrichment] Error calculating compatibility:', error);
    }
  }
  
  return {
    ...rawData,
    chart1: chart1 || rawData.chart1 || rawData.user,
    chart2: chart2 || rawData.chart2 || rawData.partner,
    user: chart1 || rawData.user,
    partner: chart2 || rawData.partner,
    synastryAspects: premiumData.synastryAspects || [],
    houseOverlays: premiumData.houseOverlays || [],
    compositeChart: premiumData.compositeChart || null,
  };
}

/**
 * Enrich transit data with premium points
 */
async function enrichTransitData(rawData) {
  if (!rawData) return null;
  
  // If already has premium data, return as-is
  if (rawData.cuspTransits && rawData.progressedChart && rawData.transitsWithExactDates) {
    return rawData;
  }
  
  // Extract from nested structures if present
  const premiumData = {
    cuspTransits: rawData.cuspTransits || rawData._premium_data?.cuspTransits || [],
    progressedChart: rawData.progressedChart || rawData._premium_data?.progressedChart || null,
    transitsWithExactDates: rawData.transitsWithExactDates || rawData._premium_data?.transitsWithExactDates || rawData.transits || [],
  };
  
  return {
    ...rawData,
    ...premiumData,
  };
}

/**
 * Enrich destiny path data with Saturn house placement
 */
async function enrichDestinyPathData(rawData) {
  if (!rawData) return null;
  
  // If already has natal Saturn placement, return as-is
  if (rawData.natalSaturnPlacement || rawData.natal_saturn_sign_house) {
    return rawData;
  }
  
  // Extract Saturn placement from birth chart data
  if (rawData.birth_chart_data || rawData.chart) {
    const chartData = rawData.birth_chart_data || rawData.chart;
    
    // Find Saturn in planetSignHouseCombinations
    if (chartData.planetSignHouseCombinations) {
      const saturnCombo = chartData.planetSignHouseCombinations.find(c => 
        c.planet === 'Saturn' || c.planet?.toLowerCase() === 'saturn'
      );
      
      if (saturnCombo) {
        return {
          ...rawData,
          natalSaturnPlacement: `${saturnCombo.planet} in ${saturnCombo.sign} in the ${saturnCombo.houseName || formatOrdinal(saturnCombo.house)}`,
          natal_saturn_sign_house: saturnCombo,
          natal_saturn_house: saturnCombo.house,
          natal_saturn_house_name: saturnCombo.houseName || formatOrdinal(saturnCombo.house),
        };
      }
    }
    
    // Fallback: extract from planets and houses
    if (chartData.planets?.saturn && chartData.houses) {
      const saturn = chartData.planets.saturn;
      // Find which house Saturn is in
      const planetHouses = chartData.planetHouses || {};
      const saturnHouse = planetHouses.saturn || planetHouses.Saturn;
      
      if (saturnHouse && chartData.houses[saturnHouse]) {
        const houseCusp = chartData.houses[saturnHouse];
        return {
          ...rawData,
          natalSaturnPlacement: `Saturn in ${saturn.sign} in the ${formatOrdinal(saturnHouse)}`,
          natal_saturn_sign_house: {
            planet: 'Saturn',
            sign: saturn.sign,
            house: saturnHouse,
            houseName: formatOrdinal(saturnHouse)
          },
          natal_saturn_house: saturnHouse,
          natal_saturn_house_name: formatOrdinal(saturnHouse),
        };
      }
    }
  }
  
  return rawData;
}

/**
 * Enrich karmic reading data with Nodal axis house placements
 */
async function enrichKarmicData(rawData) {
  if (!rawData) return null;
  
  // If already has nodal axis house placements, return as-is
  if (rawData.north_node_house && rawData.south_node_house) {
    return rawData;
  }
  
  // Extract Nodal axis placements from birth chart data
  if (rawData.birth_chart_data || rawData.chart) {
    const chartData = rawData.birth_chart_data || rawData.chart;
    
    // Find North Node and South Node in planetSignHouseCombinations
    if (chartData.planetSignHouseCombinations) {
      const northNode = chartData.planetSignHouseCombinations.find(c => 
        c.planet === 'North Node' || c.planet === 'True Node' || c.planet?.toLowerCase() === 'north node'
      );
      const southNode = chartData.planetSignHouseCombinations.find(c => 
        c.planet === 'South Node' || c.planet?.toLowerCase() === 'south node'
      );
      
      if (northNode && southNode) {
        // Safety check: Ensure house is defined before calling formatOrdinal
        const nnHouse = northNode.house;
        const snHouse = southNode.house;
        
        if (nnHouse === undefined || nnHouse === null || snHouse === undefined || snHouse === null) {
          throw new Error(
            `[enrichKarmicData] CRITICAL: North Node or South Node house is undefined. ` +
            `North Node house: ${nnHouse}, South Node house: ${snHouse}. ` +
            `This is required for karmic readings.`
          );
        }
        
        return {
          ...rawData,
          north_node_sign: northNode.sign,
          north_node_house: nnHouse,
          north_node_house_name: northNode.houseName || formatOrdinal(nnHouse),
          south_node_sign: southNode.sign,
          south_node_house: snHouse,
          south_node_house_name: southNode.houseName || formatOrdinal(snHouse),
        };
      }
    }
    
    // Fallback: extract from planets and houses
    if (chartData.planets) {
      const northNode = chartData.planets.northNode || chartData.planets['North Node'] || chartData.planets['True Node'];
      const southNode = chartData.planets.southNode || chartData.planets['South Node'];
      const planetHouses = chartData.planetHouses || {};
      
      if (northNode && southNode) {
        const nnHouse = planetHouses.northNode || planetHouses['North Node'] || planetHouses['True Node'] || planetHouses['northnode'];
        const snHouse = planetHouses.southNode || planetHouses['South Node'] || planetHouses['southnode'];
        
        // Safety check: Ensure house is defined before calling formatOrdinal
        if (nnHouse === undefined || nnHouse === null || snHouse === undefined || snHouse === null) {
          throw new Error(
            `[enrichKarmicData] CRITICAL: North Node or South Node house is undefined. ` +
            `North Node house: ${nnHouse}, South Node house: ${snHouse}. ` +
            `This is required for karmic readings. Check planetHouses assignment.`
          );
        }
        
        return {
          ...rawData,
          north_node_sign: northNode.sign,
          north_node_house: nnHouse,
          north_node_house_name: formatOrdinal(nnHouse),
          south_node_sign: southNode.sign,
          south_node_house: snHouse,
          south_node_house_name: formatOrdinal(snHouse),
        };
      }
    }
  }
  
  return rawData;
}

/**
 * Generate report content using OpenAI
 * 
 * @param {string} reportType - Type of report section
 * @param {object} data - Report data. If natalChart is provided, it's used directly (single source of truth)
 * @param {function} progressCallback - Progress callback
 * @returns {Promise<object>} Generated content with sections
 */
export async function generateReportContent(reportType, data, progressCallback) {
  try {
    await progressCallback?.(20, 'Generating report content...');
    
    // CRITICAL: Calculate NatalChartData FIRST if birth data is provided
    // This ensures signs are pre-calculated and birth dates are NEVER passed to prompts
    let calculatedChartData = null;
    
    // Check if we need to calculate chart data from birth information
    if (data.birthDate || data.birth_date || data.birthDate) {
      const birthDate = data.birthDate || data.birth_date;
      const birthTime = data.birthTime || data.birth_time || '12:00';
      const latitude = data.latitude || data.lat;
      const longitude = data.longitude || data.lng || data.lon;
      
      if (birthDate && latitude !== undefined && longitude !== undefined) {
        await progressCallback?.(25, 'Calculating natal chart data...');
        calculatedChartData = calculateNatalChartData(birthDate, birthTime, latitude, longitude);
      }
    }
    
    // If natalChart is provided directly, use it as-is (single source of truth)
    // Otherwise, enrich data with premium data points before generating prompt
    let enrichedData = data;
    
    // CRITICAL: Remove birth date information from data before passing to prompts
    // Create a clean copy without birth dates
    const cleanData = { ...data };
    delete cleanData.birthDate;
    delete cleanData.birth_date;
    delete cleanData.birthTime;
    delete cleanData.birth_time;
    delete cleanData.latitude;
    delete cleanData.lat;
    delete cleanData.longitude;
    delete cleanData.lng;
    delete cleanData.lon;
    
    // Check if data contains a natalChart object (the single source of truth)
    if (data.natalChart) {
      // Use the natalChart directly - no enrichment needed, it's already complete
      enrichedData = { ...cleanData, natalChart: data.natalChart };
    } else if (calculatedChartData) {
      // Use the calculated chart data
      enrichedData = { ...cleanData, natalChart: calculatedChartData, ...calculatedChartData };
    } else if (reportType === 'birth_chart' || reportType === 'natal_chart') {
      // If data IS the natalChart (passed directly), use it
      if (data.planetSignHouseCombinations && data.houseCuspsDetailed) {
        enrichedData = data; // Already a complete natalChart
      } else {
        enrichedData = await enrichBirthChartData(data);
      }
    } else if (reportType === 'compatibility' || reportType === 'compatibility_report') {
      // For compatibility, use natalChart from data.user if available
      if (data.user && data.user.planetSignHouseCombinations) {
        enrichedData = {
          ...data,
          user: data.user, // Use the natalChart object directly
        };
      } else {
        enrichedData = await enrichCompatibilityData(data);
      }
    } else if (reportType === 'transit_forecast_extended' || reportType === 'transit_forecast_short') {
      // For transits, use natalChart from data.natalChart if available
      if (data.natalChart && data.natalChart.planetSignHouseCombinations) {
        enrichedData = {
          ...data,
          natalChart: data.natalChart, // Use the natalChart object directly
        };
      } else {
        enrichedData = await enrichTransitData(data);
      }
    } else if (reportType === 'destiny_path' || reportType === 'destiny_path_cycle') {
      // For destiny path, use natalChart from data.natalChart if available
      if (data.natalChart && data.natalChart.planetSignHouseCombinations) {
        enrichedData = {
          ...data,
          natalChart: data.natalChart, // Use the natalChart object directly
        };
      } else {
        enrichedData = await enrichDestinyPathData(data);
      }
    } else if (reportType === 'karmic_reading' || reportType === 'shadow_work') {
      // For karmic, use natalChart from data.natalChart if available
      if (data.natalChart && data.natalChart.planetSignHouseCombinations) {
        enrichedData = {
          ...data,
          natalChart: data.natalChart, // Use the natalChart object directly
        };
      } else {
        enrichedData = await enrichKarmicData(data);
      }
    } else if (reportType === 'relationship_matrix') {
      // Guard clause: Check if partner data exists
      const userChart = data.user || data.natalChart || data.chart1 || data.pair?.user;
      const partnerChart = data.partner || data.chart2 || data.pair?.partner;
      
      if (!partnerChart || !userChart) {
        return null; // Return null to skip this section
      }
      
      // For relationship matrix, use natalChart from data.user if available
      if (data.user && data.user.planetSignHouseCombinations) {
        enrichedData = {
          ...data,
          user: data.user, // Use the natalChart object directly
          partner: partnerChart,
          pair: {
            user: userChart,
            partner: partnerChart
          }
        };
      } else {
        enrichedData = {
          ...data,
          user: userChart,
          partner: partnerChart,
          pair: {
            user: userChart,
            partner: partnerChart
          }
        };
      }
    }
    
    // Import prompts dynamically to avoid circular dependencies
    const { getPromptByType } = await import('./report-prompts.js');
    const prompt = getPromptByType(reportType, enrichedData);
    
    // Guard clause: If prompt is null, skip generation
    if (!prompt) {
      return null;
    }
    
    await progressCallback?.(40, 'Calling AI for interpretation...');
    
    // Generate content using OpenAI
    const content = await generateText(prompt);
    
    await progressCallback?.(80, 'Formatting report...');
    
    return {
      content,
      sections: parseReportSections(content, reportType),
    };
  } catch (error) {
    console.error('[PDF Generator] Error generating report content:', error);
    throw error;
  }
}

/**
 * Parse report content into structured sections for PDF
 */
function parseReportSections(content, reportType) {
  // Basic parsing - can be enhanced later
  const sections = [];
  
  // Split by headers (lines starting with # or ##)
  const lines = content.split('\n');
  let currentSection = { title: 'Introduction', content: [] };
  
  for (const line of lines) {
    if (line.match(/^#{1,2}\s+/)) {
      // New section
      if (currentSection.content.length > 0) {
        sections.push({
          ...currentSection,
          content: currentSection.content.join('\n'),
        });
      }
      currentSection = {
        title: line.replace(/^#{1,2}\s+/, '').trim(),
        content: [],
      };
    } else if (line.trim()) {
      currentSection.content.push(line);
    }
  }
  
  // Add last section
  if (currentSection.content.length > 0) {
    sections.push({
      ...currentSection,
      content: currentSection.content.join('\n'),
    });
  }
  
  return sections.length > 0 ? sections : [{ title: 'Report', content }];
}

/**
 * Generate PDF buffer from HTML using Puppeteer
 * Reuses current Puppeteer + @sparticuz/chromium configuration
 * 
 * @param {string} html - Complete HTML string
 * @param {Object} options - PDF options to override defaults (format, margins, etc.)
 *   - format: Page format (default: 'Letter')
 *   - printBackground: Include background colors/images (default: true)
 *   - margin: Page margins (default: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' })
 *   - All other page.pdf() options can be passed here
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generatePdfFromHtml(html, options = {}) {
  const chromium = await import('@sparticuz/chromium');
  const puppeteer = await import('puppeteer-core');
  
  console.log('[PDF Generator] Using Puppeteer with @sparticuz/chromium');
  
  // Configure chromium for Lambda/Render environments (same as existing config)
  // Note: setGraphicsMode may not be available in all versions, so we check first
  if (typeof chromium.setGraphicsMode === 'function') {
    chromium.setGraphicsMode(false);
  }
  
  // Launch browser with chromium configuration
  // Handle executablePath with proper error handling for serverless environments
  let launchOptions = {
    args: chromium.args || [],
    defaultViewport: chromium.defaultViewport || { width: 1280, height: 720 },
    headless: chromium.headless !== false,
  };

  // Try to get executablePath - handle both function and property access
  // If this fails (e.g., brotli files not found), fallback to system Chrome
  try {
    let executablePath;
    if (typeof chromium.executablePath === 'function') {
      try {
        executablePath = await chromium.executablePath();
      } catch (execPathError) {
        // Chromium executablePath() failed (likely brotli files not found)
        console.warn('[PDF Generator] Chromium executablePath() failed:', execPathError.message);
        console.warn('[PDF Generator] Falling back to system Chrome/Chromium');
        // Don't set executablePath - let Puppeteer find Chrome automatically
      }
    } else if (chromium.executablePath) {
      executablePath = chromium.executablePath;
    } else if (chromium.default?.executablePath) {
      try {
        executablePath = typeof chromium.default.executablePath === 'function'
          ? await chromium.default.executablePath()
          : chromium.default.executablePath;
      } catch (execPathError) {
        console.warn('[PDF Generator] Chromium default executablePath() failed:', execPathError.message);
        console.warn('[PDF Generator] Falling back to system Chrome/Chromium');
      }
    }
    
    if (executablePath) {
      launchOptions.executablePath = executablePath;
      console.log('[PDF Generator] Using Chromium executablePath:', executablePath);
    } else {
      // Fallback: let Puppeteer find Chrome/Chromium automatically (for local dev or when brotli files missing)
      console.warn('[PDF Generator] No chromium executablePath available, using system Chrome/Chromium');
    }
  } catch (error) {
    // Catch any other errors during chromium setup
    console.warn('[PDF Generator] Error setting up Chromium, using system Chrome:', error.message);
    // Don't set executablePath - let Puppeteer use system Chrome
  }

  const browser = await puppeteer.launch(launchOptions);
  
  try {
    const page = await browser.newPage();
    
    // Log HTML size for debugging
    console.log('[PDF Generator] HTML length:', html.length, 'characters');
    if (html.length < 100) {
      console.warn('[PDF Generator] WARNING: HTML is very short, might be empty or malformed');
      console.log('[PDF Generator] HTML preview (first 500 chars):', html.substring(0, 500));
    }
    
    // Set content with same wait conditions as existing code
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Default PDF options (matching existing generatePDF configuration)
    const defaultPdfOptions = {
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    };
    
    // Merge user options over defaults (allows overriding format, margins, etc.)
    const pdfOptions = Object.assign({}, defaultPdfOptions, options);
    
    const pdfBuffer = await page.pdf(pdfOptions);
    
    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF buffer is empty or invalid');
    }
    
    // Check if it's a valid PDF (starts with PDF magic bytes)
    const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
    if (pdfHeader !== '%PDF') {
      console.error('[PDF Generator] WARNING: PDF buffer does not start with PDF magic bytes:', pdfHeader);
      console.log('[PDF Generator] First 100 bytes:', pdfBuffer.toString('hex', 0, 100));
    } else {
      console.log('[PDF Generator] PDF buffer is valid, size:', pdfBuffer.length, 'bytes');
    }
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

/**
 * Upload PDF buffer to Cloudinary
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} reportType - Report type for filename
 * @param {Object} options - Upload options (folder, etc.)
 * @returns {Promise<string>} Cloudinary secure URL
 */
export async function uploadPdfToCloudinary(pdfBuffer, reportType, options = {}) {
  const { cloudinary } = await import('./cloudinary.js');
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: options.folder || 'reports',
        public_id: options.public_id || `report-${reportType}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        format: 'pdf',
        use_filename: false,
        unique_filename: true,
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error('[PDF Generator] Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    
    uploadStream.end(Buffer.from(pdfBuffer));
  });
}

/**
 * Generate PDF from report content using Puppeteer
 */
export async function generatePDF(reportType, reportData, content, options = {}) {
  try {
    // Generate HTML from content
    const html = generateHTMLReport(reportType, reportData, content);
    
    let pdfUrl = null;
    
    try {
      // Use the helper functions
      const pdfBuffer = await generatePdfFromHtml(html);
      pdfUrl = await uploadPdfToCloudinary(pdfBuffer, reportType);
      console.log('[PDF Generator] PDF generated and uploaded successfully:', pdfUrl);
    } catch (puppeteerError) {
      console.error('[PDF Generator] Puppeteer PDF generation failed:', puppeteerError);
      // Will return null pdfUrl, HTML is still available
    }
    
    return {
      pdfUrl,
      html,
    };
  } catch (error) {
    console.error('[PDF Generator] Error generating PDF:', error);
    // Return HTML as fallback
    const html = generateHTMLReport(reportType, reportData, content);
    return {
      pdfUrl: null,
      html,
    };
  }
}

/**
 * Generate HTML report structure with cover page and page breaks
 */
function generateHTMLReport(reportType, reportData, content) {
  const { name } = reportData;
  
  const title = getReportTitle(reportType);
  const sections = parseReportSections(content.content || content, reportType);
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const reportSections = content.sections || sections;
  const defaultImages = getDefaultThemeImages();
  const themeImages = {
    cover: defaultImages.cover,
    constellation: defaultImages.constellation,
    watercolor: defaultImages.watercolor,
    gateway: defaultImages.gateway,
    swirl: defaultImages.swirl,
    ...(reportData.themeImages || {}),
  };
  const accentImages = reportData.accentImages || [
    themeImages.constellation,
    themeImages.watercolor,
    themeImages.gateway,
    themeImages.swirl,
  ];
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${name || 'Your Reading'}</title>
  <style>
    /* 1. Define the physical paper size - No margins, handled in HTML */
    @page {
      size: letter portrait;
      margin: 0;
      counter-increment: page;
    }
    
    @page:first {
      margin: 0;
      size: letter portrait;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* 3. Typography */
    body {
      font-family: 'Georgia', serif;
      line-height: 1.55; /* Tightened from 1.6 to save ~15% vertical space */
      color: #1f2432;
      background: #fff;
      font-size: 10.5pt; /* Already optimized */
      width: 100%;
      margin: 0;
      padding: 0;
    }
    
    .cover-page {
      width: 8.5in;
      height: 11in;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: url('${themeImages.cover}') center/cover no-repeat, radial-gradient(circle at top, rgba(255,255,255,0.35), rgba(102,126,234,0.55));
      color: #fff;
      text-align: center;
      padding: 1.5in;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    
    .cover-page::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(147,51,234,0.45), rgba(14,165,233,0.35));
    }
    
    .cover-content {
      position: relative;
      z-index: 1;
      max-width: 620px;
    }
    
    .cover-logo {
      font-size: 28pt;
      letter-spacing: 4px;
      font-weight: 300;
      text-transform: uppercase;
      margin-bottom: 0.3in;
    }
    
    .cover-title {
      font-size: 32pt;
      line-height: 1.2;
      margin: 0.4in 0 0.2in;
    }
    
    .cover-subtitle {
      font-size: 14pt;
      opacity: 0.9;
      font-style: italic;
    }
    
    .cover-name {
      font-size: 18pt;
      margin-top: 0.6in;
      padding-top: 0.3in;
      border-top: 1px solid rgba(255,255,255,0.4);
      letter-spacing: 0.5px;
    }
    
    .cover-date {
      margin-top: 0.15in;
      font-size: 11pt;
      opacity: 0.8;
    }
    
    .cover-website {
      margin-top: 0.8in;
      font-size: 9pt;
      letter-spacing: 2px;
    }
    
    /* 1. Page Container - Fixed size with proper margins */
    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.75in 0.8in; /* Standard document margins */
      margin: 0 auto;
      background: white;
      position: relative;
      page-break-after: always;
      overflow: hidden; /* Keep content inside the page frame */
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    .page-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 0.6in;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.15in 0.5in 0.1in; /* Increased top padding for better spacing from page edge */
      border-bottom: 1px solid #e2e8f0;
      background: rgba(249,250,255,0.95);
      font-size: 9pt;
      letter-spacing: 0.5px;
      color: #4c1d95;
    }
    
    .page-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 0.5in;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.1in 0.5in 0.15in; /* Increased bottom padding for better spacing from page edge */
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #7c8aa1;
      background: rgba(255,255,255,0.95);
    }
    
    .page-inner {
      width: 100%;
      margin: 0 auto;
      padding-top: 0.6in; /* Maximize printable area - reduced from 1.25in */
      padding-bottom: 0.6in; /* Maximize printable area - reduced from 1.25in */
    }
    
    /* 3. Handle Breaks intelligently - Enforce "Keep-With-Next" for Headers */
    h1, h2, h3, .section-title, .section-subtitle {
      page-break-after: avoid; /* Don't leave a title at bottom of page */
      break-after: avoid; /* Modern CSS property */
      page-break-inside: avoid;
      margin-bottom: 0.1in; /* Reduce gap between title and text */
    }
    
    /* 2. Section Layout - The Flex Fix */
    .section {
      display: flex;
      gap: 30px;
      margin-bottom: 40px;
      align-items: flex-start;
      page-break-inside: avoid; /* Try to keep section together */
    }
    
    /* 4. Images - Fixed width and proper styling */
    .section-media {
      width: 220px;
      height: 300px;
      flex-shrink: 0;
      border-radius: 12px;
      background-size: cover;
      background-position: center;
      position: relative;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .section-media::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 8px;
      background: linear-gradient(145deg, rgba(255,255,255,0.15), rgba(15,23,42,0.25));
      mix-blend-mode: screen;
    }
    
    /* 2. Section Body - Flex grow to fill space */
    .section-body {
      flex: 1;
      min-width: 0;
      background: #fff;
      border-radius: 8px;
      padding: 0.35in 0.4in;
      box-shadow: 0 2px 8px rgba(15,23,42,0.06);
      position: relative;
      overflow: hidden; /* Keep content contained */
    }
    
    .section-body::before {
      content: '';
      position: absolute;
      top: 25px;
      right: 35px;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(147,51,234,0.13), transparent 70%);
      pointer-events: none;
    }
    
    /* 3. Typography - Section Title */
    h1.section-title {
      font-size: 22pt;
      color: #4c1d95;
      border-bottom: 2px solid #e9d5ff;
      padding-bottom: 10px;
      margin-bottom: 0.1in; /* Reduced from 20px for tighter spacing */
      line-height: 1.3;
    }
    
    .section-subtitle {
      font-size: 9pt;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #a78bfa;
      margin-bottom: 0.12in;
    }
    
    .section-content {
      font-size: 10.5pt;
      line-height: 1.55; /* Tightened to match body line-height */
    }
    
    /* 4. Paragraph flow with intelligent breaks - Prevent Orphaned Text */
    p {
      orphans: 3; /* Minimum 3 lines at bottom of page */
      widows: 3; /* Minimum 3 lines at top of new page */
      margin-bottom: 0.12in; /* Consistent spacing */
      text-align: justify;
    }
    
    .section-content p {
      margin: 0 0 0.12in; /* Reduced from 0.15in for tighter spacing */
      text-align: justify;
      orphans: 3;
      widows: 3;
    }
    
    .section-content p:first-of-type::first-letter {
      font-size: 28pt;
      font-weight: 600;
      color: #7c3aed;
      padding-right: 4px;
      float: left;
      line-height: 0.9;
      margin-top: 2px;
    }
    
    ul {
      margin: 0 0 0.2in 0.25in;
      padding: 0;
    }
    
    ul li {
      margin-bottom: 0.1in;
      position: relative;
      list-style: none;
      padding-left: 0.15in;
    }
    
    ul li::before {
      content: '✦';
      color: #c084fc;
      position: absolute;
      left: -0.2in;
      top: 0;
      font-size: 9pt;
    }
    
    blockquote {
      margin: 0.2in 0;
      padding: 0.15in 0.2in;
      border-left: 3px solid #c084fc;
      background: rgba(199,210,254,0.15);
      font-style: italic;
      color: #433b66;
      font-size: 10pt;
    }
    
    img, .chart-image-container {
      page-break-inside: avoid; /* Don't slice charts in half */
      page-break-after: avoid;
      max-height: 9in; /* Ensure images fit on one page */
    }
    
    .chart-image-container {
      margin: 0.25in 0 0.3in;
      text-align: center;
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    
    .chart-image {
      max-width: 100%;
      width: auto;
      height: auto;
      max-height: 9in; /* Updated to match requirement */
      border-radius: 8px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 2px 8px rgba(15,23,42,0.12);
      page-break-inside: avoid;
    }
    
    .chart-container {
      margin: 0.25in 0 0.3in;
      text-align: center;
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    
    .matrix-chart {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .matrix-chart svg {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 2px 8px rgba(15,23,42,0.12);
      background: #fff;
    }
    
    .section.closing .section-body {
      background: linear-gradient(145deg, #ffffff 0%, #f6edff 100%);
      border-left: 6px solid #c084fc;
    }
    
    .section.closing .section-media {
      display: none;
    }
    
    .section-divider {
      width: 100%;
      height: 0.3in;
      border-radius: 0.15in;
      margin: 0.2in auto 0.4in;
      background: url('${themeImages.swirl}') center/cover no-repeat;
      opacity: 0.85;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.45);
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    
    .section.closing .section-body {
      width: 100%;
      max-width: 7in;
      margin: 0 auto;
    }
    
    @media print {
      body {
        background: #fff;
      }
      .section-media {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page {
        background: #fff;
      }
      .pdf-print-button {
        display: none !important;
      }
      /* Headers/footers handled by @page margins in print */
      .content-page-header,
      .content-page-footer {
        display: none;
      }
      /* Fix flexbox page break issues */
      .page, .page-inner {
        display: block !important; /* Flexbox kills page breaks */
        height: auto !important;
        overflow: visible !important;
      }
    }
    
    .pdf-print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .pdf-print-button:hover {
      background: linear-gradient(135deg, #6d28d9 0%, #9333ea 100%);
      box-shadow: 0 6px 16px rgba(124, 58, 237, 0.5);
      transform: translateY(-2px);
    }
    
    .pdf-print-button:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-content">
      <div class="cover-logo">Cosmic Spiritual Guide</div>
      <div class="cover-title">${title}</div>
      <div class="cover-subtitle">Your Personalized Spiritual Reading</div>
      ${name ? `<div class="cover-name">Prepared for ${name}</div>` : ''}
      <div class="cover-date">${reportDate}</div>
      <div class="cover-website">www.cosmicspiritguide.com</div>
    </div>
  </div>
  
  <!-- Content Pages - Each major chapter on its own page -->
  ${reportSections.map((section, index) => `
    <div class="page">
      <div class="page-header">
        <div>COSMIC SPIRITUAL GUIDE</div>
        <div>${title}</div>
      </div>
      <div class="page-inner">
        <div class="section ${section.type === 'closing' ? 'closing' : ''}">
          ${section.type === 'closing' ? '' : `<div class="section-media" style="background-image: url('${accentImages[index % accentImages.length]}');"></div>`}
          <div class="section-body ${section.type === 'closing' ? 'closing-body' : ''}">
            <div class="section-subtitle">${reportDate}</div>
            <h1 class="section-title">${section.title || section.type || 'Section'}</h1>
            ${section.matrixChartSVG ? `
              <div class="chart-container matrix-chart">
                ${section.matrixChartSVG}
              </div>
            ` : section.chartImage ? `
              <div class="chart-image-container">
                <img src="${section.chartImage}" alt="Birth Chart Wheel" class="chart-image" />
              </div>
            ` : ''}
            <div class="section-content">
              ${formatSectionContent(section.content?.content || section.content || '')}
            </div>
          </div>
        </div>
        ${index < reportSections.length - 1 ? `<div class="section-divider"></div>` : ''}
      </div>
      <div class="page-footer">
        <div>Page ${index + 2}</div>
        <div>${name ? `${name} • ${reportDate}` : reportDate}</div>
        <div>www.cosmicspiritguide.com</div>
      </div>
    </div>
  `).join('')}
  
  <script>
    (function() {
      // Create floating PDF print button
      const button = document.createElement('button');
      button.className = 'pdf-print-button';
      button.textContent = '📄 Download PDF';
      button.title = 'Save as PDF';
      button.onclick = function() {
        window.print();
      };
      document.body.appendChild(button);
    })();
  </script>
</body>
</html>
  `.trim();
}

/**
 * Format content for HTML display (convert markdown to HTML)
 */
function formatSectionContent(content) {
  if (!content || typeof content !== 'string') return '';
  
  let formatted = content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  const blocks = formatted.split(/\n{2,}/).filter(Boolean);
  return blocks.map((block) => {
    const trimmed = block.trim();
    
    if (trimmed.startsWith('>')) {
      const quote = trimmed.replace(/^>\s?/gm, '');
      return `<blockquote>${quote}</blockquote>`;
    }
    
    const lines = trimmed.split('\n');
    const isList = lines.every(line => /^[-*]\s+/.test(line.trim()));
    if (isList) {
      const items = lines.map(line => line.replace(/^[-*]\s+/, '').trim()).filter(Boolean);
      return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
    }
    
    return `<p>${trimmed.replace(/\n/g, ' ')}</p>`;
  }).join('');
}

function getDefaultThemeImages() {
  return {
    cover: svgToDataUri(`
      <svg width="1600" height="1000" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bg" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="60%" stop-color="#111827"/>
            <stop offset="100%" stop-color="#020617"/>
          </radialGradient>
          <linearGradient id="trail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f472b6" stop-opacity="0"/>
            <stop offset="40%" stop-color="#f472b6" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.95"/>
          </linearGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#bg)"/>
        <g stroke="rgba(255,255,255,0.08)" stroke-width="1">
          <circle cx="800" cy="500" r="140"/>
          <circle cx="800" cy="500" r="260"/>
          <circle cx="800" cy="500" r="380"/>
          <circle cx="800" cy="500" r="520"/>
          <circle cx="800" cy="500" r="640"/>
        </g>
        <g stroke="url(#trail)" stroke-width="18" stroke-linecap="round">
          <path d="M200 250 C600 200, 1000 350, 1400 280"/>
          <path d="M180 420 C620 360, 1040 470, 1420 420"/>
          <path d="M160 600 C640 540, 1080 640, 1440 600"/>
        </g>
        <g fill="#fde047" opacity="0.8">
          <circle cx="520" cy="330" r="4"/>
          <circle cx="980" cy="360" r="5"/>
          <circle cx="740" cy="620" r="4.5"/>
          <circle cx="1180" cy="540" r="6"/>
        </g>
      </svg>
    `),
    constellation: svgToDataUri(`
      <svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="violet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2a1b63"/>
            <stop offset="45%" stop-color="#3b1f78"/>
            <stop offset="100%" stop-color="#51247f"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="900" fill="url(#violet)"/>
        <g stroke="#d8b4fe" stroke-width="2" fill="none">
          <path d="M200 420 L280 360 L360 430 L420 370 L500 440 L560 400"/>
          <path d="M660 520 L720 460 L780 510 L820 450 L900 520 L960 470 L1020 540"/>
        </g>
        <g fill="#fde68a">
          <circle cx="200" cy="420" r="4"/>
          <circle cx="280" cy="360" r="3"/>
          <circle cx="360" cy="430" r="4"/>
          <circle cx="420" cy="370" r="3"/>
          <circle cx="500" cy="440" r="5"/>
          <circle cx="560" cy="400" r="3"/>
          <circle cx="660" cy="520" r="4"/>
          <circle cx="720" cy="460" r="3"/>
          <circle cx="780" cy="510" r="4"/>
          <circle cx="820" cy="450" r="3"/>
          <circle cx="900" cy="520" r="5"/>
          <circle cx="960" cy="470" r="4"/>
          <circle cx="1020" cy="540" r="4"/>
        </g>
      </svg>
    `),
    watercolor: svgToDataUri(`
      <svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="swirl" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#a5b4fc"/>
            <stop offset="40%" stop-color="#c4b5fd" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#f5d0fe" stop-opacity="0.4"/>
          </radialGradient>
        </defs>
        <rect width="1200" height="900" fill="#fef3f4"/>
        <circle cx="350" cy="300" r="480" fill="url(#swirl)" opacity="0.9"/>
        <circle cx="800" cy="500" r="420" fill="url(#swirl)" opacity="0.5"/>
        <path d="M150 600 Q450 450 750 700" stroke="#bfdbfe" stroke-width="60" stroke-linecap="round" opacity="0.4" fill="none"/>
      </svg>
    `),
    gateway: svgToDataUri(`
      <svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="900" fill="#f5d0fe"/>
        <rect x="600" width="600" height="900" fill="#0f172a"/>
        <path d="M650 880 L780 400 Q800 320 840 400 L970 880" fill="#f8fafc" opacity="0.8"/>
        <path d="M180 150 Q380 250 420 520" stroke="#f59e0b" stroke-width="20" fill="none" opacity="0.4"/>
        <path d="M980 120 Q820 280 860 540" stroke="#60a5fa" stroke-width="18" fill="none" opacity="0.4"/>
      </svg>
    `),
    swirl: svgToDataUri(`
      <svg width="1400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gold" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#fcd34d" stop-opacity="0.2"/>
            <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#fcd34d" stop-opacity="0.2"/>
          </linearGradient>
          <linearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#d1d5db" stop-opacity="0.2"/>
            <stop offset="50%" stop-color="#e5e7eb" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#d1d5db" stop-opacity="0.2"/>
          </linearGradient>
        </defs>
        <rect width="1400" height="300" fill="#fdf6ec"/>
        <path d="M-50 200 C300 80, 600 320, 950 160 C1150 80, 1400 260, 1550 180" stroke="url(#gold)" stroke-width="80" fill="none" stroke-linecap="round" opacity="0.7"/>
        <path d="M-100 100 C250 260, 620 40, 1000 220 C1200 300, 1500 60, 1600 160" stroke="url(#silver)" stroke-width="60" fill="none" stroke-linecap="round" opacity="0.6"/>
      </svg>
    `),
  };
}

function svgToDataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg.trim()).toString('base64')}`;
}

/**
 * Get report title by type
 */
function getReportTitle(reportType) {
  const titles = {
    'tarot': 'Tarot Reading',
    'moon_reading': 'Moon Phase Reading',
    'birth_chart': 'Birth Chart Analysis',
    'natal_chart': 'Natal Chart Reading',
    'compatibility': 'Compatibility Report',
    'compatibility_report': 'Compatibility Analysis',
    'transit_forecast_short': 'Short-Term Transit Forecast',
    'transit_forecast_extended': 'Extended Transit Forecast',
    'destiny_path': 'Destiny Path Cycle Reading',
    'relationship_matrix': 'Relationship Matrix Analysis',
    'karmic_reading': 'Karmic & Shadow Work Reading',
    'shadow_work': 'Shadow Work Reading',
  };
  
  return titles[reportType?.toLowerCase()] || 'Spiritual Reading';
}

/**
 * Generate complete premium report (multiple sections)
 * 
 * @param {string} reportType - Type of report (ESSENTIAL, ADVANCED, MASTER)
 * @param {object} data - Report data containing natalChart (single source of truth) and other section data
 * @param {function} progressCallback - Progress callback function
 * @returns {Promise<object>} Generated report with sections, content, html, and pdfUrl
 */
export async function generatePremiumReport(reportType, data, progressCallback) {
  try {
    await progressCallback?.(10, 'Initializing report generation...');
    
    // Extract the single NatalChart object - this is the source of truth for all sections
    const natalChart = data.natalChart || data.birth_chart_data;
    
    if (!natalChart && (reportType === 'ADVANCED' || reportType === 'MASTER')) {
      throw new Error('Natal chart data is required for Advanced and Master reports');
    }
    
    // CRITICAL: Validate NatalChartData before generation
    // This will ABORT generation if any validation fails
    if (natalChart && (reportType === 'ADVANCED' || reportType === 'MASTER')) {
      await progressCallback?.(10, 'Validating chart data...');
      try {
        validateNatalChartData(natalChart);
        await progressCallback?.(10, 'Validation passed');
      } catch (validationError) {
        // Log error and abort
        console.error('[PDF Generator] Validation failed, aborting generation:', validationError.message);
        throw validationError; // Re-throw to abort generation
      }
    }
    
    const sections = [];
    
    // Generate main reading content
    if (reportType === 'ESSENTIAL') {
      // Essential: Tarot + Moon + Short Forecast
      await progressCallback?.(15, 'Generating Tarot reading...');
      const tarot = await generateReportContent('tarot', data.tarot_data, (p, m) => 
        progressCallback?.(15 + (p * 0.25), m)
      );
      sections.push({ 
        type: 'tarot', 
        title: 'Tarot Reading', 
        content: tarot,
        summary: extractKeyPoints(tarot.content, 'tarot')
      });
      
      await progressCallback?.(40, 'Generating Moon reading...');
      const moon = await generateReportContent('moon_reading', data.moon_data, (p, m) => 
        progressCallback?.(40 + (p * 0.25), m)
      );
      sections.push({ 
        type: 'moon', 
        title: 'Moon Phase Reading', 
        content: moon,
        summary: extractKeyPoints(moon.content, 'moon')
      });
      
      await progressCallback?.(65, 'Generating Transit forecast...');
      const forecast = await generateReportContent('transit_forecast_short', data.transit_data, (p, m) => 
        progressCallback?.(65 + (p * 0.25), m)
      );
      sections.push({ 
        type: 'transit', 
        title: 'Short-Term Forecast', 
        content: forecast,
        summary: extractKeyPoints(forecast.content, 'transit')
      });
      
    } else if (reportType === 'ADVANCED') {
      // Advanced: Birth Chart + Compatibility + Extended Forecast
      // All sections use the same natalChart object
      await progressCallback?.(20, 'Generating Birth Chart analysis...');
      // CRITICAL: Ensure aspects are included in natalChart for Advanced reports
      const advancedNatalChart = {
        ...natalChart,
        aspects: data.chartData?.user?.aspects || natalChart.aspects || data.aspects || [],
      };
      const birthChart = await generateReportContent('birth_chart', advancedNatalChart, (p, m) => 
        progressCallback?.(20 + (p * 0.2), m)
      );
      
      // Generate birth chart SVG image using the same natalChart object
      let chartImageUrl = null;
      try {
        const { generateBirthChartSVG } = await import('./birth-chart-svg.js');
        
        const chartSVG = generateBirthChartSVG(
          natalChart, // Use the same natalChart object
          {
            date: natalChart.birth_date,
            time: natalChart.birth_time,
            location: natalChart.location,
          }
        );
        
        // Convert SVG to data URL for embedding in PDF
        const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(chartSVG).toString('base64')}`;
        chartImageUrl = svgDataUrl;
      } catch (chartError) {
        console.error('[PDF Generator] Error generating birth chart image:', chartError);
        // Continue without chart image
      }
      
      sections.push({ 
        type: 'birth_chart', 
        title: 'Birth Chart Analysis', 
        content: birthChart,
        summary: extractKeyPoints(birthChart.content, 'birth_chart'),
        chartImage: chartImageUrl, // Include chart image
      });
      
      await progressCallback?.(40, 'Generating Compatibility report...');
      // Pass natalChart to compatibility (it will use user's chart + partner's chart from data.compatibility_data)
      // CRITICAL: Include partner name explicitly
      const compatibilityData = {
        ...data.compatibility_data,
        user: advancedNatalChart, // Use the natalChart with aspects
        partner_name: data.partner_name || data.compatibility_data?.partner?.name || data.compatibility_data?.partner_name || 'The Partner',
        chartData: data.chartData, // Include full chartData for matrix_scores
      };
      const compatibility = await generateReportContent('compatibility', compatibilityData, (p, m) => 
        progressCallback?.(40 + (p * 0.2), m)
      );
      sections.push({ 
        type: 'compatibility', 
        title: 'Compatibility Analysis', 
        content: compatibility,
        summary: extractKeyPoints(compatibility.content, 'compatibility')
      });
      
      await progressCallback?.(60, 'Generating Extended forecast...');
      // Pass natalChart to transit forecast
      // CRITICAL: Ensure transit_data includes natalChart and uses future-only filtering
      const forecastData = {
        ...data.transit_data,
        natalChart: advancedNatalChart, // Use the natalChart with aspects
        name: data.name, // User name for prompt
      };
      const forecast = await generateReportContent('transit_forecast_extended', forecastData, (p, m) => 
        progressCallback?.(60 + (p * 0.2), m)
      );
      sections.push({ 
        type: 'transit', 
        title: 'Extended Transit Forecast', 
        content: forecast,
        summary: extractKeyPoints(forecast.content, 'transit')
      });
      
    } else if (reportType === 'MASTER') {
      // Master: All of Advanced + Destiny Path + Karmic Reading + Relationship Matrix
      // All sections use the same natalChart object - single source of truth
      
      await progressCallback?.(10, 'Generating Birth Chart...');
      const birthChart = await generateReportContent('birth_chart', natalChart, (p, m) => 
        progressCallback?.(10 + (p * 0.1), m)
      );
      
      // Generate birth chart SVG image using the same natalChart object
      let chartImageUrl = null;
      try {
        const { generateBirthChartSVG } = await import('./birth-chart-svg.js');
        
        const chartSVG = generateBirthChartSVG(
          natalChart, // Use the same natalChart object
          {
            date: natalChart.birth_date,
            time: natalChart.birth_time,
            location: natalChart.location,
          }
        );
        const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(chartSVG).toString('base64')}`;
        chartImageUrl = svgDataUrl;
      } catch (chartError) {
        console.error('[PDF Generator] Error generating birth chart image:', chartError);
      }
      
      sections.push({ 
        type: 'birth_chart', 
        title: 'Birth Chart Analysis', 
        content: birthChart,
        summary: extractKeyPoints(birthChart.content, 'birth_chart'),
        chartImage: chartImageUrl, // Include chart image
      });
      
      await progressCallback?.(20, 'Generating Compatibility analysis...');
      // Pass natalChart to compatibility (Identity section)
      const compatibility = await generateReportContent('compatibility', {
        ...data.compatibility_data,
        user: natalChart, // Use the same natalChart object
      }, (p, m) => 
        progressCallback?.(20 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'compatibility', 
        title: 'Compatibility Analysis', 
        content: compatibility,
        summary: extractKeyPoints(compatibility.content, 'compatibility')
      });
      
      await progressCallback?.(30, 'Generating Extended forecast...');
      // Pass natalChart to transit forecast (Forecast section)
      const forecast = await generateReportContent('transit_forecast_extended', {
        ...data.transit_data,
        natalChart, // Use the same natalChart object
      }, (p, m) => 
        progressCallback?.(30 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'transit', 
        title: 'Extended Transit Forecast', 
        content: forecast,
        summary: extractKeyPoints(forecast.content, 'transit')
      });
      
      // Use SectionOrchestrator to determine which section to generate
      await progressCallback?.(40, 'Determining section type...');
      
      // Ensure natalChart has birth_date for SectionOrchestrator
      const chartDataForOrchestrator = {
        ...natalChart,
        birth_date: natalChart?.birth_date || data.birth_date || data.destiny_data?.birth_date
      };
      
      if (!chartDataForOrchestrator.birth_date) {
        throw new Error('[generatePremiumReport] birth_date is required in natalChart for SectionOrchestrator');
      }
      
      // Get section configuration from orchestrator
      const sectionConfig = SectionOrchestrator(chartDataForOrchestrator);
      
      await progressCallback?.(40, `Generating ${sectionConfig.title}...`);
      
      // Only generate the relevant section based on age
      const sectionContent = await generateReportContent(sectionConfig.reportType, {
        ...data.destiny_data,
        natalChart, // Use the same natalChart object
        birth_date: chartDataForOrchestrator.birth_date, // Pass birth date for age calculation
      }, (p, m) => 
        progressCallback?.(40 + (p * 0.1), m)
      );
      
      // Only add section if content was generated
      if (sectionContent && sectionContent.content) {
        sections.push({ 
          type: sectionConfig.type, 
          title: sectionConfig.title, 
          content: sectionContent,
          summary: extractKeyPoints(sectionContent.content, sectionConfig.type)
        });
      }
      
      // Guard clause: Only generate Relationship Matrix if partner data exists
      const partnerChart = data.matrix_data?.partner || data.matrix_data?.chart2 || data.matrix_data?.pair?.partner;
      
      if (partnerChart) {
        await progressCallback?.(50, 'Generating Relationship Matrix...');
        // Pass natalChart and partner chart to relationship matrix
        const matrix = await generateReportContent('relationship_matrix', {
          ...data.matrix_data,
          user: natalChart, // Use the same natalChart object
          pair: {
            user: natalChart,
            partner: partnerChart
          }
        }, (p, m) => 
          progressCallback?.(50 + (p * 0.1), m)
        );
        
        // Only add section if matrix was successfully generated (not null)
        if (matrix && matrix.content) {
          // Generate radar chart SVG for matrix scores
          let matrixChartSVG = null;
          let matrixChartImage = null;
          try {
            const { generateCompatibilityRadar } = await import('@/src/utils/visuals/generateMatrixSVG');
            const matrixScores = data.matrix_scores || data.chartData?.matrix_scores || data.matrix_data?.matrix_scores;
            
            if (matrixScores && typeof matrixScores === 'object') {
              const radarSVG = generateCompatibilityRadar({
                emotional: matrixScores.emotional || 50,
                communication: matrixScores.communication || 50,
                spiritual: matrixScores.spiritual || 50,
                stability: matrixScores.stability || 50,
                physical: matrixScores.physical || 50,
              });
              
              // Store SVG string for direct HTML embedding
              matrixChartSVG = radarSVG;
              
              // Also convert SVG to data URL for backward compatibility (image fallback)
              matrixChartImage = `data:image/svg+xml;base64,${Buffer.from(radarSVG).toString('base64')}`;
            }
          } catch (chartError) {
            console.error('[PDF Generator] Error generating matrix radar chart:', chartError);
            // Continue without chart image
          }
          
          sections.push({ 
            type: 'matrix', 
            title: 'Relationship Matrix', 
            content: matrix,
            summary: extractKeyPoints(matrix.content, 'matrix'),
            chartImage: matrixChartImage, // Include radar chart image (fallback)
            matrixChartSVG: matrixChartSVG // Include SVG string for direct HTML embedding
          });
        }
      } else {
        // Skip Relationship Matrix if partner data is missing
        await progressCallback?.(50, 'Skipping Relationship Matrix (partner data not available)...');
      }
      
      await progressCallback?.(60, 'Generating Karmic reading...');
      // Pass natalChart to karmic reading
      const karmic = await generateReportContent('karmic_reading', {
        ...data.karmic_data,
        natalChart, // Use the same natalChart object
      }, (p, m) => 
        progressCallback?.(60 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'karmic', 
        title: 'Karmic & Shadow Work', 
        content: karmic,
        summary: extractKeyPoints(karmic.content, 'karmic')
      });
    }
    
    // Generate closing blessing - pass actual report sections so it can reference them
    await progressCallback?.(90, 'Adding closing message...');
    const { getClosingBlessingPrompt } = await import('./report-prompts.js');
    const closing = await generateText(
      getClosingBlessingPrompt({ 
        name: data.name, 
        report_sections: sections, // Pass actual sections with content
        report_type: reportType,
        key_themes: sections.map(s => s.title), // Keep as fallback
      })
    );
    sections.push({ type: 'closing', title: 'Closing Blessing', content: { content: closing } });
    
    // Generate HTML and PDF (always generate PDF for premium reports)
    await progressCallback?.(95, 'Generating PDF...');
    const fullContent = sections.map(s => `${s.title}\n\n${s.content.content || s.content}`).join('\n\n---\n\n');
    // Pass sections array for proper page breaks
    const html = generateHTMLReport(reportType, data, { content: fullContent, sections });
    const pdf = await generatePDF(reportType, data, { content: fullContent, sections });
    
    return {
      sections,
      content: fullContent,
      html,
      pdfUrl: pdf.pdfUrl,
    };
  } catch (error) {
    console.error('[PDF Generator] Error generating premium report:', error);
    throw error;
  }
}

