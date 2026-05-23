/**
 * Unit tests for template artifact scrubbing
 */
jest.mock('../../lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { scrubTemplateArtifacts } = require('../../lib/template-scrub.js');

describe('scrubTemplateArtifacts', () => {
  describe('no-data fallback patterns', () => {
    it('should remove "No future transits were provided"', () => {
      const result = scrubTemplateArtifacts('Some content. No future transits were provided. More content.');
      expect(result).toBe('Some content. More content.');
    });

    it('should remove "No transits were provided"', () => {
      const result = scrubTemplateArtifacts('Text. No transits were provided. End.');
      expect(result).toBe('Text. End.');
    });

    it('should remove "No data were provided"', () => {
      const result = scrubTemplateArtifacts('No data were provided.');
      expect(result).toBe('');
    });

    it('should remove "No data available"', () => {
      const result = scrubTemplateArtifacts('No data available');
      expect(result).toBe('');
    });

    it('should remove "No information was found"', () => {
      const result = scrubTemplateArtifacts('No information was found for this section.');
      expect(result).toBe('for this section.');
    });

    it('should remove "No results were found"', () => {
      const result = scrubTemplateArtifacts('No results were found.');
      expect(result).toBe('');
    });

    it('should remove "No content were provided"', () => {
      const result = scrubTemplateArtifacts('No content were provided');
      expect(result).toBe('');
    });

    it('should be case-insensitive for no-data patterns', () => {
      const result = scrubTemplateArtifacts('NO FUTURE TRANSITS WERE PROVIDED');
      expect(result).toBe('');
    });

    it('should remove "No future transits calculated" (exact prompt fallback)', () => {
      const result = scrubTemplateArtifacts('Some text. No future transits calculated.');
      expect(result).toBe('Some text.');
    });

    it('should remove "No transits calculated" without "future"', () => {
      const result = scrubTemplateArtifacts('No transits calculated.');
      expect(result).toBe('');
    });

    it('should remove "No future transits available"', () => {
      const result = scrubTemplateArtifacts('No future transits available');
      expect(result).toBe('');
    });

    it('should remove "No future transits found"', () => {
      const result = scrubTemplateArtifacts('No future transits found.');
      expect(result).toBe('');
    });

    it('should remove "No future transits scheduled"', () => {
      const result = scrubTemplateArtifacts('No future transits scheduled.');
      expect(result).toBe('');
    });

    it('should remove "No major aspects provided"', () => {
      const result = scrubTemplateArtifacts('No major aspects provided.');
      expect(result).toBe('');
    });

    it('should remove "No specific transits provided"', () => {
      const result = scrubTemplateArtifacts('No specific transits provided');
      expect(result).toBe('');
    });

    it('should remove "Given the lack of specific transits..."', () => {
      const result = scrubTemplateArtifacts('Given the lack of specific transits, I will provide a general forecast.');
      expect(result).toBe('');
    });

    it('should remove "Not available"', () => {
      const result = scrubTemplateArtifacts('Transits to Natal Points: Not available');
      expect(result).toBe('Transits to Natal Points:');
    });
  });

  describe('template syntax', () => {
    it('should remove double-brace placeholders {{variable}}', () => {
      const result = scrubTemplateArtifacts('Hello {{userName}}, your sign is {{sunSign}}.');
      expect(result).toBe('Hello , your sign is .');
    });

    it('should remove triple-brace placeholders {{{variable}}}', () => {
      const result = scrubTemplateArtifacts('{{{chartSvg}}}');
      expect(result).toBe('');
    });

    it('should remove template section markers {{#section}}', () => {
      const result = scrubTemplateArtifacts('{{#birthChart}}{{/birthChart}}');
      expect(result).toBe('');
    });

    it('should remove {% ... %} template tags', () => {
      const result = scrubTemplateArtifacts('{% for item in items %}{% endfor %}');
      expect(result).toBe('');
    });

    it('should remove {# ... #} comment markers', () => {
      const result = scrubTemplateArtifacts('{# This is a comment #}');
      expect(result).toBe('');
    });

    it('should handle nested template pattern references', () => {
      const result = scrubTemplateArtifacts('{{data.user.name}} and {{{data.partner.name}}}');
      expect(result).toBe('and');
    });
  });

  describe('scaffolding patterns', () => {
    it('should remove [Auto-generated] markers', () => {
      const result = scrubTemplateArtifacts('[Auto-generated] This content was auto-generated.');
      expect(result).toBe('');
    });

    it('should remove "This content was generated by AI"', () => {
      const result = scrubTemplateArtifacts('This content was generated by AI.');
      expect(result).toBe('');
    });

    it('should remove "This report was generated using AI"', () => {
      const result = scrubTemplateArtifacts('This report was generated using AI.');
      expect(result).toBe('This report was');
    });

    it('should remove "Generated by OpenAI"', () => {
      const result = scrubTemplateArtifacts('Generated by OpenAI.');
      expect(result).toBe('');
    });

    it('should remove "[insert content here]" placeholders', () => {
      const result = scrubTemplateArtifacts('[insert content here]');
      expect(result).toBe('');
    });

    it('should remove "[insert data here]" placeholders', () => {
      const result = scrubTemplateArtifacts('[insert data here]');
      expect(result).toBe('');
    });

    it('should remove "TODO:" markers', () => {
      const result = scrubTemplateArtifacts('TODO: add real content here');
      expect(result).toBe('add real content here');
    });
  });

  describe('preservation', () => {
    it('should preserve normal text', () => {
      const result = scrubTemplateArtifacts('Your sun sign is Leo and your moon is in Pisces.');
      expect(result).toBe('Your sun sign is Leo and your moon is in Pisces.');
    });

    it('should preserve markdown formatting', () => {
      const input = '## Heading\n\n**bold text** and *italic*';
      expect(scrubTemplateArtifacts(input)).toBe(input);
    });

    it('should preserve list items', () => {
      const input = '- Item one\n- Item two\n- Item three';
      expect(scrubTemplateArtifacts(input)).toBe(input);
    });

    it('should preserve numbered lists', () => {
      const input = '1. First\n2. Second\n3. Third';
      expect(scrubTemplateArtifacts(input)).toBe(input);
    });
  });

  describe('whitespace cleanup', () => {
    it('should collapse excessive newlines', () => {
      const input = 'Line one.\n\n\n\nLine two.';
      expect(scrubTemplateArtifacts(input)).toBe('Line one.\n\nLine two.');
    });

    it('should trim leading/trailing whitespace', () => {
      const result = scrubTemplateArtifacts('  \n  content  \n  ');
      expect(result).toBe('content');
    });
  });

  describe('edge cases', () => {
    it('should handle null input', () => {
      expect(scrubTemplateArtifacts(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(scrubTemplateArtifacts(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(scrubTemplateArtifacts('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(scrubTemplateArtifacts(123)).toBe('');
    });

    it('should handle text with only template syntax', () => {
      const result = scrubTemplateArtifacts('{{placeholder}}');
      expect(result).toBe('');
    });

    it('should handle text with only no-data patterns', () => {
      const result = scrubTemplateArtifacts('No data available');
      expect(result).toBe('');
    });
  });

  describe('integration scenarios', () => {
    it('should scrub a realistic report section with mixed artifacts', () => {
      const input = `## Transit Forecast

[Auto-generated] This content was generated by AI.

The stars are aligning for new opportunities. Mars enters your 10th house.

{{#each transits}}
  {{planet}} {{aspect}} {{house}}
{{/each}}

No future transits calculated.

  In spiritual harmony,
  Cosmic Spirit Guide`;

      const result = scrubTemplateArtifacts(input);
      expect(result).not.toContain('{{planet}}');
      expect(result).not.toContain('No future transits calculated');
      expect(result).not.toContain('[Auto-generated]');
      expect(result).toContain('The stars are aligning');
      expect(result).toContain('In spiritual harmony');
      expect(result).toContain('Cosmic Spirit Guide');
    });

    it('should scrub a realistic birth chart with template syntax', () => {
      const input = `## Core Identity

Your Sun in Leo makes you a natural leader. You shine in the spotlight.

Generated by AI.

{{userName}} - {{sunSign}} in the {{house}} house

No additional data were provided.`;

      const result = scrubTemplateArtifacts(input);
      expect(result).not.toContain('{{userName}}');
      expect(result).not.toContain('Generated by AI');
      expect(result).not.toContain('No additional data were provided');
      expect(result).toContain('Your Sun in Leo');
    });

    it('should leave clean content untouched', () => {
      const input = `## Karmic Insights

Your North Node in Sagittarius calls you to explore truth and meaning.

This lifetime is about expanding your horizons and embracing wisdom.

In spiritual harmony,
Cosmic Spirit Guide`;

      expect(scrubTemplateArtifacts(input)).toBe(input);
    });
  });
});
