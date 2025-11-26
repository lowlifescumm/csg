import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAuthenticatedUser } from '@/lib/auth.js';
import { hydrateReportData } from '@/src/services/chartHydrator';

/**
 * POST /api/birth-chart/human-design
 * Calculate human design data for a birth chart
 */
export async function POST(req) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(req.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { birthDate, birthTime, latitude, longitude, chart } = body;

    if (!birthDate || !birthTime || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Birth date, time, latitude, and longitude are all required'
      }, { status: 400 });
    }

    // Use hydrateReportData to calculate human design
    const hydrationInput = {
      name: 'Human Design Calculation',
      birthDate,
      birthTime,
      birthCity: 'Unknown',
      birthLatitude: parseFloat(latitude),
      birthLongitude: parseFloat(longitude),
    };

    const hydrated = await hydrateReportData(hydrationInput);

    if (!hydrated.humanDesign) {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to calculate human design data'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      humanDesign: hydrated.humanDesign
    });
  } catch (error) {
    console.error('Error calculating human design:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to calculate human design data',
      details: error.message
    }, { status: 500 });
  }
}

