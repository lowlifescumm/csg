import { MetadataRoute } from 'next';

export default function sitemap() {
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

  return sitemapEntries;
}
