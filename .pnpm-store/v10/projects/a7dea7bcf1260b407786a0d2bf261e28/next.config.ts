import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The web app never talks to the NestJS API directly from the browser.
  // All authenticated traffic goes through /api/proxy so the JWT can stay in
  // an httpOnly cookie. See src/app/api/proxy/[...path]/route.ts
  env: {
    NEXT_PUBLIC_APP_NAME: 'BizRecord',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
