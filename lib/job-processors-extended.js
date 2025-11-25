/**
 * Extended Job Processors
 * Additional processors for premium reports and PDF generation
 */

import { generateText } from './openai.js';
import { calculateBirthChart } from './astrology.js';
import { generateReportContent, generatePDF, generatePremiumReport } from './pdf-generator.js';

/**
 * Process Moon Reading Job
 */
export async function processMoonReadingJob(job, updateProgress) {
  const { options } = job;
  const { name, moon_phase, phase_energy, sun_sign, moon_sign, generatePDF: shouldGeneratePDF } = options;

  if (!moon_phase || !sun_sign || !moon_sign) {
    throw new Error('Missing moon reading options');
  }

  await updateProgress?.(10, 'Generating moon reading...');
  
  const reportData = await generateReportContent('moon_reading', {
    name: name || 'Beloved Seeker',
    moon_phase,
    phase_energy: phase_energy || '',
    sun_sign,
    moon_sign,
  }, updateProgress);
  
  let pdfUrl = null;
  let html = null;
  
  if (shouldGeneratePDF) {
    await updateProgress?.(85, 'Generating PDF report...');
    const pdf = await generatePDF('moon_reading', {
      name: name || 'Beloved Seeker',
      moon_phase,
      sun_sign,
      moon_sign,
    }, reportData);
    pdfUrl = pdf.pdfUrl;
    html = pdf.html;
  }
  
  await updateProgress?.(90, 'Moon reading generated.');

  return {
    success: true,
    content: {
      moon_phase,
      phase_energy,
      sun_sign,
      moon_sign,
      interpretation: reportData.content,
    },
    pdfUrl,
    html,
  };
}

/**
 * Process Transit Forecast Job
 */
export async function processTransitForecastJob(job, updateProgress) {
  const { options } = job;
  const { name, date_range, transits, forecast_type = 'short', generatePDF: shouldGeneratePDF } = options;

  if (!date_range || !transits || transits.length === 0) {
    throw new Error('Missing transit forecast options');
  }

  await updateProgress?.(10, `Generating ${forecast_type} transit forecast...`);
  
  const reportType = forecast_type === 'extended' ? 'transit_forecast_extended' : 'transit_forecast_short';
  const reportData = await generateReportContent(reportType, {
    name: name || 'Beloved Seeker',
    date_range,
    transits,
  }, updateProgress);
  
  let pdfUrl = null;
  let html = null;
  
  if (shouldGeneratePDF) {
    await updateProgress?.(85, 'Generating PDF report...');
    const pdf = await generatePDF(reportType, {
      name: name || 'Beloved Seeker',
      date_range,
    }, reportData);
    pdfUrl = pdf.pdfUrl;
    html = pdf.html;
  }
  
  await updateProgress?.(90, 'Transit forecast generated.');

  return {
    success: true,
    content: {
      date_range,
      transits,
      forecast_type,
      interpretation: reportData.content,
    },
    pdfUrl,
    html,
  };
}

/**
 * Process Premium Report Job (Essential, Advanced, Master)
 * Premium reports always generate PDFs automatically
 * 
 * This function creates a single NatalChart object at the beginning
 * and passes it to all subsequent functions to ensure data consistency.
 */
export async function processPremiumReportJob(job, updateProgress) {
  const { options, user_id } = job;
  const { report_type, name, ...reportData } = options;
  
  await updateProgress?.(10, `Generating ${report_type} premium report...`);
  
  // STEP 1: Calculate/Fetch Natal Chart ONCE - This is the single source of truth
  let natalChart = null;
  
  if (user_id && (!reportData.birth_chart_data || !reportData.birth_chart_data.planetSignHouseCombinations)) {
    await updateProgress?.(12, 'Fetching user natal chart from database...');
    
    try {
      const { pool } = await import('./db.js');
      
      // Try natal_charts table first
      let chartResult = await pool.query(
        'SELECT * FROM natal_charts WHERE user_id = $1 AND is_primary = true',
        [user_id]
      );
      
      // Fallback to birth_charts table
      if (chartResult.rows.length === 0) {
        chartResult = await pool.query(
          'SELECT * FROM birth_charts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
          [user_id]
        );
      }
      
      if (chartResult.rows.length > 0) {
        const dbChart = chartResult.rows[0];
        
        // Extract chart data
        const natalPositions = typeof dbChart.natal_positions === 'string' 
          ? JSON.parse(dbChart.natal_positions) 
          : dbChart.natal_positions || {};
        
        const houses = typeof dbChart.houses === 'string'
          ? JSON.parse(dbChart.houses)
          : dbChart.houses || {};
        
        const aspects = typeof dbChart.aspects === 'string'
          ? JSON.parse(dbChart.aspects)
          : dbChart.aspects || {};
        
        // Extract premium data points
        const premiumData = natalPositions._premium_data || {};
        const houseCusps = houses._cusps_detailed || premiumData.houseCuspsDetailed || [];
        const majorAspects = aspects.major || premiumData.majorAspects || [];
        const planetCombinations = dbChart.planet_houses?._combinations || premiumData.planetSignHouseCombinations || [];
        
        // If premium data is missing, recalculate ONCE
        if (!premiumData.planetSignHouseCombinations && dbChart.birth_date && dbChart.birth_time) {
          await updateProgress?.(15, 'Calculating natal chart with premium data points...');
          const recalculated = calculateBirthChart(
            dbChart.birth_date,
            dbChart.birth_time,
            dbChart.latitude,
            dbChart.longitude
          );
          
          // Create single NatalChart object - this is the source of truth
          natalChart = {
            birth_date: dbChart.birth_date,
            birth_time: dbChart.birth_time,
            latitude: dbChart.latitude,
            longitude: dbChart.longitude,
            location: dbChart.location || dbChart.location_name,
            planets: recalculated.planets || natalPositions,
            houses: recalculated.houses || houses,
            aspects: recalculated.aspects || aspects,
            sun: recalculated.planets?.sun || natalPositions.sun || {},
            moon: recalculated.planets?.moon || natalPositions.moon || {},
            rising: { sign: dbChart.ascendant || recalculated.ascendant || '' },
            ascendant: dbChart.ascendant || recalculated.ascendant,
            midheaven: dbChart.midheaven || recalculated.midheaven,
            // Premium data points (calculated once, used everywhere)
            planetSignHouseCombinations: recalculated.planetSignHouseCombinations || [],
            houseCuspsDetailed: recalculated.houseCuspsDetailed || [],
            chartRulerLocation: recalculated.chartRulerLocation || null,
            majorAspects: recalculated.majorAspects || [],
            midpoints: recalculated.midpoints || [],
            chartRuler: recalculated.chartRuler,
            partOfFortune: recalculated.partOfFortune,
            dignities: recalculated.dignities,
            moonPhase: recalculated.moonPhase,
            chartPatterns: recalculated.chartPatterns,
            distribution: recalculated.distribution,
            planetHouses: recalculated.planetHouses,
          };
        } else {
          // Use existing premium data - create single NatalChart object
          natalChart = {
            birth_date: dbChart.birth_date,
            birth_time: dbChart.birth_time,
            latitude: dbChart.latitude,
            longitude: dbChart.longitude,
            location: dbChart.location || dbChart.location_name,
            planets: natalPositions,
            houses: houses,
            aspects: aspects,
            sun: natalPositions.sun || {},
            moon: natalPositions.moon || {},
            rising: { sign: dbChart.ascendant || '' },
            ascendant: dbChart.ascendant,
            midheaven: dbChart.midheaven,
            // Premium data points (from database, used everywhere)
            planetSignHouseCombinations: planetCombinations,
            houseCuspsDetailed: houseCusps,
            chartRulerLocation: premiumData.chartRulerLocation || null,
            majorAspects: majorAspects,
            midpoints: premiumData.midpoints || [],
            chartRuler: dbChart.chart_ruler,
            partOfFortune: dbChart.part_of_fortune,
            dignities: dbChart.dignities,
            moonPhase: dbChart.moon_phase,
            chartPatterns: dbChart.chart_patterns,
            distribution: dbChart.distribution,
            planetHouses: dbChart.planet_houses,
          };
        }
      }
    } catch (error) {
      console.error('[Premium Report] Error fetching natal chart:', error);
      // Continue with provided data if available
      if (reportData.birth_chart_data) {
        natalChart = reportData.birth_chart_data;
      }
    }
  } else if (reportData.birth_chart_data) {
    // Use provided chart data as the single source of truth
    natalChart = reportData.birth_chart_data;
  }
  
  // STEP 2: Pass the single NatalChart object to generatePremiumReport
  // All sections will use this exact same object
  const report = await generatePremiumReport(report_type, {
    name: name || 'Beloved Seeker',
    natalChart, // Single source of truth - passed to all sections
    ...reportData, // Other data (tarot, moon, etc.) for Essential reports
  }, updateProgress);
  
  await updateProgress?.(95, 'Premium report generated.');

  return {
    success: true,
    content: report.content,
    sections: report.sections,
    html: report.html,
    pdfUrl: report.pdfUrl, // PDF is always generated for premium reports
  };
}

/**
 * Process Compatibility Report with PDF
 */
export async function processCompatibilityReportJob(job, updateProgress) {
  const { options } = job;
  const { user, partner, aspects, compatibility_score, name, partner_name, generatePDF: shouldGeneratePDF } = options;

  if (!user || !partner) {
    throw new Error('Missing compatibility report options (user and partner charts required)');
  }

  await updateProgress?.(10, 'Analyzing compatibility...');
  
  // Calculate premium data points for compatibility
  await updateProgress?.(15, 'Calculating synastry aspects and house overlays...');
  const { calculateSynastryAspects, calculateHouseOverlays, calculateCompositeChart } = await import('./compatibility.js');
  const synastryAspects = calculateSynastryAspects(user, partner, name, partner_name);
  const houseOverlays = calculateHouseOverlays(user, partner, name, partner_name);
  const compositeChart = calculateCompositeChart(user, partner);
  
  // Use PDF report generation with new prompts
  const reportData = await generateReportContent('compatibility', {
    user,
    partner,
    aspects: aspects || [],
    compatibility_score: compatibility_score || 75,
    synastryAspects: synastryAspects,
    houseOverlays: houseOverlays,
    compositeChart: compositeChart
  }, updateProgress);
  
  await updateProgress?.(85, 'Generating PDF report...');
  let pdfUrl = null;
  let html = null;
  
  if (shouldGeneratePDF) {
    const pdf = await generatePDF('compatibility', {
      name: name || 'Beloved Seeker',
      partner_name: partner_name || 'Partner',
    }, reportData);
    pdfUrl = pdf.pdfUrl;
    html = pdf.html;
  }
  
  await updateProgress?.(90, 'Compatibility report generated.');

  return {
    success: true,
    content: {
      user,
      partner,
      aspects: aspects || [],
      compatibility_score: compatibility_score || 75,
      interpretation: reportData.content,
      // Premium data points
      synastryAspects: synastryAspects,
      houseOverlays: houseOverlays,
      compositeChart: compositeChart
    },
    pdfUrl,
    html,
  };
}

/**
 * Get extended processor by reading type
 */
export function getExtendedProcessor(readingType) {
  const processors = {
    'moon_reading': processMoonReadingJob,
    'moon-reading': processMoonReadingJob,
    'transit_forecast': processTransitForecastJob,
    'transit_forecast_short': processTransitForecastJob,
    'transit_forecast_extended': processTransitForecastJob,
    'transit-forecast': processTransitForecastJob,
    'premium_report': processPremiumReportJob,
    'essential': processPremiumReportJob,
    'advanced': processPremiumReportJob,
    'master': processPremiumReportJob,
    'compatibility_report': processCompatibilityReportJob,
  };
  
  return processors[readingType?.toLowerCase()] || null;
}

