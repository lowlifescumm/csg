/**
 * Job Processors
 * Process different types of reading generation jobs
 */

import { generateTarotReading, generateText } from './openai.js';
import { drawCards } from './tarot-data.js';
import { calculateBirthChart, interpretBirthChart } from './astrology.js';
import { pool } from './db.js';
import { generateReportContent, generatePDF, generatePremiumReport } from './pdf-generator.js';
import { getPromptByType } from './report-prompts.js';
import spreads from './tarot-spreads.json';

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
  
  // Calculate birth chart
  const chartData = calculateBirthChart(date, time, latitude, longitude);
  
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
        sun: chartData.sun?.sign || '',
        moon: chartData.moon?.sign || '',
        rising: chartData.ascendant?.sign || '',
        planets: chartData.planets || {},
        houses: chartData.houses || {},
        aspects: chartData.aspects || [],
      }, updateProgress);
      
      interpretation = reportData.content;
      
      // Generate PDF if requested
      await updateProgress?.(85, 'Generating PDF report...');
      const pdf = await generatePDF('birth_chart', {
        name: name || 'Beloved Seeker',
        sun: chartData.sun?.sign,
        moon: chartData.moon?.sign,
        rising: chartData.ascendant?.sign,
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
      latitude,
      longitude,
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
  
  await updateProgress?.(20, 'Analyzing first chart...');
  const chart1Data = calculateBirthChart(chart1.date, chart1.time, chart1.latitude, chart1.longitude);
  
  await updateProgress?.(40, 'Analyzing second chart...');
  const chart2Data = calculateBirthChart(chart2.date, chart2.time, chart2.latitude, chart2.longitude);
  
  await updateProgress?.(60, 'Calculating compatibility aspects...');
  
  // Calculate compatibility aspects (simplified - you may want to add more logic)
  const calculatedAspects = aspects || [];
  
  await updateProgress?.(70, 'Generating compatibility report...');
  
  let interpretation;
  let pdfUrl = null;
  
  if (shouldGeneratePDF) {
    // Use PDF report generation with new prompts
    const reportData = await generateReportContent('compatibility', {
      user: chart1Data,
      partner: chart2Data,
      aspects: calculatedAspects,
      compatibility_score: compatibility_score || 75,
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
      aspects: calculatedAspects,
      compatibility_score: compatibility_score || 75,
    });
    interpretation = await generateText(prompt);
  }
  
  await updateProgress?.(95, 'Finalizing report...');
  
  return {
    content: {
      chart1: chart1Data,
      chart2: chart2Data,
      aspects: calculatedAspects,
      interpretation,
      focus: focus || 'general',
      compatibility_score: compatibility_score || 75,
    },
    pdfUrl,
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

