const logger = require('./lib/logger');
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
  logger.info('\n📝 Cloudinary URL Update Script\n');
  logger.info('Please provide Cloudinary URLs for each meditation.\n');
  logger.info('You can find these URLs in your Cloudinary dashboard:');
  logger.info('1. Go to https://cloudinary.com/console');
  logger.info('2. Navigate to Media Library');
  logger.info('3. Click on each audio file');
  logger.info('4. Copy the "URL" or "Secure URL"\n');
  logger.info('Cloudinary URLs typically look like:');
  logger.info('https://res.cloudinary.com/{cloud_name}/video/upload/{public_id}.mp3\n');
  logger.info('Enter URLs for each meditation (or press Enter to skip):\n');
  
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
  logger.info('\n🔄 Updating meditation URLs in database...\n');
  
  let updated = 0;
  let skipped = 0;
  
  for (const [title, url] of Object.entries(urlMap)) {
    const id = MEDITATION_MAP[title];
    
    if (!id) {
      logger.info(`⚠️  Unknown meditation: ${title}`);
      skipped++;
      continue;
    }
    
    try {
      // Validate URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        logger.info(`❌ Invalid URL for ${title}: ${url}`);
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
        logger.info(`✅ Updated ${title} (ID: ${id})`);
        logger.info(`   URL: ${url}\n`);
        updated++;
      } else {
        logger.info(`⚠️  Meditation not found: ${title} (ID: ${id})`);
        skipped++;
      }
    } catch (error) {
      logger.error(`❌ Error updating ${title}:`, error.message);
      skipped++;
    }
  }
  
  logger.info(`\n📊 Summary:`);
  logger.info(`   ✅ Updated: ${updated}`);
  logger.info(`   ⚠️  Skipped: ${skipped}`);
  logger.info(`   📝 Total: ${Object.keys(urlMap).length}\n`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    logger.info('✅ Database connection successful\n');
    
    // Get URLs
    const urlMap = await getCloudinaryUrls();
    
    if (Object.keys(urlMap).length === 0) {
      logger.info('⚠️  No URLs provided. Exiting.');
      process.exit(0);
    }
    
    // Update database
    await updateMeditationUrls(urlMap);
    
    logger.info('✨ Done! Your meditation audio URLs have been updated.\n');
    
  } catch (error) {
    logger.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the script
main().catch(error => {
  logger.error('❌ Fatal error:', error);
  process.exit(1);
});

