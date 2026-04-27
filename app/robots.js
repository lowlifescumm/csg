export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/debug/', '/api/'],
        crawlDelay: 1,
      },
    ],
    sitemap: 'https://cosmicspiritguide.com/sitemap.xml',
  };
}
