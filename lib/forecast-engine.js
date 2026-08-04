import { createRequire } from "module";
const require = createRequire(import.meta.url);
const logger = require('./logger');
/**
 * Forecast Generation Engine
 * 
 * Generates personalized daily/weekly forecasts based on:
 * - User's natal chart
 * - Current transits
 * - User preferences (tone, topics, length)
 * - Transit strength and relevance
 */

import { pool } from './db.js';
import { calculateActiveTransits, getCurrentPlanetaryPositions, mergeContinuousTransits, filterRoutineTransits } from './transits';
import Groq from 'groq-sdk';

let _groqClient;
function getGroq() {
  if (!_groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    _groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groqClient;
}

/**
 * Transit strength scoring
 * Used to rank and prioritize transits for forecasts
 */
export function calculateTransitStrength(transit) {
  let score = 0;
  
  // Base score by aspect type
  const aspectScores = {
    'conjunction': 10,
    'opposition': 9,
    'square': 8,
    'trine': 7,
    'sextile': 6,
    'quincunx': 4,
    'semisquare': 3,
    'sesquisquare': 3,
  };
  score += aspectScores[transit.aspect] || 2;
  
  // Planet importance multiplier
  const planetWeights = {
    'sun': 1.5,
    'moon': 1.5,
    'mercury': 1.2,
    'venus': 1.2,
    'mars': 1.3,
    'jupiter': 1.4,
    'saturn': 1.4,
    'uranus': 1.1,
    'neptune': 1.1,
    'pluto': 1.2,
  };
  const transitWeight = planetWeights[transit.transitPlanet] || 1.0;
  const natalWeight = planetWeights[transit.natalPlanet] || 1.0;
  score *= (transitWeight + natalWeight) / 2;
  
  // Orb tightness (closer = stronger)
  const orbScore = Math.max(0, 10 - transit.orb);
  score += orbScore * 0.5;
  
  // Exact aspect bonus
  if (transit.orb < 0.5) {
    score += 5;
  }
  
  return Math.round(score);
}

/**
 * Categorize transit by topic
 */
export function getTransitTopic(transit) {
  const { transitPlanet, natalPlanet, affectedHouse } = transit;
  
  // Venus/Mars = love
  if (['venus', 'mars'].includes(transitPlanet) || ['venus', 'mars'].includes(natalPlanet)) {
    return 'love';
  }
  
  // Saturn/Jupiter/MC/10th = career
  if (['saturn', 'jupiter'].includes(transitPlanet) || affectedHouse === 10) {
    return 'career';
  }
  
  // 6th house or health indicators
  if (affectedHouse === 6) {
    return 'health';
  }
  
  // Neptune/Pluto/12th = spirituality
  if (['neptune', 'pluto'].includes(transitPlanet) || affectedHouse === 12) {
    return 'spirituality';
  }
  
  return 'general';
}

/**
 * Find matching template for a transit
 */
export async function findTemplate(transit, tone = 'spiritual', topic = 'general') {
  const result = await pool.query(
    `SELECT * FROM forecast_templates 
     WHERE planet = $1 
       AND aspect = $2 
       AND (target = $3 OR target_type = 'natal_planet')
       AND topic = $4
       AND tone = $5
     ORDER BY priority DESC, strength DESC
     LIMIT 1`,
    [transit.transitPlanet, transit.aspect, transit.natalPlanet, topic, tone]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  
  // Fallback to general template
  const fallback = await pool.query(
    `SELECT * FROM forecast_templates 
     WHERE planet = $1 
       AND aspect = $2 
       AND topic = 'general'
       AND tone = $3
     ORDER BY priority DESC
     LIMIT 1`,
    [transit.transitPlanet, transit.aspect, tone]
  );
  
  return fallback.rows[0] || null;
}

/**
 * Fill template with transit data
 */
export function fillTemplate(template, transit, length = 'medium') {
  const templateKey = `${length}_template`;
  let text = template[templateKey] || template.short_template;
  
  const variables = {
    planet: transit.transitPlanetName || transit.transitPlanet,
    aspect: transit.aspect,
    target: transit.natalPlanetName || transit.natalPlanet,
    house: transit.affectedHouse || 'unknown',
    sign: transit.transitSign || '',
    natalSign: transit.natalSign || '',
    degree: Math.round(transit.transitLongitude || 0),
    orb: transit.orb?.toFixed(1) || '0.0',
  };
  
  // Replace template variables
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    text = text.replace(regex, variables[key]);
  });
  
  return text;
}

/**
 * Core daily forecast generation (used by both daily and weekly)
 */
async function generateDailyForecastCore(userBirthChart, forecastDate, options = {}) {
  const {
    length = 'medium',
    tone = 'spiritual',
    topics = ['general'],
    includeActions = true,
  } = options;

  // Calculate active transits for the specific date
  const rawTransits = calculateActiveTransits(userBirthChart, forecastDate);

  // Merge continuous slow-planet transits (same aspect, multiple nearby dates)
  // and filter routine lunar transits from key dates
  const mergedTransits = mergeContinuousTransits(rawTransits);
  const activeTransits = filterRoutineTransits(mergedTransits, {
    minIntensity: 4,
    keepLunarConjunctions: false,
  });

  // Score and rank transits
  const scoredTransits = activeTransits.map(transit => ({
    ...transit,
    strength: calculateTransitStrength(transit),
    topic: getTransitTopic(transit),
  }));

  // Sort by strength (highest first)
  scoredTransits.sort((a, b) => b.strength - a.strength);

  // Filter by user's topic preferences
  const relevantTransits = scoredTransits.filter(t =>
    topics.includes('all') || topics.includes(t.topic) || topics.includes('general')
  );

  // Select top transits (3 for daily mini-forecast)
  const topTransits = relevantTransits.slice(0, 3);

  if (topTransits.length === 0) {
    return {
      headline: 'Quiet Cosmic Day',
      theme: 'A time for rest and integration',
      transitSummary: [],
      suggestedActions: ['Rest and recharge', 'Reflect on recent experiences'],
      topics: ['general'],
      urgency: 'low',
      confidenceScore: 'high',
    };
  }

  // Generate text for each transit
  const transitTexts = [];
  const allActions = [];
  const transitSummary = [];

  for (const transit of topTransits) {
    const template = await findTemplate(transit, tone, transit.topic);

    let text = '';
    if (template) {
      text = fillTemplate(template, transit, length);

      // Add actions from template
      if (includeActions && template.default_actions) {
        const actions = typeof template.default_actions === 'string'
          ? JSON.parse(template.default_actions)
          : template.default_actions;
        allActions.push(...actions.slice(0, 1));
      }
    } else {
      text = `${transit.transitPlanetName || transit.transitPlanet} forms a ${transit.aspect} with your natal ${transit.natalPlanetName || transit.natalPlanet}. This is a significant cosmic influence affecting your ${transit.topic} sector.`;
    }

    transitTexts.push(text);

    transitSummary.push({
      planet: transit.transitPlanet,
      aspect: transit.aspect,
      to: transit.natalPlanet,
      orb: transit.orb,
      strength: transit.strength > 15 ? 'high' : transit.strength > 10 ? 'medium' : 'low',
      topic: transit.topic,
    });
  }

  const primaryTransit = topTransits[0];
  const headline = `${primaryTransit.transitPlanetName} ${primaryTransit.aspect} ${primaryTransit.natalPlanetName}`;
  const theme = transitTexts[0]?.split('.')[0] || 'Cosmic energies are active today';
  let fullText = transitTexts.join('\n\n');

  const avgStrength = topTransits.reduce((sum, t) => sum + t.strength, 0) / topTransits.length;
  const urgency = avgStrength > 15 ? 'high' : avgStrength > 10 ? 'normal' : 'low';
  const confidence = topTransits[0].orb < 1 ? 'high' : topTransits[0].orb < 2 ? 'medium' : 'low';

  return {
    headline,
    theme,
    fullText,
    transitSummary,
    suggestedActions: allActions.slice(0, 3),
    topics: [...new Set(topTransits.map(t => t.topic))],
    urgency,
    confidenceScore: confidence,
  };
}

/**
 * Generate forecast for a user on a specific date
 */
export async function generateForecast(userId, forecastDate = new Date(), options = {}) {
  const {
    type = 'daily',
    length = 'medium',
    tone = 'spiritual',
    topics = ['general'],
    includeActions = true,
    aiRewrite = false,
  } = options;

  // Get user's natal chart
  let chart = await pool.query(
    'SELECT * FROM natal_charts WHERE user_id = $1 AND is_primary = true',
    [userId]
  );

  // Fallback to old birth_charts table
  if (chart.rows.length === 0) {
    chart = await pool.query(
      'SELECT * FROM birth_charts WHERE user_id = $1',
      [userId]
    );

    if (chart.rows.length === 0) {
      throw new Error('No natal chart found for user');
    }
  }

  const natalChart = chart.rows[0];
  const userBirthChart = {
    planets: natalChart.natal_positions || (typeof natalChart.chart_data === 'string'
      ? JSON.parse(natalChart.chart_data).planets
      : natalChart.chart_data.planets),
    houses: natalChart.houses || (typeof natalChart.chart_data === 'string'
      ? JSON.parse(natalChart.chart_data).houses
      : natalChart.chart_data.houses),
    ascendant: natalChart.ascendant || (typeof natalChart.chart_data === 'string'
      ? JSON.parse(natalChart.chart_data).ascendant
      : natalChart.chart_data.ascendant),
  };

  // For weekly forecasts, generate day-by-day breakdown
  let dayBreakdown = null;
  let weeklyTransits = [];
  let weeklyActions = [];
  let weeklyTopics = new Set();
  let weeklyUrgencyScores = [];

  if (type === 'weekly') {
    dayBreakdown = [];
    const startDate = new Date(forecastDate);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);

      const dayForecast = await generateDailyForecastCore(userBirthChart, dayDate, {
        length,
        tone,
        topics,
        includeActions,
      });

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dayDate.getDay()];

      dayBreakdown.push({
        day: dayName,
        date: dayDate.toISOString().split('T')[0],
        headline: dayForecast.headline,
        theme: dayForecast.theme,
        fullText: dayForecast.fullText,
        transitSummary: dayForecast.transitSummary,
        suggestedActions: dayForecast.suggestedActions,
        urgency: dayForecast.urgency,
      });

      // Aggregate for weekly summary
      weeklyTransits.push(...dayForecast.transitSummary);
      weeklyActions.push(...dayForecast.suggestedActions);
      dayForecast.topics.forEach(t => weeklyTopics.add(t));
      weeklyUrgencyScores.push(dayForecast.urgency === 'high' ? 3 : dayForecast.urgency === 'normal' ? 2 : 1);
    }

    // Deduplicate transits across the week by planet+aspect+to
    // For slow planets, merge duplicate entries (same planet-aspect-to) keeping tightest orb
    const transitMap = new Map();
    weeklyTransits.forEach(t => {
      const key = `${t.planet}-${t.aspect}-${t.to}`;
      const isSlow = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(t.planet);
      if (!transitMap.has(key)) {
        transitMap.set(key, { ...t, continuous: false, occurrences: [t] });
      } else {
        const existing = transitMap.get(key);
        if (isSlow) {
          if (t.orb < existing.orb) {
            transitMap.set(key, { ...t, continuous: true, occurrences: [...existing.occurrences, t] });
          } else {
            existing.occurrences.push(t);
          }
        } else {
          transitMap.set(key, t);
        }
      }
    });
    weeklyTransits = Array.from(transitMap.values()).map(t => t.occurrences ? t : t);
    weeklyTransits.sort((a, b) => {
      const sa = a.strength === 'high' ? 3 : a.strength === 'medium' ? 2 : 1;
      const sb = b.strength === 'high' ? 3 : b.strength === 'medium' ? 2 : 1;
      return sb - sa;
    });

    // Determine weekly urgency from average
    const avgUrgency = weeklyUrgencyScores.reduce((a, b) => a + b, 0) / weeklyUrgencyScores.length;
    const weeklyUrgency = avgUrgency > 2.3 ? 'high' : avgUrgency > 1.6 ? 'normal' : 'low';

    // Build weekly summary text
    const weekStart = dayBreakdown[0]?.day;
    const weekEnd = dayBreakdown[6]?.day;
    const weeklyHeadline = `Weekly Overview: ${weekStart} – ${weekEnd}`;
    const weeklyTheme = `This week brings ${weeklyTopics.size > 1 ? 'multiple cosmic themes' : 'a focused cosmic theme'} across ${weeklyTransits.length} active transits.`;

    let weeklyFullText = `## Weekly Themes\n\n${weeklyTheme}\n\n`;
    weeklyFullText += `### Day-by-Day Breakdown\n\n`;
    dayBreakdown.forEach(day => {
      weeklyFullText += `**${day.day}** — ${day.headline}\n${day.theme}\n\n`;
      if (day.transitSummary && day.transitSummary.length > 0) {
        weeklyFullText += `Key transits: ${day.transitSummary.map(t => `${t.planet} ${t.aspect} ${t.to}`).join(', ')}\n\n`;
      }
    });

    weeklyFullText += `### Week at a Glance\n\n`;
    weeklyFullText += `Active transits this week: ${weeklyTransits.map(t => `${t.planet} ${t.aspect} ${t.to}`).join(', ')}.\n`;
    weeklyFullText += `Focus areas: ${Array.from(weeklyTopics).join(', ')}.\n`;

    // AI rewrite for premium users
    if (aiRewrite && process.env.OPENAI_API_KEY) {
      try {
        weeklyFullText = await rewriteWithAI(weeklyFullText, tone, userId);
      } catch (error) {
        logger.error('AI rewrite failed:', error);
      }
    }

    return {
      userId,
      forecastDate,
      forecastType: type,
      length,
      headline: weeklyHeadline,
      theme: weeklyTheme,
      fullText: weeklyFullText,
      tone,
      transitSummary: weeklyTransits.slice(0, 10),
      topics: Array.from(weeklyTopics),
      urgency: weeklyUrgency,
      confidenceScore: 'medium',
      suggestedActions: [...new Set(weeklyActions)].slice(0, 5),
      rituals: null,
      dayBreakdown,
    };
  }

  // Daily forecast path (unchanged behavior)
  const dailyForecast = await generateDailyForecastCore(userBirthChart, forecastDate, {
    length,
    tone,
    topics,
    includeActions,
  });

  let fullText = dailyForecast.fullText;

  // AI rewrite for premium users
  if (aiRewrite && process.env.OPENAI_API_KEY) {
    try {
      fullText = await rewriteWithAI(fullText, tone, userId);
    } catch (error) {
      logger.error('AI rewrite failed:', error);
    }
  }

  return {
    userId,
    forecastDate,
    forecastType: type,
    length,
    headline: dailyForecast.headline,
    theme: dailyForecast.theme,
    fullText,
    tone,
    transitSummary: dailyForecast.transitSummary,
    topics: dailyForecast.topics,
    urgency: dailyForecast.urgency,
    confidenceScore: dailyForecast.confidenceScore,
    suggestedActions: dailyForecast.suggestedActions,
    rituals: null,
    dayBreakdown: null,
  };
}

/**
 * Generate gentle forecast when no significant transits are active
 */
export async function generateGentleForecast(userId, forecastDate, { length, tone }) {
  const gentle = {
    headline: 'Quiet Cosmic Day',
    theme: 'A time for rest and integration',
    fullText: length === 'short' 
      ? 'The planets are in a gentle phase today. Focus on rest, integration, and daily routines.'
      : 'Today brings a quieter cosmic energy. With no major transits activating your chart, this is an excellent time to rest, integrate recent experiences, and tend to daily routines. Sometimes the most productive thing you can do is simply be present.',
    transitSummary: [],
    topics: ['general'],
    urgency: 'low',
    confidenceScore: 'high',
    suggestedActions: ['Rest and recharge', 'Reflect on recent experiences', 'Handle routine tasks'],
  };
  
  return {
    userId,
    forecastDate,
    forecastType: 'daily',
    length,
    tone,
    ...gentle,
  };
}

/**
 * Generate AI text for a single transit (when no template exists)
 */
export async function generateAITransitText(transit, tone, length) {
  const tonePrompts = {
    spiritual: 'mystical and soulful language with cosmic perspective',
    practical: 'actionable and grounded language with real-world focus',
    concise: 'brief and direct language, 2-3 sentences max',
    detailed: 'comprehensive and nuanced language with full context',
  };
  
  const lengthPrompts = {
    short: '2-3 sentences',
    medium: '1 paragraph (4-6 sentences)',
    long: '2 paragraphs (8-12 sentences)',
  };
  
  const prompt = `Write an astrological forecast for this transit:
- Transiting ${transit.transitPlanetName || transit.transitPlanet} ${transit.aspect} natal ${transit.natalPlanetName || transit.natalPlanet}
- House affected: ${transit.affectedHouse || 'unknown'}
- Topic: ${transit.topic}
- Orb: ${transit.orb?.toFixed(1)}°

Write in a ${tonePrompts[tone] || 'balanced'} style.
Length: ${lengthPrompts[length] || 'medium'}.
Be warm, supportive, and insightful. Focus on the practical and spiritual implications.`;

  const completion = await getGroq().chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: 'You are an experienced astrologer creating personalized transit forecasts. Write clear, insightful interpretations that help people understand and work with cosmic energies.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: length === 'short' ? 100 : length === 'long' ? 300 : 200,
    temperature: 0.7,
  });
  
  return completion.choices[0].message.content;
}

/**
 * AI rewrite for premium personalization
 */
export async function rewriteWithAI(text, tone, userId) {
  const tonePrompts = {
    spiritual: 'mystical and soulful language, cosmic perspective',
    practical: 'actionable and grounded language, real-world focus',
    concise: 'brief and direct language, key points only',
    detailed: 'comprehensive and nuanced language, full context',
  };
  
  const completion = await getGroq().chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: `You are a skilled astrologer creating personalized daily forecasts. Rewrite the following forecast in a ${tonePrompts[tone] || 'balanced'} style. Keep the core astrological insights but make it feel personal and engaging. Maintain accuracy while being warm and supportive.`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
  });
  
  return completion.choices[0].message.content;
}

/**
 * Save forecast to database
 */
export async function saveForecast(forecast) {
  const result = await pool.query(
    `INSERT INTO forecasts
      (user_id, forecast_date, forecast_type, length, headline, theme, full_text,
       tone, transit_summary, topics, urgency, confidence_score, suggested_actions,
       rituals, cache_key, expires_at, day_breakdown)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     ON CONFLICT (user_id, forecast_date, forecast_type)
     DO UPDATE SET
       length = EXCLUDED.length,
       headline = EXCLUDED.headline,
       theme = EXCLUDED.theme,
       full_text = EXCLUDED.full_text,
       tone = EXCLUDED.tone,
       transit_summary = EXCLUDED.transit_summary,
       topics = EXCLUDED.topics,
       urgency = EXCLUDED.urgency,
       confidence_score = EXCLUDED.confidence_score,
       suggested_actions = EXCLUDED.suggested_actions,
       day_breakdown = EXCLUDED.day_breakdown,
       generated_at = CURRENT_TIMESTAMP
     RETURNING id`,
    [
      forecast.userId,
      forecast.forecastDate,
      forecast.forecastType,
      forecast.length,
      forecast.headline,
      forecast.theme,
      forecast.fullText,
      forecast.tone,
      JSON.stringify(forecast.transitSummary),
      forecast.topics,
      forecast.urgency,
      forecast.confidenceScore,
      JSON.stringify(forecast.suggestedActions),
      forecast.rituals ? JSON.stringify(forecast.rituals) : null,
      `${forecast.userId}-${forecast.forecastDate}-${forecast.forecastType}`,
      new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h cache
      forecast.dayBreakdown ? JSON.stringify(forecast.dayBreakdown) : null,
    ]
  );

  return result.rows[0].id;
}

/**
 * Get user's forecast preferences (with defaults)
 */
export async function getForecastPreferences(userId) {
  const result = await pool.query(
    'SELECT * FROM forecast_preferences WHERE user_id = $1',
    [userId]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  
  // Return defaults
  return {
    user_id: userId,
    delivery_cadence: 'daily',
    delivery_time: '08:00:00',
    timezone: 'America/Los_Angeles',
    tone: 'spiritual',
    default_length: 'medium',
    topics: ['general'],
    include_actions: true,
    include_rituals: false,
    ai_rewrite_enabled: false,
    email_enabled: true,
    push_enabled: false,
  };
}

/**
 * Get forecasts for a user in a date range
 */
export async function getUserForecasts(userId, daysBack = 7) {
  const result = await pool.query(
    `SELECT * FROM forecasts 
     WHERE user_id = $1 
       AND forecast_date >= CURRENT_DATE - INTERVAL '${daysBack} days'
     ORDER BY forecast_date DESC, forecast_type ASC`,
    [userId]
  );
  
  return result.rows;
}

