/**
 * Sanity Write Operations
 * Dual-write from pipeline to both PostgreSQL + Sanity CMS
 * Using lightweight HTTP client (no npm dependency).
 */
import { sanityWriteClient } from './sanity.js';

export async function createPostInSanity(post) {
  const doc = {
    _type: 'blogPost',
    title: post.title,
    slug: { _type: 'slug', current: post.slug },
    excerpt: post.excerpt || '',
    body: post.content
      ? post.content.split('\n\n').filter(Boolean).map(p => ({
          _type: 'block',
          style: 'normal',
          _key: p.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '') + Math.random().toString(36).slice(2, 6),
          children: [{ _type: 'span', text: p.replace(/<[^\u003e]*>/g, '').replace(/\s+/g, ' ').trim() }]
        }))
      : [],
    publishedAt: post.status === 'published' ? new Date().toISOString() : undefined,
    status: post.status === 'published' ? 'published' : 'draft',
    categories: post.category ? [{ _type: 'reference', _ref: post.category }] : [],
    tags: post.tags || [],
    metaTitle: post.meta_title || post.title,
    metaDescription: post.meta_description || post.excerpt || '',
  };

  if (post.featured_image) {
    // If it's a raw URL, can't create a proper image ref in Sanity without uploading.
    // For now, store as a string field or skip. Proper image asset upload requires binary.
    doc.featuredImageUrl = post.featured_image;
  }

  const result = await sanityWriteClient.create(doc);
  return result;
}

export async function updatePostInSanity(postId, updates) {
  const patch = await sanityWriteClient.patch(postId);
  patch.set({
    title: updates.title,
    excerpt: updates.excerpt,
    'slug.current': updates.slug,
    body: updates.content
      ? updates.content.split('\n\n').filter(Boolean).map(p => ({
          _type: 'block',
          style: 'normal',
          _key: p.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '') + Math.random().toString(36).slice(2, 6),
          children: [{ _type: 'span', text: p.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() }]
        }))
      : undefined,
    status: updates.status === 'published' ? 'published' : 'draft',
    metaTitle: updates.meta_title || updates.title,
    metaDescription: updates.meta_description || updates.excerpt || '',
    publishedAt: updates.status === 'published' ? new Date().toISOString() : undefined,
  });
  return patch.commit();
}

export async function deletePostFromSanity(postId) {
  return sanityWriteClient.delete(postId);
}
