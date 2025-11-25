/**
 * PDF Generation Service
 * Generates professionally formatted PDF reports from reading results
 */

import { generateText } from './openai.js';
import { formatOrdinal } from './astrology.js';

/**
 * Calculate age from birth date
 * @param {string|Date} birthDate - Birth date as string (YYYY-MM-DD) or Date object
 * @returns {number|null} Age in years, or null if invalid
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
  
  let date;
  if (typeof birthDate === 'string') {
    // Parse YYYY-MM-DD format
    const parts = birthDate.split('-');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      date = new Date(birthDate);
    }
  } else if (birthDate instanceof Date) {
    date = birthDate;
  } else {
    return null;
  }
  
  if (isNaN(date.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  
  return age;
}

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
          natalSaturnPlacement: `${saturnCombo.planet} in ${saturnCombo.sign} in the ${saturnCombo.houseName || formatOrdinal(saturnCombo.house)}`,
          natal_saturn_sign_house: saturnCombo,
          natal_saturn_house: saturnCombo.house,
          natal_saturn_house_name: saturnCombo.houseName || formatOrdinal(saturnCombo.house),
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
          natalSaturnPlacement: `Saturn in ${saturn.sign} in the ${formatOrdinal(saturnHouse)}`,
          natal_saturn_sign_house: {
            planet: 'Saturn',
            sign: saturn.sign,
            house: saturnHouse,
            houseName: formatOrdinal(saturnHouse)
          },
          natal_saturn_house: saturnHouse,
          natal_saturn_house_name: formatOrdinal(saturnHouse),
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
          north_node_house_name: northNode.houseName || formatOrdinal(northNode.house),
          south_node_sign: southNode.sign,
          south_node_house: southNode.house,
          south_node_house_name: southNode.houseName || formatOrdinal(southNode.house),
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
            north_node_house_name: formatOrdinal(nnHouse),
            south_node_sign: southNode.sign,
            south_node_house: snHouse,
            south_node_house_name: formatOrdinal(snHouse),
          };
        }
      }
    }
  }
  
  return rawData;
}

/**
 * Generate report content using OpenAI
 * 
 * @param {string} reportType - Type of report section
 * @param {object} data - Report data. If natalChart is provided, it's used directly (single source of truth)
 * @param {function} progressCallback - Progress callback
 * @returns {Promise<object>} Generated content with sections
 */
export async function generateReportContent(reportType, data, progressCallback) {
  try {
    await progressCallback?.(20, 'Generating report content...');
    
    // If natalChart is provided directly, use it as-is (single source of truth)
    // Otherwise, enrich data with premium data points before generating prompt
    let enrichedData = data;
    
    // Check if data contains a natalChart object (the single source of truth)
    if (data.natalChart) {
      // Use the natalChart directly - no enrichment needed, it's already complete
      enrichedData = data.natalChart;
    } else if (reportType === 'birth_chart' || reportType === 'natal_chart') {
      // If data IS the natalChart (passed directly), use it
      if (data.planetSignHouseCombinations && data.houseCuspsDetailed) {
        enrichedData = data; // Already a complete natalChart
      } else {
        enrichedData = await enrichBirthChartData(data);
      }
    } else if (reportType === 'compatibility' || reportType === 'compatibility_report') {
      // For compatibility, use natalChart from data.user if available
      if (data.user && data.user.planetSignHouseCombinations) {
        enrichedData = {
          ...data,
          user: data.user, // Use the natalChart object directly
        };
      } else {
        enrichedData = await enrichCompatibilityData(data);
      }
    } else if (reportType === 'transit_forecast_extended' || reportType === 'transit_forecast_short') {
      // For transits, use natalChart from data.natalChart if available
      if (data.natalChart && data.natalChart.planetSignHouseCombinations) {
        enrichedData = {
          ...data,
          natalChart: data.natalChart, // Use the natalChart object directly
        };
      } else {
        enrichedData = await enrichTransitData(data);
      }
    } else if (reportType === 'destiny_path' || reportType === 'destiny_path_cycle') {
      // For destiny path, use natalChart from data.natalChart if available
      if (data.natalChart && data.natalChart.planetSignHouseCombinations) {
        enrichedData = {
          ...data,
          natalChart: data.natalChart, // Use the natalChart object directly
        };
      } else {
        enrichedData = await enrichDestinyPathData(data);
      }
    } else if (reportType === 'karmic_reading' || reportType === 'shadow_work') {
      // For karmic, use natalChart from data.natalChart if available
      if (data.natalChart && data.natalChart.planetSignHouseCombinations) {
        enrichedData = {
          ...data,
          natalChart: data.natalChart, // Use the natalChart object directly
        };
      } else {
        enrichedData = await enrichKarmicData(data);
      }
    } else if (reportType === 'relationship_matrix') {
      // For relationship matrix, use natalChart from data.user if available
      if (data.user && data.user.planetSignHouseCombinations) {
        enrichedData = {
          ...data,
          user: data.user, // Use the natalChart object directly
        };
      } else {
        enrichedData = data; // Use as-is for relationship matrix
      }
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
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in',
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
            margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
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
  const { name } = reportData;
  
  const title = getReportTitle(reportType);
  const sections = parseReportSections(content.content || content, reportType);
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const reportSections = content.sections || sections;
  const defaultImages = getDefaultThemeImages();
  const themeImages = {
    cover: defaultImages.cover,
    constellation: defaultImages.constellation,
    watercolor: defaultImages.watercolor,
    gateway: defaultImages.gateway,
    swirl: defaultImages.swirl,
    ...(reportData.themeImages || {}),
  };
  const accentImages = reportData.accentImages || [
    themeImages.constellation,
    themeImages.watercolor,
    themeImages.gateway,
    themeImages.swirl,
  ];
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${name || 'Your Reading'}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0.5in;
    }
    
    @page:first {
      margin: 0;
      size: letter portrait;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cormorant Garamond', 'Georgia', serif;
      line-height: 1.75;
      color: #1f2432;
      background: #fff;
      font-size: 11pt;
      width: 8.5in;
      margin: 0 auto;
    }
    
    .cover-page {
      width: 8.5in;
      height: 11in;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: url('${themeImages.cover}') center/cover no-repeat, radial-gradient(circle at top, rgba(255,255,255,0.35), rgba(102,126,234,0.55));
      color: #fff;
      text-align: center;
      padding: 1.5in;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    
    .cover-page::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(147,51,234,0.45), rgba(14,165,233,0.35));
    }
    
    .cover-content {
      position: relative;
      z-index: 1;
      max-width: 620px;
    }
    
    .cover-logo {
      font-size: 28pt;
      letter-spacing: 4px;
      font-weight: 300;
      text-transform: uppercase;
      margin-bottom: 0.3in;
    }
    
    .cover-title {
      font-size: 32pt;
      line-height: 1.2;
      margin: 0.4in 0 0.2in;
    }
    
    .cover-subtitle {
      font-size: 14pt;
      opacity: 0.9;
      font-style: italic;
    }
    
    .cover-name {
      font-size: 18pt;
      margin-top: 0.6in;
      padding-top: 0.3in;
      border-top: 1px solid rgba(255,255,255,0.4);
      letter-spacing: 0.5px;
    }
    
    .cover-date {
      margin-top: 0.15in;
      font-size: 11pt;
      opacity: 0.8;
    }
    
    .cover-website {
      margin-top: 0.8in;
      font-size: 9pt;
      letter-spacing: 2px;
    }
    
    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.75in 0.5in;
      position: relative;
      page-break-after: always;
      background: #fff;
    }
    
    .page:last-child {
      page-break-after: auto;
    }
    
    .page-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 0.6in;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0.5in;
      border-bottom: 1px solid #e2e8f0;
      background: rgba(249,250,255,0.95);
      font-size: 9pt;
      letter-spacing: 0.5px;
      color: #4c1d95;
    }
    
    .page-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 0.5in;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0.5in;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #7c8aa1;
      background: rgba(255,255,255,0.95);
    }
    
    .page-inner {
      width: 100%;
      max-width: 7.5in;
      margin: 0 auto;
      padding-top: 0.8in;
      padding-bottom: 0.7in;
    }
    
    .section {
      display: flex;
      gap: 0.3in;
      margin-bottom: 0.4in;
      align-items: flex-start;
      page-break-inside: avoid;
    }
    
    .section-media {
      width: 2.2in;
      flex-shrink: 0;
      border-radius: 8px;
      min-height: 3in;
      background-size: cover;
      background-position: center;
      position: relative;
      box-shadow: 0 4px 12px rgba(15,23,42,0.12);
    }
    
    .section-media::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 8px;
      background: linear-gradient(145deg, rgba(255,255,255,0.15), rgba(15,23,42,0.25));
      mix-blend-mode: screen;
    }
    
    .section-body {
      flex: 1;
      min-width: 0;
      background: #fff;
      border-radius: 8px;
      padding: 0.35in 0.4in;
      box-shadow: 0 2px 8px rgba(15,23,42,0.06);
      position: relative;
      overflow: hidden;
    }
    
    .section-body::before {
      content: '';
      position: absolute;
      top: 25px;
      right: 35px;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(147,51,234,0.13), transparent 70%);
      pointer-events: none;
    }
    
    .section-title {
      font-size: 20pt;
      margin-bottom: 0.15in;
      color: #4c1d95;
      line-height: 1.3;
    }
    
    .section-subtitle {
      font-size: 9pt;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #a78bfa;
      margin-bottom: 0.12in;
    }
    
    .section-content {
      font-size: 11pt;
      line-height: 1.7;
    }
    
    .section-content p {
      margin: 0 0 0.15in;
      text-align: justify;
      orphans: 3;
      widows: 3;
    }
    
    .section-content p:first-of-type::first-letter {
      font-size: 28pt;
      font-weight: 600;
      color: #7c3aed;
      padding-right: 4px;
      float: left;
      line-height: 0.9;
      margin-top: 2px;
    }
    
    ul {
      margin: 0 0 0.2in 0.25in;
      padding: 0;
    }
    
    ul li {
      margin-bottom: 0.1in;
      position: relative;
      list-style: none;
      padding-left: 0.15in;
    }
    
    ul li::before {
      content: '✦';
      color: #c084fc;
      position: absolute;
      left: -0.2in;
      top: 0;
      font-size: 9pt;
    }
    
    blockquote {
      margin: 0.2in 0;
      padding: 0.15in 0.2in;
      border-left: 3px solid #c084fc;
      background: rgba(199,210,254,0.15);
      font-style: italic;
      color: #433b66;
      font-size: 10pt;
    }
    
    .chart-image-container {
      margin: 0.25in 0 0.3in;
      text-align: center;
      page-break-inside: avoid;
    }
    
    .chart-image {
      max-width: 100%;
      width: auto;
      height: auto;
      max-height: 5in;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 2px 8px rgba(15,23,42,0.12);
    }
    
    .section.closing .section-body {
      background: linear-gradient(145deg, #ffffff 0%, #f6edff 100%);
      border-left: 6px solid #c084fc;
    }
    
    .section.closing .section-media {
      display: none;
    }
    
    .section-divider {
      width: 100%;
      height: 0.3in;
      border-radius: 0.15in;
      margin: 0.2in auto 0.4in;
      background: url('${themeImages.swirl}') center/cover no-repeat;
      opacity: 0.85;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.45);
    }
    
    .section.closing .section-body {
      width: 100%;
      max-width: 7in;
      margin: 0 auto;
    }
    
    @media print {
      body {
        background: #fff;
      }
      .section-media {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page {
        background: #fff;
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
        <div>COSMIC SPIRITUAL GUIDE</div>
        <div>${title}</div>
      </div>
      <div class="page-inner">
        <div class="section ${section.type === 'closing' ? 'closing' : ''}">
          ${section.type === 'closing' ? '' : `<div class="section-media" style="background-image: url('${accentImages[index % accentImages.length]}');"></div>`}
          <div class="section-body ${section.type === 'closing' ? 'closing-body' : ''}">
            <div class="section-subtitle">${reportDate}</div>
            <h1 class="section-title">${section.title || section.type || 'Section'}</h1>
            ${section.chartImage ? `
              <div class="chart-image-container">
                <img src="${section.chartImage}" alt="Birth Chart Wheel" class="chart-image" />
              </div>
            ` : ''}
            <div class="section-content">
              ${formatSectionContent(section.content?.content || section.content || '')}
            </div>
          </div>
        </div>
        ${index < reportSections.length - 1 ? `<div class="section-divider"></div>` : ''}
      </div>
      <div class="page-footer">
        <div>Page ${index + 2}</div>
        <div>${name ? `${name} • ${reportDate}` : reportDate}</div>
        <div>www.cosmicspiritguide.com</div>
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
function formatSectionContent(content) {
  if (!content || typeof content !== 'string') return '';
  
  let formatted = content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  const blocks = formatted.split(/\n{2,}/).filter(Boolean);
  return blocks.map((block) => {
    const trimmed = block.trim();
    
    if (trimmed.startsWith('>')) {
      const quote = trimmed.replace(/^>\s?/gm, '');
      return `<blockquote>${quote}</blockquote>`;
    }
    
    const lines = trimmed.split('\n');
    const isList = lines.every(line => /^[-*]\s+/.test(line.trim()));
    if (isList) {
      const items = lines.map(line => line.replace(/^[-*]\s+/, '').trim()).filter(Boolean);
      return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
    }
    
    return `<p>${trimmed.replace(/\n/g, ' ')}</p>`;
  }).join('');
}

function getDefaultThemeImages() {
  return {
    cover: svgToDataUri(`
      <svg width="1600" height="1000" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bg" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="60%" stop-color="#111827"/>
            <stop offset="100%" stop-color="#020617"/>
          </radialGradient>
          <linearGradient id="trail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f472b6" stop-opacity="0"/>
            <stop offset="40%" stop-color="#f472b6" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.95"/>
          </linearGradient>
        </defs>
        <rect width="1600" height="1000" fill="url(#bg)"/>
        <g stroke="rgba(255,255,255,0.08)" stroke-width="1">
          <circle cx="800" cy="500" r="140"/>
          <circle cx="800" cy="500" r="260"/>
          <circle cx="800" cy="500" r="380"/>
          <circle cx="800" cy="500" r="520"/>
          <circle cx="800" cy="500" r="640"/>
        </g>
        <g stroke="url(#trail)" stroke-width="18" stroke-linecap="round">
          <path d="M200 250 C600 200, 1000 350, 1400 280"/>
          <path d="M180 420 C620 360, 1040 470, 1420 420"/>
          <path d="M160 600 C640 540, 1080 640, 1440 600"/>
        </g>
        <g fill="#fde047" opacity="0.8">
          <circle cx="520" cy="330" r="4"/>
          <circle cx="980" cy="360" r="5"/>
          <circle cx="740" cy="620" r="4.5"/>
          <circle cx="1180" cy="540" r="6"/>
        </g>
      </svg>
    `),
    constellation: svgToDataUri(`
      <svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="violet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2a1b63"/>
            <stop offset="45%" stop-color="#3b1f78"/>
            <stop offset="100%" stop-color="#51247f"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="900" fill="url(#violet)"/>
        <g stroke="#d8b4fe" stroke-width="2" fill="none">
          <path d="M200 420 L280 360 L360 430 L420 370 L500 440 L560 400"/>
          <path d="M660 520 L720 460 L780 510 L820 450 L900 520 L960 470 L1020 540"/>
        </g>
        <g fill="#fde68a">
          <circle cx="200" cy="420" r="4"/>
          <circle cx="280" cy="360" r="3"/>
          <circle cx="360" cy="430" r="4"/>
          <circle cx="420" cy="370" r="3"/>
          <circle cx="500" cy="440" r="5"/>
          <circle cx="560" cy="400" r="3"/>
          <circle cx="660" cy="520" r="4"/>
          <circle cx="720" cy="460" r="3"/>
          <circle cx="780" cy="510" r="4"/>
          <circle cx="820" cy="450" r="3"/>
          <circle cx="900" cy="520" r="5"/>
          <circle cx="960" cy="470" r="4"/>
          <circle cx="1020" cy="540" r="4"/>
        </g>
      </svg>
    `),
    watercolor: svgToDataUri(`
      <svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="swirl" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#a5b4fc"/>
            <stop offset="40%" stop-color="#c4b5fd" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#f5d0fe" stop-opacity="0.4"/>
          </radialGradient>
        </defs>
        <rect width="1200" height="900" fill="#fef3f4"/>
        <circle cx="350" cy="300" r="480" fill="url(#swirl)" opacity="0.9"/>
        <circle cx="800" cy="500" r="420" fill="url(#swirl)" opacity="0.5"/>
        <path d="M150 600 Q450 450 750 700" stroke="#bfdbfe" stroke-width="60" stroke-linecap="round" opacity="0.4" fill="none"/>
      </svg>
    `),
    gateway: svgToDataUri(`
      <svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="900" fill="#f5d0fe"/>
        <rect x="600" width="600" height="900" fill="#0f172a"/>
        <path d="M650 880 L780 400 Q800 320 840 400 L970 880" fill="#f8fafc" opacity="0.8"/>
        <path d="M180 150 Q380 250 420 520" stroke="#f59e0b" stroke-width="20" fill="none" opacity="0.4"/>
        <path d="M980 120 Q820 280 860 540" stroke="#60a5fa" stroke-width="18" fill="none" opacity="0.4"/>
      </svg>
    `),
    swirl: svgToDataUri(`
      <svg width="1400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gold" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#fcd34d" stop-opacity="0.2"/>
            <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#fcd34d" stop-opacity="0.2"/>
          </linearGradient>
          <linearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#d1d5db" stop-opacity="0.2"/>
            <stop offset="50%" stop-color="#e5e7eb" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#d1d5db" stop-opacity="0.2"/>
          </linearGradient>
        </defs>
        <rect width="1400" height="300" fill="#fdf6ec"/>
        <path d="M-50 200 C300 80, 600 320, 950 160 C1150 80, 1400 260, 1550 180" stroke="url(#gold)" stroke-width="80" fill="none" stroke-linecap="round" opacity="0.7"/>
        <path d="M-100 100 C250 260, 620 40, 1000 220 C1200 300, 1500 60, 1600 160" stroke="url(#silver)" stroke-width="60" fill="none" stroke-linecap="round" opacity="0.6"/>
      </svg>
    `),
  };
}

function svgToDataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg.trim()).toString('base64')}`;
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
 * 
 * @param {string} reportType - Type of report (ESSENTIAL, ADVANCED, MASTER)
 * @param {object} data - Report data containing natalChart (single source of truth) and other section data
 * @param {function} progressCallback - Progress callback function
 * @returns {Promise<object>} Generated report with sections, content, html, and pdfUrl
 */
export async function generatePremiumReport(reportType, data, progressCallback) {
  try {
    await progressCallback?.(10, 'Initializing report generation...');
    
    // Extract the single NatalChart object - this is the source of truth for all sections
    const natalChart = data.natalChart || data.birth_chart_data;
    
    if (!natalChart && (reportType === 'ADVANCED' || reportType === 'MASTER')) {
      throw new Error('Natal chart data is required for Advanced and Master reports');
    }
    
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
      // All sections use the same natalChart object
      await progressCallback?.(20, 'Generating Birth Chart analysis...');
      const birthChart = await generateReportContent('birth_chart', natalChart, (p, m) => 
        progressCallback?.(20 + (p * 0.2), m)
      );
      
      // Generate birth chart SVG image using the same natalChart object
      let chartImageUrl = null;
      try {
        const { generateBirthChartSVG } = await import('./birth-chart-svg.js');
        
        const chartSVG = generateBirthChartSVG(
          natalChart, // Use the same natalChart object
          {
            date: natalChart.birth_date,
            time: natalChart.birth_time,
            location: natalChart.location,
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
      // Pass natalChart to compatibility (it will use user's chart + partner's chart from data.compatibility_data)
      const compatibility = await generateReportContent('compatibility', {
        ...data.compatibility_data,
        user: natalChart, // Use the same natalChart object
      }, (p, m) => 
        progressCallback?.(40 + (p * 0.2), m)
      );
      sections.push({ 
        type: 'compatibility', 
        title: 'Compatibility Analysis', 
        content: compatibility,
        summary: extractKeyPoints(compatibility.content, 'compatibility')
      });
      
      await progressCallback?.(60, 'Generating Extended forecast...');
      // Pass natalChart to transit forecast
      const forecast = await generateReportContent('transit_forecast_extended', {
        ...data.transit_data,
        natalChart, // Use the same natalChart object
      }, (p, m) => 
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
      // All sections use the same natalChart object - single source of truth
      
      await progressCallback?.(10, 'Generating Birth Chart...');
      const birthChart = await generateReportContent('birth_chart', natalChart, (p, m) => 
        progressCallback?.(10 + (p * 0.1), m)
      );
      
      // Generate birth chart SVG image using the same natalChart object
      let chartImageUrl = null;
      try {
        const { generateBirthChartSVG } = await import('./birth-chart-svg.js');
        
        const chartSVG = generateBirthChartSVG(
          natalChart, // Use the same natalChart object
          {
            date: natalChart.birth_date,
            time: natalChart.birth_time,
            location: natalChart.location,
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
      // Pass natalChart to compatibility (Identity section)
      const compatibility = await generateReportContent('compatibility', {
        ...data.compatibility_data,
        user: natalChart, // Use the same natalChart object
      }, (p, m) => 
        progressCallback?.(20 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'compatibility', 
        title: 'Compatibility Analysis', 
        content: compatibility,
        summary: extractKeyPoints(compatibility.content, 'compatibility')
      });
      
      await progressCallback?.(30, 'Generating Extended forecast...');
      // Pass natalChart to transit forecast (Forecast section)
      const forecast = await generateReportContent('transit_forecast_extended', {
        ...data.transit_data,
        natalChart, // Use the same natalChart object
      }, (p, m) => 
        progressCallback?.(30 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'transit', 
        title: 'Extended Transit Forecast', 
        content: forecast,
        summary: extractKeyPoints(forecast.content, 'transit')
      });
      
      await progressCallback?.(40, 'Generating Destiny Path reading...');
      
      // Calculate age to determine Destiny Path type
      const birthDate = natalChart?.birth_date || data.birth_date || data.destiny_data?.birth_date;
      let destinyTitle = 'Destiny Path Cycle';
      
      if (birthDate) {
        const age = calculateAge(birthDate);
        if (age !== null) {
          if ((age >= 28 && age <= 30) || (age >= 58 && age <= 60)) {
            destinyTitle = 'Saturn Return';
          } else if (age >= 40 && age <= 45) {
            destinyTitle = 'Saturn Opposition (Midlife Crisis)';
          } else {
            destinyTitle = 'General Transits';
          }
        }
      }
      
      // Pass natalChart and birth_date to destiny path
      const destiny = await generateReportContent('destiny_path', {
        ...data.destiny_data,
        natalChart, // Use the same natalChart object
        birth_date: birthDate, // Pass birth date for age calculation
      }, (p, m) => 
        progressCallback?.(40 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'destiny', 
        title: destinyTitle, 
        content: destiny,
        summary: extractKeyPoints(destiny.content, 'destiny')
      });
      
      await progressCallback?.(50, 'Generating Relationship Matrix...');
      // Pass natalChart to relationship matrix (Relationships section)
      const matrix = await generateReportContent('relationship_matrix', {
        ...data.matrix_data,
        user: natalChart, // Use the same natalChart object
      }, (p, m) => 
        progressCallback?.(50 + (p * 0.1), m)
      );
      sections.push({ 
        type: 'matrix', 
        title: 'Relationship Matrix', 
        content: matrix,
        summary: extractKeyPoints(matrix.content, 'matrix')
      });
      
      await progressCallback?.(60, 'Generating Karmic reading...');
      // Pass natalChart to karmic reading
      const karmic = await generateReportContent('karmic_reading', {
        ...data.karmic_data,
        natalChart, // Use the same natalChart object
      }, (p, m) => 
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

