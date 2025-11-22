/**
 * Script to update meditation audio URLs in database with Cloudinary URLs
 * 
 * Usage:
 *   node scripts/update-meditation-audio-urls.mjs
 * 
 * Or provide URLs directly:
 *   node scripts/update-meditation-audio-urls.mjs --urls "morning-clarity=https://res.cloudinary.com/..."
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false }
});

// Map meditation titles to their IDs (from database)
const MEDITATION_MAP = {
  'Morning Clarity': 1,
  'Deep Sleep': 2,
  'Anxiety Relief': 3,
  'Energy Boost': 4,
  'Loving Kindness': 5,
  'Chakra Balance': 6,
  'Quick Reset': 7,
};

/**
 * Get Cloudinary URLs from command line or prompt user
 */
async function getCloudinaryUrls() {
  const args = process.argv.slice(2);
  
  // Check if URLs provided via command line
  if (args.includes('--urls')) {
    const urlsIndex = args.indexOf('--urls');
    const urlsString = args[urlsIndex + 1];
    const urlPairs = urlsString.split(',').map(pair => {
      const [key, url] = pair.split('=');
      return { key: key.trim(), url: url.trim() };
    });
    
    const urlMap = {};
    urlPairs.forEach(({ key, url }) => {
      // Match key to meditation title
      const title = Object.keys(MEDITATION_MAP).find(t => 
        t.toLowerCase().replace(/\s+/g, '-') === key.toLowerCase()
      );
      if (title) {
        urlMap[title] = url;
      }
    });
    
    return urlMap;
  }
  
  // Otherwise, prompt user
  console.log('\n📝 Cloudinary URL Update Script\n');
  console.log('Please provide Cloudinary URLs for each meditation.\n');
  console.log('You can find these URLs in your Cloudinary dashboard:');
  console.log('1. Go to https://cloudinary.com/console');
  console.log('2. Navigate to Media Library');
  console.log('3. Click on each audio file');
  console.log('4. Copy the "URL" or "Secure URL"\n');
  console.log('Cloudinary URLs typically look like:');
  console.log('https://res.cloudinary.com/{cloud_name}/video/upload/{public_id}.mp3\n');
  console.log('Enter URLs for each meditation (or press Enter to skip):\n');
  
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));
  
  const urlMap = {};
  
  for (const [title, id] of Object.entries(MEDITATION_MAP)) {
    const url = await question(`${title} (ID: ${id}): `);
    if (url.trim()) {
      urlMap[title] = url.trim();
    }
  }
  
  rl.close();
  return urlMap;
}

/**
 * Update meditation URLs in database
 */
async function updateMeditationUrls(urlMap) {
  console.log('\n🔄 Updating meditation URLs in database...\n');
  
  let updated = 0;
  let skipped = 0;
  
  for (const [title, url] of Object.entries(urlMap)) {
    const id = MEDITATION_MAP[title];
    
    if (!id) {
      console.log(`⚠️  Unknown meditation: ${title}`);
      skipped++;
      continue;
    }
    
    try {
      // Validate URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.log(`❌ Invalid URL for ${title}: ${url}`);
        skipped++;
        continue;
      }
      
      // Update database
      const result = await pool.query(
        `UPDATE meditations 
         SET narration_audio_url = $1, updated_at = NOW()
         WHERE id = $2`,
        [url, id]
      );
      
      if (result.rowCount > 0) {
        console.log(`✅ Updated ${title} (ID: ${id})`);
        console.log(`   URL: ${url}\n`);
        updated++;
      } else {
        console.log(`⚠️  Meditation not found: ${title} (ID: ${id})`);
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error updating ${title}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log(`   📝 Total: ${Object.keys(urlMap).length}\n`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Get URLs
    const urlMap = await getCloudinaryUrls();
    
    if (Object.keys(urlMap).length === 0) {
      console.log('⚠️  No URLs provided. Exiting.');
      process.exit(0);
    }
    
    // Update database
    await updateMeditationUrls(urlMap);
    
    console.log('✨ Done! Your meditation audio URLs have been updated.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

