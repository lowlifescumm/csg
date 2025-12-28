import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { pool } from '@/lib/db';
import { generatePremiumReport } from '@/lib/pdf-generator.js';
import { hydrateReportData } from '@/src/services/chartHydrator';

/**
 * Generate a premium report for a purchased order
 * This endpoint can be called by users to manually trigger generation
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get the order and verify it belongs to the user
    const orderResult = await pool.query(
      'SELECT * FROM premium_report_orders WHERE id = $1 AND user_id = $2',
      [orderId, decoded.userId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];

    // Check if partner data is required but missing (and not skipped)
    if ((order.report_type === 'ADVANCED' || order.report_type === 'MASTER') && 
        !order.skip_partner_data && !order.partner_data) {
      return NextResponse.json({
        error: 'Partner data required',
        message: 'Partner information is required for Advanced/Master reports. Please provide partner data or select to skip compatibility sections.',
        requiresPartnerData: true
      }, { status: 400 });
    }

    // Check if already generated
    if (order.status === 'completed' && order.report_pdf_url) {
      return NextResponse.json({
        success: true,
        message: 'Report already generated',
        pdfUrl: order.report_pdf_url,
        orderId: order.id,
      });
    }

    // Update status to processing
    await pool.query(
      'UPDATE premium_report_orders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['processing', orderId]
    );

    try {
      // Get user's birth chart data - try natal_charts first, then fallback to birth_charts
      let chartResult = await pool.query(
        'SELECT * FROM natal_charts WHERE user_id = $1 AND is_primary = true ORDER BY created_at DESC LIMIT 1',
        [decoded.userId]
      );

      // Fallback to old birth_charts table if natal_charts doesn't have data
      if (chartResult.rows.length === 0) {
        chartResult = await pool.query(
          'SELECT * FROM birth_charts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
          [decoded.userId]
        );
      }

      if (chartResult.rows.length === 0) {
        throw new Error('No birth chart found. Please create a birth chart first at /birth-chart');
      }

      const chartData = chartResult.rows[0];

      // Determine if this is from natal_charts or birth_charts table
      const isNatalCharts = chartData.hasOwnProperty('natal_positions');
      
      let birthDate, birthTime, birthCity, birthLatitude, birthLongitude;

      if (isNatalCharts) {
        // natal_charts table structure
        birthDate = chartData.birth_date;
        birthTime = chartData.birth_time;
        birthCity = chartData.location_name || chartData.location;
        birthLatitude = chartData.latitude;
        birthLongitude = chartData.longitude;
      } else {
        // birth_charts table structure
        birthDate = chartData.birth_date;
        birthTime = chartData.birth_time;
        birthCity = chartData.location;
        birthLatitude = chartData.latitude;
        birthLongitude = chartData.longitude;
      }

      // Validate required fields
      if (!birthDate || !birthTime || birthLatitude === undefined || birthLongitude === undefined) {
        throw new Error('Birth chart data is incomplete. Please recreate your birth chart at /birth-chart');
      }

      // Convert date to proper format if needed
      let formattedDate = birthDate;
      if (birthDate instanceof Date) {
        formattedDate = birthDate.toISOString().split('T')[0];
      } else if (typeof birthDate === 'string' && birthDate.includes('T')) {
        formattedDate = birthDate.split('T')[0];
      }

      // Hydrate report data
      const hydratedData = await hydrateReportData({
        name: user.first_name || user.email?.split('@')[0] || 'Beloved Seeker',
        birthDate: formattedDate,
        birthTime: birthTime,
        birthCity: birthCity || 'Unknown',
        birthLatitude: parseFloat(birthLatitude),
        birthLongitude: parseFloat(birthLongitude),
      });

      if (!hydratedData || !hydratedData.rawChart) {
        console.error('[Report Generation] Hydration failed:', {
          hasHydratedData: !!hydratedData,
          hasRawChart: !!hydratedData?.rawChart,
          hydratedDataKeys: hydratedData ? Object.keys(hydratedData) : []
        });
        throw new Error('Failed to hydrate birth chart data. Please recreate your birth chart at /birth-chart');
      }

      // Prepare data for report generation
      // The generatePremiumReport function expects natalChart to have birth_date, birth_time, location
      // Add these properties to rawChart if they don't exist
      const natalChartWithMetadata = {
        ...hydratedData.rawChart,
        birth_date: formattedDate,
        birth_time: birthTime,
        location: birthCity,
        latitude: parseFloat(birthLatitude),
        longitude: parseFloat(birthLongitude),
      };

      // Handle partner data for Advanced/Master reports
      let partnerChartData = null;
      let partnerName = 'Partner';

      if ((order.report_type === 'ADVANCED' || order.report_type === 'MASTER') && !order.skip_partner_data && order.partner_data) {
        // Parse partner data
        let partnerData;
        try {
          partnerData = typeof order.partner_data === 'string' 
            ? JSON.parse(order.partner_data) 
            : order.partner_data;
        } catch (e) {
          throw new Error('Invalid partner data format. Please provide partner information again.');
        }

        // Validate partner data has required fields
        if (!partnerData.birthDate || !partnerData.birthTime || 
            partnerData.latitude === undefined || partnerData.longitude === undefined) {
          throw new Error('Partner data is incomplete. Please provide birth date, birth time, and location coordinates.');
        }

        partnerName = partnerData.name || 'Partner';

        // Hydrate partner chart data
        const partnerHydratedData = await hydrateReportData({
          name: partnerName,
          birthDate: partnerData.birthDate,
          birthTime: partnerData.birthTime,
          birthCity: partnerData.birthCity || 'Unknown',
          birthLatitude: parseFloat(partnerData.latitude),
          birthLongitude: parseFloat(partnerData.longitude),
        });

        if (!partnerHydratedData || !partnerHydratedData.rawChart) {
          throw new Error('Failed to hydrate partner birth chart data.');
        }

        partnerChartData = {
          ...partnerHydratedData.rawChart,
          birth_date: partnerData.birthDate,
          birth_time: partnerData.birthTime,
          location: partnerData.birthCity,
          latitude: parseFloat(partnerData.latitude),
          longitude: parseFloat(partnerData.longitude),
        };
      }

      const reportData = {
        natalChart: natalChartWithMetadata,
        birth_chart_data: natalChartWithMetadata,
        name: user.first_name || user.email?.split('@')[0] || 'Beloved Seeker',
        birth_date: formattedDate,
        birth_time: birthTime,
        location: birthCity,
        // Include hydrated data for Essential reports (tarot, moon, transits)
        tarot_data: hydratedData.tarot_spread,
        moon_data: hydratedData.moon_data,
        transit_data: hydratedData.short_transits,
        // Include partner data for Advanced/Master reports (if provided)
        partner: partnerChartData,
        chart2: partnerChartData,
        pair: partnerChartData ? {
          user: natalChartWithMetadata,
          partner: partnerChartData,
        } : undefined,
        partner_name: partnerChartData ? partnerName : undefined,
        ...hydratedData,
      };

      // Generate report with progress callback
      const progressCallback = (progress, message) => {
        console.log(`[Report Generation ${orderId}] ${progress}%: ${message}`);
      };

      const report = await generatePremiumReport(
        order.report_type,
        reportData,
        progressCallback
      );

      // Update order with PDF URL and mark as completed
      await pool.query(
        `UPDATE premium_report_orders 
         SET status = $1, report_pdf_url = $2, report_data = $3, completed_at = NOW(), updated_at = NOW()
         WHERE id = $4`,
        [
          'completed',
          report.pdfUrl,
          JSON.stringify({
            sections: report.sections?.map(s => ({ type: s.type, title: s.title })),
            generatedAt: new Date().toISOString(),
          }),
          orderId,
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Report generated successfully',
        pdfUrl: report.pdfUrl,
        orderId: order.id,
      });
    } catch (error) {
      console.error(`[Report Generation ${orderId}] Error:`, error);

      // Update order with error
      await pool.query(
        'UPDATE premium_report_orders SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
        ['failed', error.message, orderId]
      );

      return NextResponse.json(
        { error: 'Failed to generate report', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Premium report generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
