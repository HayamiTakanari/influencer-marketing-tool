// Temporarily disabled error tracking to fix button functionality

export interface UserContext {
  id: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  url?: string;
}

// Mock implementations to prevent build errors
export const setUserContext = (user: UserContext) => {
  console.log('Error tracking disabled - setUserContext called');
};

export const clearUserContext = () => {
  console.log('Error tracking disabled - clearUserContext called');
};

export const setTag = (key: string, value: string) => {
  console.log('Error tracking disabled - setTag called');
};

export const captureError = (error: Error | string, context?: ErrorContext) => {
  console.error('Error (tracking disabled):', error, context);
};

export const captureWarning = (message: string, context?: ErrorContext) => {
  console.warn('Warning (tracking disabled):', message, context);
};

export const captureInfo = (message: string, context?: ErrorContext) => {
  console.info('Info (tracking disabled):', message, context);
};

export const startTransaction = (options: any) => {
  console.log('Error tracking disabled - startTransaction called');
  return {
    finish: () => {},
    setTag: () => {},
    setData: () => {},
  };
};

export const trackPerformance = (name: string, fn: () => Promise<any>) => {
  console.log('Error tracking disabled - trackPerformance called');
  return fn();
};

export const trackError = (error: Error, context?: ErrorContext) => {
  console.error('Error (tracking disabled):', error, context);
};

export const addBreadcrumb = (breadcrumb: any) => {
  console.log('Error tracking disabled - addBreadcrumb called');
};

export const trackUserAction = (action: string, data?: Record<string, any>) => {
  console.log('Error tracking disabled - trackUserAction called');
};

export const trackFeatureFlag = (flag: string, enabled: boolean) => {
  console.log('Error tracking disabled - trackFeatureFlag called');
};

export const trackExperiment = (experiment: string, variant: string) => {
  console.log('Error tracking disabled - trackExperiment called');
};

export const trackAPICall = (endpoint: string, method: string, duration: number, status: number) => {
  // Error tracking disabled in development
};

export const trackPageView = (page: string, properties?: Record<string, any>) => {
  // Error tracking disabled in development
};