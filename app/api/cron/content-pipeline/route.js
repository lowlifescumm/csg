/**
 * Content Pipeline Cron Job — Fully Automated
 *
 * Called by Render Cron on a schedule.
 * Processes one content brief per run (or all if ?all=1).
 * Creates blog post (draft or published), generates image, auto-posts to Twitter.
 *
 * Security: Bearer token in Authorization header (CRON_SECRET env var)
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { pool } from '@/lib/db';
import { loadBriefs, buildImageUrl, generateSocialCopy, slugify, generateArticleContent, getThemeForPost } from '@/lib/content-pipeline-lib.js';
import { createPostInSanity } from '@/lib/sanity-write.js';
import { sanityClient } from '@/lib/sanity.js';

export const dynamic = 'force-dynamic';

// Track last processed post number in a persistent file
const STATE_FILE = '/tmp/content-pipeline-state.json';

async function getState() {
  try {
    const { readFileSync, existsSync } = await import('fs');
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {}
  return { lastPost: 0, lastRun: null };
}

async function saveState(state) {
  try {
    const { writeFileSync } = await import('fs');
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch {}
}

function log(type, msg) {
  const ts = new Date().toISOString().split('T')[1].slice(0, 8);
  const icons = { ok: '✓', info: '→', warn: '⚠', error: '✗', img: '🖼', post: '📄', social: '🐦' };
  console.log(`${ts} ${icons[type] || '·'} ${msg}`);
}

// ─── X/Twitter Posting (OAuth 1.0a — same as CLI script) ─────────────────────

function buildOAuthHeader(method, url, body = '') {
  const apiKey = process.env.TWITTER_API_KEY;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  const oauth = {
    oauth_consumer_key: apiKey,
    oauth_token: accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_version: '1.0',
  };

  // Build the signature base string
  const params = new URLSearchParams();
  Object.keys(oauth).sort().forEach(k => params.append(k, oauth[k]));
  if (body) {
    const bodyParams = new URLSearchParams(body);
    bodyParams.forEach((v, k) => params.append(k, v));
  }

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(params.toString()),
  ].join('&');

  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  oauth.oauth_signature = signature;

  return (
    'OAuth ' +
    Object.keys(oauth)
      .sort()
      .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauth[k])}"`)
      .join(', ')
  );
}

async function postToTwitter(socialCopy) {
  const apiKey = process.env.TWITTER_API_KEY;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    log('warn', 'Twitter credentials not set — skipping tweet');
    return null;
  }

  try {
    const tweetText = socialCopy.xCopy;
    const url = 'https://api.twitter.com/1.1/statuses/update.json';
    const authHeader = buildOAuthHeader('POST', url, `status=${encodeURIComponent(tweetText)}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `status=${encodeURIComponent(tweetText)}`,
    });

    if (!res.ok) {
      const errText = await res.text();
      log('warn', `Twitter API error ${res.status}: ${errText.slice(0, 120)}`);
      return null;
    }

    const data = await res.json();
    log('social', `Tweet posted: https://x.com/user/status/${data.id_str}`);
    return data;
  } catch (err) {
    log('warn', `Twitter post failed: ${err.message}`);
    return null;
  }
}

// ─── Image Upload to Cloudinary via our own API ───────────────────────────────

async function uploadImageFromUrl(imageUrl, blogApiKey) {
  if (!imageUrl) return null;

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const formData = new FormData();
    const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'featured-image.jpg');

    const siteUrl = process.env.SITE_URL || 'https://cosmicspiritguide.com';
    const uploadRes = await fetch(`${siteUrl}/api/upload/image`, {
      method: 'POST',
      headers: { 'x-api-key': blogApiKey },
      body: formData,
    });

    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
    const uploadJson = await uploadRes.json();
    log('img', `Image uploaded: ${uploadJson.url}`);
    return uploadJson.url;
  } catch (err) {
    log('warn', `Image upload failed: ${err.message} — continuing without image`);
    return null;
  }
}

// ─── Create Blog Post via API ─────────────────────────────────────────────────

async function createBlogPost(post, imageUrl, publish, blogApiKey) {
  const title = post.title_options?.[0] || post.title || '';
  const metaDesc = post.meta_description || '';
  const keyword = post.target_keyword || '';
  const theme = getThemeForPost(post);
  const slug = slugify(title.slice(0, 60));
  const content = generateArticleContent(post);

  const siteUrl = process.env.SITE_URL || 'https://cosmicspiritguide.com';

  try {
    const res = await fetch(`${siteUrl}/api/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': blogApiKey,
      },
      body: JSON.stringify({
        title,
        slug,
        excerpt: metaDesc,
        content,
        featured_image: imageUrl,
        status: publish ? 'published' : 'draft',
        category: theme.category,
        meta_title: title,
        meta_description: metaDesc,
        tags: [keyword, theme.category.toLowerCase()],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Blog API error: ${JSON.stringify(err)}`);
    }

    const data = await res.json();

    // ─── DUAL-WRITE: also create in Sanity CMS ─────────────────────────────
    try {
      const sanityResult = await createPostInSanity({
        title,
        slug: data.slug || slug,
        excerpt: metaDesc,
        content,
        featured_image: imageUrl,
        status: publish ? 'published' : 'draft',
        category: theme.category,
        meta_title: title,
        meta_description: metaDesc,
        tags: [keyword, theme.category.toLowerCase()],
      });
      log('ok', `Synced to Sanity CMS: ${sanityResult._id}`);
    } catch (sanityErr) {
      log('warn', `Sanity sync failed (post still created in DB): ${sanityErr.message}`);
    }

    log('post', `Blog post ${publish ? 'published' : 'created'}: ${siteUrl}/blog/${data.slug}`);
    return data;
  } catch (err) {
    log('error', `Failed to create blog post: ${err.message}`);
    return null;
  }
}

// ─── Main Pipeline Run ────────────────────────────────────────────────────────

async function runPipeline(post, publish = false) {
  const blogApiKey = process.env.BLOG_API_KEY;
  const siteUrl = process.env.SITE_URL || 'https://cosmicspiritguide.com';

  if (!blogApiKey) {
    throw new Error('BLOG_API_KEY not configured');
  }

  const title = post.title_options?.[0] || post.title || '';
  log('ok', `[#${post.post_number}] ${title}`);

  // Step 1: Generate image URL (Pollinations.ai — free, no API key)
  const imageUrl = buildImageUrl(post);
  log('img', `Image: ${imageUrl}`);

  // Step 2: Upload image to Cloudinary
  const cloudinaryUrl = await uploadImageFromUrl(imageUrl, blogApiKey);

  // Step 3: Create blog post
  const blogPost = await createBlogPost(post, cloudinaryUrl, publish, blogApiKey);

  // Step 4: Generate social copy
  const slug = blogPost?.slug || slugify(title.slice(0, 60));
  const socialCopy = generateSocialCopy(post, siteUrl, slug);
  log('social', `Social copy generated: ${socialCopy.postUrl}`);

  // Step 5: Auto-post to Twitter if publishing
  if (publish) {
    await postToTwitter(socialCopy);
  }

  return { post: blogPost, social: socialCopy, imageUrl, cloudinaryUrl };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = (process.env.CRON_SECRET || '').trim().replace(/\r?\n/g, '');

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const bearerMatch = authHeader?.match(/^Bearer (.+)$/);
  const provided = bearerMatch ? bearerMatch[1].trim() : '';
  if (provided !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const runAll = searchParams.get('all') === '1';
  const publish = searchParams.get('publish') === '1';
  const postNumber = parseInt(searchParams.get('post') || '0');

  const briefs = loadBriefs();
  const results = [];

  try {
    if (runAll) {
      for (const post of briefs) {
        const result = await runPipeline(post, publish);
        results.push(result);
        await new Promise(r => setTimeout(r, 2000));
      }
      await saveState({ lastPost: briefs[briefs.length - 1].post_number, lastRun: new Date().toISOString() });

    } else if (postNumber > 0) {
      const post = briefs.find(p => p.post_number === postNumber);
      if (!post) {
        return NextResponse.json({ error: `Post #${postNumber} not found` }, { status: 404 });
      }
      const result = await runPipeline(post, publish);
      results.push(result);
      await saveState({ lastPost: postNumber, lastRun: new Date().toISOString() });

    } else {
      // Default: run next unprocessed post (one per cron run)
      const state = await getState();
      const nextPost = briefs.find(p => p.post_number > state.lastPost);

      if (!nextPost) {
        await saveState({ lastPost: 0, lastRun: new Date().toISOString() });
        log('ok', 'All posts processed — state reset for next cycle');
        return NextResponse.json({
          message: 'All posts processed. State reset for next cycle.',
          state: await getState(),
        });
      }

      const result = await runPipeline(nextPost, publish);
      results.push(result);
      await saveState({ lastPost: nextPost.post_number, lastRun: new Date().toISOString() });
    }

    return NextResponse.json({
      success: true,
      postsProcessed: results.length,
      results,
      state: await getState(),
    });

  } catch (err) {
    log('error', `Pipeline failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET handler for status checks
export async function GET(req) {
  const state = await getState();
  const briefs = loadBriefs();
  return NextResponse.json({
    state,
    totalBriefs: briefs.length,
    nextPost: briefs.find(p => p.post_number > state.lastPost)?.post_number || 'all done',
  });
}
