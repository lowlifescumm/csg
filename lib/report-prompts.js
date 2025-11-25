/**
 * Report Generation Prompts
 * Master templates for PDF report generation
 */

import { formatOrdinal } from './astrology.js';

export const SYSTEM_PROMPT = `You are a master intuitive mystic, astrologer, and spiritual advisor.

Your task is to deliver personalized, emotionally resonant, accurate-feeling spiritual insights based entirely on the user data provided.

Write with warmth, clarity, and depth.

Blend astrological logic, emotional intelligence, and actionable guidance.

Do not mention AI, software, or internal mechanics.

Do not break character.

Do not repeat the inputs; interpret them.

Write in elegant, vivid, human-sounding language with spiritual authority.`;

/**
 * Tarot Reading Prompt
 */
export function getTarotReadingPrompt(data) {
  const { name, card_spread } = data;
  
  return `${SYSTEM_PROMPT}

Generate a Tarot reading based on the card spread provided.

User: ${name}

Card Spread:
${JSON.stringify(card_spread, null, 2)}

Interpret each card with:
- Card meaning
- What it represents for the user personally
- How it influences their current path
- Specific advice tied to the card's position

End with 3 direct, actionable guidance points for the user.`;
}

/**
 * Moon Reading Prompt
 */
export function getMoonReadingPrompt(data) {
  const { name, moon_phase, phase_energy, sun_sign, moon_sign } = data;
  
  return `${SYSTEM_PROMPT}

Create a Moon Reading that explains how the current moon phase influences the user's emotions, energy, intuition, and decision-making.

User: ${name}
Moon Phase: ${moon_phase}
Phase Energy: ${phase_energy}
Sun Sign: ${sun_sign}
Moon Sign: ${moon_sign}

Include:
- The symbolic meaning of the moon phase
- How this phase interacts with their Sun and Moon signs
- Emotional tendencies to expect
- A short ritual or grounding practice`;
}

/**
 * Birth Chart (Full Natal) Prompt - Synthesis-Focused for Premium Reports
 */
export function getBirthChartPrompt(data) {
  const { 
    name, 
    sun, 
    moon, 
    rising, 
    planets, 
    houses, 
    aspects,
    // Premium data points
    planetSignHouseCombinations,
    majorAspects,
    chartRulerLocation,
    chartRuler
  } = data;
  
  // Extract Sun-Sign-House, Moon-Sign-House, Rising-Sign-House
  const sunCombination = planetSignHouseCombinations?.find(c => c.planet === 'Sun') || 
    (planets?.sun && houses ? {
      planet: 'Sun',
      sign: planets.sun.sign,
      house: getHouseForPlanet('sun', planets, houses),
      houseName: getHouseName(getHouseForPlanet('sun', planets, houses))
    } : null);
  
  const moonCombination = planetSignHouseCombinations?.find(c => c.planet === 'Moon') || 
    (planets?.moon && houses ? {
      planet: 'Moon',
      sign: planets.moon.sign,
      house: getHouseForPlanet('moon', planets, houses),
      houseName: getHouseName(getHouseForPlanet('moon', planets, houses))
    } : null);
  
  const risingCombination = rising ? {
    sign: typeof rising === 'string' ? rising : rising.sign || rising,
    house: 1,
    houseName: '1st House (Ascendant)'
  } : null;
  
  const sunSignHouse = sunCombination ? 
    `${sunCombination.planet} in ${sunCombination.sign} in the ${sunCombination.houseName}` : 
    `${sun || 'Unknown'} (house placement not available)`;
  
  const moonSignHouse = moonCombination ? 
    `${moonCombination.planet} in ${moonCombination.sign} in the ${moonCombination.houseName}` : 
    `${moon || 'Unknown'} (house placement not available)`;
  
  const risingSignHouse = risingCombination ? 
    `Ascendant in ${risingCombination.sign} in the ${risingCombination.houseName}` : 
    `${rising || 'Unknown'} (house placement not available)`;
  
  // Get chart ruler location
  const chartRulerInfo = chartRulerLocation || (chartRuler && planets?.[chartRuler.toLowerCase()] ? {
    planet: chartRuler,
    house: getHouseForPlanet(chartRuler.toLowerCase(), planets, houses),
    houseName: getHouseName(getHouseForPlanet(chartRuler.toLowerCase(), planets, houses))
  } : null);
  
  const chartRulerPlanet = chartRulerInfo?.planet || chartRuler || 'Unknown';
  const chartRulerHouse = chartRulerInfo?.houseName || 'Unknown House';
  
  // Format major aspects
  const majorAspectsList = majorAspects?.map(a => 
    `${a.planet1} ${a.type} ${a.planet2} (Orb ${a.orbDescription})`
  ).join('\n- ') || 
  (aspects?.filter(a => ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'].includes(a.type))
    .slice(0, 10)
    .map(a => `${a.planet1 || a.planet1} ${a.type} ${a.planet2 || a.planet2}${a.orb ? ` (Orb ${a.orb.toFixed(1)}°)` : ''}`)
    .join('\n- ') || 'No major aspects provided');
  
  // Extract sun sign explicitly for the prompt
  const sunSign = sunCombination?.sign || planets?.sun?.sign || sun || 'Unknown';
  
  return `${SYSTEM_PROMPT}

Generate a deeply synthesized, premium birth chart reading. The analysis MUST be built around the most specific data points provided.

User: ${name}

**IMPORTANT: The user has a Sun in ${sunSign}. Interpret this placement. Do NOT ask what the sun sign is or calculate it from a date - it is already provided.**

**Core Synthesis Data:**

- Sun-Sign-House: ${sunSignHouse}
- Moon-Sign-House: ${moonSignHouse}
- Ascendant-Sign-House: ${risingSignHouse}
- Chart Ruler: ${chartRulerPlanet} in ${chartRulerHouse}

**Key Psychological Tension (Major Aspects):**

- ${majorAspectsList}

**Instruction:**

1. **State Facts Directly:** Begin by stating "The user has a Sun in ${sunSign}." Then interpret this placement. Never ask what the sun sign is or reference birth dates.

2. **Integrate House Placements:** Every interpretation must reference the House (the *where*) as much as the Sign (the *how*). For example, if the Sun is in Gemini in the 7th House, explain how Gemini's communication style manifests specifically in the realm of partnerships and relationships.

3. **Synthesize the Triad:** The core identity section must explain how the Sun, Moon, and Rising *clash or cooperate* based on their signs and houses. Do they work in harmony, or create internal tension? How do their house placements create a unique life focus?

4. **Focus on Aspects:** The "Strengths and Challenges" section must be primarily an interpretation of the major natal aspects listed above, explaining the internal tension they create. For example, "Sun Square Saturn" creates a specific psychological pattern—explain what that means for this person's life.

5. **Actionable Guidance:** Provide one specific, personalized action step for each major planet's placement. Base these actions on the planet's sign AND house combination.

**Structure your reading with these sections:**

**Core Identity Synthesis**
Begin by stating: "The user has a Sun in ${sunSign}." Then synthesize how Sun, Moon, and Rising interact based on their signs and houses. Explain the unique identity they create together. Provide comprehensive analysis of how these three core placements work together or create tension.

**Planetary Analysis**
For each major planet (Mercury, Venus, Mars, Jupiter, Saturn), provide a comprehensive analysis explaining:
- What the planet represents (the *what*)
- How it expresses through its sign (the *how*)
- Where it manifests through its house (the *where*)
- One specific action step for working with this energy
Be thorough and detailed in your analysis of each planet.

**Strengths and Challenges**
Interpret the major natal aspects listed above. Explain what internal tensions or harmonies they create. Be specific about how these aspects shape the person's psychology and life patterns. Provide comprehensive analysis of each major aspect and its implications.

**Life Themes**
Based on the house placements and aspects, what are the primary life themes? What areas of life demand attention? Provide detailed analysis of the life patterns and themes revealed in the chart.

**Spiritual Path**
What does the chart reveal about the person's spiritual journey and karmic lessons? Provide comprehensive insight into their spiritual path and soul evolution.

Write with depth, specificity, and warmth. Every interpretation must reference both sign AND house. Remember: The user has a Sun in ${sunSign} - state this fact directly, do not ask or calculate.`;
}

/**
 * Helper function to get house for a planet
 */
function getHouseForPlanet(planetKey, planets, houses) {
  if (!planets || !houses || !planets[planetKey]) return null;
  
  const planetLon = planets[planetKey].longitude;
  if (planetLon === undefined) return null;
  
  // Simple house calculation (can be enhanced)
  const houseCusps = [];
  for (let i = 1; i <= 12; i++) {
    if (houses[i]?.longitude !== undefined) {
      houseCusps.push({ house: i, longitude: houses[i].longitude });
    }
  }
  houseCusps.sort((a, b) => a.longitude - b.longitude);
  
  for (let i = 0; i < houseCusps.length; i++) {
    const nextIndex = (i + 1) % houseCusps.length;
    const cuspLon = houseCusps[i].longitude;
    const nextLon = houseCusps[nextIndex].longitude;
    
    if (nextLon > cuspLon) {
      if (planetLon >= cuspLon && planetLon < nextLon) {
        return houseCusps[i].house;
      }
    } else {
      if (planetLon >= cuspLon || planetLon < nextLon) {
        return houseCusps[i].house;
      }
    }
  }
  
  return 1; // Default to 1st house
}

/**
 * Helper function to get house name
 */
function getHouseName(houseNum) {
  if (!houseNum || houseNum < 1 || houseNum > 12) {
    return 'Unknown House';
  }
  const houseNames = {
    1: '1st House (Ascendant)', 2: '2nd House', 3: '3rd House', 4: '4th House (IC)',
    5: '5th House', 6: '6th House', 7: '7th House (Descendant)', 8: '8th House',
    9: '9th House', 10: '10th House (Midheaven)', 11: '11th House', 12: '12th House'
  };
  return houseNames[houseNum] || formatOrdinal(houseNum);
}

/**
 * Compatibility Report Prompt - Synastry & Composite Focused for Premium Reports
 */
export function getCompatibilityPrompt(data) {
  const { 
    user, 
    partner, 
    aspects, 
    compatibility_score,
    name,
    partner_name,
    // Premium data points
    synastryAspects,
    houseOverlays,
    compositeChart
  } = data;
  
  // Extract user and partner names
  const user1Name = name || (user?.name || 'User 1 (Primary)');
  const user2Name = partner_name || (partner?.name || 'User 2 (Partner)');
  
  // Extract Sun signs
  const userSunSign = user?.sun || user?.planets?.sun?.sign || 'Unknown';
  const partnerSunSign = partner?.sun || partner?.planets?.sun?.sign || 'Unknown';
  
  // Format synastry aspects into harmonious and challenging
  const harmoniousAspects = [];
  const challengingAspects = [];
  
  if (synastryAspects && synastryAspects.length > 0) {
    for (const aspect of synastryAspects) {
      const aspectDesc = `${user1Name}'s ${aspect.person1Planet} ${aspect.aspect} ${user2Name}'s ${aspect.person2Planet} (Orb ${aspect.orbDescription})`;
      
      if (aspect.aspect === 'Trine' || aspect.aspect === 'Sextile' || aspect.aspect === 'Conjunction') {
        harmoniousAspects.push(aspectDesc);
      } else if (aspect.aspect === 'Square' || aspect.aspect === 'Opposition') {
        challengingAspects.push(aspectDesc);
      }
    }
  } else if (aspects && aspects.length > 0) {
    // Fallback to old aspects format
    for (const aspect of aspects) {
      const aspectDesc = `${aspect.planet1 || aspect.person1Planet || 'User'} ${aspect.type || aspect.aspect} ${aspect.planet2 || aspect.person2Planet || 'Partner'}`;
      
      if (aspect.type === 'Trine' || aspect.type === 'Sextile' || aspect.type === 'Conjunction' ||
          aspect.aspect === 'Trine' || aspect.aspect === 'Sextile' || aspect.aspect === 'Conjunction') {
        harmoniousAspects.push(aspectDesc);
      } else if (aspect.type === 'Square' || aspect.type === 'Opposition' ||
                 aspect.aspect === 'Square' || aspect.aspect === 'Opposition') {
        challengingAspects.push(aspectDesc);
      }
    }
  }
  
  // Format composite chart data
  let compositeSunHouse = 'Not available';
  let compositeMoonHouse = 'Not available';
  
  if (compositeChart && compositeChart.planetSignHouseCombinations) {
    const compositeSun = compositeChart.planetSignHouseCombinations.find(c => c.planet === 'Sun');
    const compositeMoon = compositeChart.planetSignHouseCombinations.find(c => c.planet === 'Moon');
    
    if (compositeSun) {
      compositeSunHouse = `Composite Sun in ${compositeSun.sign} in the ${compositeSun.houseName}`;
    }
    if (compositeMoon) {
      compositeMoonHouse = `Composite Moon in ${compositeMoon.sign} in the ${compositeMoon.houseName}`;
    }
  }
  
  // Find most challenging inter-aspect for friction analysis
  const mostChallengingAspect = challengingAspects.length > 0 
    ? challengingAspects[0] // Already sorted by orb (tightest first)
    : null;
  
  // Find Moon/Venus/Mars challenging aspects for emotional chemistry
  const emotionalChallengingAspects = challengingAspects.filter(a => 
    a.includes('Moon') || a.includes('Venus') || a.includes('Mars')
  );
  
  // Find Mercury challenging aspects for communication
  const communicationChallengingAspects = challengingAspects.filter(a => 
    a.includes('Mercury')
  );
  
  const harmoniousList = harmoniousAspects.length > 0 
    ? harmoniousAspects.slice(0, 10).join('\n- ')
    : 'No major harmonious aspects identified';
  
  const challengingList = challengingAspects.length > 0
    ? challengingAspects.slice(0, 10).join('\n- ')
    : 'No major challenging aspects identified';
  
  return `${SYSTEM_PROMPT}

Write a premium, in-depth relationship analysis. The reading MUST focus on the unique inter-aspects and the Composite Chart, not just the Sun signs.

User 1 (Primary): ${userSunSign}
User 2 (Partner): ${partnerSunSign}

**Key Relationship Dynamics (Synastry Inter-Aspects):**

- **Harmonious:** ${harmoniousList}

- **Challenging:** ${challengingList}

**Relationship Identity (Composite Chart):**

- Composite Sun-House: ${compositeSunHouse}
- Composite Moon-House: ${compositeMoonHouse}

**Instruction:**

1. **Emotional Chemistry:** Analyze the challenging Moon/Venus/Mars inter-aspects. ${emotionalChallengingAspects.length > 0 ? `Focus on: ${emotionalChallengingAspects.slice(0, 3).join(', ')}` : 'Discuss the emotional dynamics based on the aspects provided.'}

2. **Communication Flow:** Analyze the challenging Mercury inter-aspects. ${communicationChallengingAspects.length > 0 ? `Focus on: ${communicationChallengingAspects.slice(0, 3).join(', ')}` : 'Discuss how the two communicate and where misunderstandings may arise.'}

3. **Sources of Friction:** Directly interpret the most challenging inter-aspect${mostChallengingAspect ? `: "${mostChallengingAspect}"` : 's'}. Explain what this aspect means for the relationship and how it manifests in daily interactions.

4. **Long-Term Potential:** Interpret the Composite Sun and Moon house placements to describe the relationship's ultimate purpose. What is this relationship meant to teach both people? What is its karmic or spiritual purpose?

**Structure your reading with these sections:**

**Emotional Chemistry**
Analyze how the two people connect emotionally. What draws them together? What creates tension? Focus on Moon, Venus, and Mars inter-aspects. Provide comprehensive analysis of the emotional dynamics between them.

**Communication Flow**
How do they communicate? Where do misunderstandings arise? Focus on Mercury inter-aspects and any challenging communication patterns. Provide detailed analysis of their communication style and patterns.

**Sources of Friction**
Deep dive into the most challenging inter-aspect. Explain what this means, how it shows up in the relationship, and what both people need to understand about this dynamic. Provide comprehensive analysis of the friction points and how to work with them.

**Long-Term Potential**
Based on the Composite Sun and Moon house placements, what is this relationship's ultimate purpose? What are they meant to learn together? What is the relationship's destiny? Provide detailed insight into the relationship's long-term evolution and purpose.

**Harmony and Growth**
Provide specific, actionable advice for working with the challenging aspects and maximizing the harmonious ones. Be comprehensive and detailed in your guidance.

Write with depth, specificity, and warmth. Focus on the inter-aspects and composite chart, not just Sun sign compatibility.`;
}

/**
 * Transit Forecast - Short (7-14 Days) Prompt
 */
export function getShortTransitPrompt(data) {
  const { name, date_range, transits } = data;
  
  return `${SYSTEM_PROMPT}

Generate a short-term transit forecast covering the exact dates and transits provided.

User: ${name}
Date Range: ${date_range}

Transits:
${JSON.stringify(transits, null, 2)}

For each transit:
- Explain what the energy means
- How it affects the user
- Advice for working with it

End with a summary of the key opportunities and challenges in this cycle.`;
}

/**
 * Transit Forecast - Extended (30-90 Days) Prompt - Specificity-Focused for Premium Reports
 */
export function getExtendedTransitPrompt(data) {
  const { 
    name, 
    date_range, 
    transits,
    // Premium data points
    natalChart,
    houseCuspsDetailed,
    cuspTransits,
    exactDates
  } = data;
  
  // Format house cusps with degrees
  let houseCuspsList = 'Not available';
  if (houseCuspsDetailed && houseCuspsDetailed.length > 0) {
    houseCuspsList = houseCuspsDetailed.map(cusp => 
      `${cusp.houseName} Cusp at ${cusp.degree}° ${cusp.sign}`
    ).join('\n- ');
  } else if (natalChart?.houses) {
    // Fallback: extract from houses object
    const cusps = [];
    const houseNames = {
      1: '1st House (Ascendant)', 2: '2nd House', 3: '3rd House', 4: '4th House (IC)',
      5: '5th House', 6: '6th House', 7: '7th House (Descendant)', 8: '8th House',
      9: '9th House', 10: '10th House (Midheaven)', 11: '11th House', 12: '12th House'
    };
    for (let i = 1; i <= 12; i++) {
      if (natalChart.houses[i]?.longitude !== undefined) {
        const sign = natalChart.houses[i].sign || getZodiacSign(natalChart.houses[i].longitude);
        const degree = Math.floor(natalChart.houses[i].longitude % 30);
        cusps.push(`${houseNames[i] || formatOrdinal(i)} Cusp at ${degree}° ${sign}`);
      }
    }
    if (cusps.length > 0) {
      houseCuspsList = cusps.join('\n- ');
    }
  }
  
  // Format natal planet degrees
  let natalPlanetDegreesList = 'Not available';
  if (natalChart?.planets || natalChart?.natal_positions) {
    const planets = natalChart.planets || natalChart.natal_positions || {};
    const planetNames = {
      sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
      mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus',
      neptune: 'Neptune', pluto: 'Pluto'
    };
    const degrees = [];
    for (const [key, planet] of Object.entries(planets)) {
      if (planet?.longitude !== undefined && planetNames[key]) {
        const sign = planet.sign || getZodiacSign(planet.longitude);
        const degree = Math.floor(planet.longitude % 30);
        degrees.push(`Natal ${planetNames[key]} at ${degree}° ${sign}`);
      }
    }
    if (degrees.length > 0) {
      natalPlanetDegreesList = degrees.join('\n- ');
    }
  }
  
  // Format transits to natal points (with exact dates if available)
  let transitsToNatalPoints = 'Not available';
  if (transits && transits.length > 0) {
    const transitList = transits.map(transit => {
      const transitBody = transit.transitingBody || transit.transitPlanet || transit.planet || 'Unknown';
      const natalPoint = transit.natalPoint || transit.natalPlanet || transit.to || 'Unknown';
      const aspect = transit.aspect || transit.type || 'aspect';
      const house = transit.house || transit.affectedHouse || '';
      const exactDate = transit.exactDate || transit.exactDateFormatted || transit.date || '';
      
      let description = `Transiting ${transitBody} ${aspect} Natal ${natalPoint}`;
      if (house) {
        description += ` in ${house} House`;
      }
      if (exactDate) {
        description += ` on ${exactDate}`;
      }
      return description;
    });
    transitsToNatalPoints = transitList.join('\n- ');
  }
  
  // Format transits to house cusps
  let transitsToHouseCuspsList = 'Not available';
  if (cuspTransits && cuspTransits.length > 0) {
    const cuspTransitList = cuspTransits.map(transit => {
      const transitBody = transit.transitingBody || 'Unknown';
      const houseName = transit.houseName || formatOrdinal(transit.house);
      const aspect = transit.aspect || 'aspect';
      const exactDate = transit.exactDate ? formatDate(transit.exactDate) : '';
      
      let description = `Transiting ${transitBody} ${aspect} ${houseName} Cusp`;
      if (exactDate) {
        description += ` on ${exactDate}`;
      }
      return description;
    });
    transitsToHouseCuspsList = cuspTransitList.join('\n- ');
  }
  
  // Helper function to format dates
  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  
  // Helper function to get zodiac sign from longitude
  function getZodiacSign(longitude) {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return signs[Math.floor(longitude / 30) % 12];
  }
  
  return `${SYSTEM_PROMPT}

Create a highly specific, premium transit forecast for the user. The forecast MUST be personalized by referencing the House and exact degree of the natal planet being activated.

User: ${name}
Date Range: ${date_range}

**Key Natal Data:**

- All Natal House Cusps: ${houseCuspsList}

- All Natal Planet Degrees: ${natalPlanetDegreesList}

**Specific Transits to Interpret (Chronological Order):**

- Transits to Natal Points:
${transitsToNatalPoints}

- Transits to House Cusps:
${transitsToHouseCuspsList}

**Instruction:**

1. **Weekly/Monthly Structure:** Structure the report around the most impactful transits. Group transits by week or month, focusing on the most significant events first.

2. **Specificity is Key:** For each event, state the **exact date**, the **natal planet/cusp** being affected, and the **House** where the event is occurring. For example: "On March 12, 2025, Transiting Jupiter Conjuncts your Natal Venus (at 15° Gemini) in your 7th House of partnerships."

3. **Actionable Guidance:** The advice must be directly related to the life area of the affected House. For example: "Expect a challenge in your career and public standing (10th House) around April 5th as Transiting Saturn squares your Midheaven (10th House Cusp at 15° Pisces)."

**Structure your forecast with these sections:**

**Overview**
Provide a comprehensive summary of the major themes for this period based on the most significant transits. Give detailed context for what the user can expect during this time frame.

**Week-by-Week Breakdown** (or Month-by-Month for longer forecasts)
For each significant transit, provide comprehensive analysis:
- **Date**: State the exact date
- **Transit**: "Transiting [Planet] [Aspect] Natal [Planet] in [House] House"
- **Natal Point**: Reference the exact degree and sign (e.g., "your Natal Sun at 15° Gemini")
- **House Impact**: Explain what life area is affected (e.g., "7th House - partnerships and relationships")
- **Meaning**: Provide detailed explanation of what this transit means for the user
- **Actionable Guidance**: Specific, comprehensive advice for working with this energy

**Major Themes**
Synthesize the overall patterns. What are the primary life areas being activated? What is the user being called to focus on? Provide comprehensive analysis of the overarching themes and patterns.

**Key Dates to Watch** (Bullet list)
List the most important dates with detailed descriptions:
- [Date]: [Transit] - [Comprehensive impact description]

Write with precision, specificity, and warmth. Every transit interpretation must reference the exact natal degree, sign, and house placement.`;
}

/**
 * Calculate age from birth date
 * @param {string|Date} birthDate - Birth date as string (YYYY-MM-DD) or Date object
 * @returns {number} Age in years
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
  
  let date;
  if (typeof birthDate === 'string') {
    // Parse YYYY-MM-DD format
    const parts = birthDate.split('-');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
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
 * Destiny Path Cycle Reading Prompt - Routes based on age
 * - Ages 28-30 or 58-60: Saturn Return
 * - Ages 40-45: Saturn Opposition (Midlife Crisis)
 * - Otherwise: General Transits
 */
export function getDestinyPathPrompt(data) {
  // Calculate age from birth date
  const birthDate = data.birth_date || data.birthDate || data.natalChart?.birth_date;
  const age = calculateAge(birthDate);
  
  // Route to appropriate prompt based on age
  if (age !== null) {
    if ((age >= 28 && age <= 30) || (age >= 58 && age <= 60)) {
      // Saturn Return
      return getSaturnReturnPrompt(data);
    } else if (age >= 40 && age <= 44) {
      // Saturn Opposition (Midlife Crisis) - Updated to 40-44 per SectionOrchestrator
      return getSaturnOppositionPrompt(data);
    } else {
      // General Transits
      return getGeneralTransitsPrompt(data);
    }
  }
  
  // Fallback to Saturn Return if age cannot be determined
  return getSaturnReturnPrompt(data);
}

/**
 * Saturn Return Prompt (Ages 28-30 or 58-60)
 */
function getSaturnReturnPrompt(data) {
  const { 
    cycle_name, 
    start_date, 
    end_date, 
    themes,
    // Premium data points
    natalChart,
    natalSaturnPlacement,
    planetSignHouseCombinations
  } = data;
  
  // Extract natal Saturn placement
  let natalSaturnSignHouse = 'Not available';
  let natalSaturnHouse = null;
  let natalSaturnHouseName = null;
  
  if (natalSaturnPlacement) {
    natalSaturnSignHouse = natalSaturnPlacement;
    // Extract house number if available
    const houseMatch = natalSaturnPlacement.match(/(\d+)(?:st|nd|rd|th)\s+House/i);
    if (houseMatch) {
      natalSaturnHouse = parseInt(houseMatch[1]);
    }
  } else if (planetSignHouseCombinations && planetSignHouseCombinations.length > 0) {
    const saturnCombo = planetSignHouseCombinations.find(c => 
      c.planet === 'Saturn' || c.planet?.toLowerCase() === 'saturn'
    );
    if (saturnCombo) {
      natalSaturnSignHouse = `Saturn in ${saturnCombo.sign} in the ${saturnCombo.houseName}`;
      natalSaturnHouse = saturnCombo.house;
      natalSaturnHouseName = saturnCombo.houseName;
    }
  } else if (natalChart?.planets || natalChart?.natal_positions) {
    // Fallback: extract from natal chart
    const planets = natalChart.planets || natalChart.natal_positions || {};
    const saturn = planets.saturn;
    
    if (saturn && saturn.longitude !== undefined) {
      const sign = saturn.sign || getZodiacSign(saturn.longitude);
      const degree = Math.floor(saturn.longitude % 30);
      
      // Find house placement
      if (natalChart.houses) {
        const houseCusps = [];
        for (let i = 1; i <= 12; i++) {
          if (natalChart.houses[i]?.longitude !== undefined) {
            houseCusps.push({ house: i, longitude: natalChart.houses[i].longitude });
          }
        }
        houseCusps.sort((a, b) => a.longitude - b.longitude);
        
        const saturnLon = saturn.longitude;
        for (let i = 0; i < houseCusps.length; i++) {
          const nextIndex = (i + 1) % houseCusps.length;
          const cuspLon = houseCusps[i].longitude;
          const nextLon = houseCusps[nextIndex].longitude;
          
          if (nextLon > cuspLon) {
            if (saturnLon >= cuspLon && saturnLon < nextLon) {
              natalSaturnHouse = houseCusps[i].house;
              break;
            }
          } else {
            if (saturnLon >= cuspLon || saturnLon < nextLon) {
              natalSaturnHouse = houseCusps[i].house;
              break;
            }
          }
        }
      }
      
      const houseNames = {
        1: '1st House (Ascendant)', 2: '2nd House', 3: '3rd House', 4: '4th House (IC)',
        5: '5th House', 6: '6th House', 7: '7th House (Descendant)', 8: '8th House',
        9: '9th House', 10: '10th House (Midheaven)', 11: '11th House', 12: '12th House'
      };
      
      natalSaturnHouseName = houseNames[natalSaturnHouse] || formatOrdinal(natalSaturnHouse);
      natalSaturnSignHouse = `Saturn in ${sign} in the ${natalSaturnHouseName}`;
    }
  }
  
  // Get house meaning for guidance
  const houseMeanings = {
    1: 'identity, self-image, personal expression, how you present yourself to the world',
    2: 'values, money, possessions, self-worth, material security',
    3: 'communication, local community, learning, siblings, daily routines',
    4: 'home, family, roots, emotional foundation, private life',
    5: 'creativity, romance, children, self-expression, joy and play',
    6: 'work, health, daily routines, service, organization',
    7: 'partnerships, relationships, marriage, one-on-one connections',
    8: 'transformation, shared resources, intimacy, power dynamics',
    9: 'philosophy, higher education, travel, spirituality, expansion',
    10: 'career, public image, reputation, authority, life purpose',
    11: 'friendships, groups, hopes and dreams, social networks',
    12: 'spirituality, subconscious, hidden matters, karma, endings'
  };
  
  const houseMeaning = natalSaturnHouse ? houseMeanings[natalSaturnHouse] : 'the life area ruled by your natal Saturn';
  
  // Helper function to get zodiac sign from longitude
  function getZodiacSign(longitude) {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return signs[Math.floor(longitude / 30) % 12];
  }
  
  return `${SYSTEM_PROMPT}

Write a premium Destiny Path Cycle reading focused on the user's Saturn Return. The analysis MUST be personalized by referencing the natal Saturn's House placement.

Cycle: Saturn Return
Start Date: ${start_date}
End Date: ${end_date}

**Natal Saturn Placement:** ${natalSaturnSignHouse}

**Instruction:**

1. **Personalized Meaning:** Explain that the core lesson of this cycle will manifest primarily in the life area ruled by the ${natalSaturnHouseName || 'natal Saturn house'} (${houseMeaning}).

2. **Specific Challenges:** Detail the specific challenges and responsibilities that will arise in that House. Be specific about what structures, systems, or foundations need to be built or rebuilt in that life area. For example, if Saturn is in the 3rd House: "You will be tested on the structure of your daily routines and how you communicate your ideas to your peers."

3. **Actionable Advice:** Provide a minimum of 5 concrete, personalized actions the user can take to "pass" the Saturn Return in that specific House. Each action should be directly related to the house's life area and should be specific, measurable, and achievable.

**Structure your reading with these sections:**

**Understanding Your Saturn Return**
Provide comprehensive explanation of what a Saturn Return is and why it's significant. Reference the user's specific Saturn placement (${natalSaturnSignHouse}) and explain in detail that this cycle will primarily affect ${houseMeaning}. Give thorough context about Saturn Returns in general and this specific one.

**The Core Lesson**
Provide comprehensive analysis of the personalized meaning of this Saturn Return based on the ${natalSaturnHouseName || 'natal Saturn house'}. What is the primary life area being tested? What structures need to be built or rebuilt? Give detailed insight into the core lessons and themes.

**Specific Challenges**
Provide comprehensive detail about the specific challenges and responsibilities that will arise in the ${natalSaturnHouseName || 'natal Saturn house'}. Be concrete about what the user will be tested on. Reference specific examples related to that house's life area. Give thorough analysis of all potential challenges.

**5 Action Steps to Pass Your Saturn Return** (5 specific actions)
Provide exactly 5 concrete, personalized actions the user can take. For each action, provide comprehensive explanation:
- Be directly related to the ${natalSaturnHouseName || 'natal Saturn house'} life area
- Be specific and measurable
- Be achievable during the Saturn Return period
- Help the user build the structures Saturn is demanding
- Include detailed explanation of why each action is important and how to implement it

**What to Embrace vs. Avoid**
Based on the ${natalSaturnHouseName || 'natal Saturn house'} placement, provide comprehensive guidance on what the user should embrace during this cycle and what they should avoid. Give detailed reasoning for each recommendation.

**Timeline and Phases**
Provide comprehensive explanation of the phases of the Saturn Return and when the user can expect the most intense periods. Give detailed timeline information and what to expect at each phase.

Write with depth, specificity, and warmth. Every interpretation must reference the ${natalSaturnHouseName || 'natal Saturn house'} and explain how the Saturn Return will manifest in that specific life area.`;
}

/**
 * Saturn Opposition Prompt (Ages 40-45) - Midlife Crisis Transit
 */
function getSaturnOppositionPrompt(data) {
  const { 
    natalChart,
    natalSaturnPlacement,
    planetSignHouseCombinations
  } = data;
  
  // Extract natal Saturn placement (same logic as Saturn Return)
  let natalSaturnSignHouse = 'Not available';
  let natalSaturnHouse = null;
  let natalSaturnHouseName = null;
  
  if (natalSaturnPlacement) {
    natalSaturnSignHouse = natalSaturnPlacement;
    const houseMatch = natalSaturnPlacement.match(/(\d+)(?:st|nd|rd|th)\s+House/i);
    if (houseMatch) {
      natalSaturnHouse = parseInt(houseMatch[1]);
    }
  } else if (planetSignHouseCombinations && planetSignHouseCombinations.length > 0) {
    const saturnCombo = planetSignHouseCombinations.find(c => 
      c.planet === 'Saturn' || c.planet?.toLowerCase() === 'saturn'
    );
    if (saturnCombo) {
      natalSaturnSignHouse = `Saturn in ${saturnCombo.sign} in the ${saturnCombo.houseName}`;
      natalSaturnHouse = saturnCombo.house;
      natalSaturnHouseName = saturnCombo.houseName;
    }
  } else if (natalChart?.planets || natalChart?.natal_positions) {
    const planets = natalChart.planets || natalChart.natal_positions || {};
    const saturn = planets.saturn;
    
    if (saturn && saturn.longitude !== undefined) {
      const sign = saturn.sign || getZodiacSign(saturn.longitude);
      if (natalChart.houses) {
        const houseCusps = [];
        for (let i = 1; i <= 12; i++) {
          if (natalChart.houses[i]?.longitude !== undefined) {
            houseCusps.push({ house: i, longitude: natalChart.houses[i].longitude });
          }
        }
        houseCusps.sort((a, b) => a.longitude - b.longitude);
        
        const saturnLon = saturn.longitude;
        for (let i = 0; i < houseCusps.length; i++) {
          const nextIndex = (i + 1) % houseCusps.length;
          const cuspLon = houseCusps[i].longitude;
          const nextLon = houseCusps[nextIndex].longitude;
          
          if (nextLon > cuspLon) {
            if (saturnLon >= cuspLon && saturnLon < nextLon) {
              natalSaturnHouse = houseCusps[i].house;
              break;
            }
          } else {
            if (saturnLon >= cuspLon || saturnLon < nextLon) {
              natalSaturnHouse = houseCusps[i].house;
              break;
            }
          }
        }
      }
      
      natalSaturnHouseName = formatOrdinal(natalSaturnHouse);
      natalSaturnSignHouse = `Saturn in ${sign} in the ${natalSaturnHouseName}`;
    }
  }
  
  const houseMeanings = {
    1: 'identity, self-image, personal expression, how you present yourself to the world',
    2: 'values, money, possessions, self-worth, material security',
    3: 'communication, local community, learning, siblings, daily routines',
    4: 'home, family, roots, emotional foundation, private life',
    5: 'creativity, romance, children, self-expression, joy and play',
    6: 'work, health, daily routines, service, organization',
    7: 'partnerships, relationships, marriage, one-on-one connections',
    8: 'transformation, shared resources, intimacy, power dynamics',
    9: 'philosophy, higher education, travel, spirituality, expansion',
    10: 'career, public image, reputation, authority, life purpose',
    11: 'friendships, groups, hopes and dreams, social networks',
    12: 'spirituality, subconscious, hidden matters, karma, endings'
  };
  
  const houseMeaning = natalSaturnHouse ? houseMeanings[natalSaturnHouse] : 'the life area ruled by your natal Saturn';
  
  function getZodiacSign(longitude) {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return signs[Math.floor(longitude / 30) % 12];
  }
  
  return `${SYSTEM_PROMPT}

Write a premium Destiny Path Cycle reading focused on the user's Saturn Opposition (Midlife Crisis transit). The analysis MUST be personalized by referencing the natal Saturn's House placement.

Cycle: Saturn Opposition (Midlife Crisis)
This transit occurs around ages 40-45 when transiting Saturn opposes the natal Saturn position.

**Natal Saturn Placement:** ${natalSaturnSignHouse}

**Instruction:**

1. **Personalized Meaning:** Explain that the Saturn Opposition (often called the "Midlife Crisis" transit) will manifest primarily in the life area ruled by the ${natalSaturnHouseName || 'natal Saturn house'} (${houseMeaning}). This is a time of re-evaluation and restructuring of the structures built during the first Saturn Return.

2. **Specific Challenges:** Detail the specific challenges and re-evaluations that will arise in that House. Explain what structures from the first Saturn Return need to be reassessed, rebuilt, or released. Be specific about what the user will be tested on in this midlife phase.

3. **Actionable Advice:** Provide a minimum of 5 concrete, personalized actions the user can take to navigate the Saturn Opposition successfully. Each action should be directly related to the house's life area and should help the user reassess and restructure their approach to that area of life.

**Structure your reading with these sections:**

**Understanding Your Saturn Opposition**
Provide comprehensive explanation of what a Saturn Opposition is and why it's significant during midlife. Reference the user's specific Saturn placement (${natalSaturnSignHouse}) and explain in detail that this cycle will primarily affect ${houseMeaning}. Explain how this differs from the Saturn Return and what unique challenges it presents.

**The Core Lesson**
Provide comprehensive analysis of the personalized meaning of this Saturn Opposition based on the ${natalSaturnHouseName || 'natal Saturn house'}. What structures from the first Saturn Return need to be reassessed? What new approaches are needed? Give detailed insight into the core lessons and themes of this midlife transit.

**Specific Challenges**
Provide comprehensive detail about the specific challenges and re-evaluations that will arise in the ${natalSaturnHouseName || 'natal Saturn house'}. Be concrete about what the user will be tested on. Reference specific examples related to that house's life area. Give thorough analysis of all potential challenges and what needs to be restructured.

**5 Action Steps to Navigate Your Saturn Opposition** (5 specific actions)
Provide exactly 5 concrete, personalized actions the user can take. For each action, provide comprehensive explanation:
- Be directly related to the ${natalSaturnHouseName || 'natal Saturn house'} life area
- Help reassess structures built during the first Saturn Return
- Be specific and measurable
- Be achievable during the Saturn Opposition period
- Include detailed explanation of why each action is important and how to implement it

**What to Embrace vs. Avoid**
Based on the ${natalSaturnHouseName || 'natal Saturn house'} placement, provide comprehensive guidance on what the user should embrace during this midlife transit and what they should avoid. Give detailed reasoning for each recommendation.

**Timeline and Phases**
Provide comprehensive explanation of the phases of the Saturn Opposition and when the user can expect the most intense periods. Give detailed timeline information and what to expect at each phase.

Write with depth, specificity, and warmth. Every interpretation must reference the ${natalSaturnHouseName || 'natal Saturn house'} and explain how the Saturn Opposition will manifest in that specific life area.`;
}

/**
 * General Transits Prompt (All other ages)
 */
function getGeneralTransitsPrompt(data) {
  const { 
    natalChart,
    transits,
    date_range
  } = data;
  
  // Get active transits if available
  let transitList = '';
  if (transits && Array.isArray(transits) && transits.length > 0) {
    transitList = transits.map(t => {
      const transitBody = t.transitingBody || t.planet || 'Unknown';
      const aspect = t.aspect || t.type || 'aspect';
      const natalPoint = t.natalPoint || t.planet || 'natal point';
      const date = t.date || t.exactDate || '';
      return `- ${transitBody} ${aspect} ${natalPoint}${date ? ` on ${date}` : ''}`;
    }).join('\\n');
  } else {
    transitList = 'Current significant transits affecting the natal chart';
  }
  
  return `${SYSTEM_PROMPT}

Write a premium Destiny Path Cycle reading focused on the user's current significant transits and life cycles. The analysis should provide guidance on the major astrological influences affecting the user at this time.

**Current Transits:**
${transitList}

${date_range ? `**Date Range:** ${date_range}` : ''}

**Instruction:**

1. **Overview:** Provide a comprehensive overview of the current astrological climate and how it affects the user's life path and destiny.

2. **Major Themes:** Identify and explain the major themes and life areas being activated by current transits. Reference specific planetary influences and their meanings.

3. **Actionable Guidance:** Provide concrete, personalized guidance on how to work with these transits. Include specific actions the user can take to align with the cosmic energies.

**Structure your reading with these sections:**

**Current Astrological Climate**
Provide comprehensive explanation of the current transits and their overall significance. Explain how these planetary influences are shaping the user's life path and destiny at this time. Give thorough context about the astrological cycles in play.

**Major Life Themes**
Provide comprehensive analysis of the major themes and life areas being activated. What areas of life are being highlighted? What opportunities and challenges are present? Give detailed insight into how these transits are manifesting.

**Key Opportunities**
Identify and explain the key opportunities presented by current transits. What should the user focus on? What doors are opening? Provide specific guidance on how to maximize these opportunities.

**Challenges and Lessons**
Identify and explain the challenges and lessons presented by current transits. What needs attention? What structures need adjustment? Provide specific guidance on how to navigate these challenges.

**Action Steps for Alignment** (5 specific actions)
Provide exactly 5 concrete, personalized actions the user can take to align with current transits. For each action, provide comprehensive explanation:
- Be directly related to the transits and themes identified
- Be specific and measurable
- Be achievable in the current timeframe
- Include detailed explanation of why each action is important and how to implement it

**Timeline and Key Dates**
If specific dates are available, provide a timeline of when key transit events will occur and what to expect. Give detailed information about the progression of these transits.

Write with depth, specificity, and warmth. Every interpretation must reference the specific transits and explain how they are affecting the user's life path and destiny.`;
}

/**
 * Relationship Matrix Prompt
 * Guard clause: Returns null if partner data is missing
 */
export function getRelationshipMatrixPrompt(data) {
  const { pair, matrix_scores } = data;
  
  // Guard clause: Check if partner data exists
  const partnerChart = pair?.partner || data.partner;
  const userChart = pair?.user || data.user || data.chart1;
  
  if (!partnerChart || !userChart) {
    return null; // Skip generation if partner data is missing
  }
  
  // Extract sun signs explicitly to prevent LLM hallucination
  let userSunSign = 'Unknown';
  let partnerSunSign = 'Unknown';
  
  // Extract from user chart
  if (userChart.planets?.sun?.sign) {
    userSunSign = userChart.planets.sun.sign;
  } else if (userChart.natal_positions?.sun?.sign) {
    userSunSign = userChart.natal_positions.sun.sign;
  } else if (userChart.sun?.sign) {
    userSunSign = userChart.sun.sign;
  } else if (userChart.planets?.sun?.longitude !== undefined) {
    userSunSign = getZodiacSign(userChart.planets.sun.longitude);
  } else if (userChart.natal_positions?.sun?.longitude !== undefined) {
    userSunSign = getZodiacSign(userChart.natal_positions.sun.longitude);
  }
  
  // Extract from partner chart
  if (partnerChart.planets?.sun?.sign) {
    partnerSunSign = partnerChart.planets.sun.sign;
  } else if (partnerChart.natal_positions?.sun?.sign) {
    partnerSunSign = partnerChart.natal_positions.sun.sign;
  } else if (partnerChart.sun?.sign) {
    partnerSunSign = partnerChart.sun.sign;
  } else if (partnerChart.planets?.sun?.longitude !== undefined) {
    partnerSunSign = getZodiacSign(partnerChart.planets.sun.longitude);
  } else if (partnerChart.natal_positions?.sun?.longitude !== undefined) {
    partnerSunSign = getZodiacSign(partnerChart.natal_positions.sun.longitude);
  }
  
  // Helper function to get zodiac sign from longitude
  function getZodiacSign(longitude) {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return signs[Math.floor(longitude / 30) % 12];
  }
  
  return `${SYSTEM_PROMPT}

Create a Relationship Matrix interpretation.

**IMPORTANT: The user's Sun sign is ${userSunSign} and the partner's Sun sign is ${partnerSunSign}. You MUST use these exact signs in your interpretation and NOT invent or assume different signs.**

User Chart:
${JSON.stringify(userChart, null, 2)}

Partner Chart:
${JSON.stringify(partnerChart, null, 2)}

Matrix Scores:
${JSON.stringify(matrix_scores, null, 2)}

Discuss each category:
- Emotional (${matrix_scores.emotional}/100)
- Communication (${matrix_scores.communication}/100)
- Spiritual (${matrix_scores.spiritual}/100)
- Stability (${matrix_scores.stability}/100)
- Physical (${matrix_scores.physical}/100)

For each category, interpret the score and explain:
- Strengths
- Weak points
- Long-term implications
- How to improve or harmonize each area

Remember: User's Sun sign is ${userSunSign}, Partner's Sun sign is ${partnerSunSign}.`;
}

/**
 * Shadow Work / Karmic Reading Prompt - Nodal Axis House Focus for Premium Reports
 */
export function getKarmicReadingPrompt(data) {
  const { 
    placements, 
    aspects, 
    nodes,
    // Premium data points
    natalChart,
    planetSignHouseCombinations
  } = data;
  
  // Extract North Node and South Node placements
  let northNodeSign = 'Unknown';
  let northNodeHouse = null;
  let northNodeHouseName = null;
  let southNodeSign = 'Unknown';
  let southNodeHouse = null;
  let southNodeHouseName = null;
  
  // Try to get from nodes object
  if (nodes) {
    if (typeof nodes.north_node === 'string') {
      northNodeSign = nodes.north_node;
    } else if (nodes.north_node?.sign) {
      northNodeSign = nodes.north_node.sign;
    }
    
    if (typeof nodes.south_node === 'string') {
      southNodeSign = nodes.south_node;
    } else if (nodes.south_node?.sign) {
      southNodeSign = nodes.south_node.sign;
    }
  }
  
  // Find house placements from planetSignHouseCombinations or natal chart
  if (planetSignHouseCombinations && planetSignHouseCombinations.length > 0) {
    const northNodeCombo = planetSignHouseCombinations.find(c => 
      c.planet === 'North Node' || c.planet?.toLowerCase() === 'northnode'
    );
    const southNodeCombo = planetSignHouseCombinations.find(c => 
      c.planet === 'South Node' || c.planet?.toLowerCase() === 'southnode'
    );
    
      if (northNodeCombo) {
        northNodeHouse = northNodeCombo.house;
        // Safety check: Ensure house is defined
        if (northNodeHouse === undefined || northNodeHouse === null) {
          throw new Error(
            `[getKarmicReadingPrompt] CRITICAL: North Node house is undefined in planetSignHouseCombinations. ` +
            `This is required for karmic readings.`
          );
        }
        northNodeHouseName = northNodeCombo.houseName || formatOrdinal(northNodeHouse);
        if (!northNodeSign || northNodeSign === 'Unknown') {
          northNodeSign = northNodeCombo.sign;
        }
      }
    
    if (southNodeCombo) {
      southNodeHouse = southNodeCombo.house;
      southNodeHouseName = southNodeCombo.houseName;
      if (!southNodeSign || southNodeSign === 'Unknown') {
        southNodeSign = southNodeCombo.sign;
      }
    }
  } else if (natalChart) {
    // Fallback: calculate from natal chart
    const planets = natalChart.planets || natalChart.natal_positions || {};
    const houses = natalChart.houses || {};
    
    if (planets.northNode || planets.northnode) {
      const node = planets.northNode || planets.northnode;
      northNodeSign = node.sign || getZodiacSign(node.longitude);
      
      // Find house
      if (node.longitude !== undefined && houses) {
        northNodeHouse = getHouseForPlanet(node.longitude, houses);
        
        // Safety check: Ensure house is defined before using formatOrdinal
        if (northNodeHouse === undefined || northNodeHouse === null) {
          throw new Error(
            `[getKarmicReadingPrompt] CRITICAL: North Node house is undefined. ` +
            `Longitude: ${node.longitude}. This is required for karmic readings.`
          );
        }
        
        const houseNames = {
          1: '1st House (Ascendant)', 2: '2nd House', 3: '3rd House', 4: '4th House (IC)',
          5: '5th House', 6: '6th House', 7: '7th House (Descendant)', 8: '8th House',
          9: '9th House', 10: '10th House (Midheaven)', 11: '11th House', 12: '12th House'
        };
        northNodeHouseName = houseNames[northNodeHouse] || formatOrdinal(northNodeHouse);
      }
    }
    
    if (planets.southNode || planets.southnode) {
      const node = planets.southNode || planets.southnode;
      southNodeSign = node.sign || getZodiacSign(node.longitude);
      
      // Find house
      if (node.longitude !== undefined && houses) {
        southNodeHouse = getHouseForPlanet(node.longitude, houses);
        const houseNames = {
          1: '1st House (Ascendant)', 2: '2nd House', 3: '3rd House', 4: '4th House (IC)',
          5: '5th House', 6: '6th House', 7: '7th House (Descendant)', 8: '8th House',
          9: '9th House', 10: '10th House (Midheaven)', 11: '11th House', 12: '12th House'
        };
        southNodeHouseName = houseNames[southNodeHouse] || formatOrdinal(southNodeHouse);
      }
    }
  }
  
  // Format challenging aspects to nodes
  let challengingAspectsList = 'No challenging aspects identified';
  if (aspects && aspects.length > 0) {
    const challengingAspects = aspects.filter(a => {
      const aspectType = a.type || a.aspect || '';
      const planet1 = a.planet1 || a.planet || '';
      const planet2 = a.planet2 || a.to || '';
      
      // Check if aspect involves nodes and is challenging (Square, Opposition, or tight Conjunction)
      const isChallenging = ['Square', 'Opposition'].includes(aspectType) || 
                           (aspectType === 'Conjunction' && (a.orb || 0) < 3);
      const involvesNodes = planet1?.toLowerCase().includes('node') || 
                           planet2?.toLowerCase().includes('node') ||
                           planet1 === 'North Node' || planet1 === 'South Node' ||
                           planet2 === 'North Node' || planet2 === 'South Node';
      
      return isChallenging && involvesNodes;
    });
    
    if (challengingAspects.length > 0) {
      challengingAspectsList = challengingAspects.map(a => {
        const planet1 = a.planet1 || a.planet || 'Unknown';
        const planet2 = a.planet2 || a.to || 'Unknown';
        const aspect = a.type || a.aspect || 'aspect';
        const orb = a.orb ? ` (Orb ${a.orb.toFixed(1)}°)` : '';
        return `${planet1} ${aspect} ${planet2}${orb}`;
      }).join('\n- ');
    }
  }
  
  // Helper function to get house for a planet
  function getHouseForPlanet(planetLongitude, houses) {
    const houseCusps = [];
    for (let i = 1; i <= 12; i++) {
      if (houses[i]?.longitude !== undefined) {
        houseCusps.push({ house: i, longitude: houses[i].longitude });
      }
    }
    houseCusps.sort((a, b) => a.longitude - b.longitude);
    
    for (let i = 0; i < houseCusps.length; i++) {
      const nextIndex = (i + 1) % houseCusps.length;
      const cuspLon = houseCusps[i].longitude;
      const nextLon = houseCusps[nextIndex].longitude;
      
      if (nextLon > cuspLon) {
        if (planetLongitude >= cuspLon && planetLongitude < nextLon) {
          return houseCusps[i].house;
        }
      } else {
        if (planetLongitude >= cuspLon || planetLongitude < nextLon) {
          return houseCusps[i].house;
        }
      }
    }
    return 1;
  }
  
  // Helper function to get zodiac sign from longitude
  function getZodiacSign(longitude) {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    return signs[Math.floor(longitude / 30) % 12];
  }
  
  // House meanings for guidance
  const houseMeanings = {
    1: 'identity, self-image, personal expression',
    2: 'values, money, possessions, self-worth',
    3: 'communication, local community, learning',
    4: 'home, family, roots, emotional foundation',
    5: 'creativity, romance, children, self-expression',
    6: 'work, health, daily routines, service',
    7: 'partnerships, relationships, marriage',
    8: 'transformation, shared resources, intimacy',
    9: 'philosophy, higher education, travel, spirituality',
    10: 'career, public image, reputation, authority',
    11: 'friendships, groups, hopes and dreams',
    12: 'spirituality, subconscious, hidden matters, karma'
  };
  
  const southNodeHouseMeaning = southNodeHouse ? houseMeanings[southNodeHouse] : 'your comfort zone';
  const northNodeHouseMeaning = northNodeHouse ? houseMeanings[northNodeHouse] : 'your growth area';
  
  return `${SYSTEM_PROMPT}

Generate a premium Karmic and Shadow Work reading. The analysis MUST be built around the House placements of the Nodal Axis and the most challenging aspects to the Nodes.

**Nodal Axis Placement:**

- North Node: ${northNodeSign} in the **${northNodeHouseName || (northNodeHouse !== null && northNodeHouse !== undefined ? formatOrdinal(northNodeHouse) : 'Unknown House')}**

- South Node: ${southNodeSign} in the **${southNodeHouseName || (southNodeHouse !== null && southNodeHouse !== undefined ? formatOrdinal(southNodeHouse) : 'Unknown House')}**

**Karmic Challenge Aspects:**

- ${challengingAspectsList}

**Instruction:**

1. **Core Karmic Lesson:** Explain the core lesson as a shift from the comfort zone of the South Node House (${southNodeHouseMeaning}) to the growth area of the North Node House (${northNodeHouseMeaning}).

2. **Emotional Patterns to Break:** Directly interpret the challenging aspects to the Nodes. For example: "The Mars Square to your North Node indicates a pattern of aggressive action that must be channeled into purposeful, rather than reactive, self-assertion."

3. **Practical Shadow Work Guidance:** Provide 3-5 specific, personalized shadow work exercises that address the themes of the South Node House and the challenging aspects.

**Structure your reading with these sections:**

**Understanding Your Nodal Axis**
Provide comprehensive explanation of what the North Node and South Node represent. Reference the user's specific placements: North Node in ${northNodeSign} in the ${northNodeHouseName || (northNodeHouse !== null && northNodeHouse !== undefined ? formatOrdinal(northNodeHouse) : 'Unknown House')} and South Node in ${southNodeSign} in the ${southNodeHouseName || (southNodeHouse !== null && southNodeHouse !== undefined ? formatOrdinal(southNodeHouse) : 'Unknown House')}. Give thorough context about the nodal axis and its significance in the user's chart.

**The Core Karmic Lesson**
Provide comprehensive analysis of the core lesson as a shift from the comfort zone of the ${southNodeHouseName || 'South Node House'} (${southNodeHouseMeaning}) to the growth area of the ${northNodeHouseName || 'North Node House'} (${northNodeHouseMeaning}). What is the user being called to move away from? What are they being called to move toward? Give detailed insight into the karmic journey and soul evolution.

**Emotional Patterns to Break**
Directly interpret each challenging aspect to the Nodes listed above. Provide comprehensive analysis of what emotional patterns or behaviors these aspects indicate must be released or transformed. Be specific about how each aspect manifests. Give detailed guidance on recognizing and working with these patterns.

**Hidden Strengths**
Provide comprehensive analysis of what hidden strengths the South Node placement reveals. What gifts from past lives or early conditioning can be integrated rather than rejected? Give detailed insight into the talents and abilities carried forward.

**Old Cycles to Release**
Based on the South Node House placement, provide comprehensive analysis of what old cycles, patterns, or ways of being the user is meant to release. What no longer serves them? Give detailed explanation of the patterns to recognize and release.

**3-5 Practical Shadow Work Exercises** (3-5 specific exercises)
Provide exactly 3-5 specific, personalized shadow work exercises. For each exercise, provide comprehensive detail:
- Address themes of the ${southNodeHouseName || 'South Node House'} (what to release)
- Support growth in the ${northNodeHouseName || 'North Node House'} (what to move toward)
- Address the challenging aspects to the Nodes
- Be concrete, actionable, and specific
- Include comprehensive explanation of why this exercise is important for this person and how to practice it

**Integration and Growth**
Provide comprehensive guidance on how the user can integrate both the South Node gifts and the North Node calling. What is the path forward? Give detailed insight into the integration process and ongoing growth.

Write with depth, specificity, and warmth. Every interpretation must reference the specific house placements and explain how the karmic lessons manifest in those life areas.`;
}

/**
 * Closing Summary / Blessing Prompt
 * For premium reports - references the actual generated report content
 */
export function getClosingBlessingPrompt(data) {
  const { name, report_sections, report_type } = data;
  
  // Build summary of actual report content
  let reportSummary = '';
  if (report_sections && Array.isArray(report_sections)) {
    reportSummary = report_sections
      .filter(s => s.type !== 'closing') // Exclude closing if it exists
      .map(section => {
        const title = section.title || section.type || 'Section';
        // Use summary if available, otherwise extract from content
        let contentText = '';
        if (section.summary) {
          contentText = section.summary;
        } else {
          const content = section.content?.content || section.content || '';
          // Extract key points (first 300 chars of each section)
          contentText = content.substring(0, 300).replace(/\n/g, ' ').trim();
        }
        return `**${title}**:\n${contentText}${contentText.length >= 300 ? '...' : ''}`;
      })
      .join('\n\n');
  } else if (data.key_themes) {
    // Fallback to themes if sections not provided
    reportSummary = `Key themes from the reports: ${data.key_themes.join(', ')}`;
  }
  
  return `${SYSTEM_PROMPT}

Write a warm, uplifting closing message that references and integrates the ACTUAL reports that were just generated above.

User: ${name}
Report Type: ${report_type || 'Premium Report'}

**IMPORTANT**: The following reports have ALREADY been generated. Reference their specific findings and insights. Do NOT generate new readings.

Generated Reports Summary:
${reportSummary}

Your task:
1. Reference the specific insights from the Tarot reading that was already generated
2. Reference the specific moon phase guidance that was already provided
3. Reference the specific transit forecast insights that were already given
4. Synthesize these into a cohesive closing message
5. Provide forward-looking guidance based on what was already revealed
6. End with an inspirational blessing

DO NOT:
- Generate new tarot card interpretations
- Generate new moon phase readings
- Generate new transit forecasts
- Repeat the full content of the reports

DO:
- Reference specific cards, moon phases, or transits that were mentioned in the reports
- Summarize the key guidance that was already provided
- Connect the themes between the different reports
- Offer a blessing that ties everything together

Keep it warm, personal, and forward-looking. Provide comprehensive closing guidance that fully synthesizes all the report insights.`;
}

/**
 * Get prompt by report type
 */
export function getPromptByType(reportType, data) {
  const prompts = {
    'tarot': getTarotReadingPrompt,
    'moon_reading': getMoonReadingPrompt,
    'birth_chart': getBirthChartPrompt,
    'natal_chart': getBirthChartPrompt,
    'compatibility': getCompatibilityPrompt,
    'compatibility_report': getCompatibilityPrompt,
    'transit_forecast_short': getShortTransitPrompt,
    'transit_forecast_extended': getExtendedTransitPrompt,
    'destiny_path': getDestinyPathPrompt,
    'relationship_matrix': getRelationshipMatrixPrompt,
    'karmic_reading': getKarmicReadingPrompt,
    'shadow_work': getKarmicReadingPrompt,
    'closing_blessing': getClosingBlessingPrompt,
  };
  
  const getPrompt = prompts[reportType?.toLowerCase()];
  if (!getPrompt) {
    throw new Error(`Unknown report type: ${reportType}`);
  }
  
  return getPrompt(data);
}

