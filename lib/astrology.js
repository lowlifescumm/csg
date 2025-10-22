import * as Astronomy from 'astronomy-engine';

export function calculateBirthChart(birthDate, birthTime, latitude, longitude) {
  const [hours, minutes] = birthTime.split(':').map(Number);
  const datetime = new Date(birthDate);
  datetime.setHours(hours, minutes, 0, 0);

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
  const aspects = calculateAspects(chart);

  // Calculate element and modality distribution
  const distribution = calculateElementModality(chart);
  
  // Calculate Part of Fortune
  const partOfFortune = calculatePartOfFortune(chart, houses);
  
  // Determine chart ruler
  const chartRuler = getChartRuler(houses[1]);

  return {
    planets: chart,
    houses,
    aspects,
    ascendant: houses[1],
    midheaven: houses[10],
    distribution,
    partOfFortune,
    chartRuler
  };
}

function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[Math.floor(longitude / 30) % 12];
}


function calculateHouses(datetime, latitude, longitude) {
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  
  const sunVec = Astronomy.GeoVector('Sun', datetime, true);
  const sunEcl = Astronomy.Ecliptic(sunVec);
  const sunLongitude = sunEcl.elon;
  
  const ascendantLongitude = (sunLongitude + 90) % 360;
  const mcLongitude = sunLongitude;
  
  const houses = {};
  houses[1] = getZodiacSign(ascendantLongitude);
  houses[10] = getZodiacSign(mcLongitude);
  
  for (let i = 2; i <= 12; i++) {
    if (i !== 10) {
      const houseCusp = (ascendantLongitude + (i - 1) * 30) % 360;
      houses[i] = getZodiacSign(houseCusp);
    }
  }
  
  return houses;
}

function calculateAspects(chart) {
  const aspects = [];
  const planets = Object.keys(chart);
  const orbs = {
    conjunction: 8,
    opposition: 8,
    trine: 8,
    square: 7,
    sextile: 6
  };

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      const angle = Math.abs(chart[planet1].longitude - chart[planet2].longitude);
      const normalizedAngle = angle > 180 ? 360 - angle : angle;

      if (Math.abs(normalizedAngle - 0) < orbs.conjunction) {
        aspects.push({ planet1, planet2, type: 'conjunction', angle: normalizedAngle });
      } else if (Math.abs(normalizedAngle - 180) < orbs.opposition) {
        aspects.push({ planet1, planet2, type: 'opposition', angle: normalizedAngle });
      } else if (Math.abs(normalizedAngle - 120) < orbs.trine) {
        aspects.push({ planet1, planet2, type: 'trine', angle: normalizedAngle });
      } else if (Math.abs(normalizedAngle - 90) < orbs.square) {
        aspects.push({ planet1, planet2, type: 'square', angle: normalizedAngle });
      } else if (Math.abs(normalizedAngle - 60) < orbs.sextile) {
        aspects.push({ planet1, planet2, type: 'sextile', angle: normalizedAngle });
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

export async function interpretBirthChart(chart, openai) {
  const prompt = `Generate a birth chart interpretation based on these placements:

**Sun:** ${chart.planets.sun.sign}
**Moon:** ${chart.planets.moon.sign}
**Rising (Ascendant):** ${chart.ascendant}
**Mercury:** ${chart.planets.mercury.sign}
**Venus:** ${chart.planets.venus.sign}
**Mars:** ${chart.planets.mars.sign}
**Chart Ruler:** ${chart.chartRuler}
**North Node:** ${chart.planets.northNode?.sign || 'Unknown'}

Major aspects:
${chart.aspects.slice(0, 5).map(a => `${a.planet1}-${a.planet2}: ${a.type}`).join('\n')}

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
