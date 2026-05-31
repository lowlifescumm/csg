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

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function generateSocialCopy(post, siteUrl, slug) {
  const title = post.title_options?.[0] || post.title || '';
  const keyword = post.target_keyword || '';
  const intent = post.search_intent || '';
  const postUrl = `${siteUrl}/blog/${slug}`;

  function buildXCopy(title, keyword, url, intent) {
    if (intent === 'Transactional') {
      return `${title}\n\nFree tool + guide. Tap the link to calculate your ${keyword} instantly 🧭✨\n${url}`;
    }
    const templates = [
      `${title}\n\nEverything you need to know about ${keyword}. Guide + free tool linked below 👇\n${url}`,
      `The complete guide to ${keyword} is here.\n\nSave this for when you need it 🪄\n${url}`,
      `Curious about ${keyword}? This guide breaks it all down:\n\n↓ Tap the link ↓\n${url}`,
    ];
    return templates[Math.floor(Math.random() * templates.length)].slice(0, 280);
  }

  return {
    xCopy: buildXCopy(title, keyword, postUrl, intent),
    pinterestCopy: `${title}\n\nTap the link for the full guide to ${keyword} + free calculator. #astrology #${keyword.replace(/ /g, '')} #spirituality #cosmicspiritguide`,
    instagramCopy: `✨ ${title} ✨\n\nLink in bio for the full guide + free ${keyword} calculator 🧭\n\nSave this post for later ⚡\n\n#astrology #${keyword.replace(/ /g, '')} #spirituality #zodiac #cosmicspiritguide`,
    postUrl,
  };
}

function buildImageUrl(post) {
  const keyword = post.target_keyword || post.title || 'spiritual';
  const seed = keyword.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const theme = getThemeForPost(post);
  const prompt = `${theme.prompt}, ${keyword} spiritual guide article`;
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&seed=${seed}&nologo=true`;
}

function mdToHtml(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .split(/\n\n+/)
    .map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<li>')) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

function generateArticleContent(post) {
  const title = post.title_options?.[0] || post.title || '';
  const keyword = post.target_keyword || '';
  const h2s = post.h2_headings || [];
  const cta = post.cta || 'Explore our full astrology guides →';
  const siteUrl = process.env.SITE_URL || 'https://cosmicspiritguide.com';

  const templateContent = (h2) => `<p>This section covers <strong>${h2}</strong> in the context of ${keyword}. Understanding this aspect can provide meaningful insights into your relational dynamics and personal growth path.</p>`;

  const sectionsHtml = h2s.map(h2 => {
    return `<h2>${h2}</h2>\n${templateContent(h2)}`;
  }).join('\n\n');

  const faqContent = `
<h3>What is ${keyword}?</h3>
<p>${keyword.charAt(0).toUpperCase() + keyword.slice(1)} is a tool and framework for understanding astrological relationship dynamics. It examines the interplay between planetary placements to reveal harmony, tension, and growth opportunities.</p>

<h3>How accurate is a zodiac compatibility reading?</h3>
<p>Accuracy depends on the quality of the birth data you provide. Exact birth times produce the most precise readings — especially for rising sign and moon sign calculations. The deeper insights remain valuable even with approximate data.</p>

<h3>Can incompatible signs make a relationship work?</h3>
<p>Absolutely. Many of the most profound, growth-oriented relationships span challenging aspects. Astrology identifies tendencies, not destinies.</p>`;

  const html = `
<h1>${title}</h1>

${sectionsHtml}

<h2>Frequently Asked Questions</h2>
${faqContent}

<div class="cta-box">
<p><strong>${cta}</strong></p>
<p><a href="${siteUrl}/services" class="btn-primary">Explore All Guides →</a></p>
</div>`;

  return html.trim();
}

module.exports = { loadBriefs, getThemeForPost, buildImageUrl, generateSocialCopy, slugify, generateArticleContent };
