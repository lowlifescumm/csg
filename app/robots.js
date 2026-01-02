import { pool } from '@/lib/db';

const SITE_URL = 'https://cosmicspiritguide.com';

export default async function robots() {
  // Check if we have published blog posts to determine sitemap availability
  let sitemapUrl = `${SITE_URL}/sitemap.xml`;
  
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM blog_posts WHERE status = $1',
      ['published']
    );
    // Sitemap is always available, even if no blog posts
  } catch (error) {
    console.error('Error checking blog posts for robots.txt:', error);
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/advisor/',
          '/marketplace/',
          '/login',
          '/signup',
          '/reset-password',
          '/forgot-password',
          '/test-',
          '/debug',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/advisor/',
          '/marketplace/',
          '/login',
          '/signup',
          '/reset-password',
          '/forgot-password',
          '/test-',
          '/debug',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/advisor/',
          '/marketplace/',
          '/login',
          '/signup',
          '/reset-password',
          '/forgot-password',
          '/test-',
          '/debug',
        ],
      },
    ],
    sitemap: sitemapUrl,
  };
}

