const { generateCompositeChartSVG } = require('../../src/utils/visuals/generateCompositeChartSVG');

describe('generateCompositeChartSVG', () => {
  const sampleData = {
    planets: [
      { name: 'Sun', sign: 'Libra', degree: 15, longitude: 195, house: 7 },
      { name: 'Moon', sign: 'Gemini', degree: 5, longitude: 65, house: 3 },
      { name: 'Mercury', sign: 'Scorpio', degree: 22, longitude: 212, house: 8 },
      { name: 'Venus', sign: 'Virgo', degree: 8, longitude: 158, house: 6 },
      { name: 'Mars', sign: 'Leo', degree: 3, longitude: 123, house: 5 },
      { name: 'Jupiter', sign: 'Pisces', degree: 18, longitude: 348, house: 12 },
      { name: 'Saturn', sign: 'Capricorn', degree: 10, longitude: 280, house: 10 },
    ],
    rising: { sign: 'Aries', longitude: 0, degree: 0 },
  };

  test('returns a valid SVG string', () => {
    const svg = generateCompositeChartSVG(sampleData);
    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  test('contains composite chart title', () => {
    const svg = generateCompositeChartSVG(sampleData);
    expect(svg).toContain('Composite Chart');
  });

  test('contains ASC marker', () => {
    const svg = generateCompositeChartSVG(sampleData);
    expect(svg).toContain('ASC');
  });

  test('contains all 12 zodiac signs', () => {
    const svg = generateCompositeChartSVG(sampleData);
    const expectedSymbols = [
      '\u2648', '\u2649', '\u264A', '\u264B', '\u264C', '\u264D',
      '\u264E', '\u264F', '\u2650', '\u2651', '\u2652', '\u2653',
    ];
    for (const sym of expectedSymbols) {
      expect(svg).toContain(sym);
    }
  });

  test('contains all planet names in output', () => {
    const svg = generateCompositeChartSVG(sampleData);
    for (const p of sampleData.planets) {
      expect(svg).toContain(p.name);
    }
  });

  test('contains planet legend', () => {
    const svg = generateCompositeChartSVG(sampleData);
    expect(svg).toContain('Planet Key');
  });

  test('shows correct house numbers in planet labels', () => {
    const svg = generateCompositeChartSVG(sampleData);
    for (const p of sampleData.planets) {
      expect(svg).toContain(`H${p.house}`);
    }
  });

  test('handles empty planets gracefully', () => {
    const emptyData = {
      planets: [],
      rising: { sign: 'Unknown', longitude: 0, degree: 0 },
    };
    const svg = generateCompositeChartSVG(emptyData);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  test('uses custom dimensions when provided', () => {
    const svg = generateCompositeChartSVG(sampleData, 800, 900);
    expect(svg).toContain('width="800"');
    expect(svg).toContain('height="900"');
  });

  test('handles planet positions at sign boundaries', () => {
    const boundaryData = {
      planets: [
        { name: 'Sun', sign: 'Aries', degree: 29.5, longitude: 29.5, house: 1 },
        { name: 'Moon', sign: 'Pisces', degree: 0.5, longitude: 360, house: 12 },
      ],
      rising: { sign: 'Aries', longitude: 0, degree: 0 },
    };
    const svg = generateCompositeChartSVG(boundaryData);
    expect(svg).toContain('Sun');
    expect(svg).toContain('Moon');
  });

  test('includes house number labels', () => {
    const svg = generateCompositeChartSVG(sampleData);
    for (let i = 1; i <= 12; i++) {
      expect(svg).toContain(`cg-hou">${i}`);
    }
  });
});
