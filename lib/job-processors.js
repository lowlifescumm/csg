/**
 * Job Processors
 * Process different types of reading generation jobs
 */

import { generateTarotReading } from './openai.js';
import { drawCards } from './tarot-data.js';
import { calculateBirthChart, interpretBirthChart } from './astrology.js';
import { pool } from './db.js';
import spreads from './tarot-spreads.json';

/**
 * Generate a tarot reading
 */
export async function processTarotJob(job, updateProgress) {
  const { options, reading_type } = job;
  const { cards, question, spreadType, readingType, tone } = options || {};
  
  await updateProgress(20, 'Drawing cards...');
  
  // Draw cards if not provided
  let selectedCards = cards;
  if (!selectedCards || !Array.isArray(selectedCards)) {
    const spreadConfig = spreads.find(s => s.id === spreadType) || spreads[0];
    const requiredCount = spreadConfig?.ui?.required_selection_count ?? spreadConfig?.card_count ?? 3;
    selectedCards = drawCards(requiredCount);
  }
  
  await updateProgress(40, 'Generating interpretation...');
  
  // Generate interpretation
  const interpretation = await generateTarotReading(
    selectedCards,
    question || '',
    spreadType || 'daily_tarot',
    readingType || 'general',
    tone
  );
  
  await updateProgress(80, 'Formatting results...');
  
  return {
    content: {
      cards: selectedCards,
      question: question || null,
      interpretation,
      spreadType: spreadType || 'daily_tarot',
      readingType: readingType || 'general',
      tone: tone || 'spiritual',
    },
    pdfUrl: null, // Tarot readings don't generate PDFs by default
  };
}

/**
 * Generate a birth chart interpretation
 */
export async function processBirthChartJob(job, updateProgress) {
  const { options } = job;
  const { date, time, location, latitude, longitude, generateInterpretation } = options || {};
  
  if (!date || !time || latitude === undefined || longitude === undefined) {
    throw new Error('Missing required birth chart data');
  }
  
  await updateProgress(15, 'Calculating planetary positions...');
  
  // Calculate birth chart
  const chartData = calculateBirthChart(date, time, latitude, longitude);
  
  await updateProgress(50, 'Analyzing chart patterns...');
  
  let interpretation = null;
  if (generateInterpretation) {
    await updateProgress(60, 'Generating AI interpretation...');
    interpretation = await interpretBirthChart(chartData);
  }
  
  await updateProgress(90, 'Finalizing results...');
  
  return {
    content: {
      chartData,
      interpretation,
      date,
      time,
      location,
      latitude,
      longitude,
    },
    pdfUrl: null, // PDF generation can be added later
  };
}

/**
 * Generate a compatibility report
 */
export async function processCompatibilityJob(job, updateProgress) {
  const { options } = job;
  const { chart1, chart2, focus } = options || {};
  
  if (!chart1 || !chart2) {
    throw new Error('Missing compatibility chart data');
  }
  
  await updateProgress(20, 'Analyzing first chart...');
  const chart1Data = calculateBirthChart(chart1.date, chart1.time, chart1.latitude, chart1.longitude);
  
  await updateProgress(40, 'Analyzing second chart...');
  const chart2Data = calculateBirthChart(chart2.date, chart2.time, chart2.latitude, chart2.longitude);
  
  await updateProgress(60, 'Calculating compatibility aspects...');
  
  // Calculate compatibility aspects (simplified - you may want to add more logic)
  const aspects = [];
  // Add aspect calculation logic here
  
  await updateProgress(80, 'Generating compatibility report...');
  
  // Generate compatibility interpretation
  const interpretation = await generateCompatibilityReport(chart1Data, chart2Data, aspects, focus);
  
  await updateProgress(95, 'Finalizing report...');
  
  return {
    content: {
      chart1: chart1Data,
      chart2: chart2Data,
      aspects,
      interpretation,
      focus: focus || 'general',
    },
    pdfUrl: null, // PDF generation for reports can be added
  };
}

/**
 * Generate compatibility report (placeholder - implement with OpenAI)
 */
async function generateCompatibilityReport(chart1, chart2, aspects, focus) {
  // This would use OpenAI to generate compatibility interpretation
  // For now, return a placeholder
  return 'Compatibility report generation - implement with OpenAI API';
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
  
  return processors[readingType?.toLowerCase()] || null;
}

