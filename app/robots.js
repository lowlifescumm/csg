const SITE_URL = 'https://cosmicspiritguide.com';

export default function robots() {
  // Sitemap is always available at /sitemap.xml
  const sitemapUrl = `${SITE_URL}/sitemap.xml`;

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

