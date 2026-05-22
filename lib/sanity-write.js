/**
 * Sanity Write Operations
 * Dual-write from pipeline to both PostgreSQL + Sanity CMS.
 */
import { sanityWriteClient } from './sanity.js';

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96) || 'uncategorized';
}

function estimateReadingTime(content = '') {
  const text = String(content).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return Math.max(1, Math.ceil((text ? text.split(' ').length : 0) / 200));
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function makeBlock(text, style, index) {
  const cleanText = stripHtml(text);
  if (!cleanText) return null;
  return {
    _type: 'block',
    style,
    _key: `b${index}${slugify(cleanText).slice(0, 18)}`,
    markDefs: [],
    children: [{ _type: 'span', _key: `s${index}`, text: cleanText, marks: [] }],
  };
}

function htmlToPortableText(content = '') {
  const html = String(content || '').trim();
  if (!html) return [];

  const blocks = [];
  const blockRegex = /<(h1|h2|h3|p|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let index = 0;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const raw = match[2];
    const style = tag === 'h1' ? 'h1'
      : tag === 'h2' ? 'h2'
      : tag === 'h3' ? 'h3'
      : tag === 'blockquote' ? 'blockquote'
      : 'normal';

    const block = makeBlock(tag === 'li' ? `• ${raw}` : raw, style, index++);
    if (block) blocks.push(block);
  }

  if (blocks.length > 0) return blocks;

  // Fallback for plain text/markdown-like content: split on headings and paragraph breaks.
  return html
    .replace(/^(#{1,3})\s+(.+)$/gm, (_m, hashes, text) => `\n\n<${hashes.length === 1 ? 'h1' : hashes.length === 2 ? 'h2' : 'h3'}>${text}</${hashes.length === 1 ? 'h1' : hashes.length === 2 ? 'h2' : 'h3'}>\n\n`)
    .split(/\n{2,}/)
    .map((part, i) => {
      const heading = part.match(/^<(h1|h2|h3)>([\s\S]+)<\/\1>$/);
      return makeBlock(heading ? heading[2] : part, heading ? heading[1] : 'normal', i);
    })
    .filter(Boolean);
}

async function ensureCategory(category) {
  if (!category) return undefined;
  const name = String(category).trim();
  const slug = slugify(name);
  const _id = `category.${slug}`;
  await sanityWriteClient.createIfNotExists({
    _id,
    _type: 'category',
    name,
    slug: { _type: 'slug', current: slug },
  });
  return { _type: 'reference', _ref: _id };
}

async function ensureTags(tags = []) {
  const cleanTags = [...new Set((Array.isArray(tags) ? tags : [tags]).filter(Boolean).map(t => String(t).trim()).filter(Boolean))];
  const refs = [];
  for (const name of cleanTags) {
    const slug = slugify(name);
    const _id = `tag.${slug}`;
    await sanityWriteClient.createIfNotExists({
      _id,
      _type: 'tag',
      name,
      slug: { _type: 'slug', current: slug },
    });
    refs.push({ _type: 'reference', _ref: _id, _key: slug });
  }
  return refs;
}

async function buildSanityDoc(post) {
  const slug = slugify(post.slug || post.title);
  const status = post.status === 'published' ? 'published' : 'draft';
  const categoryRef = await ensureCategory(post.category);
  const tagRefs = await ensureTags(post.tags || []);

  const doc = {
    _id: `blogPost.${slug}`,
    _type: 'blogPost',
    title: post.title,
    slug: { _type: 'slug', current: slug },
    excerpt: post.excerpt || post.meta_description || '',
    content: htmlToPortableText(post.content),
    status,
    publishedAt: status === 'published' ? (post.published_at || new Date().toISOString()) : undefined,
    category: categoryRef,
    tags: tagRefs,
    metaTitle: post.meta_title || post.title,
    metaDescription: post.meta_description || post.excerpt || '',
    readingTime: post.reading_time || estimateReadingTime(post.content),
    author: post.author || 'Cosmic Spirit Guide',
  };

  if (post.featured_image) {
    // Sanity image assets require a binary upload. Preserve the external URL for frontend fallback.
    doc.featuredImageUrl = post.featured_image;
  }

  return doc;
}

export async function createPostInSanity(post) {
  const doc = await buildSanityDoc(post);
  const slugLiteral = JSON.stringify(doc.slug.current);
  const existing = await sanityWriteClient.fetch(`*[_type == "blogPost" && slug.current == ${slugLiteral}][0]{_id}`);
  if (existing?._id) doc._id = existing._id;
  return sanityWriteClient.createOrReplace(doc);
}

export async function updatePostInSanity(postId, updates) {
  const doc = await buildSanityDoc({ ...updates, slug: updates.slug || postId.replace(/^blogPost\./, '') });
  doc._id = postId;
  return sanityWriteClient.createOrReplace(doc);
}

export async function deletePostFromSanity(postId) {
  return sanityWriteClient.delete(postId);
}
