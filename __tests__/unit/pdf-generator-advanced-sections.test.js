/**
 * Advanced Report — Deep Analysis Section Verification (GSTA-46)
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

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { generatePremiumReport } = require('@/lib/pdf-generator');
const { generateText } = require('@/lib/groq');

const baseNatalChart = {
  name: 'Alice',
  birth_date: '1990-01-15',
  birth_time: '14:30',
  location: 'New York',
  planets: {
    sun: { sign: 'Capricorn', degree: 12 },
    moon: { sign: 'Pisces', degree: 5 },
    mercury: { sign: 'Capricorn', degree: 8 },
    venus: { sign: 'Aquarius', degree: 20 },
    mars: { sign: 'Scorpio', degree: 15 },
    jupiter: { sign: 'Cancer', degree: 3 },
    saturn: { sign: 'Capricorn', degree: 22 },
    uranus: { sign: 'Capricorn', degree: 7 },
    neptune: { sign: 'Capricorn', degree: 12 },
    pluto: { sign: 'Scorpio', degree: 18 },
    northNode: { sign: 'Aquarius', degree: 5 },
    southNode: { sign: 'Leo', degree: 5 },
  },
  houses: {
    1: { sign: 'Aries', longitude: 0 },
    2: { sign: 'Taurus', longitude: 30 },
    3: { sign: 'Gemini', longitude: 60 },
    4: { sign: 'Cancer', longitude: 90 },
    5: { sign: 'Leo', longitude: 120 },
    6: { sign: 'Virgo', longitude: 150 },
    7: { sign: 'Libra', longitude: 180 },
    8: { sign: 'Scorpio', longitude: 210 },
    9: { sign: 'Sagittarius', longitude: 240 },
    10: { sign: 'Capricorn', longitude: 270 },
    11: { sign: 'Aquarius', longitude: 300 },
    12: { sign: 'Pisces', longitude: 330 },
  },
  planetSignHouseCombinations: [
    { planet: 'Sun', sign: 'Capricorn', house: 10, houseName: '10th House', degree: 12 },
    { planet: 'Moon', sign: 'Pisces', house: 12, houseName: '12th House', degree: 5 },
    { planet: 'Mercury', sign: 'Capricorn', house: 10, houseName: '10th House', degree: 8 },
    { planet: 'Venus', sign: 'Aquarius', house: 11, houseName: '11th House', degree: 20 },
    { planet: 'Mars', sign: 'Scorpio', house: 8, houseName: '8th House', degree: 15 },
    { planet: 'Jupiter', sign: 'Cancer', house: 4, houseName: '4th House', degree: 3 },
    { planet: 'Saturn', sign: 'Capricorn', house: 10, houseName: '10th House', degree: 22 },
    { planet: 'Uranus', sign: 'Capricorn', house: 10, houseName: '10th House', degree: 7 },
    { planet: 'Neptune', sign: 'Capricorn', house: 10, houseName: '10th House', degree: 12 },
    { planet: 'Pluto', sign: 'Scorpio', house: 8, houseName: '8th House', degree: 18 },
    { planet: 'North Node', sign: 'Aquarius', house: 11, houseName: '11th House', degree: 5 },
    { planet: 'South Node', sign: 'Leo', house: 5, houseName: '5th House', degree: 5 },
  ],
  houseCuspsDetailed: [
    { house: 1, sign: 'Aries', degree: 0 },
    { house: 2, sign: 'Taurus', degree: 0 },
    { house: 10, sign: 'Capricorn', degree: 0 },
  ],
  aspects: [
    { planet1: 'Sun', planet2: 'Saturn', type: 'Conjunction', orb: 10.0 },
    { planet1: 'Venus', planet2: 'Mars', type: 'Square', orb: 5.0 },
  ],
};

const basePartnerChart = {
  name: 'Bob',
  birth_date: '1992-02-02',
  birth_time: '14:30',
  location: 'Los Angeles',
  planets: { sun: { sign: 'Aquarius' }, moon: { sign: 'Leo' } },
  houses: {},
  planetSignHouseCombinations: [],
  houseCuspsDetailed: {},
};

describe('generatePremiumReport — ADVANCED deep analysis sections (GSTA-46)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.REPORT_CONSISTENCY_STRICT;
  });

  test('generates all 7 deep analysis sections plus compatibility and transit', async () => {
    // We need 10 generateText calls: 7 deep analysis + compatibility + transit + closing
    generateText
      .mockResolvedValueOnce('Detailed house placements for all planets...')   // advanced_houses
      .mockResolvedValueOnce('Aspect interpretations narrative...')              // advanced_aspects
      .mockResolvedValueOnce('Career path analysis with 10th house...')          // advanced_career
      .mockResolvedValueOnce('Relationship insights from solo perspective...')     // advanced_relationships
      .mockResolvedValueOnce('Life purpose and North Node direction...')         // advanced_life_purpose
      .mockResolvedValueOnce('Financial outlook with 2nd house...')              // advanced_financial
      .mockResolvedValueOnce('Health and wellness 6th house insights...')       // advanced_health
      .mockResolvedValueOnce('Compatibility analysis between Alice and Bob...')   // compatibility
      .mockResolvedValueOnce('Extended transit forecast for Alice...')          // transit_forecast_extended
      .mockResolvedValueOnce('May the stars guide you...');                      // closing

    const data = {
      name: 'Alice',
      natalChart: baseNatalChart,
      compatibility_data: { partner: basePartnerChart },
      transit_data: { name: 'Alice', date_range: 'Feb 1–Apr 30, 2025', transits: [] },
    };

    const result = await generatePremiumReport('ADVANCED', data);

    // Should have 10 sections total (7 deep analysis + compatibility + transit + closing)
    expect(result.sections.length).toBe(10);

    // Verify all 7 deep analysis sections exist
    const expectedTypes = [
      'advanced_houses',
      'advanced_aspects',
      'advanced_career',
      'advanced_relationships',
      'advanced_life_purpose',
      'advanced_financial',
      'advanced_health',
      'compatibility',
      'transit',
      'closing',
    ];

    const actualTypes = result.sections.map(s => s.type);
    expectedTypes.forEach(type => {
      expect(actualTypes).toContain(type);
    });

    // Verify section titles
    const housesSection = result.sections.find(s => s.type === 'advanced_houses');
    expect(housesSection.title).toBe('Planetary Houses');

    const aspectsSection = result.sections.find(s => s.type === 'advanced_aspects');
    expect(aspectsSection.title).toBe('Aspect Interpretations');

    const careerSection = result.sections.find(s => s.type === 'advanced_career');
    expect(careerSection.title).toBe('Career Path');

    const relationshipsSection = result.sections.find(s => s.type === 'advanced_relationships');
    expect(relationshipsSection.title).toBe('Relationship Insights');

    const lifePurposeSection = result.sections.find(s => s.type === 'advanced_life_purpose');
    expect(lifePurposeSection.title).toBe('Life Purpose');

    const financialSection = result.sections.find(s => s.type === 'advanced_financial');
    expect(financialSection.title).toBe('Financial Outlook');

    const healthSection = result.sections.find(s => s.type === 'advanced_health');
    expect(healthSection.title).toBe('Health & Wellness');

    // Verify chart image is attached to the first section (houses)
    expect(housesSection.chartImage).toBeTruthy();

    // Verify each section has content
    result.sections.forEach(section => {
      expect(section.content).toBeTruthy();
      const contentText = typeof section.content === 'string'
        ? section.content
        : (section.content?.content || '');
      expect(contentText.length).toBeGreaterThan(0);
    });

    // Verify generateText was called for all 10 sections
    expect(generateText).toHaveBeenCalledTimes(10);
  });

  test('continues generation when a deep analysis section fails', async () => {
    // Make the 3rd section (career) throw an error
    generateText
      .mockResolvedValueOnce('Houses content...')
      .mockResolvedValueOnce('Aspects content...')
      .mockRejectedValueOnce(new Error('AI service timeout'))
      .mockResolvedValueOnce('Relationships content...')
      .mockResolvedValueOnce('Life purpose content...')
      .mockResolvedValueOnce('Financial content...')
      .mockResolvedValueOnce('Health content...')
      .mockResolvedValueOnce('Compatibility content...')
      .mockResolvedValueOnce('Transit content...');

    const data = {
      name: 'Alice',
      natalChart: baseNatalChart,
      compatibility_data: { partner: basePartnerChart },
      transit_data: { name: 'Alice', date_range: 'Feb 1–Apr 30, 2025', transits: [] },
    };

    const result = await generatePremiumReport('ADVANCED', data);

    // Should still have 10 sections (failed section has fallback content + closing)
    expect(result.sections.length).toBe(10);

    const careerSection = result.sections.find(s => s.type === 'advanced_career');
    expect(careerSection).toBeTruthy();
    expect(careerSection.content.content).toContain('encountered an issue');
  });

  test('generateText receives correct report types for each section', async () => {
    generateText.mockResolvedValue('Mock content');

    const data = {
      name: 'Alice',
      natalChart: baseNatalChart,
      compatibility_data: { partner: basePartnerChart },
      transit_data: { name: 'Alice', date_range: 'Feb 1–Apr 30, 2025', transits: [] },
    };

    await generatePremiumReport('ADVANCED', data);

    // The first 7 calls should be for the deep analysis sections
    const calls = generateText.mock.calls;
    expect(calls.length).toBe(10);

    // Check that prompts contain expected section-specific keywords
    // (getPromptByType returns the actual prompt string, so we verify by checking
    // that generateText was called 10 times with distinct prompts)
    const promptTexts = calls.map(call => call[0]);
    const uniquePrompts = new Set(promptTexts);
    expect(uniquePrompts.size).toBe(10); // Each section gets a distinct prompt
  });
});
