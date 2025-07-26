import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment identification
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay (for debugging)
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  
  // Capture console logs as breadcrumbs
  beforeBreadcrumb(breadcrumb, hint) {
    if (breadcrumb.category === 'console' && breadcrumb.level === 'error') {
      return breadcrumb;
    }
    return breadcrumb;
  },
  
  // Filter sensitive information
  beforeSend(event, hint) {
    // Remove sensitive data from URLs
    if (event.request && event.request.url) {
      event.request.url = event.request.url.replace(/([?&])(password|token|api_key)=[^&]*/gi, '$1$2=***');
    }
    
    // Remove sensitive data from form data
    if (event.request && event.request.data) {
      if (typeof event.request.data === 'object') {
        const sanitized = { ...event.request.data };
        ['password', 'token', 'apiKey', 'accessToken'].forEach(key => {
          if (sanitized[key]) sanitized[key] = '***';
        });
        event.request.data = sanitized;
      }
    }
    
    return event;
  },
  
  integrations: [
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Additional tags
  tags: {
    component: 'frontend',
    framework: 'nextjs'
  }
});