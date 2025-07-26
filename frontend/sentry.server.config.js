import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment identification
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Server-side specific configuration
  beforeSend(event, hint) {
    // Server-side filtering
    if (event.request && event.request.headers) {
      // Remove authorization headers
      const headers = { ...event.request.headers };
      ['authorization', 'cookie', 'x-api-key'].forEach(header => {
        if (headers[header]) headers[header] = '***';
      });
      event.request.headers = headers;
    }
    
    return event;
  },
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Additional tags
  tags: {
    component: 'frontend-ssr',
    framework: 'nextjs'
  }
});