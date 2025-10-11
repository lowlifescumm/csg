import OpenAI from 'openai';
import { getAspectNature } from './transits.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTransitInterpretation(transit, userChart) {
  const aspectNature = getAspectNature(transit.aspect);
  const transitDescription = `${transit.transitPlanetName} ${transit.aspect} natal ${transit.natalPlanetName}`;
  
  const prompt = `You are an expert astrologer. Generate a personalized transit interpretation.

**Transit:** ${transitDescription}
**Intensity:** ${transit.intensity}/10
**Aspect Nature:** ${aspectNature}
**Affected House:** ${transit.affectedHouse}th house
**Current Transit Planet:** ${transit.transitPlanetName} in ${transit.transitSign}
**Natal Planet:** ${transit.natalPlanetName} in ${transit.natalSign}
**Orb:** ${transit.orb.toFixed(1)}° (${transit.isExact ? 'EXACT' : 'applying/separating'})

Generate a transit interpretation with these sections:

1. **Summary** (1 sentence, 15-20 words): Quick overview of what this transit means
2. **Full Guidance** (3-4 sentences, 80-100 words): Detailed explanation of the transit's meaning and impact
3. **Timing** (2 sentences): When this transit is strongest and how long it lasts
4. **Career Impact** (1-2 sentences): How this affects work/professional life
5. **Relationship Impact** (1-2 sentences): How this affects relationships
6. **Wellness Impact** (1-2 sentences): How this affects health/energy
7. **4 Action Steps** (4 bullet points): Specific, actionable advice

Style guidelines:
- Empowering and constructive (never doom/gloom)
- Specific to these exact planetary placements
- Practical and actionable
- Professional but warm tone
- ${aspectNature === 'challenging' ? 'Acknowledge challenges but emphasize growth opportunities' : 'Emphasize opportunities while noting caution areas'}

Return as JSON with keys: summary, fullGuidance, timing, career, relationships, wellness, advice (array of 4 strings)`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert astrologer with 20 years of experience in transit interpretation. You provide insightful, practical, and empowering guidance that helps people navigate planetary influences. You always format your responses as valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 800
    });

    const interpretation = JSON.parse(completion.choices[0].message.content);
    
    return {
      summary: interpretation.summary,
      fullGuidance: interpretation.fullGuidance,
      timing: interpretation.timing,
      areas: {
        career: interpretation.career,
        relationships: interpretation.relationships,
        wellness: interpretation.wellness
      },
      advice: interpretation.advice
    };

  } catch (error) {
    console.error('OpenAI interpretation error:', error);
    return generateBasicInterpretation(transit);
  }
}

function generateBasicInterpretation(transit) {
  const aspectNature = getAspectNature(transit.aspect);
  const transitDescription = `${transit.transitPlanetName} ${transit.aspect} ${transit.natalPlanetName}`;
  
  return {
    summary: `${transitDescription} is ${aspectNature === 'challenging' ? 'testing' : 'supporting'} your ${transit.natalPlanetName} energy.`,
    fullGuidance: `This transit brings ${aspectNature} energy to your life. ${transit.transitPlanetName} is currently ${transit.aspect} your natal ${transit.natalPlanetName}, creating a dynamic that affects your ${getAreaDescription(transit.natalPlanet)}. With an intensity of ${transit.intensity}/10, this is ${transit.intensity >= 7 ? 'a major' : 'a moderate'} influence that deserves your attention.`,
    timing: `This transit is ${transit.isExact ? 'exact now' : 'currently active'} with an orb of ${transit.orb.toFixed(1)}°. Its influence will be strongest over the coming days.`,
    areas: {
      career: `This energy affects your professional life through the ${transit.affectedHouse}th house.`,
      relationships: `Your connections are influenced by this ${aspectNature} aspect.`,
      wellness: `${transit.intensity >= 7 ? 'High energy - prioritize self-care' : 'Moderate energy levels - stay balanced'}.`
    },
    advice: [
      'Be aware of this planetary influence',
      `Work ${aspectNature === 'challenging' ? 'through challenges' : 'with opportunities'}`,
      'Stay grounded in your practices',
      'Trust your intuition during this time'
    ]
  };
}

function getAreaDescription(planet) {
  const areas = {
    sun: 'identity and life purpose',
    moon: 'emotions and inner security',
    mercury: 'communication and thinking',
    venus: 'relationships and values',
    mars: 'actions and desires',
    jupiter: 'growth and expansion',
    saturn: 'structure and discipline'
  };
  return areas[planet] || 'personal development';
}

export async function generateAllTransitInterpretations(transits, userChart) {
  const majorTransits = transits.filter(t => t.intensity >= 7).slice(0, 3);
  
  const interpretations = await Promise.all(
    majorTransits.map(transit => 
      generateTransitInterpretation(transit, userChart)
        .then(interp => ({ ...transit, interpretation: interp }))
    )
  );

  return interpretations;
}
