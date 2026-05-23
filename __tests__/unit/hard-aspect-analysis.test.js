/**
 * Hard Aspect Analysis in Shadow Work Module (GSTA-301)
 *
 * Tests the getHardAspects() and buildHardAspectAnalysisText() utilities,
 * and verifies getKarmicReadingPrompt() includes the full chart-wide hard
 * aspect analysis in the generated prompt.
 */

import {
  getKarmicReadingPrompt,
  getPromptByType,
} from '@/lib/report-prompts';

// ---------------------------------------------------------------------------
// Access the un-exported utilities by importing the module's internals
// Since they're not exported, we test them through getKarmicReadingPrompt()
// which is the public API that uses them.
// ---------------------------------------------------------------------------

function countOccurrences(text, pattern) {
  return (text.match(new RegExp(pattern, 'gi')) || []).length;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseChartWithHardAspects = {
  aspects: [
    { planet1: 'Sun', planet2: 'Moon', type: 'Square', orb: 5.2 },
    { planet1: 'Mars', planet2: 'Venus', type: 'Opposition', orb: 3.8 },
    { planet1: 'Mercury', planet2: 'Jupiter', type: 'Conjunction', orb: 1.2 },
    { planet1: 'Saturn', planet2: 'Pluto', type: 'Square', orb: 2.1 },
    { planet1: 'Venus', planet2: 'Neptune', type: 'Trine', orb: 2.5 },
    { planet1: 'Sun', planet2: 'Mars', type: 'Conjunction', orb: 4.5 },
  ],
  nodes: {
    north_node: 'Aquarius',
    south_node: 'Leo',
  },
  natalChart: {
    planetSignHouseCombinations: [
      { planet: 'North Node', sign: 'Aquarius', house: 11, houseName: '11th House' },
      { planet: 'South Node', sign: 'Leo', house: 5, houseName: '5th House' },
      { planet: 'Sun', sign: 'Gemini', house: 3, houseName: '3rd House' },
      { planet: 'Moon', sign: 'Virgo', house: 6, houseName: '6th House' },
      { planet: 'Mars', sign: 'Leo', house: 5, houseName: '5th House' },
      { planet: 'Venus', sign: 'Cancer', house: 4, houseName: '4th House' },
      { planet: 'Mercury', sign: 'Gemini', house: 3, houseName: '3rd House' },
      { planet: 'Jupiter', sign: 'Capricorn', house: 10, houseName: '10th House' },
      { planet: 'Saturn', sign: 'Capricorn', house: 10, houseName: '10th House' },
      { planet: 'Pluto', sign: 'Scorpio', house: 8, houseName: '8th House' },
    ],
    aspects: [
      { planet1: 'Sun', planet2: 'Moon', type: 'Square', orb: 5.2 },
      { planet1: 'Mars', planet2: 'Venus', type: 'Opposition', orb: 3.8 },
      { planet1: 'Mercury', planet2: 'Jupiter', type: 'Conjunction', orb: 1.2 },
      { planet1: 'Saturn', planet2: 'Pluto', type: 'Square', orb: 2.1 },
      { planet1: 'Venus', planet2: 'Neptune', type: 'Trine', orb: 2.5 },
      { planet1: 'Sun', planet2: 'Mars', type: 'Conjunction', orb: 4.5 },
    ],
  },
};

const chartWithNodeAspectsOnly = {
  aspects: [
    { planet1: 'Mars', planet2: 'North Node', type: 'Square', orb: 2.1 },
    { planet1: 'Saturn', planet2: 'South Node', type: 'Opposition', orb: 1.5 },
  ],
  nodes: {
    north_node: 'Aquarius',
    south_node: 'Leo',
  },
  natalChart: {
    planetSignHouseCombinations: [
      { planet: 'North Node', sign: 'Aquarius', house: 11, houseName: '11th House' },
      { planet: 'South Node', sign: 'Leo', house: 5, houseName: '5th House' },
    ],
    aspects: [
      { planet1: 'Mars', planet2: 'North Node', type: 'Square', orb: 2.1 },
      { planet1: 'Saturn', planet2: 'South Node', type: 'Opposition', orb: 1.5 },
    ],
  },
};

const chartWithNoHardAspects = {
  aspects: [
    { planet1: 'Sun', planet2: 'Moon', type: 'Trine', orb: 2.5 },
    { planet1: 'Venus', planet2: 'Jupiter', type: 'Sextile', orb: 1.8 },
  ],
  nodes: {
    north_node: 'Aquarius',
    south_node: 'Leo',
  },
  natalChart: {
    planetSignHouseCombinations: [
      { planet: 'North Node', sign: 'Aquarius', house: 11, houseName: '11th House' },
      { planet: 'South Node', sign: 'Leo', house: 5, houseName: '5th House' },
    ],
    aspects: [
      { planet1: 'Sun', planet2: 'Moon', type: 'Trine', orb: 2.5 },
      { planet1: 'Venus', planet2: 'Jupiter', type: 'Sextile', orb: 1.8 },
    ],
  },
};

const chartWithEmptyAspects = {
  aspects: [],
  nodes: {
    north_node: 'Aquarius',
    south_node: 'Leo',
  },
  natalChart: {
    planetSignHouseCombinations: [
      { planet: 'North Node', sign: 'Aquarius', house: 11, houseName: '11th House' },
      { planet: 'South Node', sign: 'Leo', house: 5, houseName: '5th House' },
    ],
    aspects: [],
  },
};

const chartWithTightConjunctions = {
  aspects: [
    { planet1: 'Mercury', planet2: 'Venus', type: 'Conjunction', orb: 0.8 },
    { planet1: 'Sun', planet2: 'Mercury', type: 'Conjunction', orb: 2.1 },
    { planet1: 'Mars', planet2: 'Jupiter', type: 'Conjunction', orb: 3.5 },
  ],
  nodes: {
    north_node: 'Aries',
    south_node: 'Libra',
  },
  natalChart: {
    planetSignHouseCombinations: [
      { planet: 'North Node', sign: 'Aries', house: 1, houseName: '1st House' },
      { planet: 'South Node', sign: 'Libra', house: 7, houseName: '7th House' },
    ],
    aspects: [
      { planet1: 'Mercury', planet2: 'Venus', type: 'Conjunction', orb: 0.8 },
      { planet1: 'Sun', planet2: 'Mercury', type: 'Conjunction', orb: 2.1 },
      { planet1: 'Mars', planet2: 'Jupiter', type: 'Conjunction', orb: 3.5 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Hard Aspect Analysis — getKarmicReadingPrompt', () => {

  // -----------------------------------------------------------------------
  // Full hard aspect analysis present in prompt
  // -----------------------------------------------------------------------
  test('includes Hard Aspect Analysis section when chart has Squares, Oppositions, tight Conjunctions', () => {
    const prompt = getKarmicReadingPrompt(baseChartWithHardAspects);

    // Should contain the full hard aspect analysis block
    expect(prompt).toContain('Full Hard Aspect Analysis (Chart-Wide)');

    // Should contain each hard aspect type heading
    expect(prompt).toContain('Squares (Internal Tension & Growth Edges)');
    expect(prompt).toContain('Oppositions (Polarity & Relationship Dynamics)');
    expect(prompt).toContain('Tight Conjunctions (Intensified Archetypal Fusion)');

    // Should list each hard aspect with orb
    expect(prompt).toContain('Sun Square Moon (Orb 5.2°)');
    expect(prompt).toContain('Mars Opposition Venus (Orb 3.8°)');
    expect(prompt).toContain('Mercury Conjunction Jupiter (Orb 1.2°)');
    expect(prompt).toContain('Saturn Square Pluto (Orb 2.1°)');

    // Should NOT include easy aspects (Trine, Sextile, wide Conjunctions)
    expect(prompt).not.toContain('Venus Trine Neptune');
    expect(prompt).not.toContain('Sun Conjunction Mars');

    // Should include house context for planets
    expect(prompt).toContain('Sun in the 3rd House');
    expect(prompt).toContain('Moon in the 6th House');
    expect(prompt).toContain('Mars in the 5th House');
    expect(prompt).toContain('Venus in the 4th House');

    // Should include the "Shadow Patterns from Hard Aspects" instruction
    expect(prompt).toContain('Shadow Patterns from Hard Aspects');

    // Should include the "Hard Aspect Shadow Patterns" structure section
    expect(prompt).toContain('Hard Aspect Shadow Patterns');

    // Shadow work exercises should reference hard aspects
    expect(prompt).toContain('Address the chart-wide hard aspects and their shadow patterns');
  });

  test('lists Node-related challenging aspects in addition to full hard aspects', () => {
    const prompt = getKarmicReadingPrompt(baseChartWithHardAspects);

    // Should still contain the existing Karmic Challenge Aspects section
    expect(prompt).toContain('Karmic Challenge Aspects (Node-Related):');

    // Full hard aspect analysis is separate from the Node-specific section
    const challengeSection = prompt.indexOf('Karmic Challenge Aspects (Node-Related):');
    const hardSection = prompt.indexOf('Full Hard Aspect Analysis (Chart-Wide)');

    // Both sections exist
    expect(challengeSection).toBeGreaterThanOrEqual(0);
    expect(hardSection).toBeGreaterThanOrEqual(0);
  });

  // -----------------------------------------------------------------------
  // Chart with only Node aspects (no additional hard aspects)
  // -----------------------------------------------------------------------
  test('includes Hard Aspect Analysis for Node-only hard aspects', () => {
    const prompt = getKarmicReadingPrompt(chartWithNodeAspectsOnly);

    // Should include hard aspect analysis (Node aspects ARE hard aspects)
    expect(prompt).toContain('Full Hard Aspect Analysis (Chart-Wide)');

    // Should list the Node-related hard aspects
    expect(prompt).toContain('Mars Square North Node (Orb 2.1°)');
    expect(prompt).toContain('Saturn Opposition South Node (Orb 1.5°)');

    // Should include the instruction and structure section
    expect(prompt).toContain('Shadow Patterns from Hard Aspects');
    expect(prompt).toContain('Hard Aspect Shadow Patterns');
  });

  // -----------------------------------------------------------------------
  // Chart with no hard aspects (only Trines, Sextiles, wide Conjunctions)
  // -----------------------------------------------------------------------
  test('omits Hard Aspect Analysis when no hard aspects exist', () => {
    const prompt = getKarmicReadingPrompt(chartWithNoHardAspects);

    // Should NOT include the full hard aspect analysis block
    expect(prompt).not.toContain('Full Hard Aspect Analysis (Chart-Wide)');

    // Should NOT include the hard aspect structure section
    expect(prompt).not.toContain('Hard Aspect Shadow Patterns');

    // Should NOT include the "address chart-wide hard aspects" in exercises
    expect(prompt).not.toContain('Address the chart-wide hard aspects and their shadow patterns');

    // Should still contain the base karmic reading structure
    expect(prompt).toContain('Karmic Challenge Aspects (Node-Related):');
    expect(prompt).toContain('No challenging aspects identified');
    expect(prompt).toContain('Understanding Your Nodal Axis');
    expect(prompt).toContain('The Core Karmic Lesson');
    expect(prompt).toContain('Emotional Patterns to Break');
    expect(prompt).toContain('3-5 Practical Shadow Work Exercises');
  });

  // -----------------------------------------------------------------------
  // Empty aspects array
  // -----------------------------------------------------------------------
  test('handles empty aspects array without error', () => {
    const prompt = getKarmicReadingPrompt(chartWithEmptyAspects);

    // Should not error, should return valid prompt
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);

    // Should not include hard aspect analysis
    expect(prompt).not.toContain('Full Hard Aspect Analysis (Chart-Wide)');

    // Should still have the basic karmic structure
    expect(prompt).toContain('Understanding Your Nodal Axis');
    expect(prompt).toContain('The Core Karmic Lesson');
    expect(prompt).toContain('3-5 Practical Shadow Work Exercises');
  });

  // -----------------------------------------------------------------------
  // Tight Conjunctions only (orb < 3° vs orb >= 3°)
  // -----------------------------------------------------------------------
  test('includes tight Conjunctions (orb < 3°) but excludes wide Conjunctions (orb >= 3°)', () => {
    const prompt = getKarmicReadingPrompt(chartWithTightConjunctions);

    // Should include tight conjunctions (Mercury-Venus orb 0.8, Sun-Mercury orb 2.1)
    expect(prompt).toContain('Tight Conjunctions (Intensified Archetypal Fusion)');
    expect(prompt).toContain('Mercury Conjunction Venus (Orb 0.8°)');
    expect(prompt).toContain('Sun Conjunction Mercury (Orb 2.1°)');

    // Should NOT include Mars-Jupiter Conjunction with orb 3.5° (>= 3°)
    expect(prompt).not.toContain('Mars Conjunction Jupiter (Orb 3.5°)');
  });

  // -----------------------------------------------------------------------
  // Prompt routing via getPromptByType
  // -----------------------------------------------------------------------
  test('getPromptByType routes shadow_work to getKarmicReadingPrompt', () => {
    const prompt = getPromptByType('shadow_work', baseChartWithHardAspects);
    expect(prompt).toContain('Full Hard Aspect Analysis (Chart-Wide)');
    expect(prompt).toContain('Sun Square Moon');

    // karmic_reading should also route here
    const karmicPrompt = getPromptByType('karmic_reading', baseChartWithHardAspects);
    expect(karmicPrompt).toContain('Full Hard Aspect Analysis (Chart-Wide)');
  });

  // -----------------------------------------------------------------------
  // Aspect formatting consistency
  // -----------------------------------------------------------------------
  test('correctly counts hard aspects in the summary', () => {
    const prompt = getKarmicReadingPrompt(baseChartWithHardAspects);

    // Should have 2 Squares, 1 Opposition, 1 tight Conjunction
    expect(prompt).toContain('The following');

    const squareCount = countOccurrences(prompt, 'Square');
    const oppositionCount = countOccurrences(prompt, 'Opposition');
    const tightConjunctionCount = countOccurrences(prompt, 'Tight Conjunctions');

    // At least 2 squares mentioned in the hard aspect analysis (not counting headings)
    expect(squareCount).toBeGreaterThanOrEqual(3); // heading + 2 aspects
    expect(oppositionCount).toBeGreaterThanOrEqual(2); // heading + 1 aspect
  });

  // -----------------------------------------------------------------------
  // Prompts without Node-related challenging aspects
  // -----------------------------------------------------------------------
  test('includes hard aspect analysis even when no Node-related aspects exist', () => {
    const chartWithHardButNoNodeAspects = {
      aspects: [
        { planet1: 'Sun', planet2: 'Moon', type: 'Square', orb: 4.1 },
      ],
      nodes: {
        north_node: 'Pisces',
        south_node: 'Virgo',
      },
      natalChart: {
        planetSignHouseCombinations: [
          { planet: 'North Node', sign: 'Pisces', house: 12, houseName: '12th House' },
          { planet: 'South Node', sign: 'Virgo', house: 6, houseName: '6th House' },
        ],
        aspects: [
          { planet1: 'Sun', planet2: 'Moon', type: 'Square', orb: 4.1 },
        ],
      },
    };

    const prompt = getKarmicReadingPrompt(chartWithHardButNoNodeAspects);

    // Karmic challenge aspects shows "no challenging aspects" (no Node aspects)
    expect(prompt).toContain('No challenging aspects identified');

    // But full hard aspect analysis still captures Sun Square Moon
    expect(prompt).toContain('Full Hard Aspect Analysis (Chart-Wide)');
    expect(prompt).toContain('Sun Square Moon (Orb 4.1°)');
    expect(prompt).toContain('Squares (Internal Tension & Growth Edges)');
  });
});
