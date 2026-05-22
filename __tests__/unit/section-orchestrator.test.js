const { SectionOrchestrator } = require('@/lib/pdf-generator');

describe('SectionOrchestrator', () => {
  const RealDate = Date;

  beforeAll(() => {
    // Use local time to avoid UTC-to-local conversion issues
    // create local midnight of May 22, 2026
    const mockLocalMidnight = new RealDate(2026, 4, 22); // month is 0-indexed
    global.Date = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          return new RealDate(mockLocalMidnight);
        }
        return new RealDate(...args);
      }
      static now() { return mockLocalMidnight.getTime(); }
    };
  });

  afterAll(() => {
    global.Date = RealDate;
  });

  test('returns annual_forecast for default age (34)', () => {
    const result = SectionOrchestrator({ birth_date: '1992-01-01' });
    expect(result).toEqual({
      type: 'annual_forecast',
      title: 'Annual Forecast',
      reportType: 'transit_forecast_extended',
      description: 'Annual forecast based on current transits'
    });
  });

  test('returns saturn_return for age 28-30', () => {
    const result = SectionOrchestrator({ birth_date: '1997-06-01' });
    expect(result.type).toBe('saturn_return');
    expect(result.title).toBe('Saturn Return');
    expect(result.reportType).toBe('destiny_path');
  });

  test('returns saturn_return for age 58-60', () => {
    const result = SectionOrchestrator({ birth_date: '1967-06-01' });
    expect(result.type).toBe('saturn_return');
    expect(result.title).toBe('Saturn Return');
    expect(result.reportType).toBe('destiny_path');
  });

  test('returns midlife_transits for age 40-44', () => {
    const result = SectionOrchestrator({ birth_date: '1984-01-01' });
    expect(result.type).toBe('midlife_transits');
    expect(result.title).toBe('Midlife Transits');
    expect(result.reportType).toBe('destiny_path');
  });

  test('returns annual_forecast for age under 28', () => {
    const result = SectionOrchestrator({ birth_date: '2010-01-01' });
    expect(result.type).toBe('annual_forecast');
  });

  test('returns annual_forecast for age over 60', () => {
    const result = SectionOrchestrator({ birth_date: '1940-01-01' });
    expect(result.type).toBe('annual_forecast');
  });

  test('returns annual_forecast for invalid birth date', () => {
    const result = SectionOrchestrator({ birth_date: 'not-a-date' });
    expect(result.type).toBe('annual_forecast');
    expect(result.title).toBe('Annual Forecast');
  });

  test('throws when natalChartData is null', () => {
    expect(() => SectionOrchestrator(null)).toThrow(
      '[SectionOrchestrator] NatalChartData is required'
    );
  });

  test('throws when birth_date is missing', () => {
    expect(() => SectionOrchestrator({})).toThrow(
      '[SectionOrchestrator] birth_date is required in NatalChartData'
    );
  });

  test('accepts birthDate (camelCase) as fallback', () => {
    const result = SectionOrchestrator({ birthDate: '1992-01-01' });
    expect(result.type).toBe('annual_forecast');
  });

  test('handles boundary at age 28', () => {
    const result = SectionOrchestrator({ birth_date: '1998-05-22' });
    expect(result.type).toBe('saturn_return');
  });

  test('handles boundary at age 30', () => {
    const result = SectionOrchestrator({ birth_date: '1996-05-22' });
    expect(result.type).toBe('saturn_return');
  });

  test('handles boundary at age 40', () => {
    const result = SectionOrchestrator({ birth_date: '1986-05-22' });
    expect(result.type).toBe('midlife_transits');
  });

  test('handles boundary at age 44', () => {
    const result = SectionOrchestrator({ birth_date: '1982-05-22' });
    expect(result.type).toBe('midlife_transits');
  });
});
