/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

export const getApiBaseUrl = (): string => {
  // Check for runtime configuration (injected via window.APP_CONFIG)
  if (typeof window !== 'undefined' && window.APP_CONFIG?.API_BASE_URL) {
    return window.APP_CONFIG.API_BASE_URL;
  }

  // Fallback to build-time environment variable
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
};

export const getFeedbackEnabled = (): boolean => {
  // Check for runtime configuration
  if (typeof window !== 'undefined' && window.APP_CONFIG?.FEEDBACK_ENABLED) {
    return window.APP_CONFIG.FEEDBACK_ENABLED === 'true';
  }

  // Fallback to build-time environment variable
  return import.meta.env.VITE_FEEDBACK_ENABLED === 'true';
};

export const getFeedbackWebhookUrl = (): string => {
  // Check for runtime configuration
  if (typeof window !== 'undefined' && window.APP_CONFIG?.FEEDBACK_WEBHOOK_URL) {
    return window.APP_CONFIG.FEEDBACK_WEBHOOK_URL;
  }

  // Fallback to build-time environment variable
  return import.meta.env.VITE_FEEDBACK_WEBHOOK_URL || '';
};

/**
 * CouchDB Configuration
 * Priority: window.APP_CONFIG > import.meta.env > hostname-based fallback
 */
export const getCouchDbUrl = (): string => {
  // Priority 1: Runtime config (production/Cloudflare Tunnel)
  if (typeof window !== 'undefined' && window.APP_CONFIG?.COUCHDB_URL) {
    return window.APP_CONFIG.COUCHDB_URL;
  }

  // Priority 2: Build-time env var
  if (import.meta.env.VITE_COUCHDB_URL) {
    return import.meta.env.VITE_COUCHDB_URL;
  }

  // Priority 3: Hostname-based fallback (for LAN development)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:5984`;
  }

  return 'http://localhost:5984';
};

/**
 * @deprecated Will be removed after JWT implementation
 * Temporary: Used for Basic Auth before JWT migration
 */
export const getCouchDbUser = (): string => {
  if (typeof window !== 'undefined' && window.APP_CONFIG?.COUCHDB_USER) {
    return window.APP_CONFIG.COUCHDB_USER;
  }
  return import.meta.env.VITE_COUCHDB_USER || 'admin';
};

/**
 * @deprecated Will be removed after JWT implementation
 * Temporary: Used for Basic Auth before JWT migration
 */
export const getCouchDbPassword = (): string => {
  if (typeof window !== 'undefined' && window.APP_CONFIG?.COUCHDB_PASSWORD) {
    return window.APP_CONFIG.COUCHDB_PASSWORD;
  }
  return import.meta.env.VITE_COUCHDB_PASSWORD || 'password';
};

export const getFeedbackEmail = (): string => {
  // Check for runtime configuration
  if (typeof window !== 'undefined' && window.APP_CONFIG?.FEEDBACK_EMAIL) {
    return window.APP_CONFIG.FEEDBACK_EMAIL;
  }

  // Fallback to build-time environment variable
  return import.meta.env.VITE_FEEDBACK_EMAIL || '';
};

// Type definition for the global window object
declare global {
  interface Window {
    APP_CONFIG?: {
      API_BASE_URL?: string;
      FEEDBACK_ENABLED?: string;
      FEEDBACK_WEBHOOK_URL?: string;
      FEEDBACK_EMAIL?: string;
      COUCHDB_URL?: string;
      COUCHDB_USER?: string;      // @deprecated - remove after JWT
      COUCHDB_PASSWORD?: string;  // @deprecated - remove after JWT
    };
  }
}

