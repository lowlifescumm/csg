/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? [process.env.NEXT_PUBLIC_BASE_URL || 'https://your-app.onrender.com']
        : ['*']
    }
  },
  devIndicators: {
    appIsrStatus: false
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'production' 
              ? 'public, max-age=3600, s-maxage=86400'
              : 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Optimize for production
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
