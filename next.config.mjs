/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: *.posthog.com *.googleusercontent.com *.githubusercontent.com; connect-src 'self' *.posthog.com ws://localhost:* wss://localhost:* ws://127.0.0.1:* wss://127.0.0.1:*; font-src 'self' data:; frame-src 'self' https://accounts.google.com; object-src 'none'; base-uri 'self';",
  },
];

const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  // PostHog reverse proxy rewrites to avoid tracking blockers
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

