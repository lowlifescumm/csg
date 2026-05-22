jest.mock('@/lib/groq', () => ({
  generateText: jest.fn(),
}));

jest.mock('@/lib/birth-chart-svg', () => ({
  generateBirthChartSVG: jest.fn(() => '<svg viewBox="0 0 500 500"><circle cx="250" cy="250" r="200"/></svg>'),
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
  generateCompatibilityRadar: jest.fn(() => '<svg><polygon points="..."/></svg>'),
}));

const { generatePremiumReport } = require('@/lib/pdf-generator');
const { generateText } = require('@/lib/groq');

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
  planets: { sun: { sign: 'Virgo' } },
  houses: {},
  planetSignHouseCombinations: [],
};

const baseData = {
  name: 'Alex Morgan',
  partner_name: 'Jordan Taylor',
  natalChart,
  compatibility_data: { partner: partnerChart },
  chartData: { partner: partnerChart, matrix_scores: { emotional: 72, communication: 65, spiritual: 80, stability: 70, physical: 75 } },
  matrix_data: { partner: partnerChart, matrix_scores: { emotional: 72, communication: 65, spiritual: 80, stability: 70, physical: 75 } },
  birth_chart_data: natalChart,
  transit_data: {
    transits: [
      { transitingBody: 'Jupiter', aspect: 'Conjunct', natalPoint: 'Sun', exactDate: '2026-07-15', house: 3 },
    ],
  },
  destiny_data: {},
  karmic_data: {},
  skipPdf: true,
};

const noPartnerData = {
  name: 'Alex Morgan',
  natalChart,
  birth_chart_data: natalChart,
  transit_data: {},
  destiny_data: {},
  karmic_data: {},
  skipPdf: true,
};

function getSection(sections, type) {
  return sections.find((s) => s.type === type);
}

describe('generatePremiumReport — MASTER sections (GSTA-47)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.REPORT_CONSISTENCY_STRICT;
  });

  test('generates all MASTER sections with correct types and titles', async () => {
    generateText
      .mockResolvedValueOnce('Birth chart analysis for Alex...')
      .mockResolvedValueOnce('Compatibility analysis for Alex and Jordan...')
      .mockResolvedValueOnce('Extended transit forecast...')
      .mockResolvedValueOnce('Annual forecast content...')
      .mockResolvedValueOnce('Relationship matrix analysis...')
      .mockResolvedValueOnce('Karmic reading for Alex...')
      .mockResolvedValueOnce('May the stars guide you, Alex...');

    const result = await generatePremiumReport('MASTER', baseData);
    expect(result.sections.length).toBeGreaterThanOrEqual(7);

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

    expect(getSection(result.sections, 'birth_chart').title).toBe('Birth Chart Analysis');
    expect(getSection(result.sections, 'partner_birth_chart').title).toBe('Partner Birth Chart');
    expect(getSection(result.sections, 'compatibility').title).toBe('Compatibility Analysis');
    expect(getSection(result.sections, 'transit').title).toBe('Extended Transit Forecast');
    expect(getSection(result.sections, 'annual_forecast').title).toBe('Annual Forecast');
    expect(getSection(result.sections, 'matrix').title).toBe('Relationship Matrix');
    expect(getSection(result.sections, 'karmic').title).toBe('Karmic & Shadow Work');

    expect(generateText).toHaveBeenCalledTimes(7);
  });

  test('birth chart section includes chart SVG image', async () => {
    generateText
      .mockResolvedValueOnce('Birth chart analysis...')
      .mockResolvedValueOnce('Compatibility analysis...')
      .mockResolvedValueOnce('Extended transit forecast...')
      .mockResolvedValueOnce('Annual forecast...')
      .mockResolvedValueOnce('Relationship matrix...')
      .mockResolvedValueOnce('Karmic reading...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('MASTER', baseData);
    const birthChartSection = getSection(result.sections, 'birth_chart');
    expect(birthChartSection.chartImage).toBeTruthy();
    expect(birthChartSection.chartImage).toContain('data:image/svg+xml;base64,');
  });

  test('partner birth chart section includes chart SVG', async () => {
    generateText
      .mockResolvedValueOnce('Birth chart analysis...')
      .mockResolvedValueOnce('Compatibility analysis...')
      .mockResolvedValueOnce('Extended transit forecast...')
      .mockResolvedValueOnce('Annual forecast...')
      .mockResolvedValueOnce('Relationship matrix...')
      .mockResolvedValueOnce('Karmic reading...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('MASTER', baseData);
    const partnerSection = getSection(result.sections, 'partner_birth_chart');
    expect(partnerSection).toBeTruthy();
    expect(partnerSection.chartImage).toBeTruthy();
    expect(partnerSection.chartImage).toContain('data:image/svg+xml;base64,');
  });

  test('relationship matrix section includes radar chart SVG', async () => {
    generateText
      .mockResolvedValueOnce('Birth chart analysis...')
      .mockResolvedValueOnce('Compatibility analysis...')
      .mockResolvedValueOnce('Extended transit forecast...')
      .mockResolvedValueOnce('Annual forecast...')
      .mockResolvedValueOnce('Relationship matrix with scores...')
      .mockResolvedValueOnce('Karmic reading...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('MASTER', baseData);
    const matrixSection = getSection(result.sections, 'matrix');
    expect(matrixSection).toBeTruthy();
    expect(matrixSection.matrixChartSVG).toBeTruthy();
    expect(matrixSection.chartImage).toBeTruthy();
    expect(matrixSection.matrixChartSVG).toContain('<svg');
  });

  test('skips partner-dependent sections when partner data is absent', async () => {
    generateText
      .mockResolvedValueOnce('Birth chart analysis...')
      .mockResolvedValueOnce('Extended transit forecast...')
      .mockResolvedValueOnce('Annual forecast...')
      .mockResolvedValueOnce('Karmic reading...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('MASTER', noPartnerData);

    expect(getSection(result.sections, 'partner_birth_chart')).toBeFalsy();
    expect(getSection(result.sections, 'compatibility')).toBeFalsy();
    expect(getSection(result.sections, 'matrix')).toBeFalsy();

    expect(getSection(result.sections, 'birth_chart')).toBeTruthy();
    expect(getSection(result.sections, 'transit')).toBeTruthy();
    expect(getSection(result.sections, 'annual_forecast')).toBeTruthy();
    expect(getSection(result.sections, 'karmic')).toBeTruthy();
    expect(getSection(result.sections, 'closing')).toBeTruthy();

    expect(generateText).toHaveBeenCalledTimes(5);
  });

  test('each section has non-empty content', async () => {
    generateText
      .mockResolvedValueOnce('Birth chart analysis for Alex...')
      .mockResolvedValueOnce('Compatibility analysis for Alex and Jordan...')
      .mockResolvedValueOnce('Extended transit forecast with dates...')
      .mockResolvedValueOnce('Annual forecast for the coming year...')
      .mockResolvedValueOnce('Relationship matrix showing compatibility scores...')
      .mockResolvedValueOnce('Karmic and shadow work insights...')
      .mockResolvedValueOnce('May the stars guide you, Alex...');

    const result = await generatePremiumReport('MASTER', baseData);

    result.sections.forEach(section => {
      const text = typeof section.content === 'string'
        ? section.content
        : section.content?.content || '';
      expect(text.length).toBeGreaterThan(0);
    });
  });

  test('closing blessing is appended as final section', async () => {
    generateText
      .mockResolvedValueOnce('Birth chart analysis...')
      .mockResolvedValueOnce('Compatibility analysis...')
      .mockResolvedValueOnce('Extended transit forecast...')
      .mockResolvedValueOnce('Annual forecast...')
      .mockResolvedValueOnce('Relationship matrix...')
      .mockResolvedValueOnce('Karmic reading...')
      .mockResolvedValueOnce('Closing blessing for Alex...');

    const result = await generatePremiumReport('MASTER', baseData);
    const lastSection = result.sections[result.sections.length - 1];
    expect(lastSection.type).toBe('closing');
  });

  test('generates saturn_return for age 29', async () => {
    const youngData = {
      ...baseData,
      natalChart: {
        ...natalChart,
        birth_date: '1997-03-10',
      },
    };

    generateText
      .mockResolvedValueOnce('Birth chart analysis...')
      .mockResolvedValueOnce('Compatibility analysis...')
      .mockResolvedValueOnce('Extended transit forecast...')
      .mockResolvedValueOnce('Saturn Return analysis content...')
      .mockResolvedValueOnce('Relationship matrix...')
      .mockResolvedValueOnce('Karmic reading...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('MASTER', youngData);
    const saturnSection = getSection(result.sections, 'saturn_return');
    expect(saturnSection).toBeTruthy();
    expect(saturnSection.title).toBe('Saturn Return');
  });

  test('generates midlife_transits for age 42', async () => {
    const midlifeData = {
      ...baseData,
      natalChart: {
        ...natalChart,
        birth_date: '1984-03-10',
      },
    };

    generateText
      .mockResolvedValueOnce('Birth chart analysis...')
      .mockResolvedValueOnce('Compatibility analysis...')
      .mockResolvedValueOnce('Extended transit forecast...')
      .mockResolvedValueOnce('Midlife transits analysis content...')
      .mockResolvedValueOnce('Relationship matrix...')
      .mockResolvedValueOnce('Karmic reading...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('MASTER', midlifeData);
    const midlifeSection = getSection(result.sections, 'midlife_transits');
    expect(midlifeSection).toBeTruthy();
    expect(midlifeSection.title).toBe('Midlife Transits');
  });

  test('generates sections in correct order', async () => {
    generateText
      .mockResolvedValueOnce('Birth chart analysis...')
      .mockResolvedValueOnce('Compatibility analysis...')
      .mockResolvedValueOnce('Extended transit forecast...')
      .mockResolvedValueOnce('Annual forecast...')
      .mockResolvedValueOnce('Relationship matrix...')
      .mockResolvedValueOnce('Karmic reading...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('MASTER', baseData);
    const typesOrdered = result.sections.map(s => s.type);

    const birthIdx = typesOrdered.indexOf('birth_chart');
    const partnerIdx = typesOrdered.indexOf('partner_birth_chart');
    const compatIdx = typesOrdered.indexOf('compatibility');
    const transitIdx = typesOrdered.indexOf('transit');
    const annualIdx = typesOrdered.indexOf('annual_forecast');
    const matrixIdx = typesOrdered.indexOf('matrix');
    const karmicIdx = typesOrdered.indexOf('karmic');
    const closingIdx = typesOrdered.indexOf('closing');

    expect(birthIdx).toBeLessThan(partnerIdx);
    expect(partnerIdx).toBeLessThan(compatIdx);
    expect(compatIdx).toBeLessThan(transitIdx);
    expect(transitIdx).toBeLessThan(annualIdx);
    expect(annualIdx).toBeLessThan(matrixIdx);
    expect(matrixIdx).toBeLessThan(karmicIdx);
    expect(karmicIdx).toBeLessThan(closingIdx);
  });

  test('includes HTML output with cover page', async () => {
    generateText
      .mockResolvedValueOnce('Birth chart analysis...')
      .mockResolvedValueOnce('Compatibility analysis...')
      .mockResolvedValueOnce('Extended transit forecast...')
      .mockResolvedValueOnce('Annual forecast...')
      .mockResolvedValueOnce('Relationship matrix...')
      .mockResolvedValueOnce('Karmic reading...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('MASTER', baseData);

    expect(result.html).toBeTruthy();
    expect(result.html.length).toBeGreaterThan(0);
    expect(result.html).toContain('Cosmic Spiritual Guide');
    expect(result.html).toContain('Prepared for Alex Morgan');
  });
});
