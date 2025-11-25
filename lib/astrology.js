import * as Astronomy from 'astronomy-engine';

/**
 * Format a house number (1-12) into an ordinal string (1st, 2nd, 3rd, etc.)
 * Returns 'Unknown House' if input is null, undefined, or out of range
 * 
 * @param {number|null|undefined} n - House number (1-12)
 * @returns {string} Formatted house name (e.g., "1st House", "2nd House", "Unknown House")
 */
export function formatOrdinal(n) {
  if (n === null || n === undefined || typeof n !== 'number' || n < 1 || n > 12) {
    return 'Unknown House';
  }
  
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  const suffix = s[(v - 20) % 10] || s[v] || s[0];
  
  return `${n}${suffix} House`;
}

export function calculateBirthChart(birthDate, birthTime, latitude, longitude) {
  // Handle birthTime - convert to string if needed
  let timeStr = birthTime;
  if (typeof birthTime !== 'string') {
    if (birthTime instanceof Date) {
      const h = birthTime.getHours();
      const m = birthTime.getMinutes();
      timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    } else if (typeof birthTime === 'number') {
      // Assume it's minutes since midnight or similar
      const hours = Math.floor(birthTime / 60);
      const minutes = birthTime % 60;
      timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      timeStr = String(birthTime || '12:00');
    }
  }
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Handle birthDate - convert to string if needed
  let dateStr = birthDate;
  if (typeof birthDate !== 'string') {
    if (birthDate instanceof Date) {
      const year = birthDate.getFullYear();
      const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
      const day = birthDate.getDate().toString().padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else {
      dateStr = String(birthDate || new Date().toISOString().split('T')[0]);
    }
  }
  
  // Parse date string to avoid timezone issues (e.g., "1980-03-09" should be March 9th, not March 8th)
  // Parse the date components explicitly to create date in local time
  const dateParts = dateStr.split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-indexed
  const day = parseInt(dateParts[2], 10);
  
  // Create date in local time to avoid UTC conversion issues
  const datetime = new Date(year, month, day, hours, minutes, 0, 0);

  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const chart = {};
  
  for (const planetName of planetNames) {
    const geoVector = Astronomy.GeoVector(planetName, datetime, true);
    const ecliptic = Astronomy.Ecliptic(geoVector);
    
    const eclipticLongitude = ecliptic.elon;

    chart[planetName.toLowerCase()] = {
      sign: getZodiacSign(eclipticLongitude),
      degree: eclipticLongitude % 30,
      longitude: eclipticLongitude,
      retrograde: false // Will be calculated below
    };
  }

  // Calculate retrograde status
  calculateRetrogrades(chart, datetime);

  // Add Lunar Nodes
  const nodes = calculateLunarNodes(datetime);
  chart.northNode = nodes.north;
  chart.southNode = nodes.south;

  // Add Chiron (approximation - Chiron has ~50 year orbit)
  chart.chiron = calculateChiron(datetime);

  const houses = calculateHouses(datetime, latitude, longitude);
  const aspects = calculateAspects(chart, true); // Include minor aspects

  // Calculate element and modality distribution
  const distribution = calculateElementModality(chart);
  
  // Calculate Part of Fortune
  const partOfFortune = calculatePartOfFortune(chart, houses);
  
  // Determine chart ruler
  const chartRuler = getChartRuler(houses[1].sign);
  
  // Calculate planetary dignities
  const dignities = calculateDignities(chart);
  
  // Calculate Moon phase
  const moonPhase = calculateMoonPhase(chart);
  
  // Detect chart patterns
  const chartPatterns = detectChartPatterns(chart, aspects);
  
  // Assign planets to houses
  const planetHouses = assignPlanetsToHouses(chart, houses);

  // Build comprehensive data structures for premium reporting
  
  // 1. Planet-Sign-House Combinations (e.g., "Venus in Taurus in the 7th House")
  const planetSignHouseCombinations = buildPlanetSignHouseCombinations(chart, planetHouses);
  
  // 2. House Cusps with degrees (e.g., "2nd House Cusp at 12° Capricorn")
  const houseCuspsDetailed = buildHouseCuspsDetailed(houses);
  
  // 3. Chart Ruler location (where the chart ruler planet is located)
  const chartRulerLocation = getChartRulerLocation(chartRuler, chart, planetHouses);
  
  // 4. Major Natal Aspects with proper formatting (e.g., "Sun Square Saturn (Orb 1° 30')")
  const majorAspects = formatMajorAspects(aspects);
  
  // 5. Midpoints (e.g., "Sun/Moon Conjunct Ascendant")
  const midpoints = calculateMidpoints(chart, houses);

  return {
    planets: chart,
    houses,
    aspects,
    ascendant: houses[1].sign,
    midheaven: houses[10].sign,
    distribution,
    partOfFortune,
    chartRuler,
    dignities,
    moonPhase,
    chartPatterns,
    planetHouses,
    // Premium reporting data points
    planetSignHouseCombinations,
    houseCuspsDetailed,
    chartRulerLocation,
    majorAspects,
    midpoints
  };
}

/**
 * Convert degrees (0-360) to zodiac sign name
 * @param {number} deg - Longitude in degrees (0-360)
 * @returns {string} Zodiac sign name (e.g., 'Aries', 'Pisces')
 */
export function degreesToSign(deg) {
  if (deg === null || deg === undefined || isNaN(deg)) {
    return 'Unknown';
  }
  
  // Normalize to 0-360 range
  const normalizedDeg = ((deg % 360) + 360) % 360;
  
  const signs = [
    'Aries',      // 0-30
    'Taurus',     // 30-60
    'Gemini',     // 60-90
    'Cancer',     // 90-120
    'Leo',        // 120-150
    'Virgo',      // 150-180
    'Libra',      // 180-210
    'Scorpio',    // 210-240
    'Sagittarius', // 240-270
    'Capricorn',  // 270-300
    'Aquarius',   // 300-330
    'Pisces'      // 330-360
  ];
  
  const signIndex = Math.floor(normalizedDeg / 30);
  return signs[signIndex] || 'Unknown';
}

/**
 * Legacy function - now uses degreesToSign
 * @deprecated Use degreesToSign instead
 */
function getZodiacSign(longitude) {
  return degreesToSign(longitude);
}


function calculateHouses(datetime, latitude, longitude) {
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  
  const sunVec = Astronomy.GeoVector('Sun', datetime, true);
  const sunEcl = Astronomy.Ecliptic(sunVec);
  const sunLongitude = sunEcl.elon;
  
  const ascendantLongitude = (sunLongitude + 90) % 360;
  const mcLongitude = sunLongitude;
  
  const houses = {};
  houses[1] = {
    sign: getZodiacSign(ascendantLongitude),
    longitude: ascendantLongitude,
    degree: ascendantLongitude % 30 // Add degree for premium reporting
  };
  houses[10] = {
    sign: getZodiacSign(mcLongitude),
    longitude: mcLongitude,
    degree: mcLongitude % 30 // Add degree for premium reporting
  };
  
  for (let i = 2; i <= 12; i++) {
    if (i !== 10) {
      const houseCusp = (ascendantLongitude + (i - 1) * 30) % 360;
      houses[i] = {
        sign: getZodiacSign(houseCusp),
        longitude: houseCusp,
        degree: houseCusp % 30 // Add degree for premium reporting
      };
    }
  }
  
  return houses;
}

function calculateAspects(chart, includeMinor = true) {
  const aspects = [];
  const planets = Object.keys(chart);
  
  // Major aspects with tighter orbs
  const majorOrbs = {
    conjunction: 8,
    opposition: 8,
    trine: 8,
    square: 7,
    sextile: 6
  };
  
  // Minor aspects with smaller orbs
  const minorOrbs = {
    quincunx: 3,      // 150°
    semisextile: 3,   // 30°
    semisquare: 2,    // 45°
    sesquisquare: 2   // 135°
  };

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      const angle = Math.abs(chart[planet1].longitude - chart[planet2].longitude);
      const normalizedAngle = angle > 180 ? 360 - angle : angle;

      // Major aspects
      if (Math.abs(normalizedAngle - 0) < majorOrbs.conjunction) {
        aspects.push({ planet1, planet2, type: 'conjunction', angle: normalizedAngle, orb: Math.abs(normalizedAngle - 0), major: true });
      } else if (Math.abs(normalizedAngle - 180) < majorOrbs.opposition) {
        aspects.push({ planet1, planet2, type: 'opposition', angle: normalizedAngle, orb: Math.abs(normalizedAngle - 180), major: true });
      } else if (Math.abs(normalizedAngle - 120) < majorOrbs.trine) {
        aspects.push({ planet1, planet2, type: 'trine', angle: normalizedAngle, orb: Math.abs(normalizedAngle - 120), major: true });
      } else if (Math.abs(normalizedAngle - 90) < majorOrbs.square) {
        aspects.push({ planet1, planet2, type: 'square', angle: normalizedAngle, orb: Math.abs(normalizedAngle - 90), major: true });
      } else if (Math.abs(normalizedAngle - 60) < majorOrbs.sextile) {
        aspects.push({ planet1, planet2, type: 'sextile', angle: normalizedAngle, orb: Math.abs(normalizedAngle - 60), major: true });
      }
      // Minor aspects
      else if (includeMinor) {
        if (Math.abs(normalizedAngle - 150) < minorOrbs.quincunx) {
          aspects.push({ planet1, planet2, type: 'quincunx', angle: normalizedAngle, orb: Math.abs(normalizedAngle - 150), major: false });
        } else if (Math.abs(normalizedAngle - 30) < minorOrbs.semisextile) {
          aspects.push({ planet1, planet2, type: 'semisextile', angle: normalizedAngle, orb: Math.abs(normalizedAngle - 30), major: false });
        } else if (Math.abs(normalizedAngle - 45) < minorOrbs.semisquare) {
          aspects.push({ planet1, planet2, type: 'semisquare', angle: normalizedAngle, orb: Math.abs(normalizedAngle - 45), major: false });
        } else if (Math.abs(normalizedAngle - 135) < minorOrbs.sesquisquare) {
          aspects.push({ planet1, planet2, type: 'sesquisquare', angle: normalizedAngle, orb: Math.abs(normalizedAngle - 135), major: false });
        }
      }
    }
  }

  return aspects;
}

/**
 * Calculate retrograde status for planets
 */
function calculateRetrogrades(chart, datetime) {
  const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  
  for (const planetName of planets) {
    const tomorrow = new Date(datetime.getTime() + 86400000); // +1 day
    
    const todayPos = Astronomy.GeoVector(planetName, datetime, true);
    const tomorrowPos = Astronomy.GeoVector(planetName, tomorrow, true);
    
    const todayEcl = Astronomy.Ecliptic(todayPos);
    const tomorrowEcl = Astronomy.Ecliptic(tomorrowPos);
    
    // If tomorrow's longitude is less than today's, planet is retrograde
    let diff = tomorrowEcl.elon - todayEcl.elon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    chart[planetName.toLowerCase()].retrograde = diff < 0;
  }
}

/**
 * Calculate Lunar Nodes (North and South)
 */
function calculateLunarNodes(datetime) {
  // Moon's nodes regress about 19.3° per year
  // Simplified calculation based on epoch
  const epoch = new Date('2000-01-01T12:00:00Z');
  const daysSinceEpoch = (datetime - epoch) / (1000 * 60 * 60 * 24);
  const yearsSinceEpoch = daysSinceEpoch / 365.25;
  
  // North Node at epoch was approximately 125° (Leo)
  const northNodeEpoch = 125.0;
  const regressionRate = 19.3; // degrees per year
  
  let northNodeLon = northNodeEpoch - (yearsSinceEpoch * regressionRate);
  northNodeLon = ((northNodeLon % 360) + 360) % 360; // Normalize to 0-360
  
  const southNodeLon = (northNodeLon + 180) % 360;
  
  return {
    north: {
      sign: getZodiacSign(northNodeLon),
      degree: northNodeLon % 30,
      longitude: northNodeLon
    },
    south: {
      sign: getZodiacSign(southNodeLon),
      degree: southNodeLon % 30,
      longitude: southNodeLon
    }
  };
}

/**
 * Calculate Chiron position (approximation)
 */
function calculateChiron(datetime) {
  // Chiron orbit is ~50 years, highly elliptical
  // Simplified calculation
  const epoch = new Date('2000-01-01T12:00:00Z');
  const daysSinceEpoch = (datetime - epoch) / (1000 * 60 * 60 * 24);
  const yearsSinceEpoch = daysSinceEpoch / 365.25;
  
  // Chiron was at approximately 5° Sagittarius at epoch
  const chironEpoch = 245.0; // ~5° Sagittarius
  const orbitalPeriod = 50.76; // years
  const degreesPerYear = 360 / orbitalPeriod;
  
  let chironLon = chironEpoch + (yearsSinceEpoch * degreesPerYear);
  chironLon = chironLon % 360;
  
  return {
    sign: getZodiacSign(chironLon),
    degree: chironLon % 30,
    longitude: chironLon
  };
}

/**
 * Calculate element and modality distribution
 */
function calculateElementModality(chart) {
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities = { cardinal: 0, fixed: 0, mutable: 0 };
  
  const elementMap = {
    'Aries': 'fire', 'Taurus': 'earth', 'Gemini': 'air', 'Cancer': 'water',
    'Leo': 'fire', 'Virgo': 'earth', 'Libra': 'air', 'Scorpio': 'water',
    'Sagittarius': 'fire', 'Capricorn': 'earth', 'Aquarius': 'air', 'Pisces': 'water'
  };
  
  const modalityMap = {
    'Aries': 'cardinal', 'Taurus': 'fixed', 'Gemini': 'mutable', 'Cancer': 'cardinal',
    'Leo': 'fixed', 'Virgo': 'mutable', 'Libra': 'cardinal', 'Scorpio': 'fixed',
    'Sagittarius': 'mutable', 'Capricorn': 'cardinal', 'Aquarius': 'fixed', 'Pisces': 'mutable'
  };
  
  const mainPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  
  for (const planet of mainPlanets) {
    if (chart[planet]?.sign) {
      const sign = chart[planet].sign;
      elements[elementMap[sign]]++;
      modalities[modalityMap[sign]]++;
    }
  }
  
  return { elements, modalities };
}

/**
 * Calculate Part of Fortune
 * Formula: Ascendant + Moon - Sun (for day births)
 */
function calculatePartOfFortune(chart, houses) {
  if (!houses[1] || !chart.sun || !chart.moon) return null;
  
  const ascLon = houses[1].longitude || 0;
  const sunLon = chart.sun.longitude;
  const moonLon = chart.moon.longitude;
  
  let pofLon = ascLon + moonLon - sunLon;
  pofLon = ((pofLon % 360) + 360) % 360;
  
  return {
    sign: getZodiacSign(pofLon),
    degree: pofLon % 30,
    longitude: pofLon
  };
}

/**
 * Get chart ruler based on Ascendant sign
 */
function getChartRuler(ascendantSign) {
  const rulers = {
    'Aries': 'Mars',
    'Taurus': 'Venus',
    'Gemini': 'Mercury',
    'Cancer': 'Moon',
    'Leo': 'Sun',
    'Virgo': 'Mercury',
    'Libra': 'Venus',
    'Scorpio': 'Pluto',
    'Sagittarius': 'Jupiter',
    'Capricorn': 'Saturn',
    'Aquarius': 'Uranus',
    'Pisces': 'Neptune'
  };
  
  return rulers[ascendantSign] || 'Unknown';
}

/**
 * Calculate planetary dignities (domicile, exaltation, detriment, fall)
 */
function calculateDignities(chart) {
  const dignities = {};
  
  const domicile = {
    'Aries': 'mars', 'Taurus': 'venus', 'Gemini': 'mercury', 'Cancer': 'moon',
    'Leo': 'sun', 'Virgo': 'mercury', 'Libra': 'venus', 'Scorpio': 'pluto',
    'Sagittarius': 'jupiter', 'Capricorn': 'saturn', 'Aquarius': 'uranus', 'Pisces': 'neptune'
  };
  
  const exaltation = {
    'Aries': 'sun', 'Taurus': 'moon', 'Cancer': 'jupiter', 'Virgo': 'mercury',
    'Libra': 'saturn', 'Capricorn': 'mars', 'Pisces': 'venus'
  };
  
  const detriment = {
    'Aries': 'venus', 'Taurus': 'mars', 'Gemini': 'jupiter', 'Cancer': 'saturn',
    'Leo': 'uranus', 'Virgo': 'neptune', 'Libra': 'mars', 'Scorpio': 'venus',
    'Sagittarius': 'mercury', 'Capricorn': 'moon', 'Aquarius': 'sun', 'Pisces': 'mercury'
  };
  
  const fall = {
    'Aries': 'saturn', 'Taurus': 'uranus', 'Cancer': 'mars', 'Virgo': 'venus',
    'Libra': 'sun', 'Capricorn': 'jupiter', 'Pisces': 'mercury'
  };
  
  for (const [planet, data] of Object.entries(chart)) {
    if (!data?.sign) continue;
    const sign = data.sign;
    
    if (domicile[sign] === planet.toLowerCase()) {
      dignities[planet] = 'domicile'; // At home - strongest
    } else if (exaltation[sign] === planet.toLowerCase()) {
      dignities[planet] = 'exaltation'; // Empowered
    } else if (detriment[sign] === planet.toLowerCase()) {
      dignities[planet] = 'detriment'; // Challenged
    } else if (fall[sign] === planet.toLowerCase()) {
      dignities[planet] = 'fall'; // Weakened
    }
  }
  
  return dignities;
}

/**
 * Calculate Moon phase at birth
 */
function calculateMoonPhase(chart) {
  if (!chart.sun || !chart.moon) return null;
  
  const sunLon = chart.sun.longitude;
  const moonLon = chart.moon.longitude;
  
  let phase = moonLon - sunLon;
  if (phase < 0) phase += 360;
  
  // Determine phase name
  let phaseName, phaseEmoji;
  if (phase < 45) {
    phaseName = 'New Moon';
    phaseEmoji = '🌑';
  } else if (phase < 90) {
    phaseName = 'Waxing Crescent';
    phaseEmoji = '🌒';
  } else if (phase < 135) {
    phaseName = 'First Quarter';
    phaseEmoji = '🌓';
  } else if (phase < 180) {
    phaseName = 'Waxing Gibbous';
    phaseEmoji = '🌔';
  } else if (phase < 225) {
    phaseName = 'Full Moon';
    phaseEmoji = '🌕';
  } else if (phase < 270) {
    phaseName = 'Waning Gibbous';
    phaseEmoji = '🌖';
  } else if (phase < 315) {
    phaseName = 'Last Quarter';
    phaseEmoji = '🌗';
  } else {
    phaseName = 'Waning Crescent';
    phaseEmoji = '🌘';
  }
  
  return {
    angle: phase,
    name: phaseName,
    emoji: phaseEmoji
  };
}

/**
 * Detect major chart patterns
 */
function detectChartPatterns(chart, aspects) {
  const patterns = [];
  const planets = Object.keys(chart).filter(p => !['northnode', 'southnode', 'chiron'].includes(p.toLowerCase()));
  
  // Find trines (120° aspects)
  const trines = aspects.filter(a => a.type === 'trine');
  
  // Grand Trine: 3 planets each trine to the other two
  for (let i = 0; i < trines.length; i++) {
    for (let j = i + 1; j < trines.length; j++) {
      for (let k = j + 1; k < trines.length; k++) {
        const t1 = trines[i], t2 = trines[j], t3 = trines[k];
        const planets1 = [t1.planet1, t1.planet2];
        const planets2 = [t2.planet1, t2.planet2];
        const planets3 = [t3.planet1, t3.planet2];
        
        const allPlanets = [...new Set([...planets1, ...planets2, ...planets3])];
        if (allPlanets.length === 3) {
          const element = chart[allPlanets[0]].sign ? getElement(chart[allPlanets[0]].sign) : 'unknown';
          patterns.push({
            type: 'Grand Trine',
            planets: allPlanets,
            element,
            description: `Easy flow of ${element} energy between ${allPlanets.join(', ')}`
          });
        }
      }
    }
  }
  
  // T-Square: 2 planets in opposition, both square a third
  const oppositions = aspects.filter(a => a.type === 'opposition');
  const squares = aspects.filter(a => a.type === 'square');
  
  for (const opp of oppositions) {
    for (const sq1 of squares) {
      for (const sq2 of squares) {
        if (sq1 === sq2) continue;
        const oppPlanets = [opp.planet1, opp.planet2];
        const sq1Planets = [sq1.planet1, sq1.planet2];
        const sq2Planets = [sq2.planet1, sq2.planet2];
        
        const apex = sq1Planets.find(p => sq2Planets.includes(p));
        if (!apex) continue;
        
        const hasOpp1 = oppPlanets.includes(sq1Planets.find(p => p !== apex));
        const hasOpp2 = oppPlanets.includes(sq2Planets.find(p => p !== apex));
        
        if (hasOpp1 && hasOpp2) {
          patterns.push({
            type: 'T-Square',
            planets: [...oppPlanets, apex],
            apex,
            description: `Dynamic tension focused through ${apex}`
          });
          break;
        }
      }
    }
  }
  
  // Stellium: 3+ planets in same sign
  const signGroups = {};
  for (const planet of planets) {
    const sign = chart[planet]?.sign;
    if (!sign) continue;
    if (!signGroups[sign]) signGroups[sign] = [];
    signGroups[sign].push(planet);
  }
  
  for (const [sign, planetsInSign] of Object.entries(signGroups)) {
    if (planetsInSign.length >= 3) {
      patterns.push({
        type: 'Stellium',
        planets: planetsInSign,
        sign,
        description: `${planetsInSign.length} planets concentrated in ${sign}`
      });
    }
  }
  
  // Yod (Finger of God): 2 planets sextile each other, both quincunx a third
  const sextiles = aspects.filter(a => a.type === 'sextile');
  const quincunxes = aspects.filter(a => a.type === 'quincunx');
  
  for (const sext of sextiles) {
    for (const q1 of quincunxes) {
      for (const q2 of quincunxes) {
        if (q1 === q2) continue;
        const sextPlanets = [sext.planet1, sext.planet2];
        const q1Planets = [q1.planet1, q1.planet2];
        const q2Planets = [q2.planet1, q2.planet2];
        
        const apex = q1Planets.find(p => q2Planets.includes(p));
        if (!apex) continue;
        
        const hasSext1 = sextPlanets.includes(q1Planets.find(p => p !== apex));
        const hasSext2 = sextPlanets.includes(q2Planets.find(p => p !== apex));
        
        if (hasSext1 && hasSext2) {
          patterns.push({
            type: 'Yod',
            planets: [...sextPlanets, apex],
            apex,
            description: `Karmic destiny point at ${apex}`
          });
          break;
        }
      }
    }
  }
  
  return patterns;
}

/**
 * Get element of a zodiac sign
 */
function getElement(sign) {
  const elements = {
    'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
    'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
    'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
    'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water'
  };
  return elements[sign] || 'unknown';
}

/**
 * Assign planets to houses
 */
export function assignPlanetsToHouses(chart, houses) {
  const planetHouses = {};
  
  // Get house cusps with longitudes
  const houseCusps = [];
  for (let i = 1; i <= 12; i++) {
    if (houses[i]?.longitude !== undefined) {
      houseCusps.push({ house: i, longitude: houses[i].longitude });
    }
  }
  
  if (houseCusps.length === 0) {
    console.warn('[assignPlanetsToHouses] No house cusps found');
    return planetHouses;
  }
  
  // Sort by longitude
  houseCusps.sort((a, b) => a.longitude - b.longitude);
  
  // Assign each planet to a house
  for (const [planet, data] of Object.entries(chart)) {
    // Skip if no data or no longitude
    if (!data || typeof data !== 'object' || data.longitude === undefined || data.longitude === null) {
      continue;
    }
    
    const planetLon = data.longitude;
    
    // Find which house cusp the planet is after
    let house = null;
    for (let i = 0; i < houseCusps.length; i++) {
      const nextIndex = (i + 1) % houseCusps.length;
      const cuspLon = houseCusps[i].longitude;
      const nextLon = houseCusps[nextIndex].longitude;
      
      if (nextLon > cuspLon) {
        if (planetLon >= cuspLon && planetLon < nextLon) {
          house = houseCusps[i].house;
          break;
        }
      } else {
        // Wraps around 0°
        if (planetLon >= cuspLon || planetLon < nextLon) {
          house = houseCusps[i].house;
          break;
        }
      }
    }
    
    // Only assign if house was found
    if (house !== null) {
      planetHouses[planet] = house;
      // Also store with lowercase key for nodes (northNode -> northnode)
      if (planet === 'northNode') {
        planetHouses['northnode'] = house;
      } else if (planet === 'southNode') {
        planetHouses['southnode'] = house;
      }
    } else {
      // CRITICAL: For North Node and South Node, throw error if house cannot be determined
      // These are essential for karmic readings and must have house placements
      if (planet === 'northNode' || planet === 'southNode') {
        throw new Error(
          `[assignPlanetsToHouses] CRITICAL: Could not assign house for ${planet} at longitude ${planetLon}. ` +
          `This is required for accurate chart interpretation. Check house calculation logic.`
        );
      }
      // For other planets, log warning but continue
      console.warn(`[assignPlanetsToHouses] Could not assign house for ${planet} at longitude ${planetLon}`);
    }
  }
  
  return planetHouses;
}

/**
 * Build Planet-Sign-House Combinations for premium reporting
 * Returns: "Venus in Taurus in the 7th House"
 */
export function buildPlanetSignHouseCombinations(chart, planetHouses) {
  const combinations = [];
  const planetNames = {
    'sun': 'Sun', 'moon': 'Moon', 'mercury': 'Mercury', 'venus': 'Venus',
    'mars': 'Mars', 'jupiter': 'Jupiter', 'saturn': 'Saturn', 'uranus': 'Uranus',
    'neptune': 'Neptune', 'pluto': 'Pluto', 'northnode': 'North Node',
    'southnode': 'South Node', 'chiron': 'Chiron'
  };
  
  for (const [planetKey, planetData] of Object.entries(chart)) {
    if (!planetData || !planetData.sign) continue;
    
    const planetName = planetNames[planetKey.toLowerCase()] || planetKey.charAt(0).toUpperCase() + planetKey.slice(1);
    const sign = planetData.sign;
    // Try multiple key variations for nodes
    const house = planetHouses[planetKey] || 
                  planetHouses[planetKey.toLowerCase()] || 
                  planetHouses[planetName.toLowerCase()] ||
                  (planetKey === 'northNode' ? planetHouses['northnode'] : null) ||
                  (planetKey === 'southNode' ? planetHouses['southnode'] : null);
    
    if (house) {
      const houseName = formatOrdinal(house);
      const degree = Math.floor(planetData.degree);
      combinations.push({
        planet: planetName,
        sign: sign,
        house: house,
        houseName: houseName,
        degree: degree,
        description: `${planetName} in ${sign} in the ${houseName}`,
        fullDescription: `${planetName} in ${sign} at ${degree}° in the ${houseName}`
      });
    }
  }
  
  return combinations;
}

/**
 * Build detailed house cusps with degrees
 * Returns: "2nd House Cusp at 12° Capricorn"
 */
function buildHouseCuspsDetailed(houses) {
  const cusps = [];
  const houseNames = {
    1: '1st House (Ascendant)', 2: '2nd House', 3: '3rd House', 4: '4th House (IC)',
    5: '5th House', 6: '6th House', 7: '7th House (Descendant)', 8: '8th House',
    9: '9th House', 10: '10th House (Midheaven)', 11: '11th House', 12: '12th House'
  };
  
  for (let i = 1; i <= 12; i++) {
    if (houses[i] && houses[i].longitude !== undefined) {
      const degree = Math.floor(houses[i].longitude % 30);
      const minutes = Math.floor((houses[i].longitude % 30 - degree) * 60);
      const sign = houses[i].sign;
      const houseName = houseNames[i] || formatOrdinal(i);
      
      cusps.push({
        house: i,
        houseName: houseName,
        sign: sign,
        degree: degree,
        minutes: minutes,
        longitude: houses[i].longitude,
        description: `${houseName} Cusp at ${degree}°${minutes > 0 ? ` ${minutes}'` : ''} ${sign}`,
        fullDescription: `${houseName} Cusp at ${degree}°${minutes > 0 ? ` ${minutes}'` : ''} ${sign} (${houses[i].longitude.toFixed(2)}°)`
      });
    }
  }
  
  return cusps;
}

/**
 * Get chart ruler location (which house the chart ruler planet is in)
 * Returns: "Mercury (Gemini Sun's ruler) in the 8th House"
 */
function getChartRulerLocation(chartRuler, chart, planetHouses) {
  if (!chartRuler || chartRuler === 'Unknown') return null;
  
  const rulerKey = chartRuler.toLowerCase();
  const rulerPlanet = chart[rulerKey];
  const rulerHouse = planetHouses[rulerKey];
  
  if (!rulerPlanet || !rulerHouse) return null;
  
  const houseName = formatOrdinal(rulerHouse);
  
  return {
    planet: chartRuler,
    sign: rulerPlanet.sign,
    house: rulerHouse,
    houseName: houseName,
    degree: Math.floor(rulerPlanet.degree),
    description: `${chartRuler} in ${rulerPlanet.sign} in the ${houseName}`,
    fullDescription: `${chartRuler} (${chartRuler} as chart ruler) in ${rulerPlanet.sign} at ${Math.floor(rulerPlanet.degree)}° in the ${houseName}`
  };
}

/**
 * Format major natal aspects with orb
 * Returns: "Sun Square Saturn (Orb 1° 30')"
 */
function formatMajorAspects(aspects) {
  if (!Array.isArray(aspects)) return [];
  
  const majorAspects = aspects
    .filter(aspect => {
      // Include only major aspects (conjunction, opposition, trine, square, sextile)
      const majorTypes = ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'];
      return majorTypes.includes(aspect.type);
    })
    .map(aspect => {
      const orbDegrees = Math.floor(aspect.orb);
      const orbMinutes = Math.floor((aspect.orb - orbDegrees) * 60);
      
      let orbDescription = '';
      if (orbDegrees > 0 && orbMinutes > 0) {
        orbDescription = `${orbDegrees}° ${orbMinutes}'`;
      } else if (orbDegrees > 0) {
        orbDescription = `${orbDegrees}°`;
      } else if (orbMinutes > 0) {
        orbDescription = `${orbMinutes}'`;
      } else {
        orbDescription = `${aspect.orb.toFixed(1)}°`;
      }
      
      return {
        planet1: aspect.planet1,
        planet2: aspect.planet2,
        type: aspect.type,
        orb: aspect.orb,
        orbDescription: orbDescription,
        description: `${aspect.planet1} ${aspect.type} ${aspect.planet2} (Orb ${orbDescription})`,
        fullDescription: `${aspect.planet1} ${aspect.type} ${aspect.planet2} (Orb ${orbDescription})`
      };
    })
    .sort((a, b) => {
      // Sort by orb (tighter orbs first)
      return a.orb - b.orb;
    });
  
  return majorAspects;
}

/**
 * Calculate midpoints (e.g., "Sun/Moon Conjunct Ascendant")
 * Midpoints are calculated as (Planet1 + Planet2) / 2
 */
function calculateMidpoints(chart, houses) {
  const midpoints = [];
  const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  
  // Calculate planet-to-planet midpoints
  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planet1 = chart[planetNames[i]];
      const planet2 = chart[planetNames[j]];
      
      if (!planet1 || !planet2 || !planet1.longitude || !planet2.longitude) continue;
      
      let midpointLon = (planet1.longitude + planet2.longitude) / 2;
      if (Math.abs(planet1.longitude - planet2.longitude) > 180) {
        // Handle wrap-around
        midpointLon = (midpointLon + 180) % 360;
      }
      
      const midpointSign = getZodiacSign(midpointLon);
      const midpointDegree = midpointLon % 30;
      
      // Check if midpoint aspects important points (Ascendant, Midheaven, etc.)
      const ascendantLon = houses[1]?.longitude || 0;
      const midheavenLon = houses[10]?.longitude || 0;
      
      // Check aspect to Ascendant
      const orbToAsc = Math.abs(midpointLon - ascendantLon);
      const orbToAscNormalized = Math.min(orbToAsc, 360 - orbToAsc);
      if (orbToAscNormalized <= 8) { // 8° orb for midpoints
        midpoints.push({
          midpoint: `${planetNames[i].charAt(0).toUpperCase() + planetNames[i].slice(1)}/${planetNames[j].charAt(0).toUpperCase() + planetNames[j].slice(1)}`,
          point: 'Ascendant',
          aspect: getAspectTypeForMidpoint(orbToAscNormalized),
          orb: orbToAscNormalized,
          sign: midpointSign,
          degree: Math.floor(midpointDegree),
          description: `${planetNames[i].charAt(0).toUpperCase() + planetNames[i].slice(1)}/${planetNames[j].charAt(0).toUpperCase() + planetNames[j].slice(1)} ${getAspectTypeForMidpoint(orbToAscNormalized)} Ascendant`,
          fullDescription: `${planetNames[i].charAt(0).toUpperCase() + planetNames[i].slice(1)}/${planetNames[j].charAt(0).toUpperCase() + planetNames[j].slice(1)} (${midpointSign} ${Math.floor(midpointDegree)}°) ${getAspectTypeForMidpoint(orbToAscNormalized)} Ascendant (Orb ${orbToAscNormalized.toFixed(1)}°)`
        });
      }
      
      // Check aspect to Midheaven
      const orbToMC = Math.abs(midpointLon - midheavenLon);
      const orbToMCNormalized = Math.min(orbToMC, 360 - orbToMC);
      if (orbToMCNormalized <= 8) {
        midpoints.push({
          midpoint: `${planetNames[i].charAt(0).toUpperCase() + planetNames[i].slice(1)}/${planetNames[j].charAt(0).toUpperCase() + planetNames[j].slice(1)}`,
          point: 'Midheaven',
          aspect: getAspectTypeForMidpoint(orbToMCNormalized),
          orb: orbToMCNormalized,
          sign: midpointSign,
          degree: Math.floor(midpointDegree),
          description: `${planetNames[i].charAt(0).toUpperCase() + planetNames[i].slice(1)}/${planetNames[j].charAt(0).toUpperCase() + planetNames[j].slice(1)} ${getAspectTypeForMidpoint(orbToMCNormalized)} Midheaven`,
          fullDescription: `${planetNames[i].charAt(0).toUpperCase() + planetNames[i].slice(1)}/${planetNames[j].charAt(0).toUpperCase() + planetNames[j].slice(1)} (${midpointSign} ${Math.floor(midpointDegree)}°) ${getAspectTypeForMidpoint(orbToMCNormalized)} Midheaven (Orb ${orbToMCNormalized.toFixed(1)}°)`
        });
      }
    }
  }
  
  // Sun/Moon midpoint (most important)
  if (chart.sun && chart.moon) {
    let sunMoonMidpoint = (chart.sun.longitude + chart.moon.longitude) / 2;
    if (Math.abs(chart.sun.longitude - chart.moon.longitude) > 180) {
      sunMoonMidpoint = (sunMoonMidpoint + 180) % 360;
    }
    const smSign = getZodiacSign(sunMoonMidpoint);
    const smDegree = sunMoonMidpoint % 30;
    
    // Check aspect to Ascendant
    const ascLon = houses[1]?.longitude || 0;
    const orbToAsc = Math.min(Math.abs(sunMoonMidpoint - ascLon), 360 - Math.abs(sunMoonMidpoint - ascLon));
    if (orbToAsc <= 8) {
      midpoints.push({
        midpoint: 'Sun/Moon',
        point: 'Ascendant',
        aspect: getAspectTypeForMidpoint(orbToAsc),
        orb: orbToAsc,
        sign: smSign,
        degree: Math.floor(smDegree),
        description: `Sun/Moon ${getAspectTypeForMidpoint(orbToAsc)} Ascendant`,
        fullDescription: `Sun/Moon (${smSign} ${Math.floor(smDegree)}°) ${getAspectTypeForMidpoint(orbToAsc)} Ascendant (Orb ${orbToAsc.toFixed(1)}°)`
      });
    }
  }
  
  return midpoints;
}

/**
 * Get aspect type based on orb (for midpoints)
 */
function getAspectTypeForMidpoint(orb) {
  if (orb <= 1) return 'Conjunct';
  if (orb <= 2) return 'Semi-Sextile';
  if (orb <= 3) return 'Sextile';
  if (orb <= 4) return 'Square';
  if (orb <= 5) return 'Trine';
  if (orb <= 6) return 'Opposition';
  return 'Conjunct'; // Default
}

export async function interpretBirthChart(chart) {
  // Import OpenAI client
  const OpenAI = require('openai').default;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = `Generate a birth chart interpretation based on these placements:

**Sun:** ${chart.planets.sun?.sign || 'Unknown'}
**Moon:** ${chart.planets.moon?.sign || 'Unknown'}
**Rising (Ascendant):** ${chart.ascendant}
**Mercury:** ${chart.planets.mercury?.sign || 'Unknown'}
**Venus:** ${chart.planets.venus?.sign || 'Unknown'}
**Mars:** ${chart.planets.mars?.sign || 'Unknown'}
**Chart Ruler:** ${chart.chartRuler || 'Unknown'}
**North Node:** ${chart.planets.northNode?.sign || 'Unknown'}

Major aspects:
${chart.aspects?.slice(0, 5).map(a => `${a.planet1}-${a.planet2}: ${a.type}`).join('\n') || 'No major aspects'}

Create a comprehensive interpretation with these sections:

**Core Identity** (Sun sign - 3 sentences)
**Emotional Nature** (Moon sign - 3 sentences)
**How You Appear** (Rising sign - 2 sentences)
**Communication Style** (Mercury - 2 sentences)
**Love Language** (Venus - 2 sentences)
**Drive & Passion** (Mars - 2 sentences)
**Life Purpose** (North Node - 2 sentences)
**Key Patterns** (2-3 aspects - 3 sentences)

Style:
- Insightful and personal
- Empowering, never limiting
- Specific but not fortune-telling
- Professional yet warm
- Total: 500-600 words`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.8
  });

  return completion.choices[0].message.content;
}
