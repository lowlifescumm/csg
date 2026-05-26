import { getNextTransitDates, zodiacSigns } from '@/lib/pseo/astrology';
import { getAllBlogPostSlugs } from '@/lib/blog-server';
import { getAllCardSlugs } from '@/lib/tarot-data';
import { getAllPairSlugs } from '@/lib/compatibility-data';

export default async function sitemap() {
  const baseUrl = 'https://cosmicspiritguide.com';
  
  const staticPages = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/birth-chart', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/coach', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/compatibility', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/credits', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/dashboard', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/energy', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/forecasts', changeFrequency: 'daily', priority: 0.9 },
    { path: '/horoscope', changeFrequency: 'daily', priority: 0.8 },
    { path: '/journal', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/login', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/moon-phase', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/moon-reading', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/my-chart', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/newsletter', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/pricing', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/privacy', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/profile', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/reset-password', changeFrequency: 'monthly', priority: 0.3 },
    { path: '/services', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/subscription', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/tarot', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/terms', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/transits', changeFrequency: 'daily', priority: 0.8 },
    { path: '/zodiac', changeFrequency: 'weekly', priority: 0.8 },
  ];

  const sitemapEntries = staticPages.map(page => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
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

  const horoscopePages = zodiacSigns.map((sign) => ({
    url: `${baseUrl}/horoscope/${sign.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const zodiacPages = zodiacSigns.map((sign) => ({
    url: `${baseUrl}/zodiac/${sign.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const tarotCardSlugs = getAllCardSlugs();
  const tarotPages = tarotCardSlugs.map((slug) => ({
    url: `${baseUrl}/tarot/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const pairSlugs = getAllPairSlugs();
  const compatibilityPages = pairSlugs.map((pair) => ({
    url: `${baseUrl}/compatibility/${pair}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  let blogPages = [];
  try {
    const slugs = await getAllBlogPostSlugs();
    blogPages = (slugs || []).map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.published_at || Date.now()),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
  } catch (error) {
    console.warn('Failed to fetch blog posts for sitemap:', error.message);
  }

  return [...sitemapEntries, ...sunMoonPages, ...transitPages, ...horoscopePages, ...zodiacPages, ...tarotPages, ...compatibilityPages, ...blogPages];
}
