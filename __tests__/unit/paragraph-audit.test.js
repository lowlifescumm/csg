/**
 * Unit tests for paragraph-audit.js
 * Covers duplicate detection, near-duplicate detection, and deduplication logic.
 */

const {
  getSectionText,
  normalizeParagraph,
  extractParagraphs,
  computeSimilarity,
  jaccardSimilarity,
  getCharacterNgrams,
  isNearDuplicate,
  auditSections,
  deduplicateSections,
} = require('../../lib/paragraph-audit.js');

describe('getSectionText', () => {
  test('extracts string content directly', () => {
    expect(getSectionText({ content: 'Hello world' })).toBe('Hello world');
  });

  test('extracts nested content string', () => {
    expect(getSectionText({ content: { content: 'Nested hello' } })).toBe('Nested hello');
  });

  test('extracts html fallback', () => {
    expect(getSectionText({ content: { html: '<p>Hi</p>' } })).toBe('<p>Hi</p>');
  });

  test('returns empty string for null/undefined', () => {
    expect(getSectionText(null)).toBe('');
    expect(getSectionText(undefined)).toBe('');
    expect(getSectionText({})).toBe('');
  });
});

describe('normalizeParagraph', () => {
  test('lowercases text', () => {
    expect(normalizeParagraph('Hello World')).toBe('hello world');
  });

  test('removes markdown characters', () => {
    const md = '## **Bold** and *italic* with `code`';
    expect(normalizeParagraph(md)).toBe('bold and italic with code');
  });

  test('removes html tags', () => {
    expect(normalizeParagraph('<p>Hello</p> world')).toBe('hello world');
  });

  test('replaces URLs with token', () => {
    expect(normalizeParagraph('Visit https://example.com now')).toBe('visit url now');
  });

  test('collapses whitespace', () => {
    expect(normalizeParagraph('  hello    world  ')).toBe('hello world');
  });
});

describe('extractParagraphs', () => {
  test('splits on blank lines', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    const paragraphs = extractParagraphs(text, 10);
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toBe('First paragraph.');
    expect(paragraphs[1]).toBe('Second paragraph.');
  });

  test('filters short paragraphs', () => {
    const text = 'Short.\n\nThis is a much longer paragraph that should definitely be kept because it exceeds the minimum length threshold easily.';
    const paragraphs = extractParagraphs(text, 30);
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toContain('much longer paragraph');
  });

  test('returns empty array for empty text', () => {
    expect(extractParagraphs('', 10)).toEqual([]);
    expect(extractParagraphs(null, 10)).toEqual([]);
  });

  test('handles windows line endings', () => {
    const text = 'Line one.\r\n\r\nLine two.';
    const paragraphs = extractParagraphs(text, 5);
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toBe('Line one.');
    expect(paragraphs[1]).toBe('Line two.');
  });
});

describe('getCharacterNgrams', () => {
  test('returns correct 3-grams', () => {
    const ngrams = getCharacterNgrams('hello', 3);
    expect(ngrams).toEqual(new Set(['hel', 'ell', 'llo']));
  });

  test('handles short text', () => {
    const ngrams = getCharacterNgrams('ab', 3);
    expect(ngrams).toEqual(new Set(['ab']));
  });

  test('ignores whitespace', () => {
    const ngrams = getCharacterNgrams('a b c', 2);
    expect(ngrams).toEqual(new Set(['ab', 'bc']));
  });
});

describe('jaccardSimilarity', () => {
  test('identical sets have similarity 1', () => {
    const set = new Set(['a', 'b', 'c']);
    expect(jaccardSimilarity(set, set)).toBe(1);
  });

  test('completely disjoint sets have similarity 0', () => {
    expect(jaccardSimilarity(new Set(['a']), new Set(['b']))).toBe(0);
  });

  test('partial overlap', () => {
    // intersection = 1, union = 3 => 1/3
    expect(jaccardSimilarity(new Set(['a', 'b']), new Set(['a', 'c']))).toBeCloseTo(1 / 3);
  });
});

describe('computeSimilarity', () => {
  test('exact match returns 1.0', () => {
    expect(computeSimilarity('The quick brown fox.', 'The quick brown fox.')).toBe(1);
  });

  test('completely different returns ~0', () => {
    const sim = computeSimilarity(
      'The quick brown fox jumps over the lazy dog.',
      'Quantum mechanics describes nature at the smallest scales of energy levels.'
    );
    expect(sim).toBeLessThan(0.3);
  });

  test('near-duplicate has high similarity', () => {
    const a = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally.';
    const b = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally in every situation.';
    const sim = computeSimilarity(a, b);
    expect(sim).toBeGreaterThan(0.80);
    expect(sim).toBeLessThan(1);
  });

  test('normalization affects exact match', () => {
    expect(computeSimilarity('Hello **World**', 'hello world')).toBe(1);
  });
});

describe('isNearDuplicate', () => {
  test('exact duplicates are flagged', () => {
    const result = isNearDuplicate('Hello world', 'Hello world');
    expect(result.duplicate).toBe(true);
    expect(result.similarity).toBe(1);
  });

  test('near-duplicates within length ratio are flagged', () => {
    const a = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally.';
    const b = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally in every situation.';
    const result = isNearDuplicate(a, b);
    expect(result.duplicate).toBe(true);
    expect(result.similarity).toBeGreaterThan(0.80);
  });

  test('paragraphs that differ significantly in length are NOT flagged', () => {
    const a = 'Your sun in Leo gives you natural leadership.';
    const b =
      'Your sun in Leo gives you natural leadership. In relationships, this creates a dynamic where you naturally take charge and inspire others to follow your vision. Your creative energy is boundless.';
    const result = isNearDuplicate(a, b);
    expect(result.duplicate).toBe(false);
  });

  test('different paragraphs are not flagged', () => {
    const a = 'The moon waxes full in the sign of Cancer, bringing emotional depth.';
    const b = 'Mars enters your tenth house, igniting career ambitions and drive.';
    const result = isNearDuplicate(a, b);
    expect(result.duplicate).toBe(false);
    expect(result.similarity).toBeLessThan(0.5);
  });
});

describe('auditSections', () => {
  test('finds exact duplicates across sections', () => {
    const para = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally.';
    const sections = [
      { type: 'birth_chart', title: 'Birth Chart', content: { content: `Paragraph one.\n\n${para}` } },
      { type: 'compatibility', title: 'Compatibility', content: { content: `Other text.\n\n${para}` } },
    ];
    const findings = auditSections(sections);
    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe('exact_duplicate');
    expect(findings[0].sourceSectionTitle).toBe('Birth Chart');
    expect(findings[0].targetSectionTitle).toBe('Compatibility');
  });

  test('finds near-duplicates across sections', () => {
    const a = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally.';
    const b = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally in every situation.';
    const sections = [
      { type: 'birth_chart', title: 'Birth Chart', content: { content: a } },
      { type: 'compatibility', title: 'Compatibility', content: { content: b } },
    ];
    const findings = auditSections(sections);
    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe('near_duplicate');
    expect(findings[0].similarity).toBeGreaterThanOrEqual(0.8);
  });

  test('ignores short paragraphs', () => {
    const sections = [
      { type: 'a', title: 'A', content: { content: 'Short.\n\nDifferent long paragraph that is definitely longer than the minimum threshold of sixty characters easily.' } },
      { type: 'b', title: 'B', content: { content: 'Short.\n\nAnother different long paragraph that is definitely longer than the minimum threshold of sixty characters easily.' } },
    ];
    const findings = auditSections(sections, { minLength: 60 });
    // 'Short.' is below minLength, so it should not be flagged
    expect(findings.some((f) => f.preview.includes('Short.'))).toBe(false);
  });

  test('first occurrence is treated as source', () => {
    const para = 'Unique paragraph about astrology and the stars that reveals deep cosmic truths about your inner nature and destiny.';
    const sections = [
      { type: 'a', title: 'First', content: { content: para } },
      { type: 'b', title: 'Second', content: { content: para } },
      { type: 'c', title: 'Third', content: { content: para } },
    ];
    const findings = auditSections(sections);
    expect(findings).toHaveLength(2);
    expect(findings[0].sourceSectionTitle).toBe('First');
    expect(findings[1].sourceSectionTitle).toBe('First');
  });

  test('returns empty array when no duplicates', () => {
    const sections = [
      { type: 'a', title: 'A', content: { content: 'The moon waxes full in Cancer, bringing emotional depth and nurturing energy to your relationships.' } },
      { type: 'b', title: 'B', content: { content: 'Mars transits your tenth house, igniting ambition and drive in your professional life right now.' } },
    ];
    expect(auditSections(sections)).toEqual([]);
  });
});

describe('deduplicateSections', () => {
  test('removes exact duplicates from later sections', () => {
    const para = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally.';
    const sections = [
      { type: 'birth_chart', title: 'Birth Chart', content: { content: `First paragraph.\n\n${para}` } },
      { type: 'compatibility', title: 'Compatibility', content: { content: para } },
    ];
    const cleaned = deduplicateSections(sections);
    expect(getSectionText(cleaned[0])).toBe(getSectionText(sections[0]));
    expect(getSectionText(cleaned[1])).toBe(''); // entire content removed
  });

  test('removes near-duplicates from later sections', () => {
    const a = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally.';
    const b = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally in every situation.';
    const sections = [
      { type: 'birth_chart', title: 'Birth Chart', content: { content: a } },
      { type: 'compatibility', title: 'Compatibility', content: { content: b } },
    ];
    const cleaned = deduplicateSections(sections);
    expect(getSectionText(cleaned[0])).toContain('radiant personality');
    expect(getSectionText(cleaned[1])).toBe('');
  });

  test('preserves short paragraphs even if identical', () => {
    const sections = [
      { type: 'a', title: 'A', content: { content: 'Short intro.\n\nLong paragraph that exceeds the minimum length threshold easily for testing purposes.' } },
      { type: 'b', title: 'B', content: { content: 'Short intro.\n\nDifferent long paragraph that also exceeds the minimum length threshold easily for testing purposes.' } },
    ];
    const cleaned = deduplicateSections(sections, { minLength: 60 });
    // 'Short intro.' is below minLength, so it stays in both
    expect(getSectionText(cleaned[0])).toContain('Short intro.');
    expect(getSectionText(cleaned[1])).toContain('Short intro.');
  });

  test('skips sections in skipTypes', () => {
    const para = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally.';
    const sections = [
      { type: 'birth_chart', title: 'Birth Chart', content: { content: para } },
      { type: 'closing', title: 'Closing', content: { content: para } },
    ];
    const cleaned = deduplicateSections(sections, { skipTypes: ['closing'] });
    expect(getSectionText(cleaned[0])).toBe(para);
    expect(getSectionText(cleaned[1])).toBe(para);
  });

  test('preserves paragraphs that differ in length too much', () => {
    const sections = [
      { type: 'a', title: 'A', content: { content: 'Your sun in Leo gives you natural leadership and a radiant personality.' } },
      {
        type: 'b',
        title: 'B',
        content: {
          content:
            'Your sun in Leo gives you natural leadership and a radiant personality. In relationships, this creates a dynamic where you naturally take charge and inspire others. Your creative energy is boundless and attracts many admirers.',
        },
      },
    ];
    const cleaned = deduplicateSections(sections);
    // The second paragraph is much longer, so it should be preserved
    expect(getSectionText(cleaned[1])).toContain('relationships');
  });

  test('handles string content directly', () => {
    const para = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally.';
    const sections = [
      { type: 'a', title: 'A', content: para },
      { type: 'b', title: 'B', content: para },
    ];
    const cleaned = deduplicateSections(sections);
    expect(typeof cleaned[0].content).toBe('string');
    expect(typeof cleaned[1].content).toBe('string');
    expect(cleaned[1].content).toBe('');
  });

  test('preserves original section metadata', () => {
    const para = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally.';
    const sections = [
      { type: 'a', title: 'A', extra: 'meta', content: { content: para } },
      { type: 'b', title: 'B', extra: 'data', content: { content: para } },
    ];
    const cleaned = deduplicateSections(sections);
    expect(cleaned[0].extra).toBe('meta');
    expect(cleaned[1].extra).toBe('data');
  });

  test('does not mutate original sections', () => {
    const para = 'Your sun in Leo gives you natural leadership and a radiant personality that draws others to you naturally.';
    const sections = [
      { type: 'a', title: 'A', content: { content: para } },
      { type: 'b', title: 'B', content: { content: para } },
    ];
    const originalText = getSectionText(sections[1]);
    deduplicateSections(sections);
    expect(getSectionText(sections[1])).toBe(originalText);
  });
});
