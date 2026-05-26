import { getNextTransitDates, zodiacSigns } from '@/lib/pseo/astrology';
import { getBlogPosts } from '@/lib/blog-server';

export default async function sitemap() {
  const baseUrl = 'https://cosmicspiritguide.com';
  
  // Static pages
  const staticPages = [
    { path: '/', priority: 1.0 },
    { path: '/about', priority: 0.6 },
    { path: '/birth-chart', priority: 0.9 },
    { path: '/blog', priority: 0.7 },
    { path: '/coach', priority: 0.6 },
    { path: '/compatibility', priority: 0.9 },
    { path: '/contact', priority: 0.5 },
    { path: '/credits', priority: 0.5 },
    { path: '/dashboard', priority: 0.9 },
    { path: '/forecasts', priority: 0.9 },
    { path: '/journal', priority: 0.7 },
    { path: '/login', priority: 0.5 },
    { path: '/moon-reading', priority: 0.9 },
    { path: '/my-chart', priority: 0.9 },
    { path: '/newsletter', priority: 0.6 },
    { path: '/pricing', priority: 0.8 },
    { path: '/privacy', priority: 0.4 },
    { path: '/profile', priority: 0.6 },
    { path: '/reset-password', priority: 0.3 },
    { path: '/services', priority: 0.7 },
    { path: '/subscription', priority: 0.6 },
    { path: '/tarot', priority: 0.9 },
    { path: '/terms', priority: 0.4 },
    { path: '/transits', priority: 0.8 },
  ];

  const sitemapEntries = staticPages.map(page => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: page.priority,
  }));

  const sunMoonPages = zodiacSigns.flatMap((sun) =>
    zodiacSigns.map((moon) => ({
      url: `${baseUrl}/astrology/${sun.slug}/${moon.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))
  );

  const transitPages = getNextTransitDates(30).map((date) => ({
    url: `${baseUrl}/transits/${date}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.75,
  }));

  let blogPostPages = [];
  try {
    const blogResult = await getBlogPosts({ status: 'published', limit: 10000 });
    const blogPosts = blogResult?.posts || [];

    if (!blogPosts.length) {
      const total = blogResult?.pagination?.total;
      console.warn('Sitemap: 0 blog posts returned from getBlogPosts (pagination total:', total, ')');
    }

    blogPostPages = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : post.updated_at ? new Date(post.updated_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.65,
    }));
  } catch (error) {
    console.warn('Failed to fetch blog posts for sitemap, continuing with existing entries:', error?.message || error);
  }

  return [...sitemapEntries, ...sunMoonPages, ...transitPages, ...blogPostPages];
}
