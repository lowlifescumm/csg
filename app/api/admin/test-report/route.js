import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateReportContent, generatePDF, generatePremiumReport } from '@/lib/pdf-generator.js';
import { hydrateReportData, buildNatalChartPayload } from '@/src/services/chartHydrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to test report generation
 * POST /api/admin/test-report
 * 
 * Body: {
 *   report_type: 'tarot' | 'moon_reading' | 'birth_chart' | 'compatibility' | etc.
 *   data: { ... } // Optional, uses sample data if not provided
 * }
 */
export async function POST(request) {
  try {
    // Authenticate user - allow admin or authenticated users for testing
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For production, restrict to admin only. For testing, you might want to allow your own account
    // Uncomment the line below to restrict to admin only:
    // if (authResult.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    // }

    const body = await request.json();
    const { report_type, data, generate_html = true, generate_pdf = true, regenerate = false } = body;

    if (!report_type) {
      return NextResponse.json({ error: 'report_type is required' }, { status: 400 });
    }

    // Sample data if not provided
    const sampleData = data || getSampleData(report_type);

    if (!sampleData) {
      return NextResponse.json({ error: `No sample data available for ${report_type}` }, { status: 400 });
    }

    // Hydrate natal chart data for premium reports if raw inputs were provided
    const chartInput = sampleData?.natalChart || sampleData?.birth_chart_data;
    const hydrationInput = (!hasPopulatedPlanetData(chartInput) && chartInput)
      ? buildHydrationInput(chartInput, sampleData)
      : null;

    if (hydrationInput) {
      try {
        const calculatedData = await hydrateReportData(hydrationInput);
        const natalChart = buildNatalChartPayload(calculatedData, hydrationInput);

        if (natalChart) {
          sampleData.natalChart = natalChart;
          sampleData.birth_chart_data = natalChart;
          console.log('DEBUG CHART DATA:', JSON.stringify(natalChart, null, 2));
        }
      } catch (hydrationError) {
        console.error('[Test Report] Chart hydration failed:', hydrationError);
        return NextResponse.json(
          { error: 'Failed to hydrate chart data', details: hydrationError.message },
          { status: 400 }
        );
      }
    }

    const progressCallback = (percent, message) => {
      console.log(`[Test Report] ${percent}%: ${message}`);
    };

    let result;

    // Handle premium reports
    if (report_type.startsWith('premium-') || ['ESSENTIAL', 'ADVANCED', 'MASTER'].includes(report_type.toUpperCase())) {
      const tier = report_type.replace('premium-', '').toUpperCase();
      result = await generatePremiumReport(tier, sampleData, progressCallback);
    } else {
      // Regular reports
      result = await generateReportContent(report_type, sampleData, progressCallback);
      
      if (generate_html || generate_pdf) {
        const pdfResult = await generatePDF(report_type, sampleData, result);
        result.html = pdfResult.html;
        result.pdfUrl = pdfResult.pdfUrl;
      }
    }

    const clientAcceptsHtml = (request.headers.get('accept') || '').includes('text/html');

    if (
      generate_pdf &&
      !result?.pdfUrl &&
      result?.html &&
      clientAcceptsHtml
    ) {
      return new Response(result.html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    return NextResponse.json({
      success: true,
      report_type,
      content: result.content || result.sections?.map(s => s.content).join('\n\n---\n\n'),
      sections: result.sections,
      html: result.html,
      pdfUrl: result.pdfUrl,
      metadata: {
        content_length: result.content?.length || 0,
        sections_count: result.sections?.length || 0,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Test Report] Error:', error);
    return NextResponse.json(
      { error: 'Report generation failed', details: error.message },
      { status: 500 }
    );
  }
}

function getSampleData(reportType) {
  const samples = {
    tarot: {
      name: 'Test User',
      card_spread: [
        { card: 'The High Priestess', position: 'Present', orientation: 'Upright' },
        { card: 'The Tower', position: 'Challenge', orientation: 'Reversed' },
        { card: 'The Star', position: 'Future', orientation: 'Upright' },
      ],
    },
    moon_reading: {
      name: 'Test User',
      moon_phase: 'Waxing Crescent',
      phase_energy: 'Growth and intention setting',
      sun_sign: 'Gemini',
      moon_sign: 'Pisces',
    },
    birth_chart: {
      name: 'Test User',
      sun: 'Gemini',
      moon: 'Pisces',
      rising: 'Sagittarius',
      planets: {
        mercury: 'Taurus',
        venus: 'Cancer',
        mars: 'Leo',
        jupiter: 'Aries',
        saturn: 'Capricorn',
      },
      houses: {
        '1': 'Sagittarius',
        '2': 'Capricorn',
        '3': 'Aquarius',
      },
      aspects: [
        { planet1: 'Sun', planet2: 'Moon', type: 'Trine', orb: 3.5 },
      ],
    },
    compatibility: {
      user: { sun: 'Gemini', moon: 'Pisces', rising: 'Sagittarius' },
      partner: { sun: 'Scorpio', moon: 'Taurus', rising: 'Cancer' },
      aspects: [],
      compatibility_score: 82,
    },
    transit_forecast_short: {
      name: 'Test User',
      date_range: 'Feb 4–Feb 18, 2025',
      transits: [
        { aspect: 'Mars trine Sun', date: 'Feb 6', description: 'Energy boost' },
        { aspect: 'Mercury square Saturn', date: 'Feb 9', description: 'Communication challenges' },
      ],
    },
    transit_forecast_extended: {
      name: 'Test User',
      date_range: 'Feb 1–Apr 30, 2025',
      transits: [
        { aspect: 'Mars trine Sun', date: 'Feb 6' },
        { aspect: 'Saturn return begins', date: 'Mar 15' },
      ],
    },
    ESSENTIAL: {
      name: 'Test User',
      tarot_data: {
        name: 'Test User',
        card_spread: [{ card: 'The High Priestess', position: 'Present', orientation: 'Upright' }],
      },
      moon_data: {
        name: 'Test User',
        moon_phase: 'Waxing Crescent',
        phase_energy: 'Growth',
        sun_sign: 'Gemini',
        moon_sign: 'Pisces',
      },
      transit_data: {
        name: 'Test User',
        date_range: 'Feb 4–Feb 18, 2025',
        transits: [{ aspect: 'Mars trine Sun', date: 'Feb 6' }],
      },
    },
    ADVANCED: {
      name: 'Test User',
      birth_chart_data: {
        name: 'Test User',
        sun: 'Gemini',
        moon: 'Pisces',
        rising: 'Sagittarius',
        planets: {},
        houses: {},
        aspects: [],
      },
      compatibility_data: {
        user: { sun: 'Gemini' },
        partner: { sun: 'Scorpio' },
        aspects: [],
        compatibility_score: 82,
      },
      transit_data: {
        name: 'Test User',
        date_range: 'Feb 1–Apr 30, 2025',
        transits: [],
      },
    },
    MASTER: {
      name: 'Test User',
      birth_chart_data: {
        name: 'Test User',
        sun: 'Gemini',
        moon: 'Pisces',
        rising: 'Sagittarius',
        planets: {},
        houses: {},
        aspects: [],
      },
      compatibility_data: {
        user: { sun: 'Gemini' },
        partner: { sun: 'Scorpio' },
        aspects: [],
        compatibility_score: 82,
      },
      transit_data: {
        name: 'Test User',
        date_range: 'Feb 1–Apr 30, 2025',
        transits: [],
      },
      destiny_data: {
        cycle_name: 'Saturn Return',
        start_date: '2024-07-01',
        end_date: '2026-02-14',
        themes: ['Responsibility', 'Transformation'],
      },
      matrix_data: {
        pair: {
          user: { sun: 'Gemini' },
          partner: { sun: 'Scorpio' },
        },
        matrix_scores: {
          emotional: 78,
          communication: 64,
          spiritual: 85,
          stability: 71,
          physical: 88,
        },
      },
      karmic_data: {
        placements: {},
        aspects: [],
        nodes: { north_node: 'Aries', south_node: 'Libra' },
      },
    },
  };

  return samples[reportType] || samples[reportType.toUpperCase()];
}

function hasPopulatedPlanetData(chart) {
  if (!chart) return false;
  if (chart.planets && Object.keys(chart.planets).length > 0) {
    return true;
  }
  
  // Some data structures might store the core triad at the top level (strings or objects)
  const sunSign = chart.sun?.sign || chart.sun;
  const moonSign = chart.moon?.sign || chart.moon;
  const risingSign = chart.rising?.sign || chart.rising || chart.ascendant;
  
  return Boolean(sunSign || moonSign || risingSign);
}

function buildHydrationInput(chartInput, fallbackData = {}) {
  if (!chartInput) return null;
  
  const birthDate = chartInput.birth_date || chartInput.birthDate;
  const birthTime = chartInput.birth_time || chartInput.birthTime;
  const birthCity = chartInput.birthCity || chartInput.location || fallbackData.birthCity || fallbackData.location;
  const latitude = parseMaybeNumber(
    chartInput.latitude ?? chartInput.lat ?? chartInput.birth_latitude ??
    fallbackData.latitude ?? fallbackData.lat ?? fallbackData.birth_latitude
  );
  const longitude = parseMaybeNumber(
    chartInput.longitude ?? chartInput.lng ?? chartInput.birth_longitude ??
    fallbackData.longitude ?? fallbackData.lng ?? fallbackData.birth_longitude
  );
  
  if (!birthDate || !birthTime) {
    return null;
  }
  
  if (!birthCity && (latitude === null || longitude === null)) {
    return null;
  }
  
  const input = {
    name: chartInput.name || fallbackData.name || 'Test User',
    birthDate,
    birthTime,
  };
  
  if (birthCity) {
    input.birthCity = birthCity;
  }
  
  if (latitude !== null && longitude !== null) {
    input.birthLatitude = latitude;
    input.birthLongitude = longitude;
  }
  
  return input;
}

function parseMaybeNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

