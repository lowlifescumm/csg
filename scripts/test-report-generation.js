#!/usr/bin/env node

/**
 * Test Report Generation Script
 * Generates sample reports for quality verification
 * 
 * Usage:
 *   node scripts/test-report-generation.js tarot
 *   node scripts/test-report-generation.js moon
 *   node scripts/test-report-generation.js birth-chart
 *   node scripts/test-report-generation.js compatibility
 *   node scripts/test-report-generation.js transit-short
 *   node scripts/test-report-generation.js transit-extended
 *   node scripts/test-report-generation.js premium-essential
 *   node scripts/test-report-generation.js premium-advanced
 *   node scripts/test-report-generation.js premium-master
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Import ES modules
import { generateReportContent, generatePDF, generatePremiumReport } from '../lib/pdf-generator.js';
import { getPromptByType } from '../lib/report-prompts.js';
import { generateText } from '../lib/openai.js';

// Sample test data
const SAMPLE_DATA = {
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
      uranus: 'Aquarius',
      neptune: 'Pisces',
      pluto: 'Scorpio',
    },
    houses: {
      '1': 'Sagittarius',
      '2': 'Capricorn',
      '3': 'Aquarius',
      '4': 'Pisces',
      '5': 'Aries',
      '6': 'Taurus',
    },
    aspects: [
      { planet1: 'Sun', planet2: 'Moon', type: 'Trine', orb: 3.5 },
      { planet1: 'Venus', planet2: 'Mars', type: 'Square', orb: 2.1 },
    ],
  },
  compatibility: {
    user: {
      sun: 'Gemini',
      moon: 'Pisces',
      rising: 'Sagittarius',
    },
    partner: {
      sun: 'Scorpio',
      moon: 'Taurus',
      rising: 'Cancer',
    },
    aspects: [
      { planet1: 'Sun', planet2: 'Sun', type: 'Trine', orb: 4.2 },
      { planet1: 'Moon', planet2: 'Moon', type: 'Square', orb: 1.8 },
    ],
    compatibility_score: 82,
  },
  transit_forecast_short: {
    name: 'Test User',
    date_range: 'Feb 4–Feb 18, 2025',
    transits: [
      { aspect: 'Mars trine Sun', date: 'Feb 6', description: 'Energy boost and motivation' },
      { aspect: 'Mercury square Saturn', date: 'Feb 9', description: 'Communication challenges' },
      { aspect: 'Venus conjunct Jupiter', date: 'Feb 12', description: 'Love and abundance' },
    ],
  },
  transit_forecast_extended: {
    name: 'Test User',
    date_range: 'Feb 1–Apr 30, 2025',
    transits: [
      { aspect: 'Mars trine Sun', date: 'Feb 6', description: 'Energy boost' },
      { aspect: 'Mercury square Saturn', date: 'Feb 9', description: 'Communication challenges' },
      { aspect: 'Venus conjunct Jupiter', date: 'Feb 12', description: 'Love and abundance' },
      { aspect: 'Saturn return begins', date: 'Mar 15', description: 'Major life transition' },
      { aspect: 'Jupiter enters Gemini', date: 'Apr 20', description: 'Expansion and growth' },
    ],
  },
  premium_essential: {
    name: 'Test User',
    tarot_data: {
      name: 'Test User',
      card_spread: [
        { card: 'The High Priestess', position: 'Present', orientation: 'Upright' },
        { card: 'The Tower', position: 'Challenge', orientation: 'Reversed' },
        { card: 'The Star', position: 'Future', orientation: 'Upright' },
      ],
    },
    moon_data: {
      name: 'Test User',
      moon_phase: 'Waxing Crescent',
      phase_energy: 'Growth and intention setting',
      sun_sign: 'Gemini',
      moon_sign: 'Pisces',
    },
    transit_data: {
      name: 'Test User',
      date_range: 'Feb 4–Feb 18, 2025',
      transits: [
        { aspect: 'Mars trine Sun', date: 'Feb 6', description: 'Energy boost' },
      ],
    },
  },
  premium_advanced: {
    name: 'Test User',
    birth_chart_data: {
      name: 'Test User',
      sun: 'Gemini',
      moon: 'Pisces',
      rising: 'Sagittarius',
      planets: { mercury: 'Taurus', venus: 'Cancer', mars: 'Leo' },
      houses: { '1': 'Sagittarius', '2': 'Capricorn' },
      aspects: [{ planet1: 'Sun', planet2: 'Moon', type: 'Trine', orb: 3.5 }],
    },
    compatibility_data: {
      user: { sun: 'Gemini', moon: 'Pisces' },
      partner: { sun: 'Scorpio', moon: 'Taurus' },
      aspects: [],
      compatibility_score: 82,
    },
    transit_data: {
      name: 'Test User',
      date_range: 'Feb 1–Apr 30, 2025',
      transits: [{ aspect: 'Mars trine Sun', date: 'Feb 6' }],
    },
  },
  premium_master: {
    name: 'Test User',
    birth_chart_data: {
      name: 'Test User',
      sun: 'Gemini',
      moon: 'Pisces',
      rising: 'Sagittarius',
      planets: { mercury: 'Taurus', venus: 'Cancer', mars: 'Leo' },
      houses: { '1': 'Sagittarius' },
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
      themes: ['Responsibility', 'Transformation', 'Life restructuring'],
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
      placements: { sun: 'Gemini' },
      aspects: [],
      nodes: {
        north_node: 'Aries',
        south_node: 'Libra',
      },
    },
  },
};

async function testReport(reportType) {
  console.log(`\n🔮 Testing ${reportType} report generation...\n`);

  try {
    const progressCallback = (percent, message) => {
      process.stdout.write(`\r   [${percent}%] ${message}`);
    };

    let result;

    if (reportType.startsWith('premium-')) {
      const tier = reportType.replace('premium-', '').toUpperCase();
      console.log(`   Generating ${tier} premium report...`);
      result = await generatePremiumReport(tier, SAMPLE_DATA[reportType], progressCallback);
      console.log(`\n\n✅ Premium report generated successfully!`);
      console.log(`   Sections: ${result.sections.length}`);
      console.log(`   HTML length: ${result.html.length} characters`);
      if (result.pdfUrl) {
        console.log(`   PDF URL: ${result.pdfUrl}`);
      }
    } else {
      const typeMap = {
        'tarot': 'tarot',
        'moon': 'moon_reading',
        'birth-chart': 'birth_chart',
        'compatibility': 'compatibility',
        'transit-short': 'transit_forecast_short',
        'transit-extended': 'transit_forecast_extended',
      };

      const mappedType = typeMap[reportType] || reportType;
      const data = SAMPLE_DATA[reportType] || SAMPLE_DATA[mappedType];

      if (!data) {
        throw new Error(`No sample data found for ${reportType}`);
      }

      console.log(`   Generating ${mappedType} report...`);
      result = await generateReportContent(mappedType, data, progressCallback);
      console.log(`\n\n✅ Report generated successfully!`);
      console.log(`   Content length: ${result.content.length} characters`);
      console.log(`   Sections: ${result.sections.length}`);

      // Generate HTML preview
      const html = await generatePDF(mappedType, data, result);
      console.log(`   HTML length: ${html.html.length} characters`);
    }

    // Save to file for review
    const fs = require('fs');
    const outputDir = resolve(__dirname, '../test-reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportType}-${timestamp}.txt`;
    const filepath = resolve(outputDir, filename);

    const content = result.content || result.sections.map(s => `${s.title}\n\n${s.content}`).join('\n\n---\n\n');
    fs.writeFileSync(filepath, content, 'utf8');

    console.log(`\n📄 Report saved to: ${filepath}`);
    console.log(`\n💡 Review the content to verify quality and accuracy.\n`);

    return result;
  } catch (error) {
    console.error(`\n❌ Error generating ${reportType} report:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Main
const reportType = process.argv[2];

if (!reportType) {
  console.log(`
Usage: node scripts/test-report-generation.js <report-type>

Available report types:
  tarot              - Tarot reading
  moon               - Moon phase reading
  birth-chart        - Birth chart analysis
  compatibility      - Compatibility report
  transit-short      - Short-term transit forecast (7-14 days)
  transit-extended   - Extended transit forecast (30-90 days)
  premium-essential  - Essential premium report (Tarot + Moon + Forecast)
  premium-advanced   - Advanced premium report (Birth Chart + Compatibility + Forecast)
  premium-master     - Master premium report (All sections)

Examples:
  node scripts/test-report-generation.js tarot
  node scripts/test-report-generation.js premium-essential
`);
  process.exit(1);
}

testReport(reportType);

