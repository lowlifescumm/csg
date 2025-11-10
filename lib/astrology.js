import * as Astronomy from 'astronomy-engine';

/**
 * Calculates a natal (birth) chart using astronomical data.
 * @param {string} birthDate - The user's birth date in YYYY-MM-DD format.
 * @param {string} birthTime - The user's birth time in HH:MM format (24-hour).
 * @param {number} latitude - The latitude of the birthplace.
 * @param {number} longitude - The longitude of the birthplace.
 * @returns {object} An object containing detailed astrological information.
 * @property {object} planets - Positions of celestial bodies.
 * @property {object} houses - The twelve astrological houses.
 * @property {Array<object>} aspects - Significant angles between planets.
 * @property {string} ascendant - The rising sign.
 * @property {string} midheaven - The Midheaven sign (MC).
 * @property {object} distribution - Element and modality balance.
 * @property {object} partOfFortune - Calculated Part of Fortune.
 * @property {string} chartRuler - The ruling planet of the chart.
 * @property {object} dignities - Planetary dignities and debilities.
 * @property {object} moonPhase - The phase of the moon at birth.
 * @property {Array<object>} chartPatterns - Major chart patterns like Grand Trines.
 * @property {object} planetHouses - Which house each planet falls into.
 */
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
      retrograde: false
    };
  }

  calculateRetrogrades(chart, datetime);

  const nodes = calculateLunarNodes(datetime);
  chart.northNode = nodes.north;
  chart.southNode = nodes.south;

  chart.chiron = calculateChiron(datetime);

  const houses = calculateHouses(datetime, latitude, longitude);
  const aspects = calculateAspects(chart, true);

  const distribution = calculateElementModality(chart);
  
  const partOfFortune = calculatePartOfFortune(chart, houses);
  
  const chartRuler = getChartRuler(houses[1].sign);
  
  const dignities = calculateDignities(chart);
  
  const moonPhase = calculateMoonPhase(chart);
  
  const chartPatterns = detectChartPatterns(chart, aspects);
  
  const planetHouses = assignPlanetsToHouses(chart, houses);

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
    planetHouses
  };
}

/**
 * Determines the zodiac sign for a given ecliptic longitude.
 * @param {number} longitude - The ecliptic longitude in degrees.
 * @returns {string} The corresponding zodiac sign.
 */
function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[Math.floor(longitude / 30) % 12];
}

/**
 * Calculates the twelve astrological houses.
 * @param {Date} datetime - The date and time of the event.
 * @param {number} latitude - The latitude of the location.
 * @param {number} longitude - The longitude of the location.
 * @returns {object} An object with house cusps and their longitudes.
 */
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
    longitude: ascendantLongitude
  };
  houses[10] = {
    sign: getZodiacSign(mcLongitude),
    longitude: mcLongitude
  };
  
  for (let i = 2; i <= 12; i++) {
    if (i !== 10) {
      const houseCusp = (ascendantLongitude + (i - 1) * 30) % 360;
      houses[i] = {
        sign: getZodiacSign(houseCusp),
        longitude: houseCusp
      };
    }
  }
  
  return houses;
}

/**
 * Calculates the aspects (angles) between planets.
 * @param {object} chart - The birth chart object with planet positions.
 * @param {boolean} [includeMinor=true] - Whether to include minor aspects.
 * @returns {Array<object>} A list of aspects found in the chart.
 */
function calculateAspects(chart, includeMinor = true) {
  const aspects = [];
  const planets = Object.keys(chart);
  
  const majorOrbs = {
    conjunction: 8,
    opposition: 8,
    trine: 8,
    square: 7,
    sextile: 6
  };
  
  const minorOrbs = {
    quincunx: 3,
    semisextile: 3,
    semisquare: 2,
    sesquisquare: 2
  };

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      const angle = Math.abs(chart[planet1].longitude - chart[planet2].longitude);
      const normalizedAngle = angle > 180 ? 360 - angle : angle;

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
 * Calculates retrograde status for each planet in the chart.
 * @param {object} chart - The birth chart object.
 * @param {Date} datetime - The birth date and time.
 */
function calculateRetrogrades(chart, datetime) {
  const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  
  for (const planetName of planets) {
    const tomorrow = new Date(datetime.getTime() + 86400000);
    
    const todayPos = Astronomy.GeoVector(planetName, datetime, true);
    const tomorrowPos = Astronomy.GeoVector(planetName, tomorrow, true);
    
    const todayEcl = Astronomy.Ecliptic(todayPos);
    const tomorrowEcl = Astronomy.Ecliptic(tomorrowPos);
    
    let diff = tomorrowEcl.elon - todayEcl.elon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    chart[planetName.toLowerCase()].retrograde = diff < 0;
  }
}

/**
 * Calculates the positions of the North and South Lunar Nodes.
 * @param {Date} datetime - The birth date and time.
 * @returns {object} The positions of the North and South Nodes.
 */
function calculateLunarNodes(datetime) {
  const epoch = new Date('2000-01-01T12:00:00Z');
  const daysSinceEpoch = (datetime - epoch) / (1000 * 60 * 60 * 24);
  const yearsSinceEpoch = daysSinceEpoch / 365.25;
  
  const northNodeEpoch = 125.0;
  const regressionRate = 19.3;
  
  let northNodeLon = northNodeEpoch - (yearsSinceEpoch * regressionRate);
  northNodeLon = ((northNodeLon % 360) + 360) % 360;
  
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
 * Calculates the approximate position of Chiron.
 * @param {Date} datetime - The birth date and time.
 * @returns {object} The position of Chiron.
 */
function calculateChiron(datetime) {
  const epoch = new Date('2000-01-01T12:00:00Z');
  const daysSinceEpoch = (datetime - epoch) / (1000 * 60 * 60 * 24);
  const yearsSinceEpoch = daysSinceEpoch / 365.25;
  
  const chironEpoch = 245.0;
  const orbitalPeriod = 50.76;
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
 * Calculates the distribution of elements and modalities in the chart.
 * @param {object} chart - The birth chart object.
 * @returns {object} The distribution of elements and modalities.
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
 * Calculates the Part of Fortune.
 * @param {object} chart - The birth chart object.
 * @param {object} houses - The houses of the chart.
 * @returns {object|null} The position of the Part of Fortune, or null if data is missing.
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
 * Determines the chart ruler based on the Ascendant sign.
 * @param {string} ascendantSign - The Ascendant sign.
 * @returns {string} The name of the ruling planet.
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
 * Calculates planetary dignities (domicile, exaltation, detriment, fall).
 * @param {object} chart - The birth chart object.
 * @returns {object} An object with dignities for each planet.
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
      dignities[planet] = 'domicile';
    } else if (exaltation[sign] === planet.toLowerCase()) {
      dignities[planet] = 'exaltation';
    } else if (detriment[sign] === planet.toLowerCase()) {
      dignities[planet] = 'detriment';
    } else if (fall[sign] === planet.toLowerCase()) {
      dignities[planet] = 'fall';
    }
  }
  
  return dignities;
}

/**
 * Calculates the moon phase at the time of birth.
 * @param {object} chart - The birth chart object.
 * @returns {object|null} The moon phase information, or null if data is missing.
 */
function calculateMoonPhase(chart) {
  if (!chart.sun || !chart.moon) return null;
  
  const sunLon = chart.sun.longitude;
  const moonLon = chart.moon.longitude;
  
  let phase = moonLon - sunLon;
  if (phase < 0) phase += 360;
  
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
 * Detects major astrological chart patterns.
 * @param {object} chart - The birth chart object.
 * @param {Array<object>} aspects - The aspects in the chart.
 * @returns {Array<object>} A list of detected chart patterns.
 */
function detectChartPatterns(chart, aspects) {
  const patterns = [];
  const planets = Object.keys(chart).filter(p => !['northnode', 'southnode', 'chiron'].includes(p.toLowerCase()));
  
  const trines = aspects.filter(a => a.type === 'trine');
  
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
 * Gets the element (fire, earth, air, water) of a zodiac sign.
 * @param {string} sign - The zodiac sign.
 * @returns {string} The element of the sign.
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
 * Assigns each planet in the chart to an astrological house.
 * @param {object} chart - The birth chart object.
 * @param {object} houses - The houses of the chart.
 * @returns {object} An object mapping planets to their house numbers.
 */
function assignPlanetsToHouses(chart, houses) {
  const planetHouses = {};
  
  const houseCusps = [];
  for (let i = 1; i <= 12; i++) {
    if (houses[i]?.longitude !== undefined) {
      houseCusps.push({ house: i, longitude: houses[i].longitude });
    }
  }
  
  houseCusps.sort((a, b) => a.longitude - b.longitude);
  
  for (const [planet, data] of Object.entries(chart)) {
    if (!data?.longitude) continue;
    const planetLon = data.longitude;
    
    let house = 1;
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
        if (planetLon >= cuspLon || planetLon < nextLon) {
          house = houseCusps[i].house;
          break;
        }
      }
    }
    
    planetHouses[planet] = house;
  }
  
  return planetHouses;
}

/**
 * Generates an AI-powered interpretation of a birth chart.
 * @param {object} chart - The calculated birth chart object.
 * @returns {Promise<string>} A textual interpretation of the birth chart.
 */
export async function interpretBirthChart(chart) {
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
