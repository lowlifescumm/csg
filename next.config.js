/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 configuration
  reactStrictMode: true,
  output: "standalone",
  env: {
    NEXT_PUBLIC_DASHBOARD_V3: process.env.DASHBOARD_V3 ?? "false",
    NEXT_PUBLIC_DASHBOARD_V3_INVITE: process.env.DASHBOARD_V3_INVITE ?? "",
  },
};

module.exports = nextConfig;
