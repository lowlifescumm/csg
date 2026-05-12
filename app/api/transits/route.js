const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db.js';
import {
  calculateActiveTransits,
  getCurrentPlanetaryPositions,
  getAffectedArea,
  getAspectNature,
  getTransitColor,
  calculateTransitPeakDate,
} from '@/lib/transits';
import { generateAllTransitInterpretations } from '@/lib/transit-interpretation';
import { getUserTransits, updateTransitStatuses } from '@/lib/transit-engine.js';
import { getAuthenticatedUser } from '@/lib/auth';
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = authResult;
    const searchParams = req.nextUrl?.searchParams;
    const mode = searchParams?.get('mode') || 'live';
    const windowDays = parseInt(searchParams?.get('windowDays') || '30', 10);

    const accessCheck = await canAccessReading(userId, 'TRANSIT_TRACKING');
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'insufficient_credits') {
        return NextResponse.json({
          error: 'Insufficient credits',
          details: `Transit Tracking requires ${accessCheck.required} credits`,
          cost: accessCheck.required,
        }, { status: 402 });
      }
      return NextResponse.json({ error: 'Access denied', details: accessCheck.reason }, { status: 403 });
    }

    const creditResult = await consumeCreditsForReading(userId, 'TRANSIT_TRACKING');
    if (!creditResult.success) {
      const errorResponse = formatCreditError(creditResult);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    let chartResult = await pool.query(
      'SELECT * FROM natal_charts WHERE user_id = $1 AND is_primary = true',
      [userId],
    );

    if (chartResult.rows.length === 0) {
      chartResult = await pool.query(
        'SELECT * FROM birth_charts WHERE user_id = $1',
        [userId],
      );

      if (chartResult.rows.length === 0) {
        return NextResponse.json({ error: 'Birth chart required', needsBirthChart: true }, { status: 400 });
      }

      const chart = chartResult.rows[0];
      const chartData = typeof chart.chart_data === 'string'
        ? JSON.parse(chart.chart_data)
        : chart.chart_data;

      const userBirthChart = {
        planets: chartData.planets,
        houses: chartData.houses,
        ascendant: chartData.ascendant,
      };

      const activeTransits = calculateActiveTransits(userBirthChart);
      const enrichedTransits = await enrichTransitsOldFormat(activeTransits, userBirthChart);
      const currentPositions = getCurrentPlanetaryPositions();

      return NextResponse.json({
        transits: enrichedTransits,
        currentPositions,
        stats: calculateStats(enrichedTransits),
        userChart: {
          sunSign: chartData.planets.sun.sign,
          moonSign: chartData.planets.moon.sign,
          risingSign: chartData.ascendant,
        },
        mode: 'legacy',
      });
    }

    const natalChart = chartResult.rows[0];
    const natalChartId = natalChart.id;

    if (mode === 'database') {
      await updateTransitStatuses();
      const dbTransits = await getUserTransits(userId, windowDays);
      const enrichedTransits = await enrichTransitsFromDatabase(dbTransits, natalChart);
      const currentPositions = getCurrentPlanetaryPositions();

      return NextResponse.json({
        transits: enrichedTransits,
        currentPositions,
        stats: calculateStats(enrichedTransits),
        userChart: {
          sunSign: natalChart.natal_positions.sun.sign,
          moonSign: natalChart.natal_positions.moon.sign,
          risingSign: natalChart.ascendant?.sign || natalChart.ascendant,
        },
        mode: 'database',
        transitCount: dbTransits.length,
      });
    }

    const userBirthChart = {
      planets: natalChart.natal_positions,
      houses: natalChart.houses,
      ascendant: natalChart.ascendant,
    };

    // Calculate premium data points for transits
    const { calculateTransitsToHouseCusps, calculateProgressedChart, calculateExactTime } = await import('@/lib/transit-engine.js');
    
    // Calculate transits to house cusps
    const cuspTransits = await calculateTransitsToHouseCusps({
      natal_positions: natalChart.natal_positions,
      houses: natalChart.houses
    }).catch(() => []);
    
    // Calculate progressed chart (need birth date from natal chart)
    const birthDate = natalChart.birth_date || new Date();
    const progressedChart = calculateProgressedChart(
      {
        planets: natalChart.natal_positions,
        houses: natalChart.houses
      },
      birthDate
    );
    
    const activeTransits = calculateActiveTransits(userBirthChart);
    
    // Add exact dates to active transits (premium data point)
    function formatDate(date) {
      if (!date) return null;
      const d = new Date(date);
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    
    const transitsWithExactDates = await Promise.all(
      activeTransits.map(async (transit) => {
        if (transit.aspect === 'conjunction' && transit.orb < 5) {
          try {
            const transitBody = transit.transitPlanet.charAt(0).toUpperCase() + transit.transitPlanet.slice(1);
            const natalLong = userBirthChart.planets[transit.natalPlanet].longitude;
            const exactDate = await calculateExactTime(
              transitBody,
              natalLong,
              0, // Conjunction
              new Date(),
              90
            );
            return {
              ...transit,
              exactDate: exactDate,
              exactDateFormatted: exactDate ? formatDate(exactDate) : null
            };
          } catch (error) {
            return transit;
          }
        }
        return transit;
      })
    );
    
    const enrichedTransits = transitsWithExactDates.map((transit) => {
      const aspectNature = getAspectNature(transit.aspect);
      const affectedArea = getAffectedArea(transit.natalPlanet, transit.affectedHouse);
      const color = getTransitColor(transit.intensity, aspectNature);
      const peakInfo = calculateTransitPeakDate(transit.transitPlanet, userBirthChart.planets[transit.natalPlanet].longitude);

      return {
        ...transit,
        affectedArea,
        aspectNature,
        color,
        peakDate: peakInfo.date,
        daysUntilPeak: peakInfo.daysUntil,
        type: transit.intensity >= 7 ? 'major' : 'moderate',
      };
    });

    const majorTransits = enrichedTransits.filter((t) => t.type === 'major').slice(0, 3);
    const interpretedTransits = await generateAllTransitInterpretations(majorTransits, userBirthChart);

    const allTransitsWithInterpretations = enrichedTransits.map((transit) => {
      const interpreted = interpretedTransits.find(
        (it) => it.transitPlanet === transit.transitPlanet && it.natalPlanet === transit.natalPlanet,
      );
      return interpreted || transit;
    });

    const currentPositions = getCurrentPlanetaryPositions();
    const avgIntensity = transitsWithExactDates.length > 0
      ? Math.round(transitsWithExactDates.reduce((sum, t) => sum + (t.intensity || 0), 0) / transitsWithExactDates.length)
      : 0;

    return NextResponse.json({
      transits: allTransitsWithInterpretations,
      currentPositions,
      stats: {
        majorCount: allTransitsWithInterpretations.filter((t) => t.type === 'major').length,
        moderateCount: allTransitsWithInterpretations.filter((t) => t.type === 'moderate').length,
        totalActive: allTransitsWithInterpretations.length,
        averageIntensity: avgIntensity,
      },
      // Premium data points
      cuspTransits: cuspTransits || [],
      progressedChart: progressedChart || null,
      userChart: {
        sunSign: userBirthChart.planets.sun?.sign,
        moonSign: userBirthChart.planets.moon?.sign,
        risingSign: userBirthChart.ascendant?.sign || userBirthChart.ascendant,
      },
      mode: 'live',
    });
  } catch (error) {
    logger.error('Transit API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transits', details: error.message },
      { status: 500 },
    );
  }
}

async function enrichTransitsOldFormat(transits, userBirthChart) {
  const enriched = transits.map((transit) => {
    const aspectNature = getAspectNature(transit.aspect);
    const affectedArea = getAffectedArea(transit.natalPlanet, transit.affectedHouse);
    const color = getTransitColor(transit.intensity, aspectNature);
    const peakInfo = calculateTransitPeakDate(transit.transitPlanet, userBirthChart.planets[transit.natalPlanet].longitude);

    return {
      ...transit,
      affectedArea,
      aspectNature,
      color,
      peakDate: peakInfo.date,
      daysUntilPeak: peakInfo.daysUntil,
      type: transit.intensity >= 7 ? 'major' : 'moderate',
    };
  });

  const majorTransits = enriched.filter((t) => t.type === 'major').slice(0, 3);
  const interpretedTransits = await generateAllTransitInterpretations(majorTransits, userBirthChart);

  return enriched.map((transit) => {
    const interpreted = interpretedTransits.find(
      (it) => it.transitPlanet === transit.transitPlanet && it.natalPlanet === transit.natalPlanet,
    );
    return interpreted || transit;
  });
}

async function enrichTransitsFromDatabase(dbTransits, natalChart) {
  return dbTransits.map((transit) => {
    const now = new Date();
    const exactTime = new Date(transit.exact_time);
    const daysUntilPeak = Math.ceil((exactTime - now) / (1000 * 60 * 60 * 24));

    return {
      transitPlanet: transit.transiting_body.toLowerCase(),
      transitPlanetName: transit.transiting_body,
      transitSign: getSignForBody(transit.transiting_body),
      natalPlanet: transit.natal_point.toLowerCase(),
      natalPlanetName: transit.natal_point,
      natalSign: natalChart.natal_positions[transit.natal_point.toLowerCase()]?.sign || 'Unknown',
      aspect: transit.aspect,
      orb: parseFloat(transit.orb),
      intensity: Math.round(transit.strength_score / 10),
      strengthScore: transit.strength_score,
      isExact: transit.orb < 1,
      affectedHouse: transit.affected_house || 1,
      affectedArea: getHouseMeaning(transit.affected_house || 1),
      aspectNature: getAspectNature(transit.aspect),
      color: getTransitColorFromStrength(transit.strength_score, getAspectNature(transit.aspect)),
      peakDate: exactTime,
      daysUntilPeak: daysUntilPeak,
      type: transit.strength_score >= 70 ? 'major' : 'moderate',
      status: transit.status,
      interpretation: transit.interpretation || null,
    };
  });
}

function getSignForBody(body) {
  const positions = getCurrentPlanetaryPositions();
  return positions[body.toLowerCase()]?.sign || 'Unknown';
}

function getHouseMeaning(houseNumber) {
  const meanings = {
    1: 'Self & Identity',
    2: 'Money & Values',
    3: 'Communication',
    4: 'Home & Family',
    5: 'Creativity & Romance',
    6: 'Work & Health',
    7: 'Partnerships',
    8: 'Transformation',
    9: 'Philosophy & Travel',
    10: 'Career & Status',
    11: 'Friends & Community',
    12: 'Spirituality & Unconscious',
  };
  return meanings[houseNumber] || 'Unknown';
}

function getTransitColorFromStrength(strength, aspectNature) {
  if (aspectNature === 'challenging' && strength >= 70) return 'red';
  if (aspectNature === 'challenging' && strength >= 50) return 'orange';
  if (aspectNature === 'beneficial') return 'green';
  return 'purple';
}

function calculateStats(transits) {
  const majorCount = transits.filter((t) => t.type === 'major').length;
  const moderateCount = transits.filter((t) => t.type === 'moderate').length;
  const totalActive = transits.length;
  const avgIntensity = totalActive > 0
    ? Math.round(transits.reduce((sum, t) => sum + (t.intensity || t.strengthScore / 10 || 0), 0) / totalActive)
    : 0;

  return {
    majorCount,
    moderateCount,
    totalActive,
    averageIntensity: avgIntensity,
  };
}

