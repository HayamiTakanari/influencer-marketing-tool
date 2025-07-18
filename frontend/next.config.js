/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  // Ensure dynamic routes work on Vercel
  async rewrites() {
    return [
      {
        source: '/projects/:id',
        destination: '/projects/[id]',
      },
    ];
  },
  images: {
    domains: [
      'localhost',
      'instagram.com',
      'scontent.cdninstagram.com',
      'youtube.com',
      'i.ytimg.com',
      'tiktok.com',
      'p16-sign-sg.tiktokcdn.com',
      'pbs.twimg.com'
    ]
  }
}

module.exports = nextConfig