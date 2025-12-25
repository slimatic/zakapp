export const getApiBaseUrl = (): string => {
  // Check for runtime configuration (injected via window.APP_CONFIG)
  if (typeof window !== 'undefined' && window.APP_CONFIG?.API_BASE_URL) {
    return window.APP_CONFIG.API_BASE_URL;
  }

  // Fallback to build-time environment variable
  // Force localhost for connection debugging
  return 'http://localhost:3001/api';
  // return process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
};

export const getFeedbackEnabled = (): boolean => {
  // Check for runtime configuration
  if (typeof window !== 'undefined' && window.APP_CONFIG?.FEEDBACK_ENABLED) {
    return window.APP_CONFIG.FEEDBACK_ENABLED === 'true';
  }

  // Fallback to build-time environment variable
  return process.env.REACT_APP_FEEDBACK_ENABLED === 'true';
};

export const getFeedbackWebhookUrl = (): string => {
  // Check for runtime configuration
  if (typeof window !== 'undefined' && window.APP_CONFIG?.FEEDBACK_WEBHOOK_URL) {
    return window.APP_CONFIG.FEEDBACK_WEBHOOK_URL;
  }

  // Fallback to build-time environment variable
  return process.env.REACT_APP_FEEDBACK_WEBHOOK_URL || '';
};

// Type definition for the global window object
declare global {
  interface Window {
    APP_CONFIG?: {
      API_BASE_URL?: string;
      FEEDBACK_ENABLED?: string;
      FEEDBACK_WEBHOOK_URL?: string;
    };
  }
}
