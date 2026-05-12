/**
 * Content Pipeline Library
 * Shared logic for the content automation pipeline.
 */
const fs = require('fs');
const path = require('path');

const logger = require('./logger');

function loadBriefs() {
  const paths = [
    path.join(process.cwd(), 'scripts/content-briefs-month-1.json'),
    '/opt/render/project/src/scripts/content-briefs-month-1.json',
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (err) {
      logger.error("[content-pipeline-lib] Failed to load briefs:", err);
    }
  }
  throw new Error(`Could not find content-briefs-month-1.json in any of: ${paths.join(', ')}`);
}

function getThemeForPost(post) {
  const keyword = post.target_keyword || '';
  const title = (post.title_options?.[0] || post.title || '').toLowerCase();
  const search = (keyword + ' ' + title).toLowerCase();
  
  if (search.includes('tarot') || search.includes('card')) return 'tarot';
  if (search.includes('birth chart') || search.includes('natal')) return 'birth-chart';
  if (search.includes('compatibility') || search.includes('synastry') || search.includes('relationship')) return 'compatibility';
  if (search.includes('moon') || search.includes('lunar')) return 'moon-reading';
  if (search.includes('horoscope') || search.includes('zodiac') || search.includes('daily')) return 'horoscope';
  if (search.includes('transit') || search.includes('forecast')) return 'transits';
  if (search.includes('crystal') || search.includes('healing')) return 'crystals';
  if (search.includes('chakra') || search.includes('meditation')) return 'meditation';
  if (search.includes('spirit') || search.includes('guide')) return 'spiritual';
  if (search.includes('love') || search.includes('romance')) return 'love';
  if (search.includes('career') || search.includes('money') || search.includes('finance')) return 'career';
  if (search.includes('health') || search.includes('wellness')) return 'health';
  return 'general';
}

module.exports = { loadBriefs, getThemeForPost };
