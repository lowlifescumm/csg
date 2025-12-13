/**
 * Convert HTML template file to JSON format for database seeding
 * 
 * Usage: node scripts/convert-template.js
 * 
 * Reads: docs/mrpt12_11.html (or root mrpt12_11.html)
 * Outputs: master-template.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple possible locations for the HTML file
const possiblePaths = [
  join(__dirname, '../docs/mrpt12_11.html'),
  join(__dirname, '../mrpt12_11.html'),
  join(__dirname, '../../mrpt12_11.html'),
];

let htmlContent = null;
let htmlPath = null;

// Find the file
for (const path of possiblePaths) {
  try {
    htmlContent = readFileSync(path, 'utf8');
    htmlPath = path;
    console.log(`✅ Found template file at: ${path}`);
    break;
  } catch (error) {
    // File not found at this path, try next
    continue;
  }
}

if (!htmlContent) {
  console.error('❌ Error: Could not find mrpt12_11.html in any of these locations:');
  possiblePaths.forEach(p => console.error(`   - ${p}`));
  process.exit(1);
}

// Create JSON structure
const templateJson = {
  id: "MASTER_REPORT_V1",
  type: "MASTER",
  html: htmlContent
};

// Write to master-template.json in the root directory
const outputPath = join(__dirname, '../master-template.json');
writeFileSync(outputPath, JSON.stringify(templateJson, null, 2), 'utf8');

console.log(`\n✅ Successfully converted template!`);
console.log(`   Input: ${htmlPath}`);
console.log(`   Output: ${outputPath}`);
console.log(`   HTML size: ${htmlContent.length} characters`);
console.log(`   JSON size: ${JSON.stringify(templateJson).length} bytes`);
console.log(`\n📋 Template structure:`);
console.log(`   - ID: ${templateJson.id}`);
console.log(`   - Type: ${templateJson.type}`);
console.log(`   - HTML: ${htmlContent.split('\n').length} lines`);

