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

console.log('🧪 Testing renderFromTemplate function\n');

// Test 1: HTML template format
console.log('📝 Test 1: HTML template format');
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
  console.log('✅ HTML template rendered successfully');
  console.log(`   Length: ${htmlResult.length} characters`);
  console.log(`   Contains userName: ${htmlResult.includes('John Doe')}`);
  console.log(`   Contains full HTML structure: ${htmlResult.includes('<!doctype html>')}`);
  console.log(`   Contains styles: ${htmlResult.includes('<style>')}`);
  console.log('');
} catch (error) {
  console.error('❌ HTML template test failed:', error.message);
  console.error(error);
  console.log('');
}

// Test 2: Layout blocks format
console.log('📝 Test 2: Layout blocks format');
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
  console.log('✅ Layout blocks template rendered successfully');
  console.log(`   Length: ${layoutResult.length} characters`);
  console.log(`   Contains userName: ${layoutResult.includes('John Doe')}`);
  console.log(`   Contains SVG: ${layoutResult.includes('<svg xmlns')}`);
  console.log(`   Contains image: ${layoutResult.includes('Leo.png')}`);
  console.log(`   Contains custom styles: ${layoutResult.includes('.forecast')}`);
  console.log('');
} catch (error) {
  console.error('❌ Layout blocks test failed:', error.message);
  console.error(error);
  console.log('');
}

// Test 3: Sample template from file
console.log('📝 Test 3: Sample template from file');
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
  console.log('✅ File template rendered successfully');
  console.log(`   Length: ${fileResult.length} characters`);
  console.log(`   Contains flattened fields: ${fileResult.includes('userName') || fileResult.includes('userSunSign')}`);
  console.log('');
} catch (error) {
  console.error('❌ File template test failed:', error.message);
  console.error(error);
  console.log('');
}

// Test 4: Error handling
console.log('📝 Test 4: Error handling');
try {
  const invalidTemplate = { unknown: 'format' };
  renderFromTemplate(invalidTemplate, sampleData);
  console.error('❌ Should have thrown error for invalid template');
} catch (error) {
  console.log('✅ Correctly threw error for invalid template format');
  console.log(`   Error message: ${error.message}`);
  console.log('');
}

console.log('✨ All tests completed!');

