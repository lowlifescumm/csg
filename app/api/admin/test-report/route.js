import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateReportContent, generatePDF, generatePremiumReport } from '@/lib/pdf-generator.js';

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
    // Authenticate user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    if (!authResult || authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const body = await request.json();
    const { report_type, data, generate_html = true } = body;

    if (!report_type) {
      return NextResponse.json({ error: 'report_type is required' }, { status: 400 });
    }

    // Sample data if not provided
    const sampleData = data || getSampleData(report_type);

    if (!sampleData) {
      return NextResponse.json({ error: `No sample data available for ${report_type}` }, { status: 400 });
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
      
      if (generate_html) {
        const html = await generatePDF(report_type, sampleData, result);
        result.html = html.html;
        result.pdfUrl = html.pdfUrl;
      }
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

