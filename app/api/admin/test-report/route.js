import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateReportContent, generatePDF, generatePremiumReport, generatePdfFromHtml, uploadPdfToCloudinary } from '@/lib/pdf-generator.js';
import { hydrateReportData, buildNatalChartPayload } from '@/src/services/chartHydrator';
import { renderTemplatePDF, getDefaultTemplate, getTemplate, renderFromTemplate, flattenReportData } from '@/lib/template-renderer.js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter.js';
import { generateCacheKey, getCachedHtml, setCachedHtml } from '@/lib/template-cache.js';
import { getCachedReportData, setCachedReportData, hasCachedReportData, clearCachedReportData } from '@/lib/report-data-cache.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to test report generation
 * POST /api/admin/test-report?engine=puppeteer|template&templateId=<id>
 * 
 * Query Parameters:
 *   - engine: 'puppeteer' (default) or 'template' to use pdfme templates
 *   - templateId: Template ID or slug (required if engine=template)
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
    const isAuthenticated = !!authResult;
    const isAdmin = authResult?.role === 'admin';
    const userId = authResult?.userId?.toString() || null;
    
    // Rate limiting for unauthenticated requests
    if (!isAuthenticated) {
      const clientId = getClientIdentifier(request, userId);
      const rateLimit = checkRateLimit(clientId, 5, 60000); // 5 requests per minute for unauthenticated
      
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please authenticate or wait before trying again.',
            retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': rateLimit.resetAt.toString(),
            },
          }
        );
      }
    }
    
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For production, restrict to admin only. For testing, you might want to allow your own account
    // Uncomment the line below to restrict to admin only:
    // if (authResult.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    // }

    // Get query parameters for engine selection
    // Priority: 1. Query param ?engine=... 2. Environment variable REPORT_ENGINE 3. Default 'puppeteer'
    const { searchParams } = new URL(request.url);
    const engineOverride = searchParams.get('engine');
    const defaultEngine = process.env.REPORT_ENGINE || 'puppeteer';
    const engine = engineOverride || defaultEngine;
    const templateId = searchParams.get('templateId');
    const usePremiumGenerator = searchParams.get('premium') === 'true' || engine === 'premium';
    
    console.log('[Test Report] Engine selection:', {
      override: engineOverride,
      envDefault: defaultEngine,
      selected: engine,
      usePremiumGenerator,
    });

    const body = await request.json();
    const { report_type, data, generate_html = true, generate_pdf = true, regenerate = false, useCache = true, clearCache = false } = body;
    
    // Handle cache clearing
    if (clearCache) {
      clearCachedReportData(report_type);
      return NextResponse.json({ 
        success: true, 
        message: `Cache cleared for ${report_type}` 
      });
    }

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

    // AGGRESSIVE Partner Name Extraction - Check ALL possible paths (CRITICAL FIX)
    const partnerName = 
      root.compatibility_data?.partner?.name ||        // Nested Master Payload
      root.partner_name ||                             // Flat Payload
      root.partnerName ||                              // Camel Case
      root.partner?.name ||                            // Partner object
      (partnerSource?.name) ||                         // From partnerSource
      'The Partner';                                   // Safe Default (NEVER use root.name or user name)

    // CRITICAL: Log partner date and name detection for debugging
    console.log('🔍 DETECTED PARTNER DATE:', partnerBirthDate);
    console.log('🔍 DETECTED PARTNER NAME:', partnerName);
    console.log('🔍 Partner Source Found:', !!partnerSource);
    console.log('🔍 Partner Data Paths Checked:', {
      'compatibility_data.partner.birth_date': root.compatibility_data?.partner?.birth_date,
      'compatibility_data.partner.name': root.compatibility_data?.partner?.name,
      'partner_birth_date': root.partner_birth_date,
      'partner_name': root.partner_name,
      'partner.birthDate': root.partner?.birthDate,
      'partner.name': root.partner?.name,
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
        partnerName: partnerName, // CRITICAL: Pass partner name explicitly
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
        // CRITICAL: Pass partner name explicitly for prompt generation
        sampleData.partner_name = calculatedData.partner.name || hydrationInput.partnerName || 'The Partner';
        sampleData.compatibility_data = {
          ...sampleData.compatibility_data,
          partner: calculatedData.partner,
          partner_name: calculatedData.partner.name || hydrationInput.partnerName || 'The Partner', // Explicit partner name
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

      // CRITICAL: Ensure aspects are available for all report types
      if (calculatedData.user?.aspects) {
        sampleData.aspects = calculatedData.user.aspects;
        // Also add to natalChart for backward compatibility
        if (sampleData.natalChart) {
          sampleData.natalChart.aspects = calculatedData.user.aspects;
        }
      }

      // CRITICAL: Pass composite chart data to compatibility prompts
      if (calculatedData.composite) {
        sampleData.composite = calculatedData.composite;
        // Also add to compatibility_data for backward compatibility
        if (sampleData.compatibility_data) {
          sampleData.compatibility_data.composite = calculatedData.composite;
        }
      }

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
            natalChart: natalChart, // Include natalChart for extended transit calculations
          };
        }

        // CRITICAL: Ensure Essential report has all calculated data
        // Add aspects to Essential report data if available
        if (calculatedData.user.aspects) {
          if (sampleData.tarot_data) sampleData.tarot_data.aspects = calculatedData.user.aspects;
          if (sampleData.moon_data) sampleData.moon_data.aspects = calculatedData.user.aspects;
          if (sampleData.transit_data) sampleData.transit_data.aspects = calculatedData.user.aspects;
        }
      }
    }

    const progressCallback = (percent, message) => {
      console.log(`[Test Report] ${percent}%: ${message}`);
    };

    let result;

    // ============================================
    // ENGINE SELECTION: puppeteer (default) or template (HTML template rendering)
    // ============================================
    if (engine === 'template') {
      // Use HTML template rendering with renderFromTemplate
      console.log('[Test Report] Using template engine (renderFromTemplate)');
      
      // If templateId not provided, try to get default template for this report type
      let finalTemplateId = templateId;
      if (!finalTemplateId) {
        try {
          const defaultTemplate = await getDefaultTemplate(report_type.toUpperCase());
          if (defaultTemplate) {
            finalTemplateId = defaultTemplate.id;
            console.log('[Test Report] Using default template:', finalTemplateId);
          } else {
            return NextResponse.json(
              {
                error: 'templateId required when using engine=template',
                hint: 'Add ?templateId=<id> to the URL, or create a default template for this report type',
                suggestion: 'GET /api/admin/templates to see available templates'
              },
              { status: 400 }
            );
          }
        } catch (error) {
          console.error('[Test Report] Error fetching default template:', error);
          return NextResponse.json(
            {
              error: 'templateId required when using engine=template',
              hint: 'Add ?templateId=<id> to the URL',
              suggestion: 'GET /api/admin/templates to see available templates'
            },
            { status: 400 }
          );
        }
      }
      
      // 1) Hydrate data (already done above in calculatedData and sampleData)
      // 2) Generate content via existing OpenAI step (or use cache)
      let contentResult;
      
      // Check cache first if useCache is true
      if (useCache && !regenerate) {
        const cachedData = getCachedReportData(report_type);
        if (cachedData && cachedData.contentResult) {
          console.log(`[Test Report] ✓ Using cached report data for ${report_type} (cached at ${cachedData.cachedAt})`);
          contentResult = cachedData.contentResult;
          // Also restore sampleData and calculatedData if cached
          if (cachedData.sampleData) {
            Object.assign(sampleData, cachedData.sampleData);
          }
          if (cachedData.calculatedData) {
            Object.assign(calculatedData, cachedData.calculatedData);
          }
        } else {
          // Generate new content
          console.log(`[Test Report] No cache found for ${report_type}, generating new content...`);
          if (report_type.startsWith('premium-') || ['ESSENTIAL', 'ADVANCED', 'MASTER'].includes(report_type.toUpperCase())) {
            const tier = report_type.replace('premium-', '').toUpperCase();
            contentResult = await generatePremiumReport(tier, sampleData, progressCallback);
          } else {
            contentResult = await generateReportContent(report_type, sampleData, progressCallback);
          }
          
          // Cache the generated data
          setCachedReportData(report_type, {
            contentResult,
            sampleData,
            calculatedData,
          });
        }
      } else {
        // Generate new content (cache disabled or regenerate requested)
        if (report_type.startsWith('premium-') || ['ESSENTIAL', 'ADVANCED', 'MASTER'].includes(report_type.toUpperCase())) {
          const tier = report_type.replace('premium-', '').toUpperCase();
          contentResult = await generatePremiumReport(tier, sampleData, progressCallback);
        } else {
          contentResult = await generateReportContent(report_type, sampleData, progressCallback);
        }
        
        // Cache the generated data (unless regenerate is true)
        if (!regenerate) {
          setCachedReportData(report_type, {
            contentResult,
            sampleData,
            calculatedData,
          });
        }
      }
      
      // Extract chart SVG from sections if available
      let chartSvgFromSection = null;
      let matrixChartSvgFromSection = null;
      
      if (contentResult.sections) {
        // Find birth_chart section and extract chart SVG
        const birthChartSection = contentResult.sections.find(s => s.type === 'birth_chart');
        if (birthChartSection?.chartImage) {
          // Try to extract SVG from data URL
          if (birthChartSection.chartImage.startsWith('data:image/svg+xml')) {
            const base64Match = birthChartSection.chartImage.match(/base64,(.+)/);
            if (base64Match) {
              try {
                chartSvgFromSection = Buffer.from(base64Match[1], 'base64').toString('utf-8');
                // Ensure xmlns is present
                if (chartSvgFromSection && !chartSvgFromSection.includes('xmlns=')) {
                  chartSvgFromSection = chartSvgFromSection.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
                }
              } catch (e) {
                console.warn('[Test Report] Could not decode chart SVG from data URL');
              }
            }
          }
        }
        
        // Find matrix section and extract chart SVG
        const matrixSection = contentResult.sections.find(s => s.type === 'matrix');
        if (matrixSection?.matrixChartSVG) {
          matrixChartSvgFromSection = matrixSection.matrixChartSVG;
          // Ensure xmlns is present
          if (matrixChartSvgFromSection && !matrixChartSvgFromSection.includes('xmlns=')) {
            matrixChartSvgFromSection = matrixChartSvgFromSection.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
          }
        }
      }
      
      // Merge content into sampleData for template rendering
      const hydration = {
        ...sampleData,
        ...calculatedData,
        content: contentResult.content,
        sections: contentResult.sections,
        // Add chart SVGs directly to hydration
        chartSvg: chartSvgFromSection,
        chartSVG: chartSvgFromSection,
        matrixChartSVG: matrixChartSvgFromSection,
      };
      
      // Flatten data for template (using existing flattenReportData if needed, or use hydration directly)
      const flattenedData = flattenReportData(hydration);
      
      // Get template from database (use finalTemplateId which may be default)
      const template = await getTemplate(finalTemplateId, report_type.toUpperCase());
      if (!template) {
        return NextResponse.json(
          { error: `Template not found: ${templateId}` },
          { status: 404 }
        );
      }
      
      // Parse template_json if it's a string
      const templateJson = typeof template.template_json === 'string'
        ? JSON.parse(template.template_json)
        : template.template_json;
      
      // Generate cache key for identical payloads (skip if regenerate=true)
      const cacheKey = regenerate ? null : generateCacheKey(finalTemplateId, flattenedData);
      
      // Render HTML from template (with caching and image inlining)
      console.log('[Test Report] Rendering template with data keys:', Object.keys(flattenedData).slice(0, 20));
      const html = await renderFromTemplate(templateJson, flattenedData, {
        cacheKey,
        inlineImages: true, // Inline external images to base64
      });
      
      console.log('[Test Report] Generated HTML length:', html.length, 'characters');
      if (html.length < 1000) {
        console.warn('[Test Report] WARNING: HTML is very short, template might not be rendering correctly');
        console.log('[Test Report] HTML preview (first 1000 chars):', html.substring(0, 1000));
      }
      
      // Generate PDF from HTML using Puppeteer
      const pdfBuffer = await generatePdfFromHtml(html);
      
      // Upload to Cloudinary
      const pdfUrl = await uploadPdfToCloudinary(pdfBuffer, report_type, {
        folder: 'reports',
        public_id: `report-${report_type}-template-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });
      
      // Return simplified response matching expected format
      return NextResponse.json({
        url: pdfUrl,
        engine: 'template',
        template_id: finalTemplateId,
        template_name: template.name || 'Unknown',
        report_type,
        used_default: !templateId, // Indicate if default template was used
      });
    } else if (engine === 'premium') {
      // Use new premium e-book quality PDF generator (React component)
      console.log('[Test Report] Using Premium E-book PDF generator');
      
      // Check cache for premium generator path
      let contentResult;
      if (useCache && !regenerate) {
        const cachedData = getCachedReportData(report_type);
        if (cachedData && cachedData.contentResult) {
          console.log(`[Test Report] ✓ Using cached contentResult for premium generator (cached at ${cachedData.cachedAt})`);
          contentResult = cachedData.contentResult;
          // Restore sampleData if cached
          if (cachedData.sampleData) {
            Object.assign(sampleData, cachedData.sampleData);
          }
        } else {
          // Generate new content
          console.log(`[Test Report] No cache found, generating new content for premium generator...`);
          if (report_type.startsWith('premium-') || ['ESSENTIAL', 'ADVANCED', 'MASTER'].includes(report_type.toUpperCase())) {
            const tier = report_type.replace('premium-', '').toUpperCase();
            // Pass skipPdf: true to prevent duplicate PDF generation
            contentResult = await generatePremiumReport(tier, { ...sampleData, skipPdf: true }, progressCallback);
            console.log('[Test Report] Skipped PDF generation in generatePremiumReport, will use premium-pdf-generator instead');
          } else {
            contentResult = await generateReportContent(report_type, sampleData, progressCallback);
          }
          
          // Cache the generated content
          setCachedReportData(report_type, {
            contentResult,
            sampleData,
            calculatedData,
          });
        }
      } else {
        // Generate new content (cache disabled or regenerate requested)
        if (report_type.startsWith('premium-') || ['ESSENTIAL', 'ADVANCED', 'MASTER'].includes(report_type.toUpperCase())) {
          const tier = report_type.replace('premium-', '').toUpperCase();
          // Pass skipPdf: true to prevent duplicate PDF generation
          contentResult = await generatePremiumReport(tier, { ...sampleData, skipPdf: true }, progressCallback);
          console.log('[Test Report] Skipped PDF generation in generatePremiumReport, will use premium-pdf-generator instead');
        } else {
          contentResult = await generateReportContent(report_type, sampleData, progressCallback);
        }
        
        // Cache the generated content (unless regenerate is true)
        if (!regenerate) {
          setCachedReportData(report_type, {
            contentResult,
            sampleData,
            calculatedData,
          });
        }
      }
      
      // Extract chart SVG from sections
      let birthChartSvg = null;
      let compatibilityChartSvg = null;
      
      if (contentResult.sections) {
        const birthChartSection = contentResult.sections.find(s => s.type === 'birth_chart');
        if (birthChartSection?.chartImage) {
          if (birthChartSection.chartImage.startsWith('data:image/svg+xml')) {
            const base64Match = birthChartSection.chartImage.match(/base64,(.+)/);
            if (base64Match) {
              try {
                birthChartSvg = Buffer.from(base64Match[1], 'base64').toString('utf-8');
                if (!birthChartSvg.includes('xmlns=')) {
                  birthChartSvg = birthChartSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
                }
              } catch (e) {
                console.warn('[Test Report] Could not decode birth chart SVG');
              }
            }
          }
        }
        
        const matrixSection = contentResult.sections.find(s => s.type === 'matrix');
        if (matrixSection?.matrixChartSVG) {
          compatibilityChartSvg = matrixSection.matrixChartSVG;
          if (!compatibilityChartSvg.includes('xmlns=')) {
            compatibilityChartSvg = compatibilityChartSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
          }
        }
      }
      
      // Check cache for userData (if not already loaded above)
      if (!cachedPremiumData && useCache && !regenerate) {
        cachedPremiumData = getCachedReportData(report_type);
      }
      
      // Prepare userData for premium generator (use cached if available)
      const userData = cachedPremiumData?.userData || {
        name: sampleData.name || hydrationInput.name || 'Test User',
        birthDate: sampleData.birth_date || hydrationInput.birth_date || '',
        birthTime: sampleData.birth_time || hydrationInput.birth_time || '',
        location: sampleData.location || hydrationInput.location || '',
        sunSign: calculatedData?.user?.sunSign || calculatedData?.rawChart?.sun?.sign,
        moonSign: calculatedData?.user?.moonSign || calculatedData?.rawChart?.moon?.sign,
        risingSign: calculatedData?.user?.risingSign || calculatedData?.rawChart?.rising?.sign || calculatedData?.rawChart?.ascendant?.sign,
        birthChartSvg: birthChartSvg,
        compatibilityChartSvg: compatibilityChartSvg,
        sections: contentResult.sections?.map(s => ({
          type: s.type,
          title: s.title,
          content: typeof s.content === 'string' ? s.content : (s.content?.content || ''),
        })) || [],
        compatibilityScores: sampleData.matrix_scores || sampleData.chartData?.matrix_scores || calculatedData?.partner?.matrix_scores,
      };
      
      // Import premium PDF generator directly instead of internal fetch
      // This avoids network calls and works better in serverless environments
      const { generatePremiumPdf } = await import('@/lib/premium-pdf-generator.js');
      
      // Generate PDF directly using the premium generator
      const pdfBuffer = await generatePremiumPdf(userData);
      
      // Upload to Cloudinary
      const pdfUrl = await uploadPdfToCloudinary(pdfBuffer, report_type, {
        folder: 'reports',
        public_id: `report-${report_type}-premium-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });
      
      return NextResponse.json({
        url: pdfUrl,
        engine: 'premium',
        report_type,
        generated_at: new Date().toISOString(),
      });
    } else {
      // Use default Puppeteer pipeline (existing behavior)
      console.log('[Test Report] Using Puppeteer engine (default)');
      
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
      
      // Add engine metadata
      if (result.metadata) {
        result.metadata.engine = 'puppeteer';
      } else {
        result.metadata = { engine: 'puppeteer' };
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

