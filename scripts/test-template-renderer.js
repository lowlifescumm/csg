const logger = require('./lib/logger');
/**
 * Test script for renderFromTemplate function
 * Usage: node scripts/test-template-renderer.js
 */

import { renderFromTemplate } from '../lib/template-renderer.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sample data
const sampleData = {
  userName: 'John Doe',
  userSunSign: 'Leo',
  section1Title: 'Birth Chart Analysis',
  section1Content: 'Your birth chart reveals strong leadership qualities and a natural ability to inspire others. The placement of your Sun in Leo indicates...',
  generatedAt: 'January 15, 2025',
  chartSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="80" fill="none" stroke="#000" stroke-width="2"/><text x="100" y="105" text-anchor="middle" font-size="16">Chart</text></svg>',
  forecastText: 'The stars align for new opportunities this month. Your natural leadership abilities will be called upon.',
};

logger.info('🧪 Testing renderFromTemplate function\n');

// Test 1: HTML template format
logger.info('📝 Test 1: HTML template format');
const htmlTemplate = {
  html: `
    <h1>Welcome, {{userName}}!</h1>
    <p>Your sun sign is <strong>{{userSunSign}}</strong>.</p>
    <div class="section">
      <h2>{{section1Title}}</h2>
      <p>{{section1Content}}</p>
    </div>
    <footer>Generated on {{generatedAt}}</footer>
  `,
};

try {
  const htmlResult = renderFromTemplate(htmlTemplate, sampleData);
  logger.info('✅ HTML template rendered successfully');
  logger.info(`   Length: ${htmlResult.length} characters`);
  logger.info(`   Contains userName: ${htmlResult.includes('John Doe')}`);
  logger.info(`   Contains full HTML structure: ${htmlResult.includes('<!doctype html>')}`);
  logger.info(`   Contains styles: ${htmlResult.includes('<style>')}`);
  logger.info('');
} catch (error) {
  logger.error('❌ HTML template test failed:', error.message);
  logger.error(error);
  logger.info('');
}

// Test 2: Layout blocks format
logger.info('📝 Test 2: Layout blocks format');
const layoutTemplate = {
  layout: {
    blocks: [
      {
        type: 'text',
        content: 'Hello, {{userName}}! Your sign is {{userSunSign}}.',
      },
      {
        type: 'text',
        content: '## {{section1Title}}\n\n{{section1Content}}',
      },
      {
        type: 'html',
        html: '<div class="forecast"><p>{{forecastText}}</p></div>',
      },
      {
        type: 'svg',
        svg: '{{chartSvg}}',
      },
      {
        type: 'image',
        src: 'https://example.com/charts/{{userSunSign}}.png',
        alt: 'Chart for {{userName}}',
      },
    ],
  },
  styles: '.forecast { background: #f0f0f0; padding: 1em; }',
};

try {
  const layoutResult = renderFromTemplate(layoutTemplate, sampleData);
  logger.info('✅ Layout blocks template rendered successfully');
  logger.info(`   Length: ${layoutResult.length} characters`);
  logger.info(`   Contains userName: ${layoutResult.includes('John Doe')}`);
  logger.info(`   Contains SVG: ${layoutResult.includes('<svg xmlns')}`);
  logger.info(`   Contains image: ${layoutResult.includes('Leo.png')}`);
  logger.info(`   Contains custom styles: ${layoutResult.includes('.forecast')}`);
  logger.info('');
} catch (error) {
  logger.error('❌ Layout blocks test failed:', error.message);
  logger.error(error);
  logger.info('');
}

// Test 3: Sample template from file
logger.info('📝 Test 3: Sample template from file');
try {
  const templatePath = join(__dirname, 'sample-pdfme-template.json');
  const sampleTemplate = JSON.parse(readFileSync(templatePath, 'utf8'));
  
  // Convert pdfme format to our layout format for testing
  const convertedTemplate = {
    layout: {
      blocks: sampleTemplate.schemas[0].map(field => {
        if (field.type === 'text') {
          return {
            type: 'text',
            content: `{{${field.name}}}`,
            className: `field-${field.name}`,
          };
        }
        return null;
      }).filter(Boolean),
    },
  };
  
  const fileResult = renderFromTemplate(convertedTemplate, sampleData);
  logger.info('✅ File template rendered successfully');
  logger.info(`   Length: ${fileResult.length} characters`);
  logger.info(`   Contains flattened fields: ${fileResult.includes('userName') || fileResult.includes('userSunSign')}`);
  logger.info('');
} catch (error) {
  logger.error('❌ File template test failed:', error.message);
  logger.error(error);
  logger.info('');
}

// Test 4: Error handling
logger.info('📝 Test 4: Error handling');
try {
  const invalidTemplate = { unknown: 'format' };
  renderFromTemplate(invalidTemplate, sampleData);
  logger.error('❌ Should have thrown error for invalid template');
} catch (error) {
  logger.info('✅ Correctly threw error for invalid template format');
  logger.info(`   Error message: ${error.message}`);
  logger.info('');
}

logger.info('✨ All tests completed!');

