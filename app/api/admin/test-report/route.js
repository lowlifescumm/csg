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

    // ============================================
    // STEP 1: UNWRAP THE PAYLOAD (Input Layer) - AGGRESSIVE DATA EXTRACTION
    // ============================================
    const root = body.data || body;

    // AGGRESSIVE User Data Extraction - Check ALL possible paths
    const userSource = root.birth_chart_data || root.user || root;
    const userBirthDate = root.birth_chart_data?.birth_date || 
                          root.birth_date || 
                          root.user?.birthDate || 
                          root.user?.birth_date ||
                          userSource.birth_date || 
                          userSource.birthDate;
    
    // AGGRESSIVE Partner Data Extraction - Check ALL possible paths (CRITICAL FIX)
    const partnerBirthDate = root.compatibility_data?.partner?.birth_date || 
                             root.compatibility_data?.partner?.birthDate ||
                             root.partner_birth_date ||
                             root.partner?.birthDate ||
                             root.partner?.birth_date ||
                             root.partner_birthDate ||
                             (root.compatibility_data?.partner ? root.compatibility_data.partner.birth_date || root.compatibility_data.partner.birthDate : null) ||
                             (root.partner ? root.partner.birth_date || root.partner.birthDate : null);
    
    const partnerBirthTime = root.compatibility_data?.partner?.birth_time ||
                             root.compatibility_data?.partner?.birthTime ||
                             root.partner_birth_time ||
                             root.partner?.birthTime ||
                             root.partner?.birth_time ||
                             root.partner_birthTime ||
                             (root.compatibility_data?.partner ? root.compatibility_data.partner.birth_time || root.compatibility_data.partner.birthTime : null) ||
                             (root.partner ? root.partner.birth_time || root.partner.birthTime : null);
    
    const partnerSource = root.compatibility_data?.partner || root.partner;

    // CRITICAL: Log partner date detection for debugging
    console.log('🔍 DETECTED PARTNER DATE:', partnerBirthDate);
    console.log('🔍 Partner Source Found:', !!partnerSource);
    console.log('🔍 Partner Data Paths Checked:', {
      'compatibility_data.partner.birth_date': root.compatibility_data?.partner?.birth_date,
      'partner_birth_date': root.partner_birth_date,
      'partner.birthDate': root.partner?.birthDate,
      'partner.birth_date': root.partner?.birth_date,
    });

    // ============================================
    // STEP 2: MAP TO STANDARD INTERFACE
    // ============================================
    const hydrationInput = {
      // User fields
      name: userSource.name,
      birthDate: userBirthDate,
      birthTime: userSource.birth_time || userSource.birthTime,
      birthCity: userSource.location || userSource.birthCity,
      birthLatitude: userSource.latitude || userSource.lat,
      birthLongitude: userSource.longitude || userSource.lng,

      // Partner fields (only if partner data exists)
      ...(partnerBirthDate && {
        partnerBirthDate: partnerBirthDate,
        partnerBirthTime: partnerBirthTime || partnerSource?.birth_time || partnerSource?.birthTime,
        partnerBirthCity: partnerSource?.location || partnerSource?.partnerCity || partnerSource?.partnerLocation,
        partnerBirthLatitude: partnerSource?.latitude || partnerSource?.partnerLat,
        partnerBirthLongitude: partnerSource?.longitude || partnerSource?.partnerLng,
      }),
    };

    console.log('ROUTE INPUT:', JSON.stringify(hydrationInput, null, 2));

    // Validate required user fields
    if (!hydrationInput.name || !hydrationInput.birthDate || !hydrationInput.birthTime) {
      return NextResponse.json(
        { error: 'Missing required user fields: name, birthDate, birthTime' },
        { status: 400 }
      );
    }

    if (!hydrationInput.birthCity && (!hydrationInput.birthLatitude || !hydrationInput.birthLongitude)) {
      return NextResponse.json(
        { error: 'Missing location: birthCity or (birthLatitude and birthLongitude)' },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 3: CALL THE HYDRATOR (Calculation Layer)
    // ============================================
    let calculatedData;
    try {
      calculatedData = await hydrateReportData(hydrationInput);
      console.log('HYDRATOR OUTPUT:', JSON.stringify({
        hasPartner: !!calculatedData.partner,
        partnerSun: calculatedData.partner?.sun?.sign,
        matrixScores: calculatedData.matrix_scores,
      }, null, 2));
    } catch (hydrationError) {
      console.error('[Test Report] Chart hydration failed:', hydrationError);
      return NextResponse.json(
        { error: 'Failed to hydrate chart data', details: hydrationError.message },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 4: VALIDATION GATE (Safety Check)
    // ============================================
    if (hydrationInput.partnerBirthDate && !calculatedData.partner) {
      throw new Error("CRITICAL FAILURE: Partner input received, but Hydrator returned NULL partner data.");
    }

    if (calculatedData.partner && (!calculatedData.partner.sun || !calculatedData.partner.sun.sign)) {
      throw new Error("CRITICAL FAILURE: Partner data exists, but Sun Sign was not calculated.");
    }

    console.log("✅ DATA VALIDATION PASSED. Partner Sun Sign:", calculatedData.partner?.sun?.sign);
    console.log("✅ Matrix Scores:", calculatedData.matrix_scores ? JSON.stringify(calculatedData.matrix_scores) : 'null');

    // ============================================
    // STEP 4.5: CRITICAL VALIDATION GATE (Safety Net)
    // ============================================
    // Stop the report if data is missing (especially for MASTER reports)
    if (report_type === 'MASTER' && hydrationInput.partnerBirthDate && !calculatedData.partner?.sun?.sign) {
      throw new Error(
        "Pipeline Error: Partner date provided, but Partner Sun Sign was not calculated. " +
        `Partner Date: ${hydrationInput.partnerBirthDate}, ` +
        `Partner Sun: ${calculatedData.partner?.sun?.sign || 'MISSING'}`
      );
    }

    // Additional validation for any report type with partner data
    if (hydrationInput.partnerBirthDate && !calculatedData.partner) {
      throw new Error(
        "Pipeline Error: Partner date provided, but Partner chart was not calculated. " +
        `Partner Date: ${hydrationInput.partnerBirthDate}`
      );
    }

    // ============================================
    // STEP 5: PREPARE DATA FOR REPORT GENERATION
    // ============================================
    // Sample data if not provided
    const sampleData = data || getSampleData(report_type);

    if (!sampleData) {
      return NextResponse.json({ error: `No sample data available for ${report_type}` }, { status: 400 });
    }

    // Merge calculated data into sampleData
    if (calculatedData && calculatedData.user) {
      // Build natal chart payload for user
      const natalChart = buildNatalChartPayload(calculatedData.user, hydrationInput);
      if (natalChart) {
        sampleData.natalChart = natalChart;
        sampleData.birth_chart_data = natalChart;
      }

      // Add user chart data
      sampleData.user = calculatedData.user;
      sampleData.chart1 = calculatedData.user;

      // Add partner data if it exists
      if (calculatedData.partner) {
        sampleData.partner = calculatedData.partner;
        sampleData.chart2 = calculatedData.partner;
        sampleData.compatibility_data = {
          ...sampleData.compatibility_data,
          partner: calculatedData.partner,
          user: calculatedData.user || natalChart,
        };
      }

      // Add matrix scores if they exist
      if (calculatedData.matrix_scores) {
        sampleData.matrix_scores = calculatedData.matrix_scores;
        if (sampleData.matrix_data) {
          sampleData.matrix_data.matrix_scores = calculatedData.matrix_scores;
        }
      }

      // Add compatibility score
      if (calculatedData.compatibility_score !== undefined) {
        sampleData.compatibility_score = calculatedData.compatibility_score;
        if (sampleData.compatibility_data) {
          sampleData.compatibility_data.compatibility_score = calculatedData.compatibility_score;
        }
      }

      // Add chartData for prompt generation (full structure)
      sampleData.chartData = calculatedData;

      // Map Essential Report data from hydrator to report generator format
      if (report_type === 'ESSENTIAL' && calculatedData.user) {
        // Map tarot_spread to tarot_data.card_spread
        if (calculatedData.user.tarot_spread) {
          sampleData.tarot_data = {
            name: hydrationInput.name,
            card_spread: calculatedData.user.tarot_spread.map(card => ({
              card: card.card,
              position: card.position,
              orientation: card.orientation,
            })),
            // Include sun sign for prompt
            sun_sign: calculatedData.user.sunSign,
          };
        }

        // Map moon_data (already in correct format, but ensure sun_sign is included)
        if (calculatedData.user.moon_data) {
          sampleData.moon_data = {
            ...calculatedData.user.moon_data,
            name: hydrationInput.name,
            natal_moon_sign: calculatedData.user.moonSign, // User's natal moon sign
            sun_sign: calculatedData.user.sunSign, // User's sun sign
          };
        }

        // Map short_transits to transit_data.transits
        if (calculatedData.user.short_transits) {
          sampleData.transit_data = {
            name: hydrationInput.name,
            date_range: `Next 14 days from ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
            transits: calculatedData.user.short_transits,
            short_transits: calculatedData.user.short_transits, // Also include for prompt compatibility
          };
        }
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

