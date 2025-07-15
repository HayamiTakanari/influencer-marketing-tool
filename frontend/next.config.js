/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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