const {
  validateReportConsistency,
  levenshteinDistance,
  buildDateRepresentations,
  extractText,
} = require('@/lib/report-consistency-validator');

describe('Report Consistency Validator', () => {
  describe('levenshteinDistance', () => {
    test('returns 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });

    test('returns correct distance for single substitution', () => {
      expect(levenshteinDistance('hello', 'hallo')).toBe(1);
    });

    test('returns correct distance for deletion', () => {
      expect(levenshteinDistance('john', 'jon')).toBe(1);
    });

    test('returns correct distance for insertion', () => {
      expect(levenshteinDistance('jon', 'john')).toBe(1);
    });

    test('handles empty strings', () => {
      expect(levenshteinDistance('', 'abc')).toBe(3);
      expect(levenshteinDistance('abc', '')).toBe(3);
    });
  });

  describe('buildDateRepresentations', () => {
    test('builds multiple formats from YYYY-MM-DD string', () => {
      const reps = buildDateRepresentations('1990-01-01');
      expect(reps).toContain('January 1, 1990');
      expect(reps).toContain('01/01/1990');
      expect(reps).toContain('1990-01-01');
    });

    test('builds formats from Date object', () => {
      const reps = buildDateRepresentations(new Date('1990-01-01T00:00:00'));
      expect(reps).toContain('January 1, 1990');
      expect(reps).toContain('1990-01-01');
    });

    test('returns empty array for invalid input', () => {
      expect(buildDateRepresentations(null)).toEqual([]);
      expect(buildDateRepresentations('not-a-date')).toEqual([]);
    });
  });

  describe('extractText', () => {
    test('returns string as-is', () => {
      expect(extractText('Hello world')).toBe('Hello world');
    });

    test('extracts content from object', () => {
      expect(extractText({ content: 'Hello world' })).toBe('Hello world');
    });

    test('extracts text from object', () => {
      expect(extractText({ text: 'Hello world' })).toBe('Hello world');
    });

    test('falls back to JSON stringify for nested objects', () => {
      expect(extractText({ foo: 'bar' })).toBe('{"foo":"bar"}');
    });

    test('returns empty string for null/undefined', () => {
      expect(extractText(null)).toBe('');
      expect(extractText(undefined)).toBe('');
    });
  });

  describe('validateReportConsistency', () => {
    test('passes for valid single-section report', () => {
      const result = validateReportConsistency({
        sections: [{ type: 'birth_chart', title: 'Chart', content: 'Here is your chart.' }],
        canonicalNames: { userName: 'Alice' },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('flags duplicate section types as error', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'birth_chart', title: 'Chart 1', content: 'A' },
          { type: 'birth_chart', title: 'Chart 2', content: 'B' },
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate section type "birth_chart" found 2 times');
      expect(result.details.duplicateSections).toContain('birth_chart');
    });

    test('allows duplicate types in allowDuplicateTypes list', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'closing', title: 'Closing 1', content: 'A' },
          { type: 'closing', title: 'Closing 2', content: 'B' },
        ],
        options: { allowDuplicateTypes: ['closing'] },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('flags approximate name match as warning (non-strict)', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'intro', title: 'Intro', content: 'Welcome Jon, your chart is ready.' },
        ],
        canonicalNames: { userName: 'John' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Jon');
      expect(result.details.nameInconsistencies).toHaveLength(1);
    });

    test('flags approximate name match as error in strict mode', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'intro', title: 'Intro', content: 'Welcome Jon, your chart is ready.' },
        ],
        canonicalNames: { userName: 'John' },
        options: { strict: true },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Jon');
    });

    test('does not flag exact name match', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'intro', title: 'Intro', content: 'Welcome John, your chart is ready.' },
        ],
        canonicalNames: { userName: 'John' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('flags contradictory birth date as warning (non-strict)', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'birth_chart', title: 'Chart', content: 'Born on March 15, 1985.' },
        ],
        canonicalBirthData: { birthDate: '1990-01-01' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('March 15, 1985');
    });

    test('flags contradictory birth date as error in strict mode', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'birth_chart', title: 'Chart', content: 'Born on March 15, 1985.' },
        ],
        canonicalBirthData: { birthDate: '1990-01-01' },
        options: { strict: true },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('March 15, 1985');
    });

    test('does not flag matching birth date', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'birth_chart', title: 'Chart', content: 'Born on January 1, 1990.' },
        ],
        canonicalBirthData: { birthDate: '1990-01-01' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('flags contradictory birth time as warning', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'birth_chart', title: 'Chart', content: 'Born at 3:30 PM.' },
        ],
        canonicalBirthData: { birthTime: '12:00' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('3:30 PM');
    });

    test('does not flag matching birth time', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'birth_chart', title: 'Chart', content: 'Born at 12:00 PM.' },
        ],
        canonicalBirthData: { birthTime: '12:00' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('flags contradictory location as warning', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'birth_chart', title: 'Chart', content: 'Born in Los Angeles.' },
        ],
        canonicalBirthData: { location: 'New York' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Los Angeles');
    });

    test('does not flag matching location', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'birth_chart', title: 'Chart', content: 'Born in New York.' },
        ],
        canonicalBirthData: { location: 'New York' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('accumulates multiple issues across sections', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'birth_chart', title: 'Chart', content: 'Welcome Jon, born March 15, 1985.' },
          { type: 'compatibility', title: 'Compat', content: 'John and Jane are compatible.' },
          { type: 'birth_chart', title: 'Chart 2', content: 'Duplicate chart.' },
        ],
        canonicalNames: { userName: 'John', partnerName: 'Jane' },
        canonicalBirthData: { birthDate: '1990-01-01' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate section type "birth_chart" found 2 times');
      expect(result.warnings.some(w => w.includes('Jon'))).toBe(true);
      expect(result.warnings.some(w => w.includes('March 15, 1985'))).toBe(true);
    });

    test('validates partner name consistency', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'compatibility', title: 'Compat', content: 'Your partner Jne is amazing.' },
        ],
        canonicalNames: { partnerName: 'Jane' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Jne');
    });

    test('validates partner birth data consistency', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'compatibility', title: 'Compat', content: 'Partner born on February 2, 1992.' },
        ],
        canonicalBirthData: { partnerBirthDate: '1995-05-05' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('February 2, 1992');
    });

    test('returns error for non-array sections', () => {
      const result = validateReportConsistency({ sections: null });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Sections must be an array');
    });

    test('ignores month and weekday names when scanning locations', () => {
      const result = validateReportConsistency({
        sections: [
          { type: 'transit', title: 'Transit', content: 'In January, on Monday, you will feel energized.' },
        ],
        canonicalBirthData: { location: 'New York' },
      });
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('does not flag non-birth dates (e.g. transit dates) as birth date contradictions', () => {
      const result = validateReportConsistency({
        sections: [
          {
            type: 'transit',
            title: 'Transit Forecast',
            content: 'Saturn conjuncts your Sun on December 15, 2024. This transit activates your career house until March 2025.',
          },
        ],
        canonicalBirthData: { birthDate: '1990-01-01' },
      });
      // Transit dates are NOT birth dates — should not trigger birth date contradictions
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('transit date contradictions are warnings by default (not errors)', () => {
      const result = validateReportConsistency({
        sections: [
          {
            type: 'transit',
            title: 'Transit Forecast',
            content: 'transiting Saturn conjuncts your natal Sun around December 15, 2025, bringing lessons.',
          },
        ],
        canonicalBirthData: { birthDate: '1990-01-01' },
        canonicalTransits: [
          { transitingBody: 'Saturn', aspect: 'Conjunct', natalPoint: 'Sun', exactDate: '2025-06-15' },
        ],
      });
      // Transit date contradictions should be warnings (valid remains true)
      expect(result.valid).toBe(true);
      const transitWarnings = result.warnings.filter(w => w.includes('transit date'));
      expect(transitWarnings.length).toBeGreaterThan(0);
    });
  });
});
