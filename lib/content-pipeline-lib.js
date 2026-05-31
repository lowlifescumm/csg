import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import logger from './logger.js';

const __dirname_file = dirname(fileURLToPath(import.meta.url));

export function loadBriefs() {
  const briefFiles = ['content-briefs-month-1.json', 'content-briefs-months-2-3.json'];
  const basePaths = [
    join(__dirname_file, '../scripts'),
    join(process.cwd(), 'scripts'),
    '/opt/render/project/src/scripts',
  ];

  let allBriefs = [];
  for (const file of briefFiles) {
    for (const basePath of basePaths) {
      const p = join(basePath, file);
      try {
        if (existsSync(p)) {
          const data = JSON.parse(readFileSync(p, 'utf8'));
          allBriefs = allBriefs.concat(Array.isArray(data) ? data : []);
          break;
        }
      } catch (err) {
        logger.error(`[content-pipeline-lib] Failed to load ${file}:`, err);
      }
    }
  }

  if (allBriefs.length === 0) {
    throw new Error(`Could not find any content brief files in: ${basePaths.join(', ')}`);
  }
  return allBriefs;
}

export function getThemeForPost(post) {
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
