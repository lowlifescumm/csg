// Migrated to Groq - import generateText from groq.js
import { generateText } from './groq.js';

/**
 * Calculate Inter-Aspects (Synastry) between two charts
 * Returns aspects like "User's Mars Square Partner's Saturn"
 */
export function calculateSynastryAspects(chart1, chart2, person1Name = 'Person 1', person2Name = 'Person 2') {
  const synastryAspects = [];
  const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  
  // Calculate aspects between chart1 planets and chart2 planets
  for (const planet1 of planetNames) {
    if (!chart1.planets[planet1] || !chart1.planets[planet1].longitude) continue;
    
    for (const planet2 of planetNames) {
      if (!chart2.planets[planet2] || !chart2.planets[planet2].longitude) continue;
      
      const lon1 = chart1.planets[planet1].longitude;
      const lon2 = chart2.planets[planet2].longitude;
      
      const diff = Math.abs(lon1 - lon2);
      const angle = Math.min(diff, 360 - diff);
      
      // Determine aspect type and orb
      let aspectType = null;
      let orb = angle;
      const maxOrb = 8; // Maximum orb for synastry aspects
      
      // Conjunction (0°)
      if (angle <= maxOrb) {
        aspectType = 'Conjunction';
        orb = angle;
      }
      // Opposition (180°)
      else if (Math.abs(angle - 180) <= maxOrb) {
        aspectType = 'Opposition';
        orb = Math.abs(angle - 180);
      }
      // Trine (120°)
      else if (Math.abs(angle - 120) <= maxOrb) {
        aspectType = 'Trine';
        orb = Math.abs(angle - 120);
      }
      // Square (90°)
      else if (Math.abs(angle - 90) <= maxOrb) {
        aspectType = 'Square';
        orb = Math.abs(angle - 90);
      }
      // Sextile (60°)
      else if (Math.abs(angle - 60) <= maxOrb) {
        aspectType = 'Sextile';
        orb = Math.abs(angle - 60);
      }
      
      if (aspectType) {
        const planet1Name = planet1.charAt(0).toUpperCase() + planet1.slice(1);
        const planet2Name = planet2.charAt(0).toUpperCase() + planet2.slice(1);
        
        const orbDegrees = Math.floor(orb);
        const orbMinutes = Math.floor((orb - orbDegrees) * 60);
        
        let orbDescription = '';
        if (orbDegrees > 0 && orbMinutes > 0) {
          orbDescription = `${orbDegrees}° ${orbMinutes}'`;
        } else if (orbDegrees > 0) {
          orbDescription = `${orbDegrees}°`;
        } else if (orbMinutes > 0) {
          orbDescription = `${orbMinutes}'`;
        } else {
          orbDescription = `${orb.toFixed(1)}°`;
        }
        
        synastryAspects.push({
          person1Planet: planet1Name,
          person2Planet: planet2Name,
          aspect: aspectType,
          orb: orb,
          orbDescription: orbDescription,
          description: `${person1Name}'s ${planet1Name} ${aspectType} ${person2Name}'s ${planet2Name} (Orb ${orbDescription})`,
          fullDescription: `${person1Name}'s ${planet1Name} ${aspectType} ${person2Name}'s ${planet2Name} (Orb ${orbDescription})`
        });
      }
    }
  }
  
  // Sort by orb (tighter orbs first)
  synastryAspects.sort((a, b) => a.orb - b.orb);
  
  return synastryAspects;
}

/**
 * Calculate a compatibility score based on synastry aspects
 * Conjunctions/Trines = +10, Sextiles = +5, Squares/Oppositions = -5
 * Result normalized to 0-100 (50 = neutral)
 */
export function calculateSynastryScore(chart1, chart2) {
  try {
    const aspects = calculateSynastryAspects(chart1, chart2);
    if (!aspects || aspects.length === 0) {
      return 50;
    }

    const weights = {
      Conjunction: 10,
      Trine: 10,
      Sextile: 5,
      Square: -5,
      Opposition: -5,
    };

    let total = 0;
    for (const aspect of aspects) {
      total += weights[aspect.aspect] ?? 0;
    }

    const maxPossible = aspects.length * 10;
    if (maxPossible === 0) {
      return 50;
    }

    const normalized = ((total + maxPossible) / (2 * maxPossible)) * 100;
    return Math.max(0, Math.min(100, Math.round(normalized)));
  } catch (error) {
    console.error('[calculateSynastryScore] Failed to compute score:', error);
    return 50;
  }
}

/**
 * Calculate House Overlays - which house in chart1 does each planet from chart2 fall into
 * Returns overlays like "Partner's Sun in User's 5th House"
 */
export function calculateHouseOverlays(chart1, chart2, person1Name = 'Person 1', person2Name = 'Person 2') {
  const overlays = [];
  const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  
  const houseNames = {
    1: '1st House', 2: '2nd House', 3: '3rd House', 4: '4th House',
    5: '5th House', 6: '6th House', 7: '7th House', 8: '8th House',
    9: '9th House', 10: '10th House', 11: '11th House', 12: '12th House'
  };
  
  // Get chart1 house cusps
  const houseCusps = [];
  for (let i = 1; i <= 12; i++) {
    if (chart1.houses[i]?.longitude !== undefined) {
      houseCusps.push({ house: i, longitude: chart1.houses[i].longitude });
    }
  }
  
  // Sort by longitude
  houseCusps.sort((a, b) => a.longitude - b.longitude);
  
  // For each planet in chart2, find which house in chart1 it falls into
  for (const planet of planetNames) {
    if (!chart2.planets[planet] || !chart2.planets[planet].longitude) continue;
    
    const planetLon = chart2.planets[planet].longitude;
    const planetName = planet.charAt(0).toUpperCase() + planet.slice(1);
    const planetSign = chart2.planets[planet].sign;
    
    // Find which house cusp the planet is after
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
        // Wraps around 0°
        if (planetLon >= cuspLon || planetLon < nextLon) {
          house = houseCusps[i].house;
          break;
        }
      }
    }
    
    const houseName = houseNames[house] || `${house}th House`;
    
    overlays.push({
      planet: planetName,
      planetSign: planetSign,
      house: house,
      houseName: houseName,
      description: `${person2Name}'s ${planetName} in ${person1Name}'s ${houseName}`,
      fullDescription: `${person2Name}'s ${planetName} (${planetSign}) in ${person1Name}'s ${houseName}`
    });
  }
  
  return overlays;
}

/**
 * Calculate Composite Chart - midpoint chart (average of both charts)
 * Returns composite chart data like "Composite Sun in the 1st House"
 */
export function calculateCompositeChart(chart1, chart2) {
  const composite = {
    planets: {},
    houses: {},
    planetHouses: {}
  };
  
  const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  
  // Calculate composite planets (midpoints)
  for (const planet of planetNames) {
    if (!chart1.planets[planet] || !chart1.planets[planet].longitude ||
        !chart2.planets[planet] || !chart2.planets[planet].longitude) continue;
    
    let compositeLon = (chart1.planets[planet].longitude + chart2.planets[planet].longitude) / 2;
    
    // Handle wrap-around
    if (Math.abs(chart1.planets[planet].longitude - chart2.planets[planet].longitude) > 180) {
      compositeLon = (compositeLon + 180) % 360;
    }
    
    const sign = getZodiacSign(compositeLon);
    const degree = compositeLon % 30;
    
    composite.planets[planet] = {
      sign: sign,
      degree: degree,
      longitude: compositeLon
    };
  }
  
  // Calculate composite houses (midpoint of house cusps)
  for (let i = 1; i <= 12; i++) {
    if (chart1.houses[i]?.longitude !== undefined && chart2.houses[i]?.longitude !== undefined) {
      let compositeCusp = (chart1.houses[i].longitude + chart2.houses[i].longitude) / 2;
      
      // Handle wrap-around
      if (Math.abs(chart1.houses[i].longitude - chart2.houses[i].longitude) > 180) {
        compositeCusp = (compositeCusp + 180) % 360;
      }
      
      const sign = getZodiacSign(compositeCusp);
      const degree = compositeCusp % 30;
      
      composite.houses[i] = {
        sign: sign,
        degree: degree,
        longitude: compositeCusp
      };
    }
  }
  
  // Assign composite planets to composite houses
  const houseCusps = [];
  for (let i = 1; i <= 12; i++) {
    if (composite.houses[i]?.longitude !== undefined) {
      houseCusps.push({ house: i, longitude: composite.houses[i].longitude });
    }
  }
  houseCusps.sort((a, b) => a.longitude - b.longitude);
  
  for (const [planet, data] of Object.entries(composite.planets)) {
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
    
    composite.planetHouses[planet] = house;
  }
  
  // Format composite chart data for premium reporting
  const compositeData = {
    planets: composite.planets,
    houses: composite.houses,
    planetHouses: composite.planetHouses,
    planetSignHouseCombinations: []
  };
  
  const houseNames = {
    1: '1st House', 2: '2nd House', 3: '3rd House', 4: '4th House',
    5: '5th House', 6: '6th House', 7: '7th House', 8: '8th House',
    9: '9th House', 10: '10th House', 11: '11th House', 12: '12th House'
  };
  
  for (const [planet, data] of Object.entries(composite.planets)) {
    const house = composite.planetHouses[planet];
    if (house) {
      const planetName = planet.charAt(0).toUpperCase() + planet.slice(1);
      const houseName = houseNames[house] || `${house}th House`;
      
      compositeData.planetSignHouseCombinations.push({
        planet: planetName,
        sign: data.sign,
        house: house,
        houseName: houseName,
        degree: Math.floor(data.degree),
        description: `Composite ${planetName} in ${data.sign} in the ${houseName}`,
        fullDescription: `Composite ${planetName} in ${data.sign} at ${Math.floor(data.degree)}° in the ${houseName}`
      });
    }
  }
  
  return compositeData;
}

/**
 * Helper function to get zodiac sign from longitude
 */
function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[Math.floor(longitude / 30) % 12];
}

export function calculateCompatibilityScores(chart1, chart2) {
  const scores = {
    overall: 0,
    emotional: 0,
    communication: 0,
    passion: 0,
    longTerm: 0,
    challenges: 0
  };

  if (chart1.planets.sun.sign === chart2.planets.moon.sign) {
    scores.emotional += 20;
  }
  if (chart1.planets.moon.sign === chart2.planets.sun.sign) {
    scores.emotional += 20;
  }
  
  const moon1Element = getElement(chart1.planets.moon.sign);
  const moon2Element = getElement(chart2.planets.moon.sign);
  
  if (moon1Element === moon2Element) {
    scores.emotional += 15;
  } else if (areCompatibleElements(moon1Element, moon2Element)) {
    scores.emotional += 10;
  } else {
    scores.challenges += 15;
  }

  const mercury1Element = getElement(chart1.planets.mercury.sign);
  const mercury2Element = getElement(chart2.planets.mercury.sign);
  
  if (mercury1Element === mercury2Element) {
    scores.communication += 25;
  } else if (areCompatibleElements(mercury1Element, mercury2Element)) {
    scores.communication += 15;
  } else {
    scores.challenges += 10;
  }

  if (chart1.planets.mercury.sign === chart2.planets.mercury.sign) {
    scores.communication += 10;
  }

  if (chart1.planets.venus.sign === chart2.planets.mars.sign) {
    scores.passion += 25;
  }
  if (chart1.planets.mars.sign === chart2.planets.venus.sign) {
    scores.passion += 25;
  }

  const venus1Element = getElement(chart1.planets.venus.sign);
  const venus2Element = getElement(chart2.planets.venus.sign);
  
  if (venus1Element === venus2Element) {
    scores.passion += 15;
  } else if (areCompatibleElements(venus1Element, venus2Element)) {
    scores.passion += 10;
  }

  const mars1Element = getElement(chart1.planets.mars.sign);
  const mars2Element = getElement(chart2.planets.mars.sign);
  
  if (mars1Element === mars2Element) {
    scores.passion += 10;
  } else if (!areCompatibleElements(mars1Element, mars2Element)) {
    scores.challenges += 15;
  }

  const saturn1Element = getElement(chart1.planets.saturn.sign);
  const saturn2Element = getElement(chart2.planets.saturn.sign);
  
  if (saturn1Element === saturn2Element) {
    scores.longTerm += 20;
  } else if (areCompatibleElements(saturn1Element, saturn2Element)) {
    scores.longTerm += 10;
  }

  const jupiter1Element = getElement(chart1.planets.jupiter.sign);
  const jupiter2Element = getElement(chart2.planets.jupiter.sign);
  
  if (jupiter1Element === jupiter2Element) {
    scores.longTerm += 15;
  } else if (areCompatibleElements(jupiter1Element, jupiter2Element)) {
    scores.longTerm += 10;
  }

  if (chart1.ascendant === chart2.ascendant) {
    scores.overall += 10;
  } else if (getElement(chart1.ascendant) === getElement(chart2.ascendant)) {
    scores.overall += 5;
  }

  scores.overall = Math.round(
    (scores.emotional * 0.25) +
    (scores.communication * 0.25) +
    (scores.passion * 0.25) +
    (scores.longTerm * 0.20) +
    (100 - scores.challenges) * 0.05
  );

  scores.emotional = Math.min(scores.emotional, 100);
  scores.communication = Math.min(scores.communication, 100);
  scores.passion = Math.min(scores.passion, 100);
  scores.longTerm = Math.min(scores.longTerm, 100);
  scores.overall = Math.min(scores.overall, 100);

  return scores;
}

function getElement(sign) {
  const elements = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water'
  };
  return elements[sign];
}

function areCompatibleElements(el1, el2) {
  const compatible = {
    Fire: ['Air', 'Fire'],
    Air: ['Fire', 'Air'],
    Earth: ['Water', 'Earth'],
    Water: ['Earth', 'Water']
  };
  return compatible[el1]?.includes(el2);
}

function getCompatibilityInsights(chart1, chart2, person1Name, person2Name) {
  const insights = [];

  if (chart1.planets.sun.sign === chart2.planets.sun.sign) {
    insights.push(`Both are ${chart1.planets.sun.sign} suns - you understand each other's core identity deeply, but may be too similar in some ways.`);
  }

  if (chart1.planets.moon.sign === chart2.planets.moon.sign) {
    insights.push(`Matching ${chart1.planets.moon.sign} moons - you process emotions the same way, creating natural emotional understanding.`);
  }

  if (chart1.planets.venus.sign === chart2.planets.mars.sign) {
    insights.push(`${person1Name}'s Venus matches ${person2Name}'s Mars - strong magnetic attraction.`);
  }
  if (chart2.planets.venus.sign === chart1.planets.mars.sign) {
    insights.push(`${person2Name}'s Venus matches ${person1Name}'s Mars - powerful romantic chemistry.`);
  }

  if (chart1.planets.mercury.sign === chart2.planets.mercury.sign) {
    insights.push(`Matching Mercury in ${chart1.planets.mercury.sign} - you speak the same mental language.`);
  }

  const opposites = {
    'Aries': 'Libra', 'Taurus': 'Scorpio', 'Gemini': 'Sagittarius',
    'Cancer': 'Capricorn', 'Leo': 'Aquarius', 'Virgo': 'Pisces',
    'Libra': 'Aries', 'Scorpio': 'Taurus', 'Sagittarius': 'Gemini',
    'Capricorn': 'Cancer', 'Aquarius': 'Leo', 'Pisces': 'Virgo'
  };

  if (chart1.planets.sun.sign === opposites[chart2.planets.sun.sign]) {
    insights.push(`Opposite Sun signs - you're different but complementary, like two sides of a coin.`);
  }

  return insights;
}

export async function generateCompatibilityReport(chart1, chart2, person1Name, person2Name) {
  const scores = calculateCompatibilityScores(chart1, chart2);
  const insights = getCompatibilityInsights(chart1, chart2, person1Name, person2Name);
  
  // Calculate premium data points
  const synastryAspects = calculateSynastryAspects(chart1, chart2, person1Name, person2Name);
  const houseOverlays = calculateHouseOverlays(chart1, chart2, person1Name, person2Name);
  const compositeChart = calculateCompositeChart(chart1, chart2);

  const prompt = `You are an expert astrologer. Generate a detailed relationship compatibility report for ${person1Name} and ${person2Name}.

**${person1Name}'s Chart:**
- Sun: ${chart1.planets.sun.sign}
- Moon: ${chart1.planets.moon.sign}
- Rising: ${chart1.ascendant}
- Venus: ${chart1.planets.venus.sign}
- Mars: ${chart1.planets.mars.sign}
- Mercury: ${chart1.planets.mercury.sign}

**${person2Name}'s Chart:**
- Sun: ${chart2.planets.sun.sign}
- Moon: ${chart2.planets.moon.sign}
- Rising: ${chart2.ascendant}
- Venus: ${chart2.planets.venus.sign}
- Mars: ${chart2.planets.mars.sign}
- Mercury: ${chart2.planets.mercury.sign}

**Calculated Compatibility Scores:**
- Overall: ${scores.overall}/100
- Emotional Connection: ${scores.emotional}/100
- Communication: ${scores.communication}/100
- Romantic Chemistry: ${scores.passion}/100
- Long-term Potential: ${scores.longTerm}/100
- Challenge Areas: ${scores.challenges}/100

**Key Insights:**
${insights.join('\n')}

Create a comprehensive compatibility report with these sections:

**Overall Compatibility** (3-4 sentences)
Start with the overall score and give a general assessment. Be honest but constructive. Explain what makes this pairing unique.

**Emotional Connection** (3-4 sentences)
Focus on Sun-Moon synastry and emotional understanding. How do they nurture each other? Where might they misunderstand each other emotionally?

**Communication Style** (3-4 sentences)
Based on Mercury placements. How do they express thoughts? Will they understand each other's communication? What adjustments might help?

**Romantic Chemistry** (3-4 sentences)
Venus-Mars dynamics. Physical and romantic attraction. Love languages. What draws them together?

**Strengths of This Pairing** (3 bullet points)
Be specific to their placements. What works really well?

**Potential Challenges** (3 bullet points)
Be constructive and specific. What areas need awareness and work?

**Long-Term Outlook** (3-4 sentences)
Can this relationship last? What does it need to thrive? Saturn and Jupiter considerations.

**Advice for Success** (2-3 sentences)
Practical guidance for making this relationship work.

IMPORTANT STYLE GUIDELINES:
- Be honest but kind and constructive
- Use specific astrological terms but explain them
- Don't be overly pessimistic even with low scores (every relationship can work with awareness)
- Don't be overly optimistic either - be realistic
- Make it feel personal to these specific placements
- Avoid generic advice that could apply to anyone
- Total length: 600-800 words

Write the report now:`;

  const report = await generateText(prompt, {
    systemPrompt: "You are an expert relationship astrologer with 20 years of experience. You provide insightful, balanced, and personalized compatibility readings that help people understand relationship dynamics. You are honest but constructive, never doom-and-gloom.",
    temperature: 0.7,
    max_tokens: 2000
  });

  return {
    scores,
    report,
    insights,
    timestamp: new Date().toISOString(),
    // Premium data points
    synastryAspects,
    houseOverlays,
    compositeChart
  };
}
