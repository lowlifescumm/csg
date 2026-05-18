/**
 * Master Report — Cross-section consistency structural audit (GSTA-115)
 *
 * This test verifies three dimensions that the existing validator does NOT cover:
 * 1. Planetary placements in narrative text match the chart wheel data layer.
 * 2. Transit dates in Extended Forecast and Annual Forecast do not contradict.
 * 3. Karmic Nodal Axis text aligns with the birth chart's North/South Node positions.
 *
 * We mock the AI layer so this test is deterministic and does not require
 * external API calls.
 */

jest.mock('@/lib/groq', () => ({
  generateText: jest.fn(),
}));

jest.mock('@/lib/birth-chart-svg', () => ({
  generateBirthChartSVG: jest.fn(() => '<svg></svg>'),
}));

jest.mock('@/lib/premium-pdf-generator', () => ({
  generatePremiumPdf: jest.fn(() => Buffer.from('pdf')),
}));

jest.mock('@/lib/pdf-utils', () => ({
  uploadPdfToCloudinary: jest.fn(() => Promise.resolve('https://cloudinary.com/test.pdf')),
}));

jest.mock('@/lib/report-prompts', () => ({
  getPromptByType: jest.fn(() => 'mock prompt'),
  getClosingBlessingPrompt: jest.fn(() => 'mock closing prompt'),
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@/src/utils/visuals/generateMatrixSVG', () => ({
  generateCompatibilityRadar: jest.fn(() => '<svg></svg>'),
}));

const { generatePremiumReport } = require('@/lib/pdf-generator');
const { generateText } = require('@/lib/groq');
const logger = require('@/lib/logger');

// ---------------------------------------------------------------------------
// Fixture: rich natal chart with explicit placements
// ---------------------------------------------------------------------------
const natalChart = {
  name: 'Alex Morgan',
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'New York, NY',
  planets: {
    sun: { sign: 'Gemini', longitude: 84.5 },
    moon: { sign: 'Virgo', longitude: 165.2 },
    mercury: { sign: 'Gemini', longitude: 78.1 },
    venus: { sign: 'Cancer', longitude: 105.3 },
    mars: { sign: 'Leo', longitude: 135.7 },
    jupiter: { sign: 'Capricorn', longitude: 285.4 },
    saturn: { sign: 'Capricorn', longitude: 292.1 },
    uranus: { sign: 'Capricorn', longitude: 275.8 },
    neptune: { sign: 'Capricorn', longitude: 280.3 },
    pluto: { sign: 'Scorpio', longitude: 220.1 },
    northNode: { sign: 'Aquarius', longitude: 305.2 },
    southNode: { sign: 'Leo', longitude: 125.2 },
  },
  houses: {
    1: { longitude: 0 },
    2: { longitude: 30 },
    3: { longitude: 60 },
    4: { longitude: 90 },
    5: { longitude: 120 },
    6: { longitude: 150 },
    7: { longitude: 180 },
    8: { longitude: 210 },
    9: { longitude: 240 },
    10: { longitude: 270 },
    11: { longitude: 300 },
    12: { longitude: 330 },
  },
  planetSignHouseCombinations: [
    { planet: 'Sun', sign: 'Gemini', house: 3, houseName: '3rd House' },
    { planet: 'Moon', sign: 'Virgo', house: 6, houseName: '6th House' },
    { planet: 'Mercury', sign: 'Gemini', house: 3, houseName: '3rd House' },
    { planet: 'Venus', sign: 'Cancer', house: 4, houseName: '4th House' },
    { planet: 'Mars', sign: 'Leo', house: 5, houseName: '5th House' },
    { planet: 'Jupiter', sign: 'Capricorn', house: 10, houseName: '10th House' },
    { planet: 'Saturn', sign: 'Capricorn', house: 10, houseName: '10th House' },
    { planet: 'Uranus', sign: 'Capricorn', house: 10, houseName: '10th House' },
    { planet: 'Neptune', sign: 'Capricorn', house: 10, houseName: '10th House' },
    { planet: 'Pluto', sign: 'Scorpio', house: 8, houseName: '8th House' },
    { planet: 'North Node', sign: 'Aquarius', house: 11, houseName: '11th House' },
    { planet: 'South Node', sign: 'Leo', house: 5, houseName: '5th House' },
  ],
  aspects: [
    { planet1: 'Sun', planet2: 'Moon', type: 'Square', orb: 5.2 },
  ],
};

const partnerChart = {
  name: 'Jordan Taylor',
  birth_date: '1992-09-21',
  birth_time: '09:00',
  location: 'Los Angeles, CA',
  planets: { sun: { sign: 'Virgo' } },
  houses: {},
  planetSignHouseCombinations: [],
};

const transitData = {
  transits: [
    { transitingBody: 'Jupiter', aspect: 'Conjunct', natalPoint: 'Sun', exactDate: '2026-07-15', house: 3 },
    { transitingBody: 'Saturn', aspect: 'Square', natalPoint: 'Moon', exactDate: '2026-08-20', house: 6 },
  ],
};

const baseData = {
  name: 'Alex Morgan',
  partner_name: 'Jordan Taylor',
  natalChart,
  compatibility_data: { partner: partnerChart },
  chartData: { partner: partnerChart, matrix_scores: { emotional: 72, communication: 65, spiritual: 80, stability: 70, physical: 75 } },
  matrix_data: { partner: partnerChart },
  birth_chart_data: natalChart,
  transit_data: transitData,
  destiny_data: {},
  karmic_data: {},
  skipPdf: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getSection(sections, type) {
  return sections.find((s) => s.type === type);
}

function getSectionText(section) {
  if (!section) return '';
  return typeof section.content === 'string'
    ? section.content
    : section.content?.content || '';
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Master Report — cross-section consistency audit (GSTA-115)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.REPORT_CONSISTENCY_STRICT;
  });

  // -------------------------------------------------------------------------
  // 1. Planetary placements in narrative vs chart wheel
  // -------------------------------------------------------------------------
  test('P0 — validator does NOT catch a mismatched Sun sign in birth chart narrative', async () => {
    // AI returns a Sun sign that contradicts the chart wheel (wheel says Gemini)
    generateText
      .mockResolvedValueOnce('Welcome Alex. Your Sun is in Taurus...') // birth_chart (wrong Sun)
      .mockResolvedValueOnce('Your compatibility with Jordan...')       // compatibility
      .mockResolvedValueOnce('Your extended forecast...')               // transit
      .mockResolvedValueOnce('Your annual forecast...')                 // destiny/annual
      .mockResolvedValueOnce('Your relationship matrix...')            // relationship_matrix
      .mockResolvedValueOnce('Your karmic reading...')                // karmic
      .mockResolvedValueOnce('May the stars guide you...');           // closing

    const result = await generatePremiumReport('MASTER', baseData);

    // The validator should have flagged the Taurus/Gemini mismatch, but it doesn't.
    const errorCalls = logger.error.mock.calls;
    const consistencyErrors = errorCalls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('Cross-section consistency')
    );

    // This assertion documents the structural gap:
    // the validator is blind to planetary placement mismatches.
    expect(consistencyErrors.length).toBe(0);

    // Verify the mismatch is actually present in the output
    const birthText = getSectionText(getSection(result.sections, 'birth_chart'));
    expect(birthText).toContain('Taurus');
  });

  test('passes when birth chart narrative matches chart wheel placements', async () => {
    generateText
      .mockResolvedValueOnce('Welcome Alex. Your Sun is in Gemini, Moon in Virgo...')
      .mockResolvedValueOnce('Your compatibility with Jordan...')
      .mockResolvedValueOnce('Your extended forecast...')
      .mockResolvedValueOnce('Your annual forecast...')
      .mockResolvedValueOnce('Your relationship matrix...')
      .mockResolvedValueOnce('Your karmic reading...')
      .mockResolvedValueOnce('May the stars guide you...');

    const result = await generatePremiumReport('MASTER', baseData);
    const birthText = getSectionText(getSection(result.sections, 'birth_chart'));
    expect(birthText).toContain('Gemini');
    expect(birthText).toContain('Virgo');
  });

  // -------------------------------------------------------------------------
  // 2. Transit date contradictions between Extended Forecast and Annual Forecast
  // -------------------------------------------------------------------------
  test('validator catches contradictory transit dates across forecast sections', async () => {
    // Extended Transit says Jupiter conjunct Sun on July 15
    // Annual Forecast says the SAME transit on August 1 (contradiction)
    generateText
      .mockResolvedValueOnce('Welcome Alex. Your Sun is in Gemini...')
      .mockResolvedValueOnce('Your compatibility with Jordan...')
      .mockResolvedValueOnce('On July 15, 2026, transiting Jupiter conjuncts your natal Sun...') // transit
      .mockResolvedValueOnce('On August 1, 2026, transiting Jupiter conjuncts your natal Sun...') // annual (contradiction)
      .mockResolvedValueOnce('Your relationship matrix...')
      .mockResolvedValueOnce('Your karmic reading...')
      .mockResolvedValueOnce('May the stars guide you...');

    const result = await generatePremiumReport('MASTER', baseData);

    const transitText = getSectionText(getSection(result.sections, 'transit'));
    const annualText = getSectionText(getSection(result.sections, 'annual_forecast'));

    // Both dates are present in the respective sections
    expect(transitText).toContain('July 15, 2026');
    expect(annualText).toContain('August 1, 2026');

    // The validator now catches this contradiction
    const errorCalls = logger.error.mock.calls;
    const consistencyErrors = errorCalls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('Cross-section consistency')
    );
    expect(consistencyErrors.length).toBeGreaterThan(0);
    // pdf-generator logs errors as logger.error('[PDF Generator] Cross-section consistency errors:', validationResult.errors)
    // so the individual error messages are in call[1]
    expect(
      consistencyErrors.some((call) =>
        JSON.stringify(call).includes('contradictory transit date')
      )
    ).toBe(true);
  });

  test('passes when transit dates are consistent across forecast sections', async () => {
    generateText
      .mockResolvedValueOnce('Welcome Alex. Your Sun is in Gemini...')
      .mockResolvedValueOnce('Your compatibility with Jordan...')
      .mockResolvedValueOnce('On July 15, 2026, transiting Jupiter conjuncts your natal Sun...')
      .mockResolvedValueOnce('On July 15, 2026, transiting Jupiter continues its conjunction to your Sun...')
      .mockResolvedValueOnce('Your relationship matrix...')
      .mockResolvedValueOnce('Your karmic reading...')
      .mockResolvedValueOnce('May the stars guide you...');

    const result = await generatePremiumReport('MASTER', baseData);
    const transitText = getSectionText(getSection(result.sections, 'transit'));
    const annualText = getSectionText(getSection(result.sections, 'annual_forecast'));
    expect(transitText).toContain('July 15, 2026');
    expect(annualText).toContain('July 15, 2026');
  });

  // -------------------------------------------------------------------------
  // 3. Karmic Nodal Axis alignment with birth chart
  // -------------------------------------------------------------------------
  test('P0 — validator does NOT catch a mismatched North Node sign in karmic section', async () => {
    generateText
      .mockResolvedValueOnce('Welcome Alex. Your Sun is in Gemini...')
      .mockResolvedValueOnce('Your compatibility with Jordan...')
      .mockResolvedValueOnce('Your extended forecast...')
      .mockResolvedValueOnce('Your annual forecast...')
      .mockResolvedValueOnce('Your relationship matrix...')
      .mockResolvedValueOnce('Your North Node is in Pisces in the 12th House...') // wrong sign & house
      .mockResolvedValueOnce('May the stars guide you...');

    const result = await generatePremiumReport('MASTER', baseData);

    const karmicText = getSectionText(getSection(result.sections, 'karmic'));
    expect(karmicText).toContain('Pisces');
    expect(karmicText).toContain('12th House');

    const errorCalls = logger.error.mock.calls;
    const consistencyErrors = errorCalls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('Cross-section consistency')
    );
    expect(consistencyErrors.length).toBe(0);
  });

  test('passes when karmic section aligns with chart wheel nodal axis', async () => {
    generateText
      .mockResolvedValueOnce('Welcome Alex. Your Sun is in Gemini...')
      .mockResolvedValueOnce('Your compatibility with Jordan...')
      .mockResolvedValueOnce('Your extended forecast...')
      .mockResolvedValueOnce('Your annual forecast...')
      .mockResolvedValueOnce('Your relationship matrix...')
      .mockResolvedValueOnce('Your North Node is in Aquarius in the 11th House...')
      .mockResolvedValueOnce('May the stars guide you...');

    const result = await generatePremiumReport('MASTER', baseData);
    const karmicText = getSectionText(getSection(result.sections, 'karmic'));
    expect(karmicText).toContain('Aquarius');
    expect(karmicText).toContain('11th House');
  });
});
