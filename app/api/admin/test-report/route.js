import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
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
    // COMPATIBILITY REPORT OVERRIDE - Force Premium Puppeteer Engine
    // ============================================
    // TASK: INTERCEPT COMPATIBILITY REQUESTS - Always use generatePremiumPdf
    // This bypasses the legacy template engine check that requires templateId
    // Check if the request is for a compatibility report (case-insensitive)
    const normalizedReportType = (report_type || '').toLowerCase();
    const isCompatibilityReport = normalizedReportType === 'compatibility' || 
                                   normalizedReportType === 'compatibility_report' ||
                                   normalizedReportType === 'relationship';
    
    if (isCompatibilityReport) {
      console.log('[Test Report] ✓ Compatibility report detected - forcing Premium Puppeteer engine (ignoring engine parameter)');
      
      // Import premium PDF generator
      let generatePremiumPdf;
      try {
        const pdfGeneratorModule = await import('@/lib/premium-pdf-generator.js');
        generatePremiumPdf = pdfGeneratorModule.generatePremiumPdf;
      } catch (importError) {
        console.error('[Test Report] Failed to import premium PDF generator:', importError);
        return NextResponse.json(
          { error: 'Failed to import premium PDF generator', details: importError.message },
          { status: 500 }
        );
      }
      
      // Prepare userData for compatibility report
      // Extract compatibility data from the request body (supports multiple data structures)
      const root = body.data || body;
      const userSource = root.birth_chart_data || root.user || root;
      
      // Extract user and partner birth data
      // Support multiple data structure formats (compatibility API, test-report, etc.)
      const userBirthDate = userSource.birth_date || userSource.birthDate || root.birth_date || root.birthDate || root.person1BirthDate;
      const userBirthTime = userSource.birth_time || userSource.birthTime || root.birth_time || root.birthTime || root.person1BirthTime;
      const userLatitude = userSource.latitude || userSource.lat || root.latitude || root.lat || root.person1Latitude || 
                          (userSource.location && typeof userSource.location === 'object' ? userSource.location.latitude : null);
      const userLongitude = userSource.longitude || userSource.lng || root.longitude || root.lng || root.person1Longitude ||
                           (userSource.location && typeof userSource.location === 'object' ? userSource.location.longitude : null);
      
      // Extract partner data (for compatibility reports)
      // Support multiple formats: compatibility_data.partner, partner object, person2 fields, etc.
      const partnerBirthDate = root.compatibility_data?.partner?.birth_date || 
                               root.compatibility_data?.partner?.birthDate ||
                               root.partner_birth_date ||
                               root.partner?.birthDate ||
                               root.partner?.birth_date ||
                               root.partner_birthDate ||
                               root.person2BirthDate;
      const partnerBirthTime = root.compatibility_data?.partner?.birth_time ||
                               root.compatibility_data?.partner?.birthTime ||
                               root.partner_birth_time ||
                               root.partner?.birthTime ||
                               root.partner?.birth_time ||
                               root.partner_birthTime ||
                               root.person2BirthTime;
      const partnerLatitude = root.compatibility_data?.partner?.latitude ||
                              root.compatibility_data?.partner?.lat ||
                              root.partner_latitude ||
                              root.partner?.latitude ||
                              root.partner?.lat ||
                              root.person2Latitude ||
                              (root.compatibility_data?.partner?.location && typeof root.compatibility_data.partner.location === 'object' ? root.compatibility_data.partner.location.latitude : null) ||
                              (root.partner?.location && typeof root.partner.location === 'object' ? root.partner.location.latitude : null);
      const partnerLongitude = root.compatibility_data?.partner?.longitude ||
                               root.compatibility_data?.partner?.lng ||
                               root.partner_longitude ||
                               root.partner?.longitude ||
                               root.partner?.lng ||
                               root.person2Longitude ||
                               (root.compatibility_data?.partner?.location && typeof root.compatibility_data.partner.location === 'object' ? root.compatibility_data.partner.location.longitude : null) ||
                               (root.partner?.location && typeof root.partner.location === 'object' ? root.partner.location.longitude : null);
      const partnerName = root.compatibility_data?.partner?.name ||
                         root.partner_name ||
                         root.partnerName ||
                         root.partner?.name ||
                         'The Partner';
      
      // Check if we need to generate compatibility content
      const hasPreGeneratedSections = root.sections && root.sections.length > 0;
      const hasPartnerData = partnerBirthDate && partnerBirthTime && partnerLatitude && partnerLongitude;
      const hasUserData = userBirthDate && userBirthTime && userLatitude && userLongitude;
      
      // #region agent log (production-safe)
      if (typeof fetch !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:172',message:'H6: Checking section generation conditions',data:{hasPreGeneratedSections,hasPartnerData,hasUserData,partnerBirthDate:!!partnerBirthDate,partnerBirthTime:!!partnerBirthTime,partnerLatitude:!!partnerLatitude,partnerLongitude:!!partnerLongitude,partnerLatValue:partnerLatitude,partnerLonValue:partnerLongitude,userBirthDate:!!userBirthDate,userBirthTime:!!userBirthTime,userLatitude:!!userLatitude,userLongitude:!!userLongitude,userLatValue:userLatitude,userLonValue:userLongitude,rootSectionsCount:root.sections?.length||0,rootKeys:Object.keys(root).slice(0,20),hasCompatibilityData:!!root.compatibility_data,hasPartner:!!root.partner},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
      }
      // #endregion
      
      let sections = root.sections || data?.sections || [];
      let compatibilityScores = root.compatibilityScores || root.compatibility_scores || data?.compatibilityScores;
      let compatibilityChartSvg = root.compatibilityChartSvg || root.compatibility_chart_svg || data?.compatibilityChartSvg;
      
      // If sections are missing but we have partner data, generate compatibility report
      if (!hasPreGeneratedSections && hasPartnerData && hasUserData) {
        console.log('[Test Report] Generating compatibility report content...');
        
          // #region agent log (production-safe)
          if (typeof fetch !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:182',message:'H1: Starting compatibility content generation',data:{hasPreGeneratedSections,hasPartnerData,userBirthDate:!!userBirthDate,partnerBirthDate:!!partnerBirthDate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
          }
          // #endregion
        
        try {
          const startTime = Date.now();
          console.log('[Test Report] Starting compatibility generation at', new Date().toISOString());
          
          // Import required functions
          console.log('[Test Report] Importing hydrateReportData and generateReportContent...');
          const { hydrateReportData } = await import('@/src/services/chartHydrator');
          const { generateReportContent } = await import('@/lib/pdf-generator.js');
          console.log('[Test Report] Imports complete, elapsed:', Date.now() - startTime, 'ms');
          
          // #region agent log (production-safe)
          if (typeof fetch !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:208',message:'H7: Imports complete',data:{elapsed:Date.now()-startTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
          }
          // #endregion
          
          // Hydrate both charts (same as master report does)
          console.log('[Test Report] Hydrating user chart...');
          const hydrateStart1 = Date.now();
          const chart1Hydrated = await hydrateReportData({
            name: userSource.name || root.name || 'Person 1',
            birthDate: userBirthDate,
            birthTime: userBirthTime,
            birthLatitude: parseFloat(userLatitude),
            birthLongitude: parseFloat(userLongitude),
          });
          console.log('[Test Report] User chart hydrated, elapsed:', Date.now() - hydrateStart1, 'ms');
          
          // #region agent log (production-safe)
          if (typeof fetch !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:225',message:'H7: User chart hydrated',data:{elapsed:Date.now()-hydrateStart1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
          }
          // #endregion
          
          console.log('[Test Report] Hydrating partner chart...');
          const hydrateStart2 = Date.now();
          const chart2Hydrated = await hydrateReportData({
            name: partnerName,
            birthDate: partnerBirthDate,
            birthTime: partnerBirthTime,
            birthLatitude: parseFloat(partnerLatitude),
            birthLongitude: parseFloat(partnerLongitude),
          });
          console.log('[Test Report] Partner chart hydrated, elapsed:', Date.now() - hydrateStart2, 'ms');
          
          // #region agent log (production-safe)
          if (typeof fetch !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:212',message:'H2: Chart hydration complete',data:{chart1HasUser:!!chart1Hydrated.user,chart1HasPartner:!!chart1Hydrated.partner,chart2HasUser:!!chart2Hydrated.user,chart2HasPartner:!!chart2Hydrated.partner,chart1HasMatrixScores:!!chart1Hydrated.matrix_scores,chart1HasComposite:!!chart1Hydrated.composite},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
          }
          // #endregion
          
          // Build compatibility data structure matching master report format
          // H2: Include all required fields for generateReportContent
          const compatibilityData = {
            name: userSource.name || root.name || 'Person 1',
            partner_name: partnerName,
            user: chart1Hydrated.user || chart1Hydrated.rawChart,
            partner: chart2Hydrated.user || chart2Hydrated.rawChart,
            chartData: {
              user: chart1Hydrated.user || chart1Hydrated.rawChart,
              partner: chart2Hydrated.user || chart2Hydrated.rawChart,
              matrix_scores: chart1Hydrated.matrix_scores || chart2Hydrated.matrix_scores,
            },
            compatibility_data: {
              partner: chart2Hydrated.user || chart2Hydrated.rawChart,
              user: chart1Hydrated.user || chart1Hydrated.rawChart,
            },
            synastryAspects: chart1Hydrated.synastryAspects,
            houseOverlays: chart1Hydrated.houseOverlays,
            composite: chart1Hydrated.composite,
            compositeChart: chart1Hydrated.compositeChart,
            matrix_scores: chart1Hydrated.matrix_scores || chart2Hydrated.matrix_scores,
            compatibility_scores: chart1Hydrated.matrix_scores || chart2Hydrated.matrix_scores,
          };
          
          // #region agent log (production-safe)
          if (typeof fetch !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:234',message:'H2: Compatibility data structure built',data:{hasUser:!!compatibilityData.user,hasPartner:!!compatibilityData.partner,hasSynastryAspects:!!compatibilityData.synastryAspects,hasHouseOverlays:!!compatibilityData.houseOverlays,hasComposite:!!compatibilityData.composite,hasMatrixScores:!!compatibilityData.matrix_scores},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
          }
          // #endregion
          
          // H1: Use generateReportContent (same as master report) instead of generateCompatibilityReport
          let compatibilityResult;
          try {
            console.log('[Test Report] Calling generateReportContent for compatibility...');
            const generateStart = Date.now();
            
            // Add timeout wrapper (5 minutes max)
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('generateReportContent timeout after 5 minutes')), 5 * 60 * 1000);
            });
            
            compatibilityResult = await Promise.race([
              generateReportContent('compatibility', compatibilityData, (progress, message) => {
                console.log(`[Test Report] generateReportContent progress: ${progress}% - ${message} (elapsed: ${Date.now() - generateStart}ms)`);
              }),
              timeoutPromise
            ]);
            console.log('[Test Report] generateReportContent complete, elapsed:', Date.now() - generateStart, 'ms');
            
            // #region agent log (production-safe)
            if (typeof fetch !== 'undefined') {
              fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:252',message:'H1: generateReportContent completed',data:{hasResult:!!compatibilityResult,hasContent:!!compatibilityResult?.content,contentLength:compatibilityResult?.content?.length||0,hasSections:!!compatibilityResult?.sections,sectionsCount:compatibilityResult?.sections?.length||0,contentPreview:compatibilityResult?.content?.substring(0,200)||'',resultType:typeof compatibilityResult,resultKeys:compatibilityResult?Object.keys(compatibilityResult):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
            }
            // #endregion
          } catch (genError) {
            // #region agent log (production-safe)
            if (typeof fetch !== 'undefined') {
              fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:260',message:'ERROR: generateReportContent threw exception',data:{error:genError.message,stack:genError.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
            }
            // #endregion
            console.error('[Test Report] generateReportContent failed:', genError);
            throw genError; // Re-throw to be caught by outer try-catch
          }
          
          // Check if result is null or empty
          if (!compatibilityResult || !compatibilityResult.content) {
            // #region agent log (production-safe)
            if (typeof fetch !== 'undefined') {
              fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:270',message:'H3: generateReportContent returned null or empty',data:{resultIsNull:!compatibilityResult,hasContent:!!compatibilityResult?.content,resultValue:JSON.stringify(compatibilityResult)?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
            }
            // #endregion
            
            // Fallback: Use generateCompatibilityReport if generateReportContent fails
            console.warn('[Test Report] generateReportContent returned empty, falling back to generateCompatibilityReport');
            const { generateCompatibilityReport } = await import('@/lib/compatibility');
            const chart1 = chart1Hydrated.rawChart;
            const chart2 = chart2Hydrated.rawChart;
            const fallbackResult = await generateCompatibilityReport(
              chart1,
              chart2,
              userSource.name || root.name || 'Person 1',
              partnerName
            );
            
            sections = [
              {
                type: 'compatibility',
                title: 'Compatibility Analysis',
                content: fallbackResult.report || '',
              },
            ];
            
            // Generate Relationship Matrix section even in fallback case
            console.log('[Test Report] Generating relationship matrix (fallback case)...');
            try {
              const relationshipMatrixResult = await generateReportContent('relationship_matrix', {
                user: chart1Hydrated.user || chart1Hydrated.rawChart,
                partner: chart2Hydrated.user || chart2Hydrated.rawChart,
                pair: {
                  user: chart1Hydrated.user || chart1Hydrated.rawChart,
                  partner: chart2Hydrated.user || chart2Hydrated.rawChart,
                },
                matrix_scores: fallbackResult.scores || chart1Hydrated.matrix_scores || chart2Hydrated.matrix_scores,
              });
              
              if (relationshipMatrixResult && relationshipMatrixResult.content) {
                sections.push({
                  type: 'relationship_matrix',
                  title: 'Relationship Matrix',
                  content: relationshipMatrixResult.content || '',
                });
              }
            } catch (matrixError) {
              console.error('[Test Report] Failed to generate relationship matrix in fallback:', matrixError);
              // Continue without relationship matrix
            }
            
            sections.push({
              type: 'closing',
              title: 'Closing Blessing',
              content: 'May this compatibility report guide you on your journey together. The stars have aligned to bring you insights into your relationship dynamics, helping you understand each other more deeply and navigate your path forward with greater awareness and harmony.',
            });
            
            compatibilityScores = fallbackResult.scores;
          } else {
            // Build sections array matching master report format
            // generateReportContent returns { content: string, sections: array }
            sections = [
              {
                type: 'compatibility',
                title: 'Compatibility Analysis',
                content: compatibilityResult.content || '',
              },
            ];
            
            // Generate Relationship Matrix section (required for compatibility reports per REPORT_RECIPES)
            console.log('[Test Report] Generating relationship matrix...');
            const matrixStart = Date.now();
            try {
              const relationshipMatrixResult = await generateReportContent('relationship_matrix', {
                user: chart1Hydrated.user || chart1Hydrated.rawChart,
                partner: chart2Hydrated.user || chart2Hydrated.rawChart,
                pair: {
                  user: chart1Hydrated.user || chart1Hydrated.rawChart,
                  partner: chart2Hydrated.user || chart2Hydrated.rawChart,
                },
                matrix_scores: chart1Hydrated.matrix_scores || chart2Hydrated.matrix_scores,
              }, (progress, message) => {
                console.log(`[Test Report] relationship_matrix progress: ${progress}% - ${message}`);
              });
              
              if (relationshipMatrixResult && relationshipMatrixResult.content) {
                sections.push({
                  type: 'relationship_matrix',
                  title: 'Relationship Matrix',
                  content: relationshipMatrixResult.content || '',
                });
                console.log('[Test Report] Relationship matrix generated, elapsed:', Date.now() - matrixStart, 'ms');
              } else {
                console.warn('[Test Report] Relationship matrix returned empty, skipping');
              }
            } catch (matrixError) {
              console.error('[Test Report] Failed to generate relationship matrix:', matrixError);
              // Continue without relationship matrix - compatibility section is more important
            }
            
            // Add closing section
            sections.push({
              type: 'closing',
              title: 'Closing Blessing',
              content: 'May this compatibility report guide you on your journey together. The stars have aligned to bring you insights into your relationship dynamics, helping you understand each other more deeply and navigate your path forward with greater awareness and harmony.',
            });
            
            // #region agent log (production-safe)
            if (typeof fetch !== 'undefined') {
              fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:370',message:'H8: Sections built including relationship matrix',data:{sectionsCount:sections.length,sectionsTypes:sections.map(s=>s.type),hasCompatibility:!!sections.find(s=>s.type==='compatibility'),hasRelationshipMatrix:!!sections.find(s=>s.type==='relationship_matrix'),hasClosing:!!sections.find(s=>s.type==='closing')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H8'})}).catch(()=>{});
            }
            // #endregion
            
            // Set compatibility scores from hydrated data
            compatibilityScores = chart1Hydrated.matrix_scores || chart2Hydrated.matrix_scores;
          }
          
          // #region agent log (production-safe)
          if (typeof fetch !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:333',message:'H5: Sections array built after generation',data:{sectionsCount:sections.length,sectionsTypes:sections.map(s=>s.type),firstSectionContentLength:sections[0]?.content?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
          }
          // #endregion
          
          console.log('[Test Report] ✓ Compatibility report generated:', {
            sectionsCount: sections.length,
            hasScores: !!compatibilityScores,
            overallScore: compatibilityScores?.overall,
            contentLength: sections[0]?.content?.length || 0,
          });
        } catch (genError) {
          // #region agent log (production-safe)
          if (typeof fetch !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:267',message:'ERROR: Compatibility generation failed',data:{error:genError.message,stack:genError.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2'})}).catch(()=>{});
          }
          // #endregion
          console.error('[Test Report] Failed to generate compatibility content:', genError);
          // Continue with empty sections - will still generate cover page
        }
      } else {
        // #region agent log (production-safe)
        if (typeof fetch !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:345',message:'H6: Section generation condition FAILED - skipping generation',data:{hasPreGeneratedSections,hasPartnerData,hasUserData,reason:hasPreGeneratedSections?'hasPreGeneratedSections':!hasPartnerData?'missingPartnerData':!hasUserData?'missingUserData':'unknown',partnerBirthDate:!!partnerBirthDate,partnerBirthTime:!!partnerBirthTime,partnerLatitude:!!partnerLatitude,partnerLongitude:!!partnerLongitude,userBirthDate:!!userBirthDate,userBirthTime:!!userBirthTime,userLatitude:!!userLatitude,userLongitude:!!userLongitude},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
        }
        // #endregion
        console.warn('[Test Report] Skipping compatibility content generation:', {
          hasPreGeneratedSections,
          hasPartnerData,
          hasUserData,
          reason: hasPreGeneratedSections ? 'sections already provided' : !hasPartnerData ? 'missing partner data' : !hasUserData ? 'missing user data' : 'unknown',
          partnerData: { birthDate: !!partnerBirthDate, birthTime: !!partnerBirthTime, lat: !!partnerLatitude, lon: !!partnerLongitude },
          userData: { birthDate: !!userBirthDate, birthTime: !!userBirthTime, lat: !!userLatitude, lon: !!userLongitude },
        });
      }
      
      // Build userData structure expected by generatePremiumPdf
      // CRITICAL: Ensure sections array is properly formatted before building userData
      const finalSections = sections.length > 0 ? sections : [];
      
      // #region agent log (production-safe)
      if (typeof fetch !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:290',message:'H4: Building userData with sections',data:{sectionsCount:finalSections.length,sectionsTypes:finalSections.map(s=>s.type),firstSectionHasContent:!!finalSections[0]?.content,firstSectionContentLength:finalSections[0]?.content?.length||0,firstSectionContentPreview:finalSections[0]?.content?.substring(0,100)||''},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      }
      // #endregion
      
      const userData = {
        name: userSource.name || root.name || 'User',
        birthDate: userBirthDate,
        birthTime: userBirthTime,
        location: userSource.location || root.location || '',
        sunSign: userSource.sunSign || root.sunSign,
        moonSign: userSource.moonSign || root.moonSign,
        risingSign: userSource.risingSign || root.risingSign,
        reportType: 'compatibility', // Set report type for dynamic title (TASK 1)
        reportTitle: 'COMPATIBILITY REPORT', // Explicit title for cover page
        sections: finalSections, // CRITICAL: Pass sections array
        compatibilityScores: compatibilityScores,
        compatibilityChartSvg: compatibilityChartSvg,
        base64BackgroundImage: root.base64BackgroundImage || root.backgroundImageUrl || data?.base64BackgroundImage,
      };
      
      // #region agent log (production-safe)
      if (typeof fetch !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-report/route.js:310',message:'H4: userData built, ready for PDF generation',data:{name:userData.name,reportType:userData.reportType,hasSections:!!userData.sections?.length,sectionsCount:userData.sections?.length||0,firstSectionType:userData.sections?.[0]?.type,firstSectionTitle:userData.sections?.[0]?.title,firstSectionContentLength:userData.sections?.[0]?.content?.length||0,hasCompatibilityScores:!!userData.compatibilityScores},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      }
      // #endregion
      
      console.log('[Test Report] Generating compatibility PDF with userData:', {
        name: userData.name,
        reportType: userData.reportType,
        hasSections: !!userData.sections?.length,
        sectionsCount: userData.sections?.length || 0,
        sectionsTypes: userData.sections?.map(s => s.type) || [],
        firstSectionContentLength: userData.sections?.[0]?.content?.length || 0,
        hasCompatibilityScores: !!userData.compatibilityScores,
        hasCompatibilityChartSvg: !!userData.compatibilityChartSvg,
      });
      
      // Generate PDF using premium generator (bypasses template engine entirely)
      try {
        const pdfBuffer = await generatePremiumPdf(userData);
        
        console.log('[Test Report] ✓ Compatibility PDF generated successfully, size:', pdfBuffer.length, 'bytes');
        
        // Return PDF directly
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="compatibility-report-${userData.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
          },
        });
      } catch (pdfError) {
        console.error('[Test Report] Premium PDF generation failed:', pdfError);
        return NextResponse.json(
          { error: 'Failed to generate compatibility PDF', details: pdfError.message },
          { status: 500 }
        );
      }
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
          // Normalize report type for template lookup
          // Map common report types to their template report_type values
          const reportTypeMap = {
            'compatibility': 'COMPATIBILITY',
            'compatibility_report': 'COMPATIBILITY',
            'birth_chart': 'BIRTH_CHART',
            'tarot': 'TAROT',
            'moon_reading': 'MOON_READING',
            'forecast': 'FORECAST',
            'transit': 'TRANSIT',
          };
          
          const normalizedReportType = reportTypeMap[report_type?.toLowerCase()] || report_type.toUpperCase();
          
          const defaultTemplate = await getDefaultTemplate(normalizedReportType);
          if (defaultTemplate) {
            finalTemplateId = defaultTemplate.id;
            console.log('[Test Report] Using default template:', finalTemplateId);
          } else {
            // Try to find any template for this report type (not just default)
            const { pool } = await import('@/lib/db.js');
            const anyTemplateResult = await pool.query(
              `SELECT id, name, slug FROM report_templates 
               WHERE report_type = $1 
               ORDER BY created_at DESC LIMIT 5`,
              [normalizedReportType]
            );
            
            // Also check legacy table
            const legacyTemplateResult = await pool.query(
              `SELECT id, name, slug FROM pdf_templates 
               WHERE report_type = $1 AND is_active = true 
               ORDER BY created_at DESC LIMIT 5`,
              [normalizedReportType]
            );
            
            const availableTemplates = [
              ...anyTemplateResult.rows.map(t => ({ id: t.id, name: t.name, slug: t.slug })),
              ...legacyTemplateResult.rows.map(t => ({ id: t.id, name: t.name, slug: t.slug }))
            ];
            
            return NextResponse.json(
              {
                error: 'templateId required when using engine=template',
                report_type: report_type,
                normalized_report_type: normalizedReportType,
                hint: `No default template found for report type "${report_type}" (normalized: "${normalizedReportType}")`,
                suggestion: availableTemplates.length > 0
                  ? `Available templates for this report type: ${availableTemplates.map(t => t.id || t.slug).join(', ')}. Add ?templateId=<id> to the URL.`
                  : `No templates found for this report type. Create a template first, or use engine=puppeteer instead.`,
                available_templates: availableTemplates.length > 0 ? availableTemplates : null,
                alternative: 'Use engine=puppeteer (default) instead, or create a template via POST /api/admin/templates'
              },
              { status: 400 }
            );
          }
        } catch (error) {
          console.error('[Test Report] Error fetching default template:', error);
          return NextResponse.json(
            {
              error: 'templateId required when using engine=template',
              report_type: report_type,
              details: error.message,
              hint: `Add ?templateId=<id> to the URL, or use engine=puppeteer instead`,
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
      let cachedPremiumData = null; // Initialize here
      
      if (useCache && !regenerate) {
        cachedPremiumData = getCachedReportData(report_type);
        if (cachedPremiumData && cachedPremiumData.contentResult) {
          console.log(`[Test Report] ✓ Using cached contentResult for premium generator (cached at ${cachedPremiumData.cachedAt})`);
          contentResult = cachedPremiumData.contentResult;
          // Restore sampleData if cached
          if (cachedPremiumData.sampleData) {
            Object.assign(sampleData, cachedPremiumData.sampleData);
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
                
                // Fix: Update viewBox if it's the old one (0 0 1000 800) to new one (0 0 1400 1000)
                if (birthChartSvg.includes('viewBox="0 0 1000 800"')) {
                  birthChartSvg = birthChartSvg.replace(/viewBox="0 0 1000 800"/g, 'viewBox="0 0 1400 1000"');
                  console.log('[Test Report] Updated cached SVG viewBox from "0 0 1000 800" to "0 0 1400 1000"');
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
      
      // Check cache for userData if not already loaded
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
      let generatePremiumPdf;
      try {
        const pdfGeneratorModule = await import('@/lib/premium-pdf-generator.js');
        generatePremiumPdf = pdfGeneratorModule.generatePremiumPdf;
      } catch (importError) {
        throw importError;
      }
      
      // Generate PDF directly using the premium generator
      let pdfBuffer;
      try {
        pdfBuffer = await generatePremiumPdf(userData);
      } catch (pdfError) {
        throw pdfError;
      }
      
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

