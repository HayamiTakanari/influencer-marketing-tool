// const { withSentryConfig } = require('@sentry/nextjs'); // Temporarily disabled

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
  
  // XSS対策: セキュリティヘッダーの設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Content Type Options
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Frame Options
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Content Security Policy (temporarily relaxed for debugging)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:",
              "style-src 'self' 'unsafe-inline' https: http:",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' https: http: data:",
              "connect-src 'self' https: http:",
              "media-src 'self' https: http: data: blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)'
          }
        ],
      },
    ];
  },
  
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
      'pbs.twimg.com',
      'res.cloudinary.com',
      'images.unsplash.com'
    ],
    // 画像の安全性を強化
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  // 本番環境でのセキュリティ強化
  poweredByHeader: false, // X-Powered-By ヘッダーを無効化
  
  // 実験的機能：セキュリティ関連
  experimental: {
    serverComponentsExternalPackages: ['dompurify'],
  }
}

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  silent: true, // Suppresses all logs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Upload source maps only in production
  dryRun: process.env.NODE_ENV !== 'production',
  
  // Disable source map upload during development
  widenClientFileUpload: true,
  transpileClientSDK: true,
  hideSourceMaps: true,
  disableLogger: true,
  
  // Release configuration
  release: {
    name: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    uploadLegacySourcemaps: false,
  }
};

// Export regular config (Sentry temporarily disabled)
module.exports = nextConfig;