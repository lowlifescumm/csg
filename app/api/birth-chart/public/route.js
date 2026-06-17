import { NextResponse } from 'next/server';
import { calculateBirthChart } from '@/lib/astrology.js';

/**
 * POST /api/birth-chart/public
 * Create a birth chart without authentication (preview/gated mode)
 * Does NOT save to database - just calculates and returns chart data
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { date, time, location, latitude, longitude } = body;

    if (!date || !time || !location || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Date, time, location, latitude, and longitude are all required'
      }, { status: 400 });
    }

    const latNumber = typeof latitude === 'number' ? latitude : parseFloat(latitude);
    const lonNumber = typeof longitude === 'number' ? longitude : parseFloat(longitude);

    // Validate coordinates
    if (isNaN(latNumber) || isNaN(lonNumber) || 
        latNumber < -90 || latNumber > 90 || 
        lonNumber < -180 || lonNumber > 180) {
      return NextResponse.json({
        error: 'Invalid coordinates',
        details: 'Latitude must be -90 to 90, longitude must be -180 to 180'
      }, { status: 400 });
    }

    // Calculate birth chart (this is the free part)
    const chartData = calculateBirthChart(date, time, latNumber, lonNumber);

    if (!chartData || !chartData.planets) {
      return NextResponse.json({
        error: 'Failed to calculate birth chart',
        details: 'Could not generate chart from provided birth data'
      }, { status: 500 });
    }

    // Return chart data WITHOUT interpretation
    // The user will be prompted to signup for the full interpretation
    return NextResponse.json({
      success: true,
      chart: chartData,
      message: 'Chart calculated successfully. Sign up to unlock your full interpretation!',
      gated: true,
      previewOnly: true
    });

  } catch (error) {
    console.error('Public birth chart calculation error:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate birth chart',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
