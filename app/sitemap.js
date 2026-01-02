import { pool } from '@/lib/db';

const SITE_URL = 'https://cosmicspiritguide.com';

export default async function sitemap() {
  try {
    // Static pages
    const staticPages = [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
      },
      {
        url: `${SITE_URL}/services`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${SITE_URL}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.5,
      },
      {
        url: `${SITE_URL}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.5,
      },
      {
        url: `${SITE_URL}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${SITE_URL}/credits`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${SITE_URL}/subscription`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
    ];

    // Fetch all published blog posts
    const blogPostsResult = await pool.query(
      `SELECT slug, updated_at, published_at
       FROM blog_posts
       WHERE status = 'published'
       ORDER BY published_at DESC`
    );

    // Log for debugging (can be removed in production)
    if (blogPostsResult.rows.length > 0) {
      console.log(`[Sitemap] Including ${blogPostsResult.rows.length} published blog posts`);
    }

    // Create sitemap entries for each blog post
    const blogPostPages = blogPostsResult.rows.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : (post.published_at ? new Date(post.published_at) : new Date()),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Combine static pages and blog posts
    return [...staticPages, ...blogPostPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least static pages on error
    return [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
      },
      {
        url: `${SITE_URL}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ];
  }
}

