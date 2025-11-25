/**
 * Job Processors
 * Process different types of reading generation jobs
 */

import { generateTarotReading, generateText } from './openai.js';
import { drawCards } from './tarot-data.js';
import { interpretBirthChart } from './astrology.js';
import { pool } from './db.js';
import { generateReportContent, generatePDF, generatePremiumReport } from './pdf-generator.js';
import { getPromptByType } from './report-prompts.js';
import spreads from './tarot-spreads.json';
import { hydrateReportData, buildNatalChartPayload } from '@/src/services/chartHydrator';

/**
 * Generate a tarot reading
 */
export async function processTarotJob(job, updateProgress) {
  const { options, reading_type } = job;
  const { cards, question, spreadType, readingType, tone, name, generatePDF: shouldGeneratePDF } = options || {};
  
  await updateProgress?.(20, 'Drawing cards...');
  
  let html = null;
  
  // Draw cards if not provided
  let selectedCards = cards;
  if (!selectedCards || !Array.isArray(selectedCards)) {
    const spreadConfig = spreads.find(s => s.id === spreadType) || spreads[0];
    const requiredCount = spreadConfig?.ui?.required_selection_count ?? spreadConfig?.card_count ?? 3;
    selectedCards = drawCards(requiredCount);
  }
  
  await updateProgress?.(40, 'Generating interpretation...');
  
  // Use PDF report generation with new prompts if PDF is requested, otherwise use existing function
  let interpretation;
  let pdfUrl = null;
  
  if (shouldGeneratePDF) {
    // Use PDF report generation with new prompts
    const cardSpread = selectedCards.map((card, i) => ({
      card: card.name,
      position: card.position || `Position ${i + 1}`,
      orientation: card.reversed ? 'Reversed' : 'Upright',
    }));
    
    const reportData = await generateReportContent('tarot', {
      name: name || 'Beloved Seeker',
      card_spread: cardSpread,
    }, updateProgress);
    
    interpretation = reportData.content;
    
    // Generate PDF if requested
    await updateProgress?.(85, 'Generating PDF report...');
    const pdf = await generatePDF('tarot', {
      name: name || 'Beloved Seeker',
      card_spread: cardSpread,
    }, reportData);
    pdfUrl = pdf.pdfUrl;
    html = pdf.html;
  } else {
    // Use existing tarot generation for quick readings
    interpretation = await generateTarotReading(
      selectedCards,
      question || '',
      spreadType || 'daily_tarot',
      readingType || 'general',
      tone
    );
  }
  
  await updateProgress?.(90, 'Formatting results...');
  
  return {
    content: {
      cards: selectedCards,
      question: question || null,
      interpretation,
      spreadType: spreadType || 'daily_tarot',
      readingType: readingType || 'general',
      tone: tone || 'spiritual',
    },
    pdfUrl,
    html,
  };
}

/**
 * Generate a birth chart interpretation
 */
export async function processBirthChartJob(job, updateProgress) {
  const { options } = job;
  const { date, time, location, latitude, longitude, generateInterpretation, name, generatePDF: shouldGeneratePDF } = options || {};
  
  if (!date || !time || latitude === undefined || longitude === undefined) {
    throw new Error('Missing required birth chart data');
  }
  
  await updateProgress?.(15, 'Calculating planetary positions...');
  
  const latValue = typeof latitude === 'number' ? latitude : parseFloat(latitude);
  const lonValue = typeof longitude === 'number' ? longitude : parseFloat(longitude);

  if (!Number.isFinite(latValue) || !Number.isFinite(lonValue)) {
    throw new Error('Invalid latitude or longitude provided for birth chart job');
  }

  const hydrationInput = {
    name: name || 'Beloved Seeker',
    birthDate: date,
    birthTime: time,
    birthCity: location,
    birthLatitude: latValue,
    birthLongitude: lonValue,
  };

  const hydrated = await hydrateReportData(hydrationInput);
  const chartData = hydrated.rawChart;
  const natalChart = buildNatalChartPayload(hydrated, hydrationInput);
  
  await updateProgress?.(50, 'Analyzing chart patterns...');
  
  let interpretation = null;
  let pdfUrl = null;
  let html = null;
  
  if (generateInterpretation || shouldGeneratePDF) {
    await updateProgress?.(60, 'Generating AI interpretation...');
    
    if (shouldGeneratePDF) {
      // Use PDF report generation with new prompts
      const reportData = await generateReportContent('birth_chart', {
        name: name || 'Beloved Seeker',
        natalChart,
      }, updateProgress);
      
      interpretation = reportData.content;
      
      // Generate PDF if requested
      await updateProgress?.(85, 'Generating PDF report...');
      const pdf = await generatePDF('birth_chart', {
        name: name || 'Beloved Seeker',
        natalChart,
      }, reportData);
      pdfUrl = pdf.pdfUrl;
      html = pdf.html;
    } else {
      // Use existing interpretation function
      interpretation = await interpretBirthChart(chartData);
    }
  }
  
  await updateProgress?.(90, 'Finalizing results...');
  
  return {
    content: {
      chartData,
      interpretation,
      date,
      time,
      location,
      latitude: latValue,
      longitude: lonValue,
    },
    pdfUrl,
    html,
  };
}

/**
 * Generate compatibility report with PDF support
 */
export async function processCompatibilityJob(job, updateProgress) {
  const { options } = job;
  const { chart1, chart2, focus, name, partner_name, aspects, compatibility_score, generatePDF: shouldGeneratePDF } = options || {};
  
  if (!chart1 || !chart2) {
    throw new Error('Missing compatibility chart data');
  }
  
  const chart1Lat = typeof chart1.latitude === 'number' ? chart1.latitude : parseFloat(chart1.latitude);
  const chart1Lon = typeof chart1.longitude === 'number' ? chart1.longitude : parseFloat(chart1.longitude);
  const chart2Lat = typeof chart2.latitude === 'number' ? chart2.latitude : parseFloat(chart2.latitude);
  const chart2Lon = typeof chart2.longitude === 'number' ? chart2.longitude : parseFloat(chart2.longitude);

  if (!Number.isFinite(chart1Lat) || !Number.isFinite(chart1Lon) || !Number.isFinite(chart2Lat) || !Number.isFinite(chart2Lon)) {
    throw new Error('Invalid latitude or longitude provided for compatibility job');
  }

  await updateProgress?.(20, 'Analyzing first chart...');
  const chart1Hydrated = await hydrateReportData({
    name: name || chart1.name || 'Person One',
    birthDate: chart1.date,
    birthTime: chart1.time,
    birthCity: chart1.location,
    birthLatitude: chart1Lat,
    birthLongitude: chart1Lon,
  });
  const chart1Data = chart1Hydrated.rawChart;
  
  await updateProgress?.(40, 'Analyzing second chart...');
  const chart2Hydrated = await hydrateReportData({
    name: partner_name || chart2.name || 'Person Two',
    birthDate: chart2.date,
    birthTime: chart2.time,
    birthCity: chart2.location,
    birthLatitude: chart2Lat,
    birthLongitude: chart2Lon,
  });
  const chart2Data = chart2Hydrated.rawChart;
  
  await updateProgress?.(60, 'Calculating compatibility aspects...');
  
  // Calculate premium data points for compatibility
  await updateProgress?.(65, 'Calculating synastry aspects and house overlays...');
  const { calculateSynastryAspects, calculateHouseOverlays, calculateCompositeChart, calculateSynastryScore } = await import('./compatibility.js');
  const synastryAspects = calculateSynastryAspects(chart1Data, chart2Data, name, partner_name);
  const houseOverlays = calculateHouseOverlays(chart1Data, chart2Data, name, partner_name);
  const compositeChart = calculateCompositeChart(chart1Data, chart2Data);
  const compatibilityScore = calculateSynastryScore(chart1Data, chart2Data);
  const aspectsForReport = (aspects && aspects.length > 0) ? aspects : synastryAspects;
  
  await updateProgress?.(70, 'Generating compatibility report...');
  
  let interpretation;
  let pdfUrl = null;
  
  if (shouldGeneratePDF) {
    // Use PDF report generation with new prompts
    const reportData = await generateReportContent('compatibility', {
      user: chart1Data,
      partner: chart2Data,
      aspects: aspectsForReport,
      compatibility_score: compatibilityScore,
      synastryAspects,
      houseOverlays,
      compositeChart
    }, updateProgress);
    
    interpretation = reportData.content;
    
    // Generate PDF if requested
    await updateProgress?.(85, 'Generating PDF report...');
    const pdf = await generatePDF('compatibility', {
      name: name || 'Beloved Seeker',
      partner_name: partner_name || 'Partner',
    }, reportData);
    pdfUrl = pdf.pdfUrl;
  } else {
    // Use OpenAI directly for quick compatibility report
    const { getPromptByType } = await import('./report-prompts.js');
    const prompt = getPromptByType('compatibility', {
      user: chart1Data,
      partner: chart2Data,
      aspects: aspectsForReport,
      compatibility_score: compatibilityScore,
      synastryAspects,
      houseOverlays,
      compositeChart
    });
    interpretation = await generateText(prompt);
  }
  
  await updateProgress?.(95, 'Finalizing report...');
  
  return {
    content: {
      chart1: chart1Data,
      chart2: chart2Data,
      aspects: aspectsForReport,
      interpretation,
      focus: focus || 'general',
      compatibility_score: compatibilityScore,
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
 * Get job processor by reading type
 */
export function getJobProcessor(readingType) {
  const processors = {
    'tarot': processTarotJob,
    'tarot_basic': processTarotJob,
    'tarot_premium': processTarotJob,
    'birth_chart': processBirthChartJob,
    'natal_chart': processBirthChartJob,
    'compatibility': processCompatibilityJob,
    'compatibility_report': processCompatibilityJob,
  };
  
  // Try extended processors if not found in main processors
  const processor = processors[readingType?.toLowerCase()];
  if (processor) {
    return processor;
  }
  
  // Import and check extended processors
  const { getExtendedProcessor } = require('./job-processors-extended.js');
  return getExtendedProcessor(readingType) || null;
}

