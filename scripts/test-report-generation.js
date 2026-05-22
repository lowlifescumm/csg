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
const logger = require('../lib/logger.js');

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Import ES modules
import { generateReportContent, generatePDF, generatePremiumReport } from '../lib/pdf-generator.js';
import { getPromptByType } from '../lib/report-prompts.js';
import { generateText } from '../lib/groq.js';

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
    birth_date: '1995-06-15',
    natalChart: {
      name: 'Test User',
      birth_date: '1995-06-15',
      birth_time: '14:30',
      location: 'New York, USA',
      sun: 'Gemini',
      moon: 'Pisces',
      rising: 'Sagittarius',
      mercury: 'Taurus',
      venus: 'Cancer',
      mars: 'Leo',
      jupiter: 'Aries',
      saturn: 'Capricorn',
      uranus: 'Aquarius',
      neptune: 'Pisces',
      pluto: 'Scorpio',
      planets: {
        sun: { sign: 'Gemini', degree: 15 },
        moon: { sign: 'Pisces', degree: 22 },
        mercury: { sign: 'Taurus', degree: 8 },
        venus: { sign: 'Cancer', degree: 3 },
        mars: { sign: 'Leo', degree: 19 },
        jupiter: { sign: 'Aries', degree: 11 },
        saturn: { sign: 'Capricorn', degree: 5 },
        uranus: { sign: 'Aquarius', degree: 27 },
        neptune: { sign: 'Pisces', degree: 14 },
        pluto: { sign: 'Scorpio', degree: 20 },
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
      planetSignHouseCombinations: [
        { planet: 'Sun', sign: 'Gemini', house: 1, houseName: '1st House' },
        { planet: 'Moon', sign: 'Pisces', house: 4, houseName: '4th House' },
        { planet: 'Mercury', sign: 'Taurus', house: 2, houseName: '2nd House' },
        { planet: 'Venus', sign: 'Cancer', house: 3, houseName: '3rd House' },
        { planet: 'Mars', sign: 'Leo', house: 4, houseName: '4th House' },
        { planet: 'Jupiter', sign: 'Aries', house: 12, houseName: '12th House' },
        { planet: 'Saturn', sign: 'Capricorn', house: 7, houseName: '7th House' },
        { planet: 'Uranus', sign: 'Aquarius', house: 8, houseName: '8th House' },
        { planet: 'Neptune', sign: 'Pisces', house: 9, houseName: '9th House' },
        { planet: 'Pluto', sign: 'Scorpio', house: 6, houseName: '6th House' },
      ],
      houseCuspsDetailed: {
        '1': { sign: 'Sagittarius', degree: 5 },
        '2': { sign: 'Capricorn', degree: 10 },
        '3': { sign: 'Aquarius', degree: 15 },
        '4': { sign: 'Pisces', degree: 20 },
        '5': { sign: 'Aries', degree: 22 },
        '6': { sign: 'Taurus', degree: 18 },
      },
      planetHouses: {
        sun: 1, moon: 4, mercury: 2, venus: 3, mars: 4,
        jupiter: 12, saturn: 7, uranus: 8, neptune: 9, pluto: 6,
      },
      majorAspects: [
        { planet1: 'Sun', planet2: 'Moon', aspect: 'Trine', orb: 3.5, influence: 'Harmonious' },
        { planet1: 'Venus', planet2: 'Mars', aspect: 'Square', orb: 2.1, influence: 'Challenging' },
      ],
      chartRuler: 'Jupiter',
      partOfFortune: { sign: 'Leo', degree: 7 },
      moonPhase: 'Waxing Gibbous',
    },
    compatibility_data: {
      user: { sun: 'Gemini', name: 'Test User' },
      partner: { sun: 'Scorpio', name: 'Partner' },
      aspects: [],
      compatibility_score: 82,
      partner_name: 'Partner',
    },
    transit_data: {
      name: 'Test User',
      date_range: 'Feb 1–Apr 30, 2025',
      transits: [],
      natalChart: {
        name: 'Test User',
        birth_date: '1995-06-15',
        sun: 'Gemini', moon: 'Pisces', rising: 'Sagittarius',
        planetSignHouseCombinations: [],
        planets: {},
      },
    },
    destiny_data: {
      birth_date: '1995-06-15',
      cycle_name: 'Saturn Return',
      start_date: '2024-07-01',
      end_date: '2026-02-14',
      themes: ['Responsibility', 'Transformation', 'Life restructuring'],
      natalChart: {
        name: 'Test User',
        birth_date: '1995-06-15',
      },
    },
    matrix_data: {
      pair: {
        user: { sun: 'Gemini', name: 'Test User' },
        partner: { sun: 'Scorpio', name: 'Partner' },
      },
      user: { sun: 'Gemini', name: 'Test User' },
      partner: { sun: 'Scorpio', name: 'Partner' },
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
      natalChart: {
        name: 'Test User',
        birth_date: '1995-06-15',
        planets: {},
      },
    },
    chartData: {
      user: {
        name: 'Test User',
        sun: 'Gemini', moon: 'Pisces', rising: 'Sagittarius',
      },
      matrix_scores: {
        emotional: 78, communication: 64, spiritual: 85, stability: 71, physical: 88,
      },
    },
    partner_name: 'Partner',
  },
};

async function testReport(reportType) {
  logger.info(`\n🔮 Testing ${reportType} report generation...\n`);

  try {
    const progressCallback = (percent, message) => {
      process.stdout.write(`\r   [${percent}%] ${message}`);
    };

    let result;

    if (reportType.startsWith('premium-')) {
      const tier = reportType.replace('premium-', '').toUpperCase();
      const premiumKey = reportType.replace(/-/g, '_');
      logger.info(`   Generating ${tier} premium report...`);
      result = await generatePremiumReport(tier, SAMPLE_DATA[premiumKey], progressCallback);
      logger.info(`\n\n✅ Premium report generated successfully!`);
      logger.info(`   Sections: ${result.sections.length}`);
      logger.info(`   HTML length: ${result.html.length} characters`);
      if (result.pdfUrl) {
        logger.info(`   PDF URL: ${result.pdfUrl}`);
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

      logger.info(`   Generating ${mappedType} report...`);
      result = await generateReportContent(mappedType, data, progressCallback);
      logger.info(`\n\n✅ Report generated successfully!`);
      logger.info(`   Content length: ${result.content.length} characters`);
      logger.info(`   Sections: ${result.sections.length}`);

      // Generate HTML preview
      const html = await generatePDF(mappedType, data, result);
      logger.info(`   HTML length: ${html.html.length} characters`);
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

    logger.info(`\n📄 Report saved to: ${filepath}`);
    logger.info(`\n💡 Review the content to verify quality and accuracy.\n`);

    return result;
  } catch (error) {
    logger.error(`\n❌ Error generating ${reportType} report:`, error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Main
const reportType = process.argv[2];

if (!reportType) {
  logger.info(`
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

