#!/usr/bin/env node
/**
 * migrate-to-groq.js
 * Migrates CosmicSpiritGuide from OpenAI to Groq API
 * Usage: node migrate-to-groq.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

// Files to migrate
const files = [
  'lib/openai.js',
  'app/api/tarot/route.js',
  'app/api/transits/interpret/route.js',
  'app/api/coach/daily/route.js',
  'app/api/readings/create/route.js',
  'app/api/readings/generate/route.js',
  'lib/forecast-engine.js',
  'lib/transit-interpretation.js',
  'lib/horoscope.js',
  'lib/job-processors-extended.js',
  'lib/pdf-generator.js',
];

let changed = 0;
let errors = [];

files.forEach(file => {
  const fullPath = path.join('/home/ethan/.openclaw/workspace/cosmicspiritguide', file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  SKIP: ${file} (not found)`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const original = content;
    
    // Replace import statements
    content = content.replace(
      /from\s+['"]@\/lib\/openai['"]/g,
      "from @/lib/groq"
    );
    
    content = content.replace(
      /import\s+\{[^}]*\}\s+from\s+['"]\.\.\/openai\.js['"]/g,
      (match) => match.replace('openai.js', 'groq.js')
    );
    
    content = content.replace(
      /import\s+\{[^}]*\}\s+from\s+['"]\.\.\.\/openai\.js['"]/g,
      (match) => match.replace('openai.js', 'groq.js')
    );
    
    content = content.replace(
      /import\s+OpenAI\s+from\s+['"]openai['"]/g,
      "import Groq from 'groq-sdk'"
    );
    
    content = content.replace(
      /import\s+OpenAI\s+from\s+['"]\.\.\/openai\.js['"]/g,
      "import Groq from 'groq-sdk'"
    );
    
    content = content.replace(
      /import\s+\{[^}]*\}\s+from\s+['"]openai['"]/g,
      "import Groq from 'groq-sdk'"
    );
    
    // Replace client instantiation
    content = content.replace(
      /new\s+OpenAI\(\{[^}]*\}\)/g,
      "new Groq({ apiKey: process.env.GROQ_API_KEY })"
    );
    
    content = content.replace(
      /new\s+OpenAI\s*\(\s*\{[^}]*apiKey[^}]*\}\s*\)/g,
      "new Groq({ apiKey: process.env.GROQ_API_KEY })"
    );
    
    if (content !== original) {
      changed++;
      if (DRY_RUN) {
        console.log(`🔍 WOULD UPDATE: ${file}`);
      } else {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ UPDATED: ${file}`);
      }
    } else {
      console.log(`⏭️  NO CHANGE: ${file}`);
    }
  } catch (err) {
    errors.push({ file, error: err.message });
    console.log(`❌ ERROR: ${file} - ${err.message}`);
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Migration Summary:`);
console.log(`  Files changed: ${changed}`);
console.log(`  Errors: ${errors.length}`);
console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
console.log(`${'='.repeat(50)}`);

if (errors.length > 0) {
  console.log('\n⚠️  Some files had errors. Check logs above.');
  process.exit(1);
}

console.log('\n✅ Migration complete!');
console.log('\nNext steps:');
console.log('  1. Add GROQ_API_KEY to .env or Render dashboard');
console.log('  2. Test the tarot readings still work');
console.log('  3. Monitor costs (should be ~90% cheaper)');
