/**
 * Report Generation Prompts
 * Master templates for PDF report generation
 */

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
  
  return `${SYSTEM_PROMPT}

Generate a deeply synthesized, premium birth chart reading. The analysis MUST be built around the most specific data points provided.

User: ${name}

**Core Synthesis Data:**

- Sun-Sign-House: ${sunSignHouse}
- Moon-Sign-House: ${moonSignHouse}
- Ascendant-Sign-House: ${risingSignHouse}
- Chart Ruler: ${chartRulerPlanet} in ${chartRulerHouse}

**Key Psychological Tension (Major Aspects):**

- ${majorAspectsList}

**Instruction:**

1. **Integrate House Placements:** Every interpretation must reference the House (the *where*) as much as the Sign (the *how*). For example, if the Sun is in Gemini in the 7th House, explain how Gemini's communication style manifests specifically in the realm of partnerships and relationships.

2. **Synthesize the Triad:** The core identity section must explain how the Sun, Moon, and Rising *clash or cooperate* based on their signs and houses. Do they work in harmony, or create internal tension? How do their house placements create a unique life focus?

3. **Focus on Aspects:** The "Strengths and Challenges" section must be primarily an interpretation of the major natal aspects listed above, explaining the internal tension they create. For example, "Sun Square Saturn" creates a specific psychological pattern—explain what that means for this person's life.

4. **Actionable Guidance:** Provide one specific, personalized action step for each major planet's placement. Base these actions on the planet's sign AND house combination.

**Structure your reading with these sections:**

**Core Identity Synthesis** (4-5 sentences)
Synthesize how Sun, Moon, and Rising interact based on their signs and houses. Explain the unique identity they create together.

**Planetary Analysis** (2-3 sentences per major planet)
For each major planet (Mercury, Venus, Mars, Jupiter, Saturn), explain:
- What the planet represents (the *what*)
- How it expresses through its sign (the *how*)
- Where it manifests through its house (the *where*)
- One specific action step for working with this energy

**Strengths and Challenges** (4-5 sentences)
Interpret the major natal aspects listed above. Explain what internal tensions or harmonies they create. Be specific about how these aspects shape the person's psychology and life patterns.

**Life Themes** (3-4 sentences)
Based on the house placements and aspects, what are the primary life themes? What areas of life demand attention?

**Spiritual Path** (2-3 sentences)
What does the chart reveal about the person's spiritual journey and karmic lessons?

Write with depth, specificity, and warmth. Every interpretation must reference both sign AND house.`;
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
  const houseNames = {
    1: '1st House (Ascendant)', 2: '2nd House', 3: '3rd House', 4: '4th House (IC)',
    5: '5th House', 6: '6th House', 7: '7th House (Descendant)', 8: '8th House',
    9: '9th House', 10: '10th House (Midheaven)', 11: '11th House', 12: '12th House'
  };
  return houseNames[houseNum] || `${houseNum}th House`;
}

/**
 * Compatibility Report Prompt
 */
export function getCompatibilityPrompt(data) {
  const { user, partner, aspects, compatibility_score } = data;
  
  return `${SYSTEM_PROMPT}

Write a compatibility reading between the two people based on their charts and aspects.

User Chart:
${JSON.stringify(user, null, 2)}

Partner Chart:
${JSON.stringify(partner, null, 2)}

Aspects:
${JSON.stringify(aspects, null, 2)}

Compatibility Score: ${compatibility_score}/100

Include:
- Emotional chemistry
- Communication flow
- Strengths of the relationship
- Sources of friction or misunderstanding
- Long-term potential and cycles
- Advice for harmony and growth`;
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
 * Transit Forecast - Extended (30-90 Days) Prompt
 */
export function getExtendedTransitPrompt(data) {
  const { name, date_range, transits } = data;
  
  return `${SYSTEM_PROMPT}

Create a long-range transit forecast based on the transits provided.

User: ${name}
Date Range: ${date_range}

Transits:
${JSON.stringify(transits, null, 2)}

For each week:
- Describe the energetic theme
- Key planetary influences
- Opportunities, challenges, and patterns

Include:
- Career influences
- Love/relationship influences
- Emotional/inner growth patterns

End with a text-only energy progression overview.`;
}

/**
 * Destiny Path Cycle Reading Prompt
 */
export function getDestinyPathPrompt(data) {
  const { cycle_name, start_date, end_date, themes } = data;
  
  return `${SYSTEM_PROMPT}

Write a destiny path cycle reading explaining the meaning and impact of this astrological cycle.

Cycle: ${cycle_name}
Start Date: ${start_date}
End Date: ${end_date}
Themes: ${themes.join(', ')}

Explain:
- The meaning of the cycle
- What lesson this cycle brings
- How long it lasts
- How it shapes identity, relationships, career, and spiritual growth
- What the user should embrace vs avoid`;
}

/**
 * Relationship Matrix Prompt
 */
export function getRelationshipMatrixPrompt(data) {
  const { pair, matrix_scores } = data;
  
  return `${SYSTEM_PROMPT}

Create a Relationship Matrix interpretation.

User Chart:
${JSON.stringify(pair.user, null, 2)}

Partner Chart:
${JSON.stringify(pair.partner, null, 2)}

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
- How to improve or harmonize each area`;
}

/**
 * Shadow Work / Karmic Reading Prompt
 */
export function getKarmicReadingPrompt(data) {
  const { placements, aspects, nodes } = data;
  
  return `${SYSTEM_PROMPT}

Generate a karmic and shadow reading using the user's nodes, aspects, and challenging placements.

Placements:
${JSON.stringify(placements, null, 2)}

Aspects:
${JSON.stringify(aspects, null, 2)}

Nodes:
- North Node: ${nodes.north_node}
- South Node: ${nodes.south_node}

Include:
- Core karmic lesson
- Emotional patterns to break
- Hidden strengths
- Old cycles the user is meant to release
- Practical shadow work guidance`;
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

Keep it warm, personal, and forward-looking. Length: 150-250 words.`;
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

