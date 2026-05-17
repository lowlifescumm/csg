/**
 * PDF Generator — Cross-section consistency integration tests (GSTA-50)
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

const baseNatalChart = {
  name: 'John',
  birth_date: '1990-01-01',
  birth_time: '12:00',
  location: 'New York',
  planets: { sun: { sign: 'Capricorn' } },
  houses: {},
  planetSignHouseCombinations: [],
  houseCuspsDetailed: {},
};

const basePartnerChart = {
  name: 'Jane',
  birth_date: '1992-02-02',
  birth_time: '14:30',
  location: 'Los Angeles',
  planets: { sun: { sign: 'Aquarius' } },
  houses: {},
  planetSignHouseCombinations: [],
  houseCuspsDetailed: {},
};

describe('generatePremiumReport — cross-section consistency (GSTA-50)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.REPORT_CONSISTENCY_STRICT;
  });

  test('logs warnings when AI-generated content contains approximate name matches', async () => {
    // Simulate AI content that misspells the user name (Jon vs John)
    generateText
      .mockResolvedValueOnce('Welcome Jon, your birth chart shows...')  // birth_chart
      .mockResolvedValueOnce('Your extended forecast...')              // transit
      .mockResolvedValueOnce('Your destiny path...')                    // destiny
      .mockResolvedValueOnce('Your partner Jne is compatible...')       // compatibility
      .mockResolvedValueOnce('Your karmic reading...')                 // karmic
      .mockResolvedValueOnce('May the stars guide you...');            // closing

    const data = {
      name: 'John',
      partner_name: 'Jane',
      natalChart: baseNatalChart,
      compatibility_data: { partner: basePartnerChart },
      chartData: { partner: basePartnerChart, matrix_scores: {} },
      matrix_data: { partner: basePartnerChart },
      birth_chart_data: baseNatalChart,
      transit_data: {},
      destiny_data: {},
      karmic_data: {},
    };

    const result = await generatePremiumReport('MASTER', data);

    expect(result.sections.length).toBeGreaterThan(0);

    // Logger should have been called with warnings about name inconsistencies
    const warnCalls = logger.warn.mock.calls;
    const nameWarning = warnCalls.find(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('Cross-section consistency warnings')
    );
    expect(nameWarning).toBeTruthy();
  });

  test('throws in strict mode when inconsistencies are detected', async () => {
    process.env.REPORT_CONSISTENCY_STRICT = 'true';

    // AI content with wrong birth date and misspelled name
    generateText
      .mockResolvedValueOnce('Welcome Jon, born March 15, 1985...') // birth_chart with wrong date + name
      .mockResolvedValueOnce('Your extended forecast...')
      .mockResolvedValueOnce('Your destiny path...')
      .mockResolvedValueOnce('Your partner Jne is compatible...')
      .mockResolvedValueOnce('Your karmic reading...')
      .mockResolvedValueOnce('May the stars guide you...');

    const data = {
      name: 'John',
      partner_name: 'Jane',
      natalChart: baseNatalChart,
      compatibility_data: { partner: basePartnerChart },
      chartData: { partner: basePartnerChart, matrix_scores: {} },
      matrix_data: { partner: basePartnerChart },
      birth_chart_data: baseNatalChart,
      transit_data: {},
      destiny_data: {},
      karmic_data: {},
    };

    await expect(generatePremiumReport('MASTER', data)).rejects.toThrow(
      /Cross-section consistency validation failed/
    );
  });

  test('does not throw in non-strict mode when inconsistencies are detected', async () => {
    delete process.env.REPORT_CONSISTENCY_STRICT;

    // AI content with wrong birth date and misspelled name
    generateText
      .mockResolvedValueOnce('Welcome Jon, born March 15, 1985...')
      .mockResolvedValueOnce('Your extended forecast...')
      .mockResolvedValueOnce('Your destiny path...')
      .mockResolvedValueOnce('Your partner Jne is compatible...')
      .mockResolvedValueOnce('Your karmic reading...')
      .mockResolvedValueOnce('May the stars guide you...');

    const data = {
      name: 'John',
      partner_name: 'Jane',
      natalChart: baseNatalChart,
      compatibility_data: { partner: basePartnerChart },
      chartData: { partner: basePartnerChart, matrix_scores: {} },
      matrix_data: { partner: basePartnerChart },
      birth_chart_data: baseNatalChart,
      transit_data: {},
      destiny_data: {},
      karmic_data: {},
    };

    const result = await generatePremiumReport('MASTER', data);
    expect(result.sections.length).toBeGreaterThan(0);

    // Should log errors for inconsistencies
    const errorCalls = logger.error.mock.calls;
    const consistencyError = errorCalls.find(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('Cross-section consistency errors')
    );
    expect(consistencyError).toBeTruthy();
  });

  test('passes validation when all data is consistent', async () => {
    generateText
      .mockResolvedValueOnce('Welcome Alice Smith, born January 1, 1990 in New York...')
      .mockResolvedValueOnce('Your extended forecast for Alice Smith...')
      .mockResolvedValueOnce('Your destiny path begins on January 1, 1990...')
      .mockResolvedValueOnce('Your partner Bob Jones, born February 2, 1992 in Los Angeles...')
      .mockResolvedValueOnce('Your karmic reading for Alice Smith...')
      .mockResolvedValueOnce('May the stars guide you, Alice Smith...');

    const data = {
      name: 'Alice Smith',
      partner_name: 'Bob Jones',
      natalChart: baseNatalChart,
      compatibility_data: { partner: basePartnerChart },
      chartData: { partner: basePartnerChart, matrix_scores: {} },
      matrix_data: { partner: basePartnerChart },
      birth_chart_data: baseNatalChart,
      transit_data: {},
      destiny_data: {},
      karmic_data: {},
    };

    const result = await generatePremiumReport('MASTER', data);
    expect(result.sections.length).toBeGreaterThan(0);

    // No consistency errors or warnings should be logged
    const errorCalls = logger.error.mock.calls;
    const consistencyError = errorCalls.find(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('Cross-section consistency')
    );
    expect(consistencyError).toBeFalsy();
  });
});
