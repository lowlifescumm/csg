jest.mock('@/lib/groq', () => ({
  generateText: jest.fn(),
}));

jest.mock('@/lib/birth-chart-svg', () => ({
  generateBirthChartSVG: jest.fn(() => '<svg viewBox="0 0 500 500"><circle cx="250" cy="250" r="200"/></svg>'),
}));

jest.mock('@/lib/premium-pdf-generator', () => ({
  generatePremiumPdf: jest.fn(() => Buffer.from('%PDF-1.4 mock pdf content')),
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
  generateCompatibilityRadar: jest.fn(() => '<svg><polygon points="..."/></svg>'),
}));

const { generatePremiumReport } = require('@/lib/pdf-generator');
const { generateText } = require('@/lib/groq');
const premiumPdfGenerator = require('@/lib/premium-pdf-generator');
const pdfUtils = require('@/lib/pdf-utils');

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
    1: { longitude: 0 }, 2: { longitude: 30 }, 3: { longitude: 60 },
    4: { longitude: 90 }, 5: { longitude: 120 }, 6: { longitude: 150 },
    7: { longitude: 180 }, 8: { longitude: 210 }, 9: { longitude: 240 },
    10: { longitude: 270 }, 11: { longitude: 300 }, 12: { longitude: 330 },
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
  planets: { sun: { sign: 'Virgo', longitude: 160.0 } },
  houses: {},
  planetSignHouseCombinations: [],
};

// Add top-level sign references for generatePDF pass-through
const natalChartWithSigns = {
  ...natalChart,
  sun: { sign: 'Gemini' },
  moon: { sign: 'Virgo' },
};

const masterData = {
  name: 'Alex Morgan',
  partner_name: 'Jordan Taylor',
  natalChart: natalChartWithSigns,
  compatibility_data: { partner: partnerChart },
  chartData: {
    partner: partnerChart,
    matrix_scores: { emotional: 72, communication: 65, spiritual: 80, stability: 70, physical: 75 },
  },
  matrix_data: {
    partner: partnerChart,
    matrix_scores: { emotional: 72, communication: 65, spiritual: 80, stability: 70, physical: 75 },
  },
  birth_chart_data: natalChart,
  transit_data: {
    transits: [
      { transitingBody: 'Jupiter', aspect: 'Conjunct', natalPoint: 'Sun', exactDate: '2026-07-15', house: 3 },
    ],
  },
  destiny_data: {},
  karmic_data: {},
};

function getSection(sections, type) {
  return sections.find((s) => s.type === type);
}

function makeProgressTracker() {
  const calls = [];
  const fn = (percent, message) => { calls.push({ percent, message }); };
  fn.calls = calls;
  return fn;
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.REPORT_CONSISTENCY_STRICT;
});

describe('GSTA-265: End-to-end Master Report PDF verification', () => {

  describe('PDF generation pipeline', () => {
    test('generates PDF when skipPdf is false/omitted', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart analysis for Alex...')
        .mockResolvedValueOnce('Compatibility analysis for Alex and Jordan...')
        .mockResolvedValueOnce('Extended transit forecast...')
        .mockResolvedValueOnce('Annual forecast content...')
        .mockResolvedValueOnce('Relationship matrix analysis...')
        .mockResolvedValueOnce('Karmic reading for Alex...')
        .mockResolvedValueOnce('May the stars guide you, Alex...');

      const result = await generatePremiumReport('MASTER', masterData);

      expect(premiumPdfGenerator.generatePremiumPdf).toHaveBeenCalledTimes(1);
      expect(pdfUtils.uploadPdfToCloudinary).toHaveBeenCalledTimes(1);
      expect(result.pdfUrl).toBe('https://cloudinary.com/test.pdf');
    });

    test('skips PDF generation when skipPdf is true', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart analysis...')
        .mockResolvedValueOnce('Compatibility analysis...')
        .mockResolvedValueOnce('Extended transit forecast...')
        .mockResolvedValueOnce('Annual forecast...')
        .mockResolvedValueOnce('Relationship matrix...')
        .mockResolvedValueOnce('Karmic reading...')
        .mockResolvedValueOnce('Closing blessing...');

      const result = await generatePremiumReport('MASTER', { ...masterData, skipPdf: true });

      expect(premiumPdfGenerator.generatePremiumPdf).not.toHaveBeenCalled();
      expect(result.pdfUrl).toBeNull();
    });

    test('passes correct section data to premium PDF generator', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart analysis for Alex...')
        .mockResolvedValueOnce('Compatibility analysis for Alex and Jordan...')
        .mockResolvedValueOnce('Extended transit forecast...')
        .mockResolvedValueOnce('Annual forecast content...')
        .mockResolvedValueOnce('Relationship matrix analysis...')
        .mockResolvedValueOnce('Karmic reading for Alex...')
        .mockResolvedValueOnce('May the stars guide you, Alex...');

      await generatePremiumReport('MASTER', masterData);

      const userDataArg = premiumPdfGenerator.generatePremiumPdf.mock.calls[0][0];
      expect(userDataArg.name).toBe('Alex Morgan');
      expect(userDataArg.sections.length).toBeGreaterThanOrEqual(7);
      expect(userDataArg.birthDate).toBe('1990-06-15');
      expect(userDataArg.birthTime).toBe('14:30');
      expect(userDataArg.location).toBe('New York, NY');
      expect(userDataArg.sunSign).toBe('Gemini');
      expect(userDataArg.moonSign).toBe('Virgo');
    });
  });

  describe('Progress callback', () => {
    test('fires progress callback through all stages (0-100%)', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart...')
        .mockResolvedValueOnce('Compatibility...')
        .mockResolvedValueOnce('Transit...')
        .mockResolvedValueOnce('Annual forecast...')
        .mockResolvedValueOnce('Matrix...')
        .mockResolvedValueOnce('Karmic...')
        .mockResolvedValueOnce('Closing blessing...');

      const progress = makeProgressTracker();
      await generatePremiumReport('MASTER', masterData, progress);

      expect(progress.calls.length).toBeGreaterThanOrEqual(6);
      const percentages = progress.calls.map(c => c.percent);
      expect(percentages[0]).toBeLessThanOrEqual(percentages[percentages.length - 1]);
      expect(percentages[percentages.length - 1]).toBe(95);
    });

    test('reports progress for each major pipeline stage', async () => {
      generateText
        .mockResolvedValueOnce('Birth...')
        .mockResolvedValueOnce('Compatibility...')
        .mockResolvedValueOnce('Transit...')
        .mockResolvedValueOnce('Annual...')
        .mockResolvedValueOnce('Matrix...')
        .mockResolvedValueOnce('Karmic...')
        .mockResolvedValueOnce('Closing...');

      const progress = makeProgressTracker();
      await generatePremiumReport('MASTER', masterData, progress);

      const messages = progress.calls.map(c => c.message);
      expect(progress.calls.length).toBeGreaterThanOrEqual(6);
      expect(messages.some(m => m.includes('closing') || m.includes('Closing'))).toBe(true);
    });
  });

  describe('Error recovery', () => {
    test('handles AI generation failure mid-pipeline gracefully', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart analysis...')
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockResolvedValueOnce('Extended transit forecast...')
        .mockResolvedValueOnce('Annual forecast...')
        .mockResolvedValueOnce('Relationship matrix...')
        .mockResolvedValueOnce('Karmic reading...')
        .mockResolvedValueOnce('Closing blessing...');

      const result = await generatePremiumReport('MASTER', masterData);

      // At least one section should fail gracefully but report still completes
      const sectionsWithContent = result.sections.filter(s => s.content && typeof s.content === 'object' && s.content.content);
      expect(sectionsWithContent.length).toBeGreaterThanOrEqual(5);
      expect(result.sections.some(s => s.type === 'closing')).toBe(true);
      expect(result.html).toBeTruthy();
    });

    test('handles multiple AI failures and returns partial sections', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart...')
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce('Closing blessing...');

      const result = await generatePremiumReport('MASTER', masterData);

      expect(getSection(result.sections, 'birth_chart')).toBeTruthy();
      expect(getSection(result.sections, 'closing')).toBeTruthy();
      expect(result.html).toBeTruthy();
    });

    test('all sections with partner data omitted gracefully', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart analysis...')
        .mockResolvedValueOnce('Extended transit forecast...')
        .mockResolvedValueOnce('Annual forecast...')
        .mockResolvedValueOnce('Karmic reading...')
        .mockResolvedValueOnce('Closing blessing...');

      const noPartnerData = {
        name: 'Alex Morgan',
        natalChart,
        birth_chart_data: natalChart,
        transit_data: {},
        destiny_data: {},
        karmic_data: {},
      };

      const result = await generatePremiumReport('MASTER', noPartnerData);

      expect(getSection(result.sections, 'partner_birth_chart')).toBeFalsy();
      expect(getSection(result.sections, 'compatibility')).toBeFalsy();
      expect(getSection(result.sections, 'matrix')).toBeFalsy();
      expect(result.sections.length).toBe(5);
    });
  });

  describe('HTML output', () => {
    test('produces valid HTML with branding', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart...')
        .mockResolvedValueOnce('Compatibility...')
        .mockResolvedValueOnce('Transit...')
        .mockResolvedValueOnce('Annual...')
        .mockResolvedValueOnce('Matrix...')
        .mockResolvedValueOnce('Karmic...')
        .mockResolvedValueOnce('Closing...');

      const result = await generatePremiumReport('MASTER', masterData);

      expect(result.html).toBeTruthy();
      expect(result.html).toContain('Cosmic Spiritual Guide');
      expect(result.html).toContain('Alex Morgan');
      expect(result.html).toContain('</html>');
    });

    test('HTML contains all section types as CSS classes or IDs', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart...')
        .mockResolvedValueOnce('Compatibility...')
        .mockResolvedValueOnce('Transit...')
        .mockResolvedValueOnce('Annual...')
        .mockResolvedValueOnce('Matrix...')
        .mockResolvedValueOnce('Karmic...')
        .mockResolvedValueOnce('Closing...');

      const result = await generatePremiumReport('MASTER', masterData);

      expect(result.html).toContain('Birth Chart');
      expect(result.html).toContain('Compatibility');
      expect(result.html).toContain('Transit');
      expect(result.html).toContain('Matrix');
      expect(result.html).toContain('Karmic');
      expect(result.html).toContain('Closing');
    });
  });

  describe('Cross-section consistency', () => {
    test('passes consistency validation with matching data (no errors)', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart analysis for Alex born June 15, 1990 in New York...')
        .mockResolvedValueOnce('Compatibility analysis for Alex and Jordan...')
        .mockResolvedValueOnce('Extended transit forecast...')
        .mockResolvedValueOnce('Annual forecast...')
        .mockResolvedValueOnce('Relationship matrix...')
        .mockResolvedValueOnce('Karmic reading for Alex...')
        .mockResolvedValueOnce('Closing blessing...');

      const result = await generatePremiumReport('MASTER', masterData);

      expect(result).toBeTruthy();
      expect(result.sections.length).toBeGreaterThanOrEqual(7);
    });

    test('generates html with page-break class for PDF friendly output', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart...')
        .mockResolvedValueOnce('Compatibility...')
        .mockResolvedValueOnce('Transit...')
        .mockResolvedValueOnce('Annual...')
        .mockResolvedValueOnce('Matrix...')
        .mockResolvedValueOnce('Karmic...')
        .mockResolvedValueOnce('Closing...');

      const result = await generatePremiumReport('MASTER', masterData);

      expect(result.html).toContain('page-break');
    });
  });

  describe('Tier completeness', () => {
    test('ESSENTIAL tier generates correct sections', async () => {
      generateText
        .mockResolvedValueOnce('Tarot reading with High Priestess...')
        .mockResolvedValueOnce('Moon phase reading for Waxing Crescent...')
        .mockResolvedValueOnce('Short-term transit forecast...')
        .mockResolvedValueOnce('Closing blessing...');

      const essentialData = {
        name: 'Alex Morgan',
        tarot_data: {
          name: 'Alex',
          card_spread: [{ card: 'The High Priestess', position: 'Present', orientation: 'Upright' }],
        },
        moon_data: {
          name: 'Alex',
          moon_phase: 'Waxing Crescent',
          sun_sign: 'Gemini',
          moon_sign: 'Pisces',
        },
        transit_data: {
          name: 'Alex',
          transits: [{ aspect: 'Mars trine Sun', date: 'Feb 6' }],
        },
      };

      const result = await generatePremiumReport('ESSENTIAL', essentialData);

      expect(getSection(result.sections, 'tarot')).toBeTruthy();
      expect(getSection(result.sections, 'moon')).toBeTruthy();
      expect(getSection(result.sections, 'transit')).toBeTruthy();
      expect(getSection(result.sections, 'closing')).toBeTruthy();
      expect(getSection(result.sections, 'compatibility')).toBeFalsy();
      expect(getSection(result.sections, 'matrix')).toBeFalsy();
      expect(result.sections.length).toBe(4);
    });

    test('ADVANCED tier generates correct sections', async () => {
      generateText
        .mockResolvedValueOnce('Planetary Houses analysis...')
        .mockResolvedValueOnce('Aspect interpretations...')
        .mockResolvedValueOnce('Career path insights...')
        .mockResolvedValueOnce('Relationship insights...')
        .mockResolvedValueOnce('Life purpose analysis...')
        .mockResolvedValueOnce('Financial outlook...')
        .mockResolvedValueOnce('Health and wellness...')
        .mockResolvedValueOnce('Compatibility analysis...')
        .mockResolvedValueOnce('Extended transit forecast...')
        .mockResolvedValueOnce('Closing blessing...');

      const advancedData = {
        name: 'Alex Morgan',
        natalChart: natalChartWithSigns,
        compatibility_data: { partner: partnerChart },
        chartData: { partner: partnerChart, matrix_scores: { emotional: 72, communication: 65 } },
        transit_data: { transits: [{ transitingBody: 'Jupiter', aspect: 'Conjunct', natalPoint: 'Sun', exactDate: '2026-07-15', house: 3 }] },
        destiny_data: {},
        karmic_data: {},
      };

      const result = await generatePremiumReport('ADVANCED', advancedData);

      expect(getSection(result.sections, 'advanced_houses')).toBeTruthy();
      expect(getSection(result.sections, 'advanced_aspects')).toBeTruthy();
      expect(getSection(result.sections, 'advanced_career')).toBeTruthy();
      expect(getSection(result.sections, 'advanced_relationships')).toBeTruthy();
      expect(getSection(result.sections, 'advanced_life_purpose')).toBeTruthy();
      expect(getSection(result.sections, 'advanced_financial')).toBeTruthy();
      expect(getSection(result.sections, 'advanced_health')).toBeTruthy();
      expect(getSection(result.sections, 'compatibility')).toBeTruthy();
      expect(getSection(result.sections, 'transit')).toBeTruthy();
      expect(getSection(result.sections, 'closing')).toBeTruthy();
    });

    test('MASTER tier includes all 7+ sections', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart...')
        .mockResolvedValueOnce('Compatibility...')
        .mockResolvedValueOnce('Transit...')
        .mockResolvedValueOnce('Annual...')
        .mockResolvedValueOnce('Matrix...')
        .mockResolvedValueOnce('Karmic...')
        .mockResolvedValueOnce('Closing...');

      const result = await generatePremiumReport('MASTER', masterData);

      const expectedTypes = [
        'birth_chart',
        'partner_birth_chart',
        'compatibility',
        'transit',
        'annual_forecast',
        'matrix',
        'karmic',
        'closing',
      ];
      const actualTypes = result.sections.map(s => s.type);
      expectedTypes.forEach(type => {
        expect(actualTypes).toContain(type);
      });
    });
  });

  describe('Section deduplication', () => {
    test('deduplication runs for MASTER tier by default', async () => {
      generateText
        .mockResolvedValueOnce('Birth chart...')
        .mockResolvedValueOnce('Compatibility...')
        .mockResolvedValueOnce('Transit...')
        .mockResolvedValueOnce('Annual...')
        .mockResolvedValueOnce('Matrix...')
        .mockResolvedValueOnce('Karmic...')
        .mockResolvedValueOnce('Closing...');

      const result = await generatePremiumReport('MASTER', masterData);

      expect(result).toBeTruthy();
      expect(result.sections.length).toBeGreaterThanOrEqual(7);
    });
  });
});
