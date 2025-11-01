/** @type {import('next').NextConfig} */
const nextConfig = {
  // SWC minification is enabled by default in Next.js 15
  
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? [process.env.NEXT_PUBLIC_BASE_URL || 'https://cosmicspiritguide.com']
        : ['*']
    },
    // Build optimizations
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  outputFileTracingRoot: __dirname,
  // Fix chunk loading issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Optimize chunks
  output: 'standalone',
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
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai; img-src 'self' data: https:; connect-src 'self' https://nominatim.openstreetmap.org https://maps.googleapis.com https://www.google-analytics.com https://analytics.google.com; frame-ancestors 'none'; frame-src https://js.stripe.com;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:* https://nominatim.openstreetmap.org https://maps.googleapis.com https://www.google-analytics.com https://analytics.google.com; frame-ancestors 'none'; frame-src https://js.stripe.com;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Fix chunk loading for static assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // Fix chunk loading issues
  generateEtags: false,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig