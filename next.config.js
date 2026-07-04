/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 configuration
  reactStrictMode: true,
  output: "standalone",
  env: {
    NEXT_PUBLIC_DASHBOARD_V3: process.env.DASHBOARD_V3 ?? "false",
    NEXT_PUBLIC_DASHBOARD_V3_INVITE: process.env.DASHBOARD_V3_INVITE ?? "",
  },
  
  outputFileTracingRoot: __dirname,

  // Exclude heavy browser-only packages from server bundle
  serverExternalPackages: [
    'playwright',
    '@playwright/test',
    'playwright-core',
    'puppeteer',
    'puppeteer-core',
    '@sparticuz/chromium',
    'pdf-lib',
    '@pdfme/generator',
    '@pdfme/common',
    '@pdfme/schemas',
    '@pdfme/pdf-lib',
    'fontkit',
  ],
  
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
        ],
      },
    ];
  },
  
  poweredByHeader: false,

  // Disable ESLint during build (flat config mismatch with ESLint 8 in Next.js 15)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
