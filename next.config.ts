import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
  async redirects() {
    return [
      {
        source: '/chapters/pes',
        destination: '/chapters/pes-sc',
        permanent: true,
      },
      {
        source: '/chapters/sc',
        destination: '/chapters/pes-sc',
        permanent: true,
      },
      {
        source: '/chapters/pels',
        destination: '/chapters/pels-ies',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
