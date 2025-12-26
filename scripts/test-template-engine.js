#!/usr/bin/env node

/**
 * Test Script for Template Engine
 * 
 * This script performs automated tests for the template-based PDF generation engine.
 * 
 * Usage:
 *   node scripts/test-template-engine.js <templateId>
 * 
 * Or set environment variables:
 *   TEMPLATE_ID=<uuid> BASE_URL=<url> node scripts/test-template-engine.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEMPLATE_ID = process.env.TEMPLATE_ID || process.argv[2];

if (!TEMPLATE_ID) {
  console.error('❌ Error: Template ID required');
  console.error('Usage: node scripts/test-template-engine.js <templateId>');
  console.error('Or set: TEMPLATE_ID=<id> node scripts/test-template-engine.js');
  process.exit(1);
}

// Sample hydration payload
const samplePayload = {
  name: 'Test User',
  birthDate: '1990-01-01',
  birthTime: '12:00',
  location: 'New York, NY',
  report_type: 'ESSENTIAL',
  data: {
    birth_chart_data: {
      birth_date: '1990-01-01',
      birth_time: '12:00',
      location: 'New York, NY',
    },
  },
};

/**
 * Test 1: Single Report Generation
 */
async function testSingleReport() {
  console.log('\n📋 Test 1: Single Report Generation');
  console.log('─'.repeat(50));
  
  try {
    const url = `${BASE_URL}/api/admin/test-report?engine=template&templateId=${TEMPLATE_ID}`;
    console.log(`POST ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(samplePayload),
    });

    const data = await response.json();
    
    if (response.ok && data.pdfUrl) {
      console.log('✅ Success');
      console.log(`   PDF URL: ${data.pdfUrl}`);
      console.log(`   Engine: ${data.metadata?.engine || 'template'}`);
      console.log(`   Template ID: ${data.metadata?.template_id || TEMPLATE_ID}`);
      return { success: true, pdfUrl: data.pdfUrl, data };
    } else {
      console.error('❌ Failed');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${data.error || JSON.stringify(data)}`);
      return { success: false, error: data.error || 'Unknown error' };
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Puppeteer Engine Still Works
 */
async function testPuppeteerEngine() {
  console.log('\n📋 Test 2: Puppeteer Engine (Backward Compatibility)');
  console.log('─'.repeat(50));
  
  try {
    const url = `${BASE_URL}/api/admin/test-report?engine=puppeteer`;
    console.log(`POST ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(samplePayload),
    });

    const data = await response.json();
    
    if (response.ok && data.pdfUrl) {
      console.log('✅ Success');
      console.log(`   PDF URL: ${data.pdfUrl}`);
      console.log(`   Engine: ${data.metadata?.engine || 'puppeteer'}`);
      return { success: true, pdfUrl: data.pdfUrl };
    } else {
      console.error('❌ Failed');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${data.error || JSON.stringify(data)}`);
      return { success: false, error: data.error || 'Unknown error' };
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Performance Test (Multiple Reports)
 */
async function testPerformance(count = 5) {
  console.log(`\n📋 Test 3: Performance Test (${count} Reports)`);
  console.log('─'.repeat(50));
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 1; i <= count; i++) {
    process.stdout.write(`   Generating report ${i}/${count}... `);
    
    try {
      const url = `${BASE_URL}/api/admin/test-report?engine=template&templateId=${TEMPLATE_ID}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...samplePayload,
          name: `Test User ${i}`,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.pdfUrl) {
        results.push({ success: true, index: i, pdfUrl: data.pdfUrl });
        process.stdout.write('✅\n');
      } else {
        results.push({ success: false, index: i, error: data.error });
        process.stdout.write(`❌ (${data.error})\n`);
      }
    } catch (error) {
      results.push({ success: false, index: i, error: error.message });
      process.stdout.write(`❌ (${error.message})\n`);
    }
    
    // Small delay between requests
    if (i < count) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const successCount = results.filter(r => r.success).length;
  
  console.log(`\n   Summary:`);
  console.log(`   - Total: ${count} reports`);
  console.log(`   - Successful: ${successCount}`);
  console.log(`   - Failed: ${count - successCount}`);
  console.log(`   - Duration: ${duration}s`);
  console.log(`   - Average: ${(duration / count).toFixed(2)}s per report`);
  
  if (successCount === count) {
    console.log('✅ All reports generated successfully');
    return { success: true, results, duration };
  } else {
    console.log('❌ Some reports failed');
    return { success: false, results, duration };
  }
}

/**
 * Test 4: SVG Embedding Test
 */
async function testSVGEmbedding() {
  console.log('\n📋 Test 4: SVG Embedding Test');
  console.log('─'.repeat(50));
  
  try {
    // Test payload with SVG data
    const payloadWithSVG = {
      ...samplePayload,
      matrixChartSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="500"><circle cx="300" cy="250" r="100" fill="purple"/></svg>',
      chartSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="lightblue"/></svg>',
    };
    
    const url = `${BASE_URL}/api/admin/test-report?engine=template&templateId=${TEMPLATE_ID}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadWithSVG),
    });

    const data = await response.json();
    
    if (response.ok && data.pdfUrl) {
      console.log('✅ Report generated with SVG data');
      console.log(`   PDF URL: ${data.pdfUrl}`);
      
      // Check if HTML contains SVG (if returned)
      if (data.html) {
        const hasInlineSVG = data.html.includes('<svg') || data.html.includes('data:image/svg+xml');
        if (hasInlineSVG) {
          console.log('✅ SVG found in generated HTML');
          return { success: true, hasSVG: true, pdfUrl: data.pdfUrl };
        } else {
          console.log('⚠️  Warning: SVG not found in HTML (may be converted to image)');
          return { success: true, hasSVG: false, pdfUrl: data.pdfUrl };
        }
      } else {
        console.log('⚠️  Warning: HTML not returned, cannot verify SVG embedding');
        return { success: true, hasSVG: null, pdfUrl: data.pdfUrl };
      }
    } else {
      console.error('❌ Failed');
      console.error(`   Error: ${data.error || JSON.stringify(data)}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('🧪 Template Engine Test Suite');
  console.log('═'.repeat(50));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Template ID: ${TEMPLATE_ID}`);
  console.log('═'.repeat(50));
  
  const results = {
    singleReport: null,
    puppeteerEngine: null,
    performance: null,
    svgEmbedding: null,
  };
  
  // Test 1: Single Report
  results.singleReport = await testSingleReport();
  
  // Test 2: Puppeteer Engine
  results.puppeteerEngine = await testPuppeteerEngine();
  
  // Test 3: Performance
  results.performance = await testPerformance(5);
  
  // Test 4: SVG Embedding
  results.svgEmbedding = await testSVGEmbedding();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(50));
  
  const allTests = [
    { name: 'Single Report Generation', result: results.singleReport },
    { name: 'Puppeteer Engine (Backward Compatibility)', result: results.puppeteerEngine },
    { name: 'Performance Test (5 reports)', result: results.performance },
    { name: 'SVG Embedding', result: results.svgEmbedding },
  ];
  
  let passed = 0;
  let failed = 0;
  
  allTests.forEach(test => {
    const status = test.result?.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.name}`);
    if (!test.result?.success) {
      console.log(`   Error: ${test.result?.error || 'Unknown'}`);
    }
    if (test.result?.success) passed++;
    else failed++;
  });
  
  console.log('\n' + '═'.repeat(50));
  console.log(`Total: ${allTests.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('═'.repeat(50));
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

