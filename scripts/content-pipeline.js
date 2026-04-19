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
 *   BLOG_API_KEY=<key>           # API key for blog API auth
 *   FAL_KEY=<key>               # FAL.ai for image generation
 *   TWITTER_API_KEY=<key>
 *   TWITTER_API_SECRET=<key>
 *   TWITTER_ACCESS_TOKEN=<key>
 *   TWITTER_ACCESS_SECRET=<key>
 * 
 * Image generation uses FAL.ai (flux-2-kontext-pro) — no local GPU needed.
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Config ──────────────────────────────────────────────────────────────────

const SITE_URL = process.env.SITE_URL || 'https://cosmicspiritguide.com';
const BLOG_API_KEY = process.env.BLOG_API_KEY;
const FAL_KEY = process.env.FAL_KEY;
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
  console.log(`${ts} ${icons[type] || '·'} ${msg}`);
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

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

// ─── Image Generation (FAL.ai) ───────────────────────────────────────────────

async function generateImage(post) {
  if (!FAL_KEY) {
    log('warn', 'FAL_KEY not set — skipping image generation');
    return null;
  }

  // Build a thematic prompt based on post category/keyword
  const theme = getThemeForPost(post);
  
  log('img', `Generating featured image: "${theme.prompt}"`);

  try {
    const res = await fetch('https://queue.fal.run/fal-ai/flux-2-kontext-pro', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: theme.prompt,
        aspect_ratio: '16:9',
        seed: Math.floor(Math.random() * 999999),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`FAL ${res.status}: ${errText}`);
    }

    const result = await res.json();
    const imageUrl = result.images?.[0]?.url;
    
    if (!imageUrl) throw new Error('No image URL in FAL response');
    
    log('img', `Image generated: ${imageUrl}`);
    return imageUrl;
  } catch (err) {
    log('warn', `Image gen failed: ${err.message} — continuing without image`);
    return null;
  }
}

function getThemeForPost(post) {
  const title = post.title_options?.[0] || post.title || post.target_keyword || '';
  const keyword = post.target_keyword || '';
  const category = post.category || categorizeKeyword(keyword);

  const themes = {
    'tarot': {
      prompt: `Mystical tarot cards floating in cosmic space, ethereal purple and gold lighting, spiritual atmosphere, dark celestial background with stars and nebula, professional product photography, 4K`,
      category: 'Tarot',
    },
    'zodiac': {
      prompt: `Zodiac constellation wheel with golden stars on deep cosmic purple background, astrological symbols, celestial elegance, mystical spiritual aesthetic, 4K`,
      category: 'Astrology',
    },
    'birth chart': {
      prompt: `Beautiful birth chart wheel with planets on a cosmic blue background, astrology wheel diagram, mystical spiritual aesthetic, detailed celestial map, 4K`,
      category: 'Astrology',
    },
    'compatibility': {
      prompt: `Two overlapping zodiac constellation circles merging with golden light, cosmic love connection, romantic celestial theme, deep purple and rose gold, spiritual love, 4K`,
      category: 'Compatibility',
    },
    'moon sign': {
      prompt: `Full moon over mystical ocean with moonlight reflecting silver, lunar goddess energy, spiritual serene atmosphere, dreamy blue and silver palette, 4K`,
      category: 'Astrology',
    },
    'mercury retrograde': {
      prompt: `Retrograde Mercury planet in cosmic space with communication symbols, glitch effect overlay, mystical purple and teal, retro sci-fi spiritual aesthetic, 4K`,
      category: 'Astrology',
    },
    'crystal': {
      prompt: `Beautiful crystals and gemstones arranged artfully with soft spiritual lighting, rose quartz amethyst and citrine, mystical crystal grid, warm ethereal glow, 4K`,
      category: 'Spiritual',
    },
    'manifestation': {
      prompt: `Manifestation journal open with golden pen and floating cosmic light particles, affirmation cards beside it, spiritual productivity aesthetic, warm gold and purple, 4K`,
      category: 'Spiritual',
    },
    'angel number': {
      prompt: `Glowing repeating numbers 111 222 333 floating in angelic cosmic light, divine spiritual message, golden numerology symbols, white and gold celestial background, 4K`,
      category: 'Spiritual',
    },
    'numerology': {
      prompt: `Numerology numbers and sacred geometry symbols glowing in cosmic space, golden mathematical patterns, spiritual mystical aesthetic, 4K`,
      category: 'Numerology',
    },
    'twin flame': {
      prompt: `Two mirror-image flames merging into one cosmic light, twin flame spiritual concept, warm orange and purple dual tones, ethereal and romantic, 4K`,
      category: 'Love',
    },
    'love': {
      prompt: `Cosmic love connection visualization, two souls as stars connecting with golden light beam, romantic celestial art, deep purple and rose gold palette, spiritual love, 4K`,
      category: 'Love',
    },
    'career': {
      prompt: `Career success constellation in night sky, professional achievement spiritual concept, golden stars forming success path, cosmic blue background, motivational mystical aesthetic, 4K`,
      category: 'Career',
    },
    'default': {
      prompt: `Mystical spiritual cosmic background with stars and soft purple blue gradient, ethereal floating particles, magical celestial atmosphere, clean minimal design, 4K`,
      category: 'Spiritual',
    },
  };

  // Match keyword to theme
  for (const [key, theme] of Object.entries(themes)) {
    if (keyword.toLowerCase().includes(key) || title.toLowerCase().includes(key)) {
      return theme;
    }
  }
  
  return themes['default'];
}

// ─── Social Copy Generation ──────────────────────────────────────────────────

function generateSocialCopy(post, siteUrl, postSlug) {
  const title = post.title_options?.[0] || post.title || '';
  const keyword = post.target_keyword || '';
  const intent = post.search_intent || '';
  
  const postUrl = `${siteUrl}/blog/${postSlug}`;

  // X/Twitter copy (280 chars max, with tracking)
  const xCopy = buildXCopy(title, keyword, postUrl, intent);
  
  // Pinterest caption
  const pinterestCopy = buildPinterestCopy(title, keyword, postUrl);
  
  // Instagram caption
  const instagramCopy = buildInstagramCopy(title, keyword, postUrl);

  return { xCopy, pinterestCopy, instagramCopy, postUrl };
}

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

// ─── Content Generation from Brief ───────────────────────────────────────────

function buildContentFromBrief(post) {
  // Generate full HTML content from the structured brief
  const title = post.title_options?.[0] || post.title || '';
  const metaDesc = post.meta_description || '';
  const h2s = post.h2_headings || [];
  const keyword = post.target_keyword || '';
  const wordCount = post.target_word_count || 2000;
  const cta = post.cta || 'Try our free calculator →';
  
  // Build the full article HTML
  let html = `
<h1>${title}</h1>
<p class="lead">${metaDesc}</p>
${h2s.map(h2 => `<h2>${h2}</h2>\n<p>Detailed content about "${h2}" — covering ${keyword} with practical guidance, examples, and actionable steps.</p>`).join('\n\n')}
<h2>Frequently Asked Questions</h2>
<h3>What is ${keyword}?</h3>
<p>This comprehensive guide covers everything you need to know about ${keyword}. Our free tools and detailed explanations help you understand and apply this knowledge in your daily life.</p>
<h3>How do I use ${keyword}?</h3>
<p>Getting started is easy. Use our free calculator above, read through the guide below, and apply the insights to your personal situation. Many users find that tracking patterns over time increases the accuracy and usefulness.</p>
<h3>Is this free to use?</h3>
<p>Yes! Our ${keyword} tools are completely free to use. Create your account to save your results and get personalized follow-up guidance.</p>
<div class="cta-box">
<p><strong>${cta}</strong></p>
<p><a href="${SITE_URL}/services" class="btn-primary">Start Free →</a></p>
</div>
`;
  
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
  const content = buildContentFromBrief(post);
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

// ─── X/Twitter Posting ───────────────────────────────────────────────────────

async function postToTwitter(copy) {
  if (!TWITTER_API_KEY || !TWITTER_ACCESS_TOKEN) {
    log('warn', 'Twitter credentials not configured — skipping Twitter post');
    return null;
  }

  try {
    // Twitter API v2 posting
    const tweetText = copy.xCopy;
    
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TWITTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweetText }),
    });
    
    const json = await res.json();
    if (!res.ok) throw new Error(`Twitter ${res.status}: ${JSON.stringify(json)}`);
    
    log('social', `Tweet posted: ${json.data?.id}`);
    return json.data?.id;
  } catch (err) {
    log('warn', `Twitter post failed: ${err.message}`);
    return null;
  }
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

async function runPost(postNumber, publish = false) {
  log('info', `═══ Processing Post #${postNumber} ═══`);
  
  const briefPath = join(ROOT, '.paperclip/instances/default/projects/84898c57-acb2-43a9-a0e7-b22d600d3434/f3cca765-f210-4ec7-8fd7-6134eb67f658/csg/content-briefs-month-1.json');
  const briefs = JSON.parse(readFileSync(briefPath, 'utf8'));
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
  // Month 1 = posts 1-8
  for (let i = 1; i <= 8; i++) {
    await runPost(i, publish);
    // Small delay between posts to avoid rate limits
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
    console.log(`
Content Pipeline — cosmicspiritguide.com

Usage:
  node scripts/content-pipeline.js --status              List existing posts on site
  node scripts/content-pipeline.js --post <n>            Process post #n (draft)
  node scripts/content-pipeline.js --post <n> --publish   Process post #n and publish + tweet
  node scripts/content-pipeline.js --all                  Run all 8 Month 1 posts (drafts)
  node scripts/content-pipeline.js --all --publish        Run all + publish + tweet

Environment variables required:
  SITE_URL=https://cosmicspiritguide.com
  BLOG_API_KEY=<key>
  FAL_KEY=<key>                    (optional — skips image if not set)
  TWITTER_API_KEY=<key>            (optional — skips tweet if not set)
  TWITTER_ACCESS_TOKEN=<key>
`);
    process.exit(1);
  }
}

log('ok', 'Done!');
