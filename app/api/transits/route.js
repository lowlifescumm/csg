import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { calculateActiveTransits, getCurrentPlanetaryPositions, getAffectedArea, getAspectNature, getTransitColor, calculateTransitPeakDate } from '@/lib/transits';
import { generateAllTransitInterpretations } from '@/lib/transit-interpretation';

// **THIS IS THE UPDATED PART**
// This configuration explicitly forces an SSL connection.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await pool.query(
      'SELECT role, stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const isAdmin = user.role === 'admin';
    const isPremium = user.stripe_subscription_id !== null && user.stripe_subscription_id !== '';

    if (!isAdmin && !isPremium) {
      return NextResponse.json({ 
        error: 'Premium subscription required',
        requiresPremium: true
      }, { status: 402 });
    }

    const chartResult = await pool.query(
      'SELECT * FROM birth_charts WHERE user_id = $1',
      [userId]
    );

    if (chartResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Birth chart required',
        needsBirthChart: true
      }, { status: 400 });
    }

    const chart = chartResult.rows[0];
    const chartData = typeof chart.chart_data === 'string' 
      ? JSON.parse(chart.chart_data) 
      : chart.chart_data;
    
    const userBirthChart = {
      planets: chartData.planets,
      houses: chartData.houses,
      ascendant: chartData.ascendant
    };

    const activeTransits = calculateActiveTransits(userBirthChart);
    
    const enrichedTransits = activeTransits.map(transit => {
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
        type: transit.intensity >= 7 ? 'major' : 'moderate'
      };
    });

    const majorTransits = enrichedTransits.filter(t => t.type === 'major').slice(0, 3);
    const interpretedTransits = await generateAllTransitInterpretations(majorTransits, userBirthChart);

    const allTransitsWithInterpretations = enrichedTransits.map(transit => {
      const interpreted = interpretedTransits.find(
        it => it.transitPlanet === transit.transitPlanet && it.natalPlanet === transit.natalPlanet
      );
      return interpreted || transit;
    });

    const currentPositions = getCurrentPlanetaryPositions();
    
    const sunSign = currentPositions.sun.sign;
    const moonSign = currentPositions.moon.sign;
    const avgIntensity = activeTransits.length > 0 
      ? Math.round(activeTransits.reduce((sum, t) => sum + t.intensity, 0) / activeTransits.length)
      : 0;

    return NextResponse.json({
      transits: allTransitsWithInterpretations,
      currentPositions,
      stats: {
        majorCount: allTransitsWithInterpretations.filter(t => t.type === 'major').length,
        moderateCount: allTransitsWithInterpretations.filter(t => t.type === 'moderate').length,
        totalActive: allTransitsWithInterpretations.length,
        averageIntensity: avgIntensity
      },
      userChart: {
        sunSign: chartData.planets.sun.sign,
        moonSign: chartData.planets.moon.sign,
        risingSign: chartData.ascendant.sign
      }
    });

  } catch (error) {
    console.error('Transit API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch transits',
      details: error.message
    }, { status: 500 });
  }
}
