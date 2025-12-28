/**
 * Unit tests for template renderer HTML generation
 */

import { renderFromTemplate } from '../../lib/template-renderer.js';

describe('renderFromTemplate', () => {
  const sampleData = {
    userName: 'John Doe',
    userSunSign: 'Leo',
    section1Title: 'Birth Chart Analysis',
    section1Content: 'Your birth chart reveals strong leadership qualities...',
    generatedAt: 'January 15, 2025',
    chartSvg: '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>',
    forecastText: 'The stars align for new opportunities this month.',
  };

  describe('HTML template format', () => {
    it('should render HTML template with Mustache placeholders', () => {
      const template = {
        html: '<h1>Hello, {{userName}}!</h1><p>Your sun sign is {{userSunSign}}.</p>',
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('Hello, John Doe!');
      expect(result).toContain('Your sun sign is Leo.');
      expect(result).toContain('<!doctype html>');
      expect(result).toContain('<head>');
      expect(result).toContain('<style>');
    });

    it('should wrap partial HTML in full document structure', () => {
      const template = {
        html: '<div>Simple content</div>',
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toMatch(/<!doctype html>/i);
      expect(result).toContain('<html');
      expect(result).toContain('<head>');
      expect(result).toContain('<body>');
      expect(result).toContain('Simple content');
      expect(result).toContain('</body>');
    });

    it('should preserve full HTML documents', () => {
      const fullHtml = `<!doctype html>
<html>
<head><title>Test</title></head>
<body><h1>Hello, {{userName}}!</h1></body>
</html>`;

      const template = { html: fullHtml };
      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('Hello, John Doe!');
      expect(result).toContain('<!doctype html>');
    });

    it('should include inline styles and fonts', () => {
      const template = {
        html: '<p>{{userName}}</p>',
        styles: 'p { color: blue; }',
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('<style>');
      expect(result).toContain('font-family');
      expect(result).toContain('color: blue');
    });
  });

  describe('Layout blocks format', () => {
    it('should render text blocks', () => {
      const template = {
        layout: {
          blocks: [
            {
              type: 'text',
              content: 'Welcome, {{userName}}! Your sign is {{userSunSign}}.',
            },
          ],
        },
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('Welcome, John Doe!');
      expect(result).toContain('Your sign is Leo.');
      expect(result).toContain('<!doctype html>');
      expect(result).toContain('class="text-block"');
    });

    it('should render image blocks', () => {
      const template = {
        layout: {
          blocks: [
            {
              type: 'image',
              src: 'https://example.com/{{userSunSign}}.jpg',
              alt: 'Chart for {{userName}}',
            },
          ],
        },
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('src="https://example.com/Leo.jpg"');
      expect(result).toContain('alt="Chart for John Doe"');
      expect(result).toContain('<img');
      expect(result).toContain('class="image-block"');
    });

    it('should render HTML blocks', () => {
      const template = {
        layout: {
          blocks: [
            {
              type: 'html',
              html: '<div class="forecast"><p>{{forecastText}}</p></div>',
            },
          ],
        },
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('The stars align');
      expect(result).toContain('class="forecast"');
      expect(result).toContain('class="html-block"');
    });

    it('should render SVG blocks', () => {
      const template = {
        layout: {
          blocks: [
            {
              type: 'svg',
              svg: '{{chartSvg}}',
            },
          ],
        },
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('<svg xmlns');
      expect(result).toContain('<circle');
      expect(result).toContain('class="svg-block"');
    });

    it('should handle multiple blocks', () => {
      const template = {
        layout: {
          blocks: [
            { type: 'text', content: 'Title: {{section1Title}}' },
            { type: 'text', content: '{{section1Content}}' },
            { type: 'html', html: '<footer>Generated: {{generatedAt}}</footer>' },
          ],
        },
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('Title: Birth Chart Analysis');
      expect(result).toContain('Your birth chart reveals');
      expect(result).toContain('Generated: January 15, 2025');
    });

    it('should include custom styles from template', () => {
      const template = {
        styles: 'body { background: #f0f0f0; } .custom { color: red; }',
        layout: {
          blocks: [
            { type: 'text', content: 'Test', className: 'custom' },
          ],
        },
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('background: #f0f0f0');
      expect(result).toContain('color: red');
      expect(result).toContain('class="custom"');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing data gracefully', () => {
      const template = {
        html: '<p>Hello, {{userName}}! Your sign is {{missingField}}.</p>',
      };

      const result = renderFromTemplate(template, { userName: 'John' });

      expect(result).toContain('Hello, John!');
      expect(result).toContain('Your sign is .'); // Empty replacement
    });

    it('should handle empty template', () => {
      const template = {
        html: '',
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('<!doctype html>');
      expect(result).toContain('<body>');
    });

    it('should handle nested template_json structure', () => {
      const template = {
        template_json: {
          html: '<p>{{userName}}</p>',
        },
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('John Doe');
    });

    it('should throw error for unrecognized format', () => {
      const template = {
        unknown: 'format',
      };

      expect(() => renderFromTemplate(template, sampleData)).toThrow('Unrecognized template format');
    });

    it('should parse string JSON', () => {
      const templateJson = JSON.stringify({
        html: '<p>{{userName}}</p>',
      });

      const result = renderFromTemplate(templateJson, sampleData);

      expect(result).toContain('John Doe');
    });
  });

  describe('Puppeteer compatibility', () => {
    it('should include all necessary meta tags', () => {
      const template = {
        html: '<p>Test</p>',
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('<meta charset="utf-8">');
      expect(result).toContain('<meta name="viewport"');
    });

    it('should include fonts for consistent rendering', () => {
      const template = {
        html: '<p>Test</p>',
      };

      const result = renderFromTemplate(template, sampleData);

      expect(result).toContain('fonts.googleapis.com');
      expect(result).toContain('font-family');
    });

    it('should have proper document structure', () => {
      const template = {
        html: '<p>Content</p>',
      };

      const result = renderFromTemplate(template, sampleData);

      // Check structure
      const htmlStart = result.indexOf('<!doctype');
      const htmlEnd = result.indexOf('</html>');
      
      expect(htmlStart).toBe(0);
      expect(htmlEnd).toBeGreaterThan(0);
      expect(result).toMatch(/<html[\s>]/i);
      expect(result).toMatch(/<head>.*<\/head>/s);
      expect(result).toMatch(/<body>.*<\/body>/s);
    });
  });
});








