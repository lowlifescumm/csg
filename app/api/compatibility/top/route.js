const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';
import { calculateCompatibilityScores } from '@/lib/compatibility';
import { zodiacSigns } from '@/lib/zodiac-data';

/**
 * Get top compatibility matches for a user based on their birth chart
 */
export async function GET(request) {
  try {
    let userId = null;

    // Check for NextAuth session first
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch (nextAuthError) {
      // Continue to JWT fallback
    }

    // Fall back to JWT token
    if (!userId) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (token) {
          const decoded = verifyToken(token);
          if (decoded?.userId) {
            userId = decoded.userId;
          }
        }
      } catch (error) {
        // Continue without user
      }
    }

    // Get userId from query params if not from auth
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    if (userIdParam && !userId) {
      userId = parseInt(userIdParam);
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Get user's birth chart (most recent if is_primary not set)
    const { rows: chartRows } = await pool.query(
      `SELECT chart_data FROM birth_charts 
       WHERE user_id = $1 
       ORDER BY is_primary DESC NULLS LAST, created_at DESC LIMIT 1`,
      [userId]
    );

    if (chartRows.length === 0) {
      // Return sun sign matches if no birth chart
      const matches = getSunSignMatches(null);
      return NextResponse.json({
        success: true,
        matches: matches.slice(0, 5),
        message: 'No birth chart found. Showing general sun sign compatibility.'
      });
    }

    const userChartData = typeof chartRows[0].chart_data === 'string'
      ? JSON.parse(chartRows[0].chart_data)
      : chartRows[0].chart_data;

    if (!userChartData || !userChartData.planets) {
      return NextResponse.json(
        { success: false, error: 'Invalid birth chart data' },
        { status: 400 }
      );
    }

    // Calculate compatibility with all signs
    const matches = [];
    for (const sign of zodiacSigns) {
      // Create a simplified chart for this sign (using average positions)
      const signChart = createSignChart(sign.name);
      
      // Calculate compatibility
      const scores = calculateCompatibilityScores(userChartData, signChart);
      
      // Generate reasons
      const reasons = generateCompatibilityReasons(userChartData, signChart, scores);
      
      matches.push({
        sign: sign.name,
        score: scores.overall,
        compatibility: scores.overall,
        element: sign.element,
        reason: reasons[0] || `${sign.element} sign compatibility`,
        reasons
      });
    }

    // Sort by score (highest first) and take top 5
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 5);

    return NextResponse.json({
      success: true,
      matches: topMatches
    });
  } catch (error) {
    logger.error('Compatibility top API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to calculate compatibility matches'
      },
      { status: 500 }
    );
  }
}

/**
 * Create a simplified chart for a zodiac sign
 * Uses average planetary positions for that sign
 */
function createSignChart(signName) {
  // Base longitude for each sign (middle of sign)
  const signLongitudes = {
    'Aries': 15, 'Taurus': 45, 'Gemini': 75, 'Cancer': 105,
    'Leo': 135, 'Virgo': 165, 'Libra': 195, 'Scorpio': 225,
    'Sagittarius': 255, 'Capricorn': 285, 'Aquarius': 315, 'Pisces': 345
  };

  const baseLongitude = signLongitudes[signName] || 15;
  
  // Create a simplified chart with planets in the same sign
  // This is a simplified approach - in reality, planets would be in different signs
  return {
    planets: {
      sun: { sign: signName, longitude: baseLongitude },
      moon: { sign: signName, longitude: baseLongitude + 10 },
      mercury: { sign: signName, longitude: baseLongitude + 5 },
      venus: { sign: signName, longitude: baseLongitude + 15 },
      mars: { sign: signName, longitude: baseLongitude + 20 },
      jupiter: { sign: signName, longitude: baseLongitude + 25 },
      saturn: { sign: signName, longitude: baseLongitude + 30 }
    },
    ascendant: signName
  };
}

/**
 * Generate compatibility reasons based on scores and chart comparisons
 */
function generateCompatibilityReasons(userChart, signChart, scores) {
  const reasons = [];

  // Check Sun-Moon synastry
  if (userChart.planets.sun.sign === signChart.planets.moon.sign) {
    reasons.push('Sun-Moon synastry creates deep emotional understanding');
  }
  if (userChart.planets.moon.sign === signChart.planets.sun.sign) {
    reasons.push('Moon-Sun synastry creates natural emotional harmony');
  }

  // Check element compatibility
  const userSunElement = getElement(userChart.planets.sun.sign);
  const signElement = getElement(signChart.planets.sun.sign);
  
  if (userSunElement === signElement) {
    reasons.push(`Both ${userSunElement} signs share similar energy and values`);
  } else if (areCompatibleElements(userSunElement, signElement)) {
    reasons.push(`${userSunElement} and ${signElement} elements complement each other`);
  }

  // Check Venus-Mars aspects
  if (userChart.planets.venus.sign === signChart.planets.mars.sign) {
    reasons.push('Venus-Mars conjunction creates strong romantic attraction');
  }
  if (userChart.planets.mars.sign === signChart.planets.venus.sign) {
    reasons.push('Mars-Venus synastry indicates passionate chemistry');
  }

  // Check Mercury compatibility
  if (userChart.planets.mercury.sign === signChart.planets.mercury.sign) {
    reasons.push('Matching Mercury signs enable clear communication');
  }

  // Check Saturn/Jupiter for long-term
  if (getElement(userChart.planets.saturn.sign) === getElement(signChart.planets.saturn.sign)) {
    reasons.push('Saturn alignment suggests long-term stability potential');
  }

  // Add score-based reasons
  if (scores.emotional > 70) {
    reasons.push('Strong emotional connection potential');
  }
  if (scores.communication > 70) {
    reasons.push('Excellent communication compatibility');
  }
  if (scores.passion > 70) {
    reasons.push('High romantic chemistry');
  }
  if (scores.longTerm > 70) {
    reasons.push('Strong long-term relationship potential');
  }

  // Default reason if none found
  if (reasons.length === 0) {
    reasons.push(`${signElement} sign compatibility`);
  }

  return reasons.slice(0, 3); // Return top 3 reasons
}

/**
 * Get element from sign
 */
function getElement(sign) {
  const elements = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water'
  };
  return elements[sign] || 'Fire';
}

/**
 * Check if two elements are compatible
 */
function areCompatibleElements(el1, el2) {
  const compatible = {
    Fire: ['Air', 'Fire'],
    Earth: ['Water', 'Earth'],
    Air: ['Fire', 'Air'],
    Water: ['Earth', 'Water']
  };
  return compatible[el1]?.includes(el2) || false;
}

/**
 * Get sun sign matches when no birth chart is available
 */
function getSunSignMatches(userSign) {
  const elementGroups = {
    Fire: ['Leo', 'Sagittarius', 'Aries'],
    Earth: ['Taurus', 'Virgo', 'Capricorn'],
    Air: ['Gemini', 'Libra', 'Aquarius'],
    Water: ['Cancer', 'Scorpio', 'Pisces']
  };

  // If we know the user's sign, prefer same element
  // Otherwise return general good matches
  if (userSign) {
    const userElement = getElement(userSign);
    const sameElement = elementGroups[userElement] || [];
    return sameElement.map(sign => ({
      sign,
      score: 85,
      compatibility: 85,
      element: userElement,
      reason: `${userElement} sign compatibility`,
      reasons: [`Both ${userElement} signs share similar energy and values`]
    }));
  }

  // Default: return Fire signs as good general matches
  return ['Leo', 'Sagittarius', 'Gemini', 'Libra', 'Aquarius'].map(sign => ({
    sign,
    score: 80,
    compatibility: 80,
    element: getElement(sign),
    reason: 'General compatibility',
    reasons: ['Good energy match']
  }));
}
