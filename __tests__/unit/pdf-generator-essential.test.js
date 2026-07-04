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

const { generatePremiumReport } = require('@/lib/pdf-generator');
const { generateText } = require('@/lib/groq');

describe('generatePremiumReport — ESSENTIAL report (GSTA-47)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generates 4 sections: tarot, moon, transit, closing', async () => {
    generateText
      .mockResolvedValueOnce('Tarot reading: The High Priestess...')
      .mockResolvedValueOnce('Moon phase: Waxing Crescent...')
      .mockResolvedValueOnce('Short transit forecast...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('ESSENTIAL', {
      name: 'Test User',
      tarot_data: {
        name: 'Test User',
        card_spread: [{ card: 'The High Priestess', position: 'Present' }],
      },
      moon_data: {
        name: 'Test User',
        moon_phase: 'Waxing Crescent',
      },
      transit_data: {
        name: 'Test User',
        date_range: 'Feb 4–Feb 18, 2025',
        transits: [{ aspect: 'Mars trine Sun', date: 'Feb 6' }],
      },
    });

    expect(result.sections.length).toBe(4);
    expect(result.sections[0].type).toBe('tarot');
    expect(result.sections[1].type).toBe('moon');
    expect(result.sections[2].type).toBe('transit');
    expect(result.sections[3].type).toBe('closing');

    expect(generateText).toHaveBeenCalledTimes(4);
  });

  test('each section has content', async () => {
    generateText
      .mockResolvedValueOnce('Tarot reading content...')
      .mockResolvedValueOnce('Moon phase reading content...')
      .mockResolvedValueOnce('Transit forecast content...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('ESSENTIAL', {
      name: 'Test User',
      tarot_data: { name: 'Test User', card_spread: [] },
      moon_data: { name: 'Test User', moon_phase: 'Full Moon' },
      transit_data: { name: 'Test User', transits: [] },
    });

    result.sections.forEach(section => {
      const text = typeof section.content === 'string'
        ? section.content
        : section.content?.content || '';
      expect(text.length).toBeGreaterThan(0);
    });
  });

  test('includes HTML output', async () => {
    generateText
      .mockResolvedValueOnce('Tarot reading...')
      .mockResolvedValueOnce('Moon phase...')
      .mockResolvedValueOnce('Transit forecast...')
      .mockResolvedValueOnce('Closing blessing...');

    const result = await generatePremiumReport('ESSENTIAL', {
      name: 'Test User',
      tarot_data: { name: 'Test User', card_spread: [] },
      moon_data: { name: 'Test User', moon_phase: 'Waning' },
      transit_data: { name: 'Test User', transits: [] },
    });

    expect(result.html).toBeTruthy();
    expect(result.html.length).toBeGreaterThan(0);
  });
});
