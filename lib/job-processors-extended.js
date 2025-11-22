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
  
  if (shouldGeneratePDF) {
    await updateProgress?.(85, 'Generating PDF report...');
    const pdf = await generatePDF('moon_reading', {
      name: name || 'Beloved Seeker',
      moon_phase,
      sun_sign,
      moon_sign,
    }, reportData);
    pdfUrl = pdf.pdfUrl;
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
  
  if (shouldGeneratePDF) {
    await updateProgress?.(85, 'Generating PDF report...');
    const pdf = await generatePDF(reportType, {
      name: name || 'Beloved Seeker',
      date_range,
    }, reportData);
    pdfUrl = pdf.pdfUrl;
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
  };
}

/**
 * Process Premium Report Job (Essential, Advanced, Master)
 */
export async function processPremiumReportJob(job, updateProgress) {
  const { options } = job;
  const { report_type, name, ...reportData } = options;
  
  await updateProgress?.(10, `Generating ${report_type} premium report...`);
  
  const report = await generatePremiumReport(report_type, {
    name: name || 'Beloved Seeker',
    ...reportData,
  }, updateProgress);
  
  await updateProgress?.(95, 'Premium report generated.');

  return {
    success: true,
    content: report.content,
    sections: report.sections,
    html: report.html,
    pdfUrl: report.pdfUrl,
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
  
  // Use PDF report generation with new prompts
  const reportData = await generateReportContent('compatibility', {
    user,
    partner,
    aspects: aspects || [],
    compatibility_score: compatibility_score || 75,
  }, updateProgress);
  
  await updateProgress?.(85, 'Generating PDF report...');
  let pdfUrl = null;
  
  if (shouldGeneratePDF) {
    const pdf = await generatePDF('compatibility', {
      name: name || 'Beloved Seeker',
      partner_name: partner_name || 'Partner',
    }, reportData);
    pdfUrl = pdf.pdfUrl;
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
    },
    pdfUrl,
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

