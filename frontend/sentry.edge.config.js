import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment identification
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  
  // Edge runtime specific configuration
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Additional tags
  tags: {
    component: 'frontend-edge',
    framework: 'nextjs'
  }
});