const logger = require('./lib/logger');
#!/usr/bin/env node
/**
 * Content Pipeline — cosmicspiritguide.com
 * 
 * End-to-end pipeline: Content brief → Featured image → Post to site → Social copy
 * 
 * Usage:
 *   node scripts/content-pipeline.js --post 1              # Post #1 from content-briefs-month-1.json
 *   node scripts/content-pipeline.js --post 1 --publish    # Also publish immediately
 *   node scripts/content-pipeline.js --all                 # Run all 8 Month 1 posts
 *   node scripts/content-pipeline.js --social-only <slug>  # Regenerate social copy for a post
 *   node scripts/content-pipeline.js --status              # List all posts and their site status
 * 
 * Environment variables required (.env or Render env):
 *   SITE_URL=https://cosmicspiritguide.com
 *   BLOG_API_KEY=***           # API key for blog API auth
 *   TWITTER_API_KEY=***
 *   TWITTER_API_SECRET=***
 *   TWITTER_ACCESS_TOKEN=***
 *   TWITTER_ACCESS_SECRET=***
 * 
 * Image generation: Pollinations.ai (free, no API key needed)
 */

// ─── Imports ─────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Shared pipeline logic (themes, social copy, article HTML, image URLs)
import { getThemeForPost, buildImageUrl, generateSocialCopy, slugify } from '../lib/content-pipeline-lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Env Loader ───────────────────────────────────────────────────────────────
// Simple .env loader (no external deps needed)
function loadEnv() {
  for (const envPath of [join(ROOT, '.env'), join(process.env.HOME || '', '.env')]) {
    if (existsSync(envPath)) {
      readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx > 0) {
          const k = line.slice(0, idx).trim(), v = line.slice(idx + 1).trim();
          if (k && !process.env[k]) process.env[k] = v;
        }
      });
    }
  }
}
loadEnv();

// ─── Config ──────────────────────────────────────────────────────────────────

const SITE_URL = process.env.SITE_URL || 'https://cosmicspiritguide.com';
const BLOG_API_KEY = process.env.BLOG_API_KEY;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;

const BLOG_API = `${SITE_URL}/api/blog`;
const UPLOAD_API = `${SITE_URL}/api/upload/image`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(type, msg) {
  const ts = new Date().toISOString().split('T')[1].slice(0, 8);
  const icons = { ok: '✓', info: '→', warn: '⚠', error: '✗', img: '🖼', post: '📄', social: '🐦' };
  logger.info(`${ts} ${icons[type] || '·'} ${msg}`);
}

// slugify imported from lib

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': BLOG_API_KEY,
  };
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...apiHeaders(), ...options.headers },
  });
  const json = await res.json().catch(() => ({ error: `Non-JSON response: ${res.status}` }));
  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

// ─── Image Generation (Pollinations.ai — via shared lib) ──────────────────────

async function generateImage(post) {
  const imageUrl = buildImageUrl(post);
  log('img', `Image: ${imageUrl}`);
  return imageUrl;
}

// CLI-specific: load briefs from local scripts/ path
const CONTENT_CACHE = {};
function loadBriefsLocal() {
  if (!CONTENT_CACHE.briefs) {
    const files = ['content-briefs-month-1.json', 'content-briefs-months-2-3.json'];
    let all = [];
    for (const file of files) {
      const path = join(__dirname, file);
      try {
        if (existsSync(path)) {
          const data = JSON.parse(readFileSync(path, 'utf8'));
          all = all.concat(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        logger.warn(`[pipeline] Failed to load ${file}: ${err.message}`);
      }
    }
    CONTENT_CACHE.briefs = all;
  }
  return CONTENT_CACHE.briefs;
}

// ─── Social Copy Generation (CLI overrides the lib's social copy) ───────────────

function buildXCopy(title, keyword, url, intent) {
  // Different angles based on search intent
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

function buildPinterestCopy(title, keyword, url) {
  return `${title}\n\nTap the link for the full guide to ${keyword} + free calculator. #astrology #${keyword.replace(/ /g, '')} #spirituality #cosmicspiritguide`;
}

function buildInstagramCopy(title, keyword, url) {
  return `✨ ${title} ✨\n\nLink in bio for the full guide + free ${keyword} calculator 🧭\n\nSave this post for later ⚡\n\n#astrology #${keyword.replace(/ /g, '')} #spirituality #zodiac #cosmicspiritguide`;
}

// ─── Content Generation from Brief (via shared lib) ───────────────────────────
// generateArticleContent, generateSocialCopy imported from ../lib/content-pipeline-lib.js

// CLI uses loadBriefsLocal (defined above) — not the shared lib's loadBriefs()
// The lib's generateArticleContent is used by the API route; CLI uses its own
// section templates above (keep CLI's generateArticleContent for now)
function mdToHtml(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)(?=\s*<li>)/gs, '$1')
    .replace(/(<li>[\s\S]*?<\/li>)(\n)(?=<li>)/g, '$1')
    .split(/\n\n+/)
    .map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<li>') || p.startsWith('<ul>')) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

// Keep CLI's own generateArticleContent with richer section content templates
// (the lib has a simpler version for the API route)
function generateArticleContentCLI(post) {
  const title = post.title_options?.[0] || post.title || '';
  const keyword = post.target_keyword || '';
  const metaDesc = post.meta_description || '';
  const h2s = post.h2_headings || [];
  const cta = post.cta || 'Explore our full astrology guides →';

  // Per-keyword content templates — real, useful content per section
  const contentTemplates = {
    'zodiac compatibility calculator': {
      intro: `The stars have been guiding human connection for thousands of years — and modern astrology has distilled that wisdom into something remarkably practical: the zodiac compatibility calculator. Whether you're exploring a new relationship, deepening a current one, or simply curious about your cosmic connection with someone special, understanding how your signs interact can offer insights that go far beyond the "just vibes" stereotype.\n\nThis guide walks you through every layer of astrological compatibility — from your sun sign's basic chemistry to the hidden emotional language of your moon sign and the first-impression energy of your rising sign. By the end, you'll know exactly how to interpret your compatibility results and what they actually mean for your relationship.`,
      sections: {
        'How Zodiac Compatibility Works': `Astrological compatibility isn't just about your sun sign — it's about how four different planetary placements interact: your sun sign (core identity), moon sign (emotional nature), rising sign (how others perceive you), and mercury (how you communicate).\n\nWhen two people meet, their charts create aspects — angular relationships between planets — that reveal harmony or tension. Trines (120 degrees apart) flow easily. Squares (90 degrees apart) create productive friction. Oppositions (180 degrees apart) offer complementary but require awareness.\n\nThe most compatible combinations share elemental affinities: Fire signs (Aries, Leo, Sagittarius) resonate with Fire; Earth signs (Taurus, Virgo, Capricorn) with Earth; Air with Air; Water with Water. But cross-element connections — like a Fire sun with an Air moon — create dynamic, growth-oriented pairings that keep things interesting.\n\nNo single aspect defines compatibility. A relationship with challenging aspects can thrive with self-awareness, just as one with all trines can become complacent. Use your compatibility results as a map, not a verdict.`,
        'Sun Sign Compatibility Chart': `Your sun sign compatibility forms the foundation of your relationship's day-to-day rhythm. Here's what each pairing tends to bring:\n\nFire + Fire (Aries-Aries, Leo-Leo, Sagittarius-Sagittarius): High passion, high intensity. These pairings spark easily but can combust just as fast. Best when both partners channel energy into shared goals rather than competition.\n\nFire + Air (Aries with Gemini, Libra, or Aquarius): Dynamic and mentally stimulating. Air fans Fire's creative flames. Watch for impatience — Fire moves fast, Air wants to deliberate.\n\nFire + Earth (Aries with Taurus, Virgo, or Capricorn): Challenging but potentially grounding. Fire wants to charge ahead; Earth wants to build steadily. Success requires mutual respect for each other's pace.\n\nEarth + Earth: Stable, loyal, deeply practical. These pairings build empires together. Watch for boredom or excessive pragmatism without enough play.\n\nEarth + Water: One of the most naturally nurturing combinations. Water's emotional depth meets Earth's stability. Risk: Earth suppressing Water's emotional needs, or Water overwhelming Earth with intensity.\n\nAir + Air: Mentally electric. These pairs can talk for hours and never run out of ideas. Watch for living in theory without enough physical or emotional grounding.\n\nAir + Water: Fascinating but challenging. Air's logic can feel cold to Water; Water's depth can feel overwhelming to Air. The bridge is learning each other's language.`,
        'Moon Sign Emotional Connection': `If sun signs are the steering wheel of a relationship, moon signs are the engine. Your moon sign governs your deepest emotional needs — what makes you feel secure, loved, and understood.\n\nWhen two moon signs harmonize, partners tend to instinctively meet each other's needs. A Cancer moon with a Scorpio moon understands unspoken emotional currents. A Libra moon and a Gemini moon share a need for mental connection as a form of intimacy.\n\nChallenging moon sign aspects aren't dealbreakers — they're invitations to grow. A Virgo moon with a Sagittarius moon both value expansion but process emotions differently. The Virgo moon needs order to feel safe; the Sagittarius moon needs freedom. With conscious communication, this tension becomes an asset — each partner teaches the other a different mode of emotional processing.`,
        'Rising Sign First Impressions': `Your rising sign — also called the ascendant — is the mask you wear when meeting the world. It's what people notice first about you, and it shapes the initial chemistry between two people.\n\nA Leo rising meeting a Capricorn rising might feel like an unexpectedly smooth first encounter — both value presence and gravitas. An Aries rising meeting a Pisces rising creates immediate intrigue — Fire's directness meeting Water's mystery.\n\nRising sign compatibility matters most in new relationships and social contexts. In long-term partnerships, it often manifests as how the couple presents to the world rather than the internal relationship dynamic. A couple with harmonious rising signs often feels like a well-coordinated team from the outside.`,
        'What Your Results Mean': `A high compatibility score doesn't guarantee a perfect relationship — and a low score doesn't mean you're doomed. Here's how to read your results:\n\n80-100%: Natural harmony. You likely share values, communicate similarly, and meet each other's needs with relative ease. The work here is avoiding complacency and continuing to grow together.\n\n60-79%: Solid with nuance. You have strong foundations with specific areas requiring conscious attention. Identify your top 2-3 friction points and build communication strategies for those specifically.\n\n40-59%: Growth-oriented pairing. You're here to teach each other something. The challenge is real but so is the potential for deep mutual evolution. These pairings often have the most dramatic success stories — if both partners do the inner work.\n\nBelow 40%: Requires significant awareness and commitment from both partners. Not impossible — some of the most profound partnerships span difficult aspects. But go in with eyes open and a commitment to communication.\n\nNo number captures the full picture. Two people with "50% compatibility" who are both committed to growth and honest communication will outperform two "90% compatible" people coasting on natural ease. Use the score as a starting point for deeper exploration.`,
        'Free Compatibility Calculator': `Ready to see how your signs actually interact? Our free zodiac compatibility calculator lets you compare any two sun signs instantly — no signup required.\n\nEnter two birth signs, and within seconds you'll get a breakdown of your elemental compatibility, communication style alignment, and overall relationship tendency. For deeper insights, add birth times to unlock moon sign and rising sign comparisons.\n\nThe calculator pulls from the same astrological framework we use throughout this guide: planetary aspects, elemental resonance, and cross-sign dynamics. Think of it as the practical companion to everything you've read here.\n\nCome back to this tool after reading through the rest of the guide — you'll find the results much more meaningful once you understand why the numbers fall where they do.`,
      },
    },
    'default': null,
  };

  const tmpl = contentTemplates[keyword] || null;
  const sectionContent = tmpl ? tmpl.sections : null;

  let sectionsHtml = h2s.map(h2 => {
    let content = '';
    if (sectionContent && sectionContent[h2]) {
      content = mdToHtml(sectionContent[h2]);
    } else {
      content = `<p>This section covers <strong>${h2}</strong> in the context of ${keyword}. Understanding this aspect of your chart can provide meaningful insights into your relational dynamics and personal growth path.</p>`;
    }
    return `<h2>${h2}</h2>\n${content}`;
  }).join('\n\n');

  const faqContent = `
<h3>What is ${keyword}?</h3>
<p>${keyword.charAt(0).toUpperCase() + keyword.slice(1)} is a tool and framework for understanding astrological relationship dynamics. It examines the interplay between planetary placements in two charts to reveal harmony, tension, and growth opportunities.</p>

<h3>How accurate is a zodiac compatibility reading?</h3>
<p>Accuracy depends on the quality of the birth data you provide. Exact birth times produce the most precise readings — especially for rising sign and moon sign calculations. Without a birth time, estimates are used. The deeper insights (elemental compatibility, communication styles) remain valuable even with approximate data.</p>

<h3>Can incompatible signs make a relationship work?</h3>
<p>Absolutely. Many of the most profound, growth-oriented relationships span challenging aspects. Astrology identifies tendencies, not destinies. Conscious communication, mutual respect, and a shared commitment to growth consistently outweigh "natural compatibility" in long-term relationship success.</p>

<h3>What's the most important sign for compatibility?</h3>
<p>There's no single answer — but if pressed, many astrologers point to moon sign compatibility as most predictive of long-term relationship satisfaction. Your moon sign governs your emotional core needs. When two people instinctively meet each other's emotional needs, the relationship has a foundation that sun sign differences can't shake.</p>
`;

  const html = `
<h1>${title}</h1>
<p class="lead">${metaDesc}</p>

${sectionsHtml}

<h2>Frequently Asked Questions</h2>
${faqContent}

<div class="cta-box">
<p><strong>${cta}</strong></p>
<p><a href="${SITE_URL}/services" class="btn-primary">Explore All Guides →</a></p>
</div>`;

  return html.trim();
}

// ─── API Calls ───────────────────────────────────────────────────────────────

async function uploadImageFromUrl(imageUrl) {
  if (!imageUrl) return null;
  
  try {
    // Download image and upload to Cloudinary via our upload endpoint
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
    
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const formData = new FormData();
    const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'featured-image.jpg');
    
    const uploadRes = await fetch(UPLOAD_API, {
      method: 'POST',
      headers: { 'x-api-key': BLOG_API_KEY },
      body: formData,
    });
    
    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(`Upload failed: ${JSON.stringify(uploadJson)}`);
    
    log('img', `Image uploaded to Cloudinary: ${uploadJson.url}`);
    return uploadJson.url;
  } catch (err) {
    log('warn', `Image upload failed: ${err.message} — post will have no featured image`);
    return null;
  }
}

async function createBlogPost(post, imageUrl, publish = false) {
  const title = post.title_options?.[0] || post.title || '';
  const metaDesc = post.meta_description || '';
  const keyword = post.target_keyword || '';
  const category = getThemeForPost(post).category;
  
  const slug = slugify(title.slice(0, 60));
  const content = generateArticleContentCLI(post);
  const featured_image = imageUrl || '';
  
  const payload = {
    title,
    slug,
    excerpt: metaDesc,
    content,
    featured_image,
    status: publish ? 'published' : 'draft',
    tags: [keyword, category.toLowerCase(), 'seo'],
    category,
    meta_title: title,
    meta_description: metaDesc,
  };

  log('post', `Creating ${publish ? 'published' : 'draft'} post: "${title}"`);
  
  const result = await apiFetch(BLOG_API, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  
  log('ok', `Post created! ID: ${result.post?.id}, Slug: ${result.post?.slug}`);
  return result.post;
}

// ─── X/Twitter Posting (OAuth 1.0a) ───────────────────────────────────────────

function buildOAuthHeader(method, url, body = '') {
  const oauth = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_version: '1.0',
  };

  // Build the signature base string
  const params = new URLSearchParams();
  Object.keys(oauth).sort().forEach(k => params.append(k, oauth[k]));
  if (body) {
    // For tweet posting, the body param is included in signature for some configs
    // Twitter's 1.0a signature: method + url + all params (sorted)
    const bodyParams = new URLSearchParams(body);
    bodyParams.forEach((v, k) => params.append(k, v));
  }

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(params.toString()),
  ].join('&');

  // Sign with consumer secret + access token secret
  const signingKey = `${encodeURIComponent(TWITTER_API_SECRET)}&${encodeURIComponent(TWITTER_ACCESS_SECRET)}`;
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  oauth.oauth_signature = signature;

  // Build Authorization header
  const authHeader =
    'OAuth ' +
    Object.keys(oauth)
      .sort()
      .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauth[k])}"`)
      .join(', ');

  return authHeader;
}

async function postToTwitter(copy) {
  if (!TWITTER_API_KEY || !TWITTER_ACCESS_TOKEN) {
    log('warn', 'Twitter credentials not configured — skipping Twitter post');
    return null;
  }

  try {
    const tweetText = copy.xCopy;
    const url = 'https://api.twitter.com/1.1/statuses/update.json';

    // Build the OAuth 1.0a Authorization header
    const authHeader = buildOAuthHeader('POST', url, `status=${encodeURIComponent(tweetText)}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `status=${encodeURIComponent(tweetText)}`,
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      // Twitter returned non-JSON (empty, HTML error page, etc.)
      throw new Error(`Twitter ${res.status}: Non-JSON response (${text.length} bytes). Body: ${text.slice(0, 300)}`);
    }

    if (!res.ok) {
      throw new Error(`Twitter ${res.status}: ${JSON.stringify(json)}`);
    }

    log('social', `Tweet posted: ${json.id_str}`);
    return json.id_str;
  } catch (err) {
    log('warn', `Twitter post failed: ${err.message}`);
    return null;
  }
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

async function runPost(postNumber, publish = false) {
  log('info', `═══ Processing Post #${postNumber} ═══`);
  
  const briefs = loadBriefsLocal();
  const post = briefs.find(p => p.post_number === postNumber);
  
  if (!post) {
    log('error', `Post #${postNumber} not found in briefs`);
    return;
  }

  const title = post.title_options?.[0] || post.title || '';
  log('ok', `Title: "${title}"`);
  
  // Step 1: Generate featured image
  const imageUrl = await generateImage(post);
  
  // Step 2: Upload image to Cloudinary
  const cloudinaryUrl = await uploadImageFromUrl(imageUrl);
  
  // Step 3: Create blog post
  const blogPost = await createBlogPost(post, cloudinaryUrl, publish);
  
  // Step 4: Generate social copy
  const socialCopy = generateSocialCopy(post, SITE_URL, blogPost?.slug || slugify(title.slice(0, 60)));
  
  // Step 5: Save social copy to file for review/manual posting
  const outputDir = join(ROOT, '.openclaw/workspace/content-assets/social');
  mkdirSync(outputDir, { recursive: true });
  const socialFile = join(outputDir, `${blogPost?.slug || slugify(title)}-social.md`);
  
  writeFileSync(socialFile, `# Social Copy — ${title}\n\n## X/Twitter\n\`\`\`\n${socialCopy.xCopy}\n\`\`\`\n\n## Pinterest\n${socialCopy.pinterestCopy}\n\n## Instagram\n${socialCopy.instagramCopy}\n\n## Post URL\n${socialCopy.postUrl}\n`);
  log('ok', `Social copy saved: ${socialFile}`);
  
  // Step 6: Auto-post to Twitter
  if (publish) {
    await postToTwitter(socialCopy);
  }
  
  log('ok', `═══ Post #${postNumber} complete! ═══`);
  return { post: blogPost, social: socialCopy };
}

async function runAll(publish = false) {
  // Months 1-3 = posts 1-24
  for (let i = 1; i <= 24; i++) {
    await runPost(i, publish);
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function showStatus() {
  log('info', 'Fetching existing posts from site...');
  try {
    const result = await apiFetch(`${BLOG_API}?status=all&limit=50`);
    const posts = result.posts || [];
    if (posts.length === 0) {
      log('info', 'No posts found on site yet.');
    } else {
      log('info', `Found ${posts.length} post(s) on site:`);
      posts.forEach(p => {
        log('ok', `  [${p.status}] #${p.id} — ${p.title} (${p.category})`);
      });
    }
  } catch (err) {
    log('error', `Failed to fetch posts: ${err.message}`);
  }
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--status')) {
  await showStatus();
} else if (args.includes('--all')) {
  const publish = args.includes('--publish');
  await runAll(publish);
} else {
  const postIdx = args.findIndex(a => a === '--post');
  if (postIdx !== -1 && args[postIdx + 1]) {
    const num = parseInt(args[postIdx + 1]);
    const publish = args.includes('--publish');
    await runPost(num, publish);
  } else {
    logger.info(`
Content Pipeline — cosmicspiritguide.com

Usage:
  node scripts/content-pipeline.js --status              List existing posts on site
  node scripts/content-pipeline.js --post <n>            Process post #n (draft)
  node scripts/content-pipeline.js --post <n> --publish   Process post #n and publish + tweet
  node scripts/content-pipeline.js --all                  Run all 8 Month 1 posts (drafts)
  node scripts/content-pipeline.js --all --publish        Run all + publish + tweet

Environment variables required:
  SITE_URL=https://cosmicspiritguide.com
  BLOG_API_KEY=***
  TWITTER_API_KEY=***
  TWITTER_API_SECRET=***
  TWITTER_ACCESS_TOKEN=***
  TWITTER_ACCESS_SECRET=***

  Twitter credentials optional — tweet skipped if not set
`);
    process.exit(1);
  }
}

log('ok', 'Done!');
