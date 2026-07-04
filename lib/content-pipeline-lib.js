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

function buildImageUrl(post) {
  const keyword = post.target_keyword || post.title || 'spiritual';
  const seed = keyword.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const theme = getThemeForPost(post);
  const prompts = {
    'tarot': 'Mystical tarot cards floating in cosmic space, ethereal purple and gold lighting, spiritual atmosphere, dark celestial background with stars and nebula, professional product photography, 4K',
    'zodiac': 'Zodiac constellation wheel with golden stars on deep cosmic purple background, astrological symbols, celestial elegance, mystical spiritual aesthetic, 4K',
    'birth-chart': 'Beautiful birth chart wheel with planets on a cosmic blue background, astrology wheel diagram, mystical spiritual aesthetic, detailed celestial map, 4K',
    'compatibility': 'Two overlapping zodiac constellation circles merging with golden light, cosmic love connection, romantic celestial theme, deep purple and rose gold, spiritual love, 4K',
    'moon-reading': 'Full moon over mystical ocean with moonlight reflecting silver, lunar goddess energy, spiritual serene atmosphere, dreamy blue and silver palette, 4K',
    'horoscope': 'Cosmic astrology wheel with zodiac signs, daily horoscope concept, mystical purple and gold celestial background, spiritual guidance aesthetic, 4K',
    'transits': 'Planetary transit visualization in cosmic space, orbiting spheres with mystical energy trails, deep purple and teal celestial atmosphere, 4K',
    'crystals': 'Beautiful crystals and gemstones arranged artfully with soft spiritual lighting, rose quartz amethyst and citrine, mystical crystal grid, warm ethereal glow, 4K',
    'meditation': 'Serene meditation space with cosmic spiritual energy, person meditating under starry sky, mystical purple and blue light, peaceful zen atmosphere, 4K',
    'spiritual': 'Mystical spiritual cosmic background with stars and soft purple blue gradient, ethereal floating particles, magical celestial atmosphere, clean minimal design, 4K',
    'love': 'Cosmic love connection visualization, two souls as stars connecting with golden light beam, romantic celestial art, deep purple and rose gold palette, spiritual love, 4K',
    'career': 'Career success constellation in night sky, professional achievement spiritual concept, golden stars forming success path, cosmic blue background, motivational mystical aesthetic, 4K',
    'general': 'Mystical spiritual cosmic background with stars and soft purple blue gradient, ethereal floating particles, magical celestial atmosphere, clean minimal design, 4K',
  };
  const prompt = `${prompts[theme] || prompts.general}, ${keyword} spiritual guide article`;
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&seed=${seed}&nologo=true`;
}

function generateSocialCopy(post, siteUrl, slug) {
  const title = post.title_options?.[0] || post.title || '';
  const keyword = post.target_keyword || '';
  const postUrl = `${siteUrl}/blog/${slug}`;
  
  return {
    xCopy: `${title}\\n\\nFree guide to ${keyword}. Tap the link to learn more ✨\\n${postUrl}`,
    pinterestCopy: `${title}\\n\\n${keyword} guide + free tools. #astrology #${keyword.replace(/ /g, '')} #spirituality`,
    instagramCopy: `✨ ${title} ✨\\n\\nLink in bio for the full guide 🧭\\n\\n#astrology #${keyword.replace(/ /g, '')} #spirituality`,
    postUrl,
  };
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function generateArticleContent(post) {
  const title = post.title_options?.[0] || post.title || '';
  const h2s = post.h2_headings || [];
  const keyword = post.target_keyword || '';
  
  const sectionsHtml = h2s.map(h2 => {
    return `<h2>${h2}</h2>\\n<p>This section covers <strong>${h2}</strong> in the context of ${keyword}. Understanding this aspect can provide meaningful insights into your spiritual journey and personal growth path.</p>`;
  }).join('\\n\\n');

  return `<h1>${title}</h1>\\n<p class="lead">A comprehensive guide to understanding ${keyword} and how it applies to your spiritual practice.</p>\\n\\n${sectionsHtml}`;
}

module.exports = { loadBriefs, getThemeForPost, buildImageUrl, generateSocialCopy, slugify, generateArticleContent };
