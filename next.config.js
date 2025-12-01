/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 configuration
  reactStrictMode: true,
  output: "standalone",
  env: {
    NEXT_PUBLIC_DASHBOARD_V3: process.env.DASHBOARD_V3 ?? "false",
    NEXT_PUBLIC_DASHBOARD_V3_INVITE: process.env.DASHBOARD_V3_INVITE ?? "",
  },
  
  // Configure headers to remove unnecessary ones and improve security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Note: X-XSS-Protection is deprecated and should not be set
          // Note: Pragma header is set by Next.js/Render and cannot be removed here
          // Note: Cache-Control headers are managed by Next.js for optimal performance
        ],
      },
    ];
  },
  
  // Remove X-Powered-By header
  poweredByHeader: false,
};

module.exports = nextConfig;
