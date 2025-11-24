/**
 * PDF Generation Service
 * Generates professionally formatted PDF reports from reading results
 */

import { generateText } from './openai.js';

/**
 * Extract key points from report content for closing blessing
 */
function extractKeyPoints(content, reportType) {
  if (!content || typeof content !== 'string') return '';
  
  // Extract first 300 characters as summary
  const preview = content.substring(0, 300).trim();
  
  // Try to extract specific elements based on report type
  if (reportType === 'tarot') {
    // Extract card names if mentioned
    const cardMatches = content.match(/\*\*([^*]+)\*\*/g);
    if (cardMatches) {
      return `Cards drawn: ${cardMatches.slice(0, 3).map(c => c.replace(/\*\*/g, '')).join(', ')}. ${preview}`;
    }
  } else if (reportType === 'moon') {
    // Extract moon phase if mentioned
    const moonPhaseMatch = content.match(/(Waxing|Waning|New|Full) (Crescent|Gibbous|Moon)/i);
    if (moonPhaseMatch) {
      return `Moon Phase: ${moonPhaseMatch[0]}. ${preview}`;
    }
  } else if (reportType === 'transit') {
    // Extract transit aspects if mentioned
    const transitMatches = content.match(/(Mars|Venus|Mercury|Jupiter|Saturn|Uranus|Neptune|Pluto|Sun|Moon)\s+(trine|square|conjunct|opposition|sextile)/gi);
    if (transitMatches) {
      return `Key transits: ${transitMatches.slice(0, 3).join(', ')}. ${preview}`;
    }
  }
  
  return preview;
}

/**
 * Enrich chart data with all premium data points
 * Extracts premium data from database JSONB structures or recalculates if missing
 */
async function enrichBirthChartData(rawData) {
  if (!rawData) return null;
  
  // If data already has premium points at top level, return as-is
  if (rawData.planetSignHouseCombinations && rawData.houseCuspsDetailed) {
    return rawData;
  }
  
  // Try to extract from nested structures (database format)
  let premiumData = {};
  
  // Extract from _premium_data if present
  if (rawData.planets?._premium_data) {
    premiumData = rawData.planets._premium_data;
  } else if (rawData._premium_data) {
    premiumData = rawData._premium_data;
  } else if (rawData.natal_positions?._premium_data) {
    premiumData = rawData.natal_positions._premium_data;
  }
  
  // Extract from houses JSONB
  if (!premiumData.houseCuspsDetailed) {
    if (rawData.houses?._cusps_detailed) {
      premiumData.houseCuspsDetailed = rawData.houses._cusps_detailed;
    }
  }
  
  // Extract from aspects JSONB
  if (!premiumData.majorAspects) {
    if (rawData.aspects?.major) {
      premiumData.majorAspects = rawData.aspects.major;
    } else if (Array.isArray(rawData.aspects)) {
      premiumData.majorAspects = rawData.aspects;
    }
  }
  
  // Extract from planet_houses JSONB
  if (!premiumData.planetSignHouseCombinations) {
    if (rawData.planet_houses?._combinations) {
      premiumData.planetSignHouseCombinations = rawData.planet_houses._combinations;
    }
  }
  
  // Normalize chart structure for recalculation
  const normalizedPlanets = rawData.planets || rawData.natal_positions || {};
  const normalizedHouses = rawData.houses || {};
  
  // Check if planetSignHouseCombinations is missing or incomplete (missing Moon, Saturn, or Nodes)
  const hasMoon = premiumData.planetSignHouseCombinations?.some(c => 
    c.planet === 'Moon' || c.planet?.toLowerCase() === 'moon'
  );
  const hasSaturn = premiumData.planetSignHouseCombinations?.some(c => 
    c.planet === 'Saturn' || c.planet?.toLowerCase() === 'saturn'
  );
  const hasNorthNode = premiumData.planetSignHouseCombinations?.some(c => 
    c.planet === 'North Node' || c.planet === 'True Node' || c.planet?.toLowerCase() === 'north node'
  );
  const hasSouthNode = premiumData.planetSignHouseCombinations?.some(c => 
    c.planet === 'South Node' || c.planet?.toLowerCase() === 'south node'
  );
  
  const isIncomplete = !premiumData.planetSignHouseCombinations || 
    !hasMoon || !hasSaturn || !hasNorthNode || !hasSouthNode;
  
  // If still missing or incomplete, recalculate from raw chart data
  if (!premiumData.planetSignHouseCombinations || !premiumData.houseCuspsDetailed || isIncomplete) {
    try {
      const { calculateBirthChart } = await import('./astrology.js');
      
      // Need birth date/time/location to recalculate
      if (rawData.birth_date && rawData.birth_time && rawData.latitude !== undefined && rawData.longitude !== undefined) {
        const recalculated = calculateBirthChart(
          rawData.birth_date,
          rawData.birth_time,
          rawData.latitude,
          rawData.longitude
        );
        
        premiumData.planetSignHouseCombinations = recalculated.planetSignHouseCombinations || [];
        premiumData.houseCuspsDetailed = recalculated.houseCuspsDetailed || [];
        premiumData.chartRulerLocation = recalculated.chartRulerLocation || null;
        premiumData.majorAspects = recalculated.majorAspects || [];
        premiumData.midpoints = recalculated.midpoints || [];
      } else if (normalizedPlanets && normalizedHouses && Object.keys(normalizedPlanets).length > 0) {
        // If we have planets and houses but no birth data, try to build combinations manually
        const { buildPlanetSignHouseCombinations, assignPlanetsToHouses } = await import('./astrology.js');
        
        // Assign planets to houses
        const planetHouses = assignPlanetsToHouses(normalizedPlanets, normalizedHouses);
        
        // Build combinations
        premiumData.planetSignHouseCombinations = buildPlanetSignHouseCombinations(normalizedPlanets, planetHouses) || [];
      }
    } catch (error) {
      console.error('[Data Enrichment] Error recalculating chart:', error);
    }
  }
  
  // Verify all critical planets are present in combinations
  const finalCombinations = premiumData.planetSignHouseCombinations || [];
  const hasAllCritical = finalCombinations.some(c => c.planet === 'Moon') &&
    finalCombinations.some(c => c.planet === 'Saturn') &&
    (finalCombinations.some(c => c.planet === 'North Node') || finalCombinations.some(c => c.planet === 'True Node')) &&
    finalCombinations.some(c => c.planet === 'South Node');
  
  if (!hasAllCritical && normalizedPlanets && normalizedHouses) {
    console.warn('[Data Enrichment] Missing critical planets in combinations, attempting manual build');
    try {
      const { buildPlanetSignHouseCombinations, assignPlanetsToHouses } = await import('./astrology.js');
      const planetHouses = assignPlanetsToHouses(normalizedPlanets, normalizedHouses);
      const manualCombinations = buildPlanetSignHouseCombinations(normalizedPlanets, planetHouses) || [];
      
      // Merge with existing, prioritizing manual build
      const existingPlanets = new Set(finalCombinations.map(c => c.planet));
      const newCombinations = manualCombinations.filter(c => !existingPlanets.has(c.planet));
      premiumData.planetSignHouseCombinations = [...finalCombinations, ...newCombinations];
    } catch (error) {
      console.error('[Data Enrichment] Error building combinations manually:', error);
    }
  }
  
  // Merge enriched data with original
  return {
    ...rawData,
    // Ensure premium data points are at top level for prompts
    planetSignHouseCombinations: premiumData.planetSignHouseCombinations || [],
    houseCuspsDetailed: premiumData.houseCuspsDetailed || [],
    chartRulerLocation: premiumData.chartRulerLocation || null,
    majorAspects: premiumData.majorAspects || [],
    midpoints: premiumData.midpoints || [],
    // Ensure planets, houses, aspects are accessible
    planets: normalizedPlanets,
    houses: normalizedHouses,
    aspects: rawData.aspects || {},
    sun: normalizedPlanets.sun || rawData.sun,
    moon: normalizedPlanets.moon || rawData.moon,
    rising: rawData.ascendant || rawData.rising,
  };
}

/**
 * Enrich compatibility data with premium synastry points
 */
async function enrichCompatibilityData(rawData) {
  if (!rawData) return null;
  
  // If already has premium data, return as-is
  if (rawData.synastryAspects && rawData.houseOverlays && rawData.compositeChart) {
    return rawData;
  }
  
  // Extract from scores JSONB (database format)
  let premiumData = {};
  if (rawData.scores?._premium_data) {
    premiumData = rawData.scores._premium_data;
  } else if (rawData._premium_data) {
    premiumData = rawData._premium_data;
  }
  
  // Normalize chart1 and chart2 structures
  let chart1 = rawData.chart1 || rawData.user;
  let chart2 = rawData.chart2 || rawData.partner;
  
  // If charts are in database format, extract planets and houses
  if (chart1 && (chart1.natal_positions || chart1.planets)) {
    chart1 = {
      planets: chart1.planets || chart1.natal_positions || {},
      houses: chart1.houses || {},
    };
  }
  if (chart2 && (chart2.natal_positions || chart2.planets)) {
    chart2 = {
      planets: chart2.planets || chart2.natal_positions || {},
      houses: chart2.houses || {},
    };
  }
  
  // If missing, try to calculate from chart1 and chart2
  if ((!premiumData.synastryAspects || !premiumData.houseOverlays || !premiumData.compositeChart) 
      && chart1 && chart2 && chart1.planets && chart2.planets) {
    try {
      const { generateCompatibilityReport } = await import('./compatibility.js');
      const result = generateCompatibilityReport(
        chart1,
        chart2,
        rawData.user_name || rawData.person1Name || rawData.name || 'User',
        rawData.partner_name || rawData.person2Name || 'Partner'
      );
      
      premiumData.synastryAspects = result.synastryAspects || [];
      premiumData.houseOverlays = result.houseOverlays || [];
      premiumData.compositeChart = result.compositeChart || null;
    } catch (error) {
      console.error('[Data Enrichment] Error calculating compatibility:', error);
    }
  }
  
  return {
    ...rawData,
    chart1: chart1 || rawData.chart1 || rawData.user,
    chart2: chart2 || rawData.chart2 || rawData.partner,
    user: chart1 || rawData.user,
    partner: chart2 || rawData.partner,
    synastryAspects: premiumData.synastryAspects || [],
    houseOverlays: premiumData.houseOverlays || [],
    compositeChart: premiumData.compositeChart || null,
  };
}

/**
 * Enrich transit data with premium points
 */
async function enrichTransitData(rawData) {
  if (!rawData) return null;
  
  // If already has premium data, return as-is
  if (rawData.cuspTransits && rawData.progressedChart && rawData.transitsWithExactDates) {
    return rawData;
  }
  
  // Extract from nested structures if present
  const premiumData = {
    cuspTransits: rawData.cuspTransits || rawData._premium_data?.cuspTransits || [],
    progressedChart: rawData.progressedChart || rawData._premium_data?.progressedChart || null,
    transitsWithExactDates: rawData.transitsWithExactDates || rawData._premium_data?.transitsWithExactDates || rawData.transits || [],
  };
  
  return {
    ...rawData,
    ...premiumData,
  };
}

/**
 * Enrich destiny path data with Saturn house placement
 */
async function enrichDestinyPathData(rawData) {
  if (!rawData) return null;
  
  // If already has natal Saturn placement, return as-is
  if (rawData.natalSaturnPlacement || rawData.natal_saturn_sign_house) {
    return rawData;
  }
  
  // Extract Saturn placement from birth chart data
  if (rawData.birth_chart_data || rawData.chart) {
    const chartData = rawData.birth_chart_data || rawData.chart;
    
    // Find Saturn in planetSignHouseCombinations
    if (chartData.planetSignHouseCombinations) {
      const saturnCombo = chartData.planetSignHouseCombinations.find(c => 
        c.planet === 'Saturn' || c.planet?.toLowerCase() === 'saturn'
      );
      
      if (saturnCombo) {
        return {
          ...rawData,
          natalSaturnPlacement: `${saturnCombo.planet} in ${saturnCombo.sign} in the ${saturnCombo.houseName || `${saturnCombo.house}th House`}`,
          natal_saturn_sign_house: saturnCombo,
          natal_saturn_house: saturnCombo.house,
          natal_saturn_house_name: saturnCombo.houseName || `${saturnCombo.house}th House`,
        };
      }
    }
    
    // Fallback: extract from planets and houses
    if (chartData.planets?.saturn && chartData.houses) {
      const saturn = chartData.planets.saturn;
      // Find which house Saturn is in
      const planetHouses = chartData.planetHouses || {};
      const saturnHouse = planetHouses.saturn || planetHouses.Saturn;
      
      if (saturnHouse && chartData.houses[saturnHouse]) {
        const houseCusp = chartData.houses[saturnHouse];
        return {
          ...rawData,
          natalSaturnPlacement: `Saturn in ${saturn.sign} in the ${saturnHouse}th House`,
          natal_saturn_sign_house: {
            planet: 'Saturn',
            sign: saturn.sign,
            house: saturnHouse,
            houseName: `${saturnHouse}th House`
          },
          natal_saturn_house: saturnHouse,
          natal_saturn_house_name: `${saturnHouse}th House`,
        };
      }
    }
  }
  
  return rawData;
}

/**
 * Enrich karmic reading data with Nodal axis house placements
 */
async function enrichKarmicData(rawData) {
  if (!rawData) return null;
  
  // If already has nodal axis house placements, return as-is
  if (rawData.north_node_house && rawData.south_node_house) {
    return rawData;
  }
  
  // Extract Nodal axis placements from birth chart data
  if (rawData.birth_chart_data || rawData.chart) {
    const chartData = rawData.birth_chart_data || rawData.chart;
    
    // Find North Node and South Node in planetSignHouseCombinations
    if (chartData.planetSignHouseCombinations) {
      const northNode = chartData.planetSignHouseCombinations.find(c => 
        c.planet === 'North Node' || c.planet === 'True Node' || c.planet?.toLowerCase() === 'north node'
      );
      const southNode = chartData.planetSignHouseCombinations.find(c => 
        c.planet === 'South Node' || c.planet?.toLowerCase() === 'south node'
      );
      
      if (northNode && southNode) {
        return {
          ...rawData,
          north_node_sign: northNode.sign,
          north_node_house: northNode.house,
          north_node_house_name: northNode.houseName || `${northNode.house}th House`,
          south_node_sign: southNode.sign,
          south_node_house: southNode.house,
          south_node_house_name: southNode.houseName || `${southNode.house}th House`,
        };
      }
    }
    
    // Fallback: extract from planets and houses
    if (chartData.planets) {
      const northNode = chartData.planets.northNode || chartData.planets['North Node'] || chartData.planets['True Node'];
      const southNode = chartData.planets.southNode || chartData.planets['South Node'];
      const planetHouses = chartData.planetHouses || {};
      
      if (northNode && southNode) {
        const nnHouse = planetHouses.northNode || planetHouses['North Node'] || planetHouses['True Node'];
        const snHouse = planetHouses.southNode || planetHouses['South Node'];
        
        if (nnHouse && snHouse) {
          return {
            ...rawData,
            north_node_sign: northNode.sign,
            north_node_house: nnHouse,
            north_node_house_name: `${nnHouse}th House`,
            south_node_sign: southNode.sign,
            south_node_house: snHouse,
            south_node_house_name: `${snHouse}th House`,
          };
        }
      }
    }
  }
  
  return rawData;
}

/**
 * Generate report content using OpenAI
 */
export async function generateReportContent(reportType, data, progressCallback) {
  try {
    await progressCallback?.(20, 'Generating report content...');
    
    // Enrich data with premium data points before generating prompt
    let enrichedData = data;
    if (reportType === 'birth_chart' || reportType === 'natal_chart') {
      enrichedData = await enrichBirthChartData(data);
    } else if (reportType === 'compatibility' || reportType === 'compatibility_report') {
      enrichedData = await enrichCompatibilityData(data);
    } else if (reportType === 'transit_forecast_extended' || reportType === 'transit_forecast_short') {
      enrichedData = await enrichTransitData(data);
    } else if (reportType === 'destiny_path' || reportType === 'destiny_path_cycle') {
      enrichedData = await enrichDestinyPathData(data);
    } else if (reportType === 'karmic_reading' || reportType === 'shadow_work') {
      enrichedData = await enrichKarmicData(data);
    }
    
    // Import prompts dynamically to avoid circular dependencies
    const { getPromptByType } = await import('./report-prompts.js');
    const prompt = getPromptByType(reportType, enrichedData);
    
    await progressCallback?.(40, 'Calling AI for interpretation...');
    
    // Generate content using OpenAI
    const content = await generateText(prompt);
    
    await progressCallback?.(80, 'Formatting report...');
    
    return {
      content,
      sections: parseReportSections(content, reportType),
    };
  } catch (error) {
    console.error('[PDF Generator] Error generating report content:', error);
    throw error;
  }
}

/**
 * Parse report content into structured sections for PDF
 */
function parseReportSections(content, reportType) {
  // Basic parsing - can be enhanced later
  const sections = [];
  
  // Split by headers (lines starting with # or ##)
  const lines = content.split('\n');
  let currentSection = { title: 'Introduction', content: [] };
  
  for (const line of lines) {
    if (line.match(/^#{1,2}\s+/)) {
      // New section
      if (currentSection.content.length > 0) {
        sections.push({
          ...currentSection,
          content: currentSection.content.join('\n'),
        });
      }
      currentSection = {
        title: line.replace(/^#{1,2}\s+/, '').trim(),
        content: [],
      };
    } else if (line.trim()) {
      currentSection.content.push(line);
    }
  }
  
  // Add last section
  if (currentSection.content.length > 0) {
    sections.push({
      ...currentSection,
      content: currentSection.content.join('\n'),
    });
  }
  
  return sections.length > 0 ? sections : [{ title: 'Report', content }];
}

/**
 * Generate PDF from report content using Puppeteer
 */
export async function generatePDF(reportType, reportData, content, options = {}) {
  try {
    // Generate HTML from content
    const html = generateHTMLReport(reportType, reportData, content);
    
    // Generate PDF using external API service (works on Render without Chrome)
    let pdfUrl = null;
    
    try {
      // Use HTMLtoPDF API or similar service
      // For now, we'll use a free service like html2pdf.app or similar
      // You can also use services like PDFShift, HTMLtoPDF API, etc.
      
      const pdfApiUrl = process.env.PDF_API_URL || 'https://api.html2pdf.app/v1/generate';
      const pdfApiKey = process.env.PDF_API_KEY;
      
      if (pdfApiKey && pdfApiUrl) {
        // Use external PDF API service
        console.log('[PDF Generator] Using external PDF API service');
        
        const response = await fetch(pdfApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pdfApiKey}`,
          },
          body: JSON.stringify({
            html: html,
            options: {
              format: 'Letter',
              printBackground: true,
              margin: {
                top: '0.75in',
                right: '0.75in',
                bottom: '0.75in',
                left: '0.75in',
              },
            },
          }),
        });
        
        if (response.ok) {
          const pdfBuffer = await response.arrayBuffer();
          
          // Upload PDF to Cloudinary
          const { cloudinary } = await import('./cloudinary.js');
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: 'raw',
                folder: 'reports',
                public_id: `report-${reportType}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                format: 'pdf',
                use_filename: false,
                unique_filename: true,
              },
              (error, result) => {
                if (error) {
                  console.error('[PDF Generator] Cloudinary upload error:', error);
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );
            
            uploadStream.end(Buffer.from(pdfBuffer));
          });
          
          pdfUrl = uploadResult.secure_url;
          console.log('[PDF Generator] PDF uploaded successfully:', pdfUrl);
        } else {
          throw new Error(`PDF API returned ${response.status}: ${await response.text()}`);
        }
      } else {
        // Fallback: Try Puppeteer if available (for local dev)
        console.log('[PDF Generator] No PDF API configured, trying Puppeteer fallback');
        throw new Error('PDF_API_KEY not configured. Please set PDF_API_URL and PDF_API_KEY environment variables, or install Chrome for Puppeteer.');
      }
    } catch (apiError) {
      console.error('[PDF Generator] PDF API error:', apiError);
      
      // Final fallback: Try Puppeteer if Chrome is available (for local development)
      try {
        const puppeteer = await import('puppeteer-core');
        let executablePath = null;
        let launchArgs = [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ];
        
        // Try @sparticuz/chromium first
        try {
          const chromium = await import('@sparticuz/chromium');
          chromium.setGraphicsMode(false);
          executablePath = await chromium.executablePath();
          launchArgs = chromium.args;
          console.log('[PDF Generator] Using @sparticuz/chromium as fallback');
        } catch {
          // Try system Chrome
          const fs = await import('fs');
          const { access } = fs.promises;
          const possiblePaths = [
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
          ];
          
          for (const path of possiblePaths) {
            try {
              await access(path);
              executablePath = path;
              break;
            } catch {}
          }
        }
        
        if (executablePath) {
          const browser = await puppeteer.launch({
            args: launchArgs,
            executablePath: executablePath,
            headless: true,
          });
          
          const page = await browser.newPage();
          await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
          
          const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
          });
          
          await browser.close();
          
          // Upload to Cloudinary
          const { cloudinary } = await import('./cloudinary.js');
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: 'raw',
                folder: 'reports',
                public_id: `report-${reportType}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                format: 'pdf',
              },
              (error, result) => error ? reject(error) : resolve(result)
            );
            uploadStream.end(Buffer.from(pdfBuffer));
          });
          
          pdfUrl = uploadResult.secure_url;
          console.log('[PDF Generator] PDF generated with Puppeteer fallback');
        } else {
          console.warn('[PDF Generator] No PDF generation method available. Returning HTML only.');
        }
      } catch (puppeteerError) {
        console.error('[PDF Generator] All PDF generation methods failed:', puppeteerError);
        // Will return null pdfUrl, HTML is still available
      }
    }
    
    return {
      pdfUrl,
      html,
    };
  } catch (error) {
    console.error('[PDF Generator] Error generating PDF:', error);
    // Return HTML as fallback
    const html = generateHTMLReport(reportType, reportData, content);
    return {
      pdfUrl: null,
      html,
    };
  }
}

/**
 * Generate HTML report structure with cover page and page breaks
 */
function generateHTMLReport(reportType, reportData, content) {
  const { name, card_spread, moon_phase, sun, moon, rising } = reportData;
  
  const title = getReportTitle(reportType);
  const sections = parseReportSections(content.content || content, reportType);
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // For premium reports, use the sections array directly
  const reportSections = content.sections || sections;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${name || 'Your Reading'}</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    
    @page:first {
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.8;
      color: #1a202c;
      background: #ffffff;
      font-size: 11pt;
    }
    
    /* Cover Page */
    .cover-page {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      color: white;
      text-align: center;
      padding: 60px;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    
    .cover-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
      opacity: 0.3;
    }
    
    .cover-content {
      position: relative;
      z-index: 1;
      max-width: 600px;
    }
    
    .cover-logo {
      font-size: 3.5em;
      font-weight: 300;
      letter-spacing: 8px;
      margin-bottom: 20px;
      text-transform: uppercase;
      opacity: 0.95;
    }
    
    .cover-title {
      font-size: 2.2em;
      font-weight: 400;
      margin: 40px 0 20px;
      line-height: 1.3;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    
    .cover-subtitle {
      font-size: 1.3em;
      font-weight: 300;
      margin: 20px 0;
      opacity: 0.9;
      font-style: italic;
    }
    
    .cover-name {
      font-size: 1.6em;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid rgba(255,255,255,0.3);
      font-weight: 300;
    }
    
    .cover-date {
      font-size: 1em;
      margin-top: 20px;
      opacity: 0.8;
      font-weight: 300;
    }
    
    .cover-website {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.9em;
      opacity: 0.7;
      letter-spacing: 2px;
    }
    
    /* Content Pages */
    .page {
      min-height: 100vh;
      padding: 60px 80px;
      page-break-after: always;
      position: relative;
      background: #ffffff;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    /* Page Header */
    .page-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 80px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 80px;
      background: linear-gradient(to right, #f7fafc, #ffffff);
    }
    
    .page-header-logo {
      font-size: 0.85em;
      color: #9333ea;
      font-weight: 600;
      letter-spacing: 1px;
    }
    
    .page-header-title {
      font-size: 0.75em;
      color: #718096;
      font-style: italic;
    }
    
    /* Page Footer */
    .page-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 80px;
      font-size: 0.7em;
      color: #a0aec0;
    }
    
    .page-number {
      font-weight: 500;
    }
    
    /* Section Styling */
    .section {
      margin-top: 40px;
      margin-bottom: 60px;
      page-break-inside: avoid;
    }
    
    .section:first-child {
      margin-top: 100px;
    }
    
    .section-title {
      color: #553c9a;
      font-size: 1.8em;
      font-weight: 600;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid #9333ea;
      letter-spacing: 0.5px;
    }
    
    .section-content {
      text-align: justify;
      font-size: 1.05em;
      line-height: 1.9;
    }
    
    .chart-image-container {
      margin: 30px 0;
      text-align: center;
      page-break-inside: avoid;
    }
    
    .chart-image {
      max-width: 100%;
      height: auto;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      color: #2d3748;
      white-space: pre-wrap;
    }
    
    .section-content p {
      margin-bottom: 18px;
      text-indent: 0;
    }
    
    .section-content strong {
      color: #553c9a;
      font-weight: 600;
    }
    
    .section-content em {
      color: #6b46c1;
      font-style: italic;
    }
    
    /* Table of Contents (if needed) */
    .toc {
      page-break-after: always;
      padding: 100px 80px;
    }
    
    .toc-title {
      font-size: 2em;
      color: #553c9a;
      margin-bottom: 40px;
      text-align: center;
      border-bottom: 3px solid #9333ea;
      padding-bottom: 20px;
    }
    
    .toc-item {
      margin: 15px 0;
      padding-left: 20px;
      font-size: 1.1em;
      color: #4a5568;
    }
    
    .toc-item::before {
      content: '•';
      color: #9333ea;
      font-weight: bold;
      margin-right: 10px;
    }
    
    /* Closing Blessing Special Styling */
    .closing-section {
      background: linear-gradient(to bottom, #ffffff, #f7fafc);
      padding: 40px;
      border-radius: 8px;
      border-left: 5px solid #9333ea;
      margin-top: 40px;
    }
    
    .closing-section .section-title {
      color: #9333ea;
      border-bottom: 2px solid #c084fc;
    }
    
    /* Print Styles */
    @media print {
      .page {
        page-break-after: always;
      }
      
      .page:last-child {
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-content">
      <div class="cover-logo">Cosmic Spiritual Guide</div>
      <div class="cover-title">${title}</div>
      <div class="cover-subtitle">Your Personalized Spiritual Reading</div>
      ${name ? `<div class="cover-name">Prepared for ${name}</div>` : ''}
      <div class="cover-date">${reportDate}</div>
      <div class="cover-website">www.cosmicspiritguide.com</div>
    </div>
  </div>
  
  ${reportSections.map((section, index) => `
    <div class="page">
      <div class="page-header">
        <div class="page-header-logo">COSMIC SPIRITUAL GUIDE</div>
        <div class="page-header-title">${title}</div>
      </div>
      
      <div class="section">
        <h1 class="section-title">${section.title || section.type || 'Section'}</h1>
        ${section.chartImage ? `
          <div class="chart-image-container">
            <img src="${section.chartImage}" alt="Birth Chart" class="chart-image" />
          </div>
        ` : ''}
        <div class="section-content ${section.type === 'closing' ? 'closing-section' : ''}">
          ${formatContent(section.content?.content || section.content || '')}
        </div>
      </div>
      
      <div class="page-footer">
        <div class="page-number">Page ${index + 2}</div>
        <div>www.cosmicspiritguide.com</div>
        <div class="page-number">${reportDate}</div>
      </div>
    </div>
  `).join('')}
</body>
</html>
  `.trim();
}

/**
 * Format content for HTML display (convert markdown to HTML)
 */
function formatContent(content) {
  if (!content || typeof content !== 'string') return '';
  
  // Convert markdown bold to HTML
  content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert markdown italic to HTML
  content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert line breaks to paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  return paragraphs.map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('');
}

/**
 * Get report title by type
 */
function getReportTitle(reportType) {
  const titles = {
    'tarot': 'Tarot Reading',
    'moon_reading': 'Moon Phase Reading',
    'birth_chart': 'Birth Chart Analysis',
    'natal_chart': 'Natal Chart Reading',
    'compatibility': 'Compatibility Report',
    'compatibility_report': 'Compatibility Analysis',
    'transit_forecast_short': 'Short-Term Transit Forecast',
    'transit_forecast_extended': 'Extended Transit Forecast',
    'destiny_path': 'Destiny Path Cycle Reading',
    'relationship_matrix': 'Relationship Matrix Analysis',
    'karmic_reading': 'Karmic & Shadow Work Reading',
    'shadow_work': 'Shadow Work Reading',
  };
  
  return titles[reportType?.toLowerCase()] || 'Spiritual Reading';
}

/**
 * Generate complete premium report (multiple sections)
 */
export async function generatePremiumReport(reportType, data, progressCallback) {
  try {
    await progressCallback?.(10, 'Initializing report generation...');
    
    const sections = [];
    
    // Generate main reading content
    if (reportType === 'ESSENTIAL') {
      // Essential: Tarot + Moon + Short Forecast
      await progressCallback?.(15, 'Generating Tarot reading...');
      const tarot = await generateReportContent('tarot', data.tarot_data, (p, m) => 
        progressCallback?.(15 + (p * 0.25), m)
      );
      sections.push({ 
        type: 'tarot', 
        title: 'Tarot Reading', 
        content: tarot,
        summary: extractKeyPoints(tarot.content, 'tarot')
      });
      
      await progressCallback?.(40, 'Generating Moon reading...');
      const moon = await generateReportContent('moon_reading', data.moon_data, (p, m) => 
        progressCallback?.(40 + (p * 0.25), m)
      );
      sections.push({ 
        type: 'moon', 
        title: 'Moon Phase Reading', 
        content: moon,
        summary: extractKeyPoints(moon.content, 'moon')
      });
      
      await progressCallback?.(65, 'Generating Transit forecast...');
      const forecast = await generateReportContent('transit_forecast_short', data.transit_data, (p, m) => 
        progressCallback?.(65 + (p * 0.25), m)
      );
      sections.push({ 
        type: 'transit', 
        title: 'Short-Term Forecast', 
        content: forecast,
        summary: extractKeyPoints(forecast.content, 'transit')
      });
      
    } else if (reportType === 'ADVANCED') {
      // Advanced: Birth Chart + Compatibility + Extended Forecast
      await progressCallback?.(20, 'Generating Birth Chart analysis...');
      const birthChart = await generateReportContent('birth_chart', data.birth_chart_data, (p, m) => 
        progressCallback?.(20 + (p * 0.2), m)
      );
      
      // Generate birth chart SVG image
      let chartImageUrl = null;
      try {
        const { generateBirthChartSVG } = await import('./birth-chart-svg.js');
        const chartSVG = generateBirthChartSVG(
          data.birth_chart_data,
          {
            date: data.birth_chart_data?.birth_date || data.birth_chart_data?.date,
            time: data.birth_chart_data?.birth_time || data.birth_chart_data?.time,
            location: data.birth_chart_data?.location || data.birth_chart_data?.birth_location,
          }
        );
        
        // Convert SVG to data URL for embedding in PDF
        const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(chartSVG).toString('base64')}`;
        chartImageUrl = svgDataUrl;
      } catch (chartError) {
        console.error('[PDF Generator] Error generating birth chart image:', chartError);
        // Continue without chart image
      }
      
      sections.push({ 
        type: 'birth_chart', 
        title: 'Birth Chart Analysis', 
        content: birthChart,
        summary: extractKeyPoints(birthChart.content, 'birth_chart'),
        chartImage: chartImageUrl, // Include chart image
      });
      
      await progressCallback?.(40, 'Generating Compatibility report...');
      const compatibility = await generateReportContent('compatibility', data.compatibility_data, (p, m) => 
        progressCallback?.(40 + (p * 0.2), m)
      );
      sections.push({ 
        type: 'compatibility', 
        title: 'Compatibility Analysis', 
        content: compatibility,
        summary: extractKeyPoints(compatibility.content, 'compatibility')
      });
      
      await progressCallback?.(60, 'Generating Extended forecast...');
      const forecast = await generateReportContent('transit_forecast_extended', data.transit_data, (p, m) => 
        progressCallback?.(60 + (p * 0.2), m)
      );
      sections.push({ 
        type: 'transit', 
        title: 'Extended Transit Forecast', 
        content: forecast,
        summary: extractKeyPoints(forecast.content, 'transit')
      });
      
    } else if (reportType === 'MASTER') {
      // Master: All of Advanced + Destiny Path + Karmic Reading + Relationship Matrix
      await progressCallback?.(10, 'Generating Birth Chart...');
      const birthChart = await generateReportContent('birth_chart', data.birth_chart_data, (p, m) => 
        progressCallback?.(10 + (p * 0.1), m)
      );
      
      // Generate birth chart SVG image (Master also includes chart)
      let chartImageUrl = null;
      try {
        const { generateBirthChartSVG } = await import('./birth-chart-svg.js');
        const chartSVG = generateBirthChartSVG(
          data.birth_chart_data,
          {
            date: data.birth_chart_data?.birth_date || data.birth_chart_data?.date,
            time: data.birth_chart_data?.birth_time || data.birth_chart_data?.time,
            location: data.birth_chart_data?.location || data.birth_chart_data?.birth_location,
          }
        );
        const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(chartSVG).toString('base64')}`;
        chartImageUrl = svgDataUrl;
      } catch (chartError) {
        console.error('[PDF Generator] Error generating birth chart image:', chartError);
      }
      
      sections.push({ 
        type: 'birth_chart', 
        title: 'Birth Chart Analysis', 
        content: birthChart,
        summary: extractKeyPoints(birthChart.content, 'birth_chart'),
        chartImage: chartImageUrl, // Include chart image
      });
      
      await progressCallback?.(20, 'Generating Compatibility analysis...');
      const compatibility = await generateReportContent('compatibility', data.compatibility_data, (p, m) => 
        progressCallback?.(20 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'compatibility', 
        title: 'Compatibility Analysis', 
        content: compatibility,
        summary: extractKeyPoints(compatibility.content, 'compatibility')
      });
      
      await progressCallback?.(30, 'Generating Extended forecast...');
      const forecast = await generateReportContent('transit_forecast_extended', data.transit_data, (p, m) => 
        progressCallback?.(30 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'transit', 
        title: 'Extended Transit Forecast', 
        content: forecast,
        summary: extractKeyPoints(forecast.content, 'transit')
      });
      
      await progressCallback?.(40, 'Generating Destiny Path reading...');
      const destiny = await generateReportContent('destiny_path', data.destiny_data, (p, m) => 
        progressCallback?.(40 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'destiny', 
        title: 'Destiny Path Cycle', 
        content: destiny,
        summary: extractKeyPoints(destiny.content, 'destiny')
      });
      
      await progressCallback?.(50, 'Generating Relationship Matrix...');
      const matrix = await generateReportContent('relationship_matrix', data.matrix_data, (p, m) => 
        progressCallback?.(50 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'matrix', 
        title: 'Relationship Matrix', 
        content: matrix,
        summary: extractKeyPoints(matrix.content, 'matrix')
      });
      
      await progressCallback?.(60, 'Generating Karmic reading...');
      const karmic = await generateReportContent('karmic_reading', data.karmic_data, (p, m) => 
        progressCallback?.(60 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'karmic', 
        title: 'Karmic & Shadow Work', 
        content: karmic,
        summary: extractKeyPoints(karmic.content, 'karmic')
      });
    }
    
    // Generate closing blessing - pass actual report sections so it can reference them
    await progressCallback?.(90, 'Adding closing message...');
    const { getClosingBlessingPrompt } = await import('./report-prompts.js');
    const closing = await generateText(
      getClosingBlessingPrompt({ 
        name: data.name, 
        report_sections: sections, // Pass actual sections with content
        report_type: reportType,
        key_themes: sections.map(s => s.title), // Keep as fallback
      })
    );
    sections.push({ type: 'closing', title: 'Closing Blessing', content: { content: closing } });
    
    // Generate HTML and PDF (always generate PDF for premium reports)
    await progressCallback?.(95, 'Generating PDF...');
    const fullContent = sections.map(s => `${s.title}\n\n${s.content.content || s.content}`).join('\n\n---\n\n');
    // Pass sections array for proper page breaks
    const html = generateHTMLReport(reportType, data, { content: fullContent, sections });
    const pdf = await generatePDF(reportType, data, { content: fullContent, sections });
    
    return {
      sections,
      content: fullContent,
      html,
      pdfUrl: pdf.pdfUrl,
    };
  } catch (error) {
    console.error('[PDF Generator] Error generating premium report:', error);
    throw error;
  }
}

