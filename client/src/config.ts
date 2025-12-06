export const getApiBaseUrl = (): string => {
  // Check for runtime configuration (injected via window.APP_CONFIG)
  if (typeof window !== 'undefined' && window.APP_CONFIG?.API_BASE_URL) {
    return window.APP_CONFIG.API_BASE_URL;
  }
  
  // Fallback to build-time environment variable
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
};

// Type definition for the global window object
declare global {
  interface Window {
    APP_CONFIG?: {
      API_BASE_URL?: string;
    };
  }
}
