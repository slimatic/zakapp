/**
 * Custom API Error Types
 * 
 * These error types are designed to be caught by React components
 * so they can handle navigation using React Router instead of
 * causing full page reloads with window.location.
 */

/**
 * Base API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Authentication error - indicates user needs to log in
 * 
 * Components should catch this error and use React Router's
 * useNavigate to redirect to /login instead of using window.location
 */
export class AuthenticationError extends ApiError {
  constructor(message = 'Session expired. Please login again.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
}

/**
 * Authorization error - indicates user lacks permission
 */
export class AuthorizationError extends ApiError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError);
    }
  }
}

/**
 * Validation error - indicates invalid input
 */
export class ValidationError extends ApiError {
  constructor(
    message = 'Validation failed.',
    public validationErrors?: any[]
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Not found error - indicates resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found.') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}

/**
 * Network error - indicates connection issues
 */
export class NetworkError extends Error {
  constructor(message = 'Network error occurred. Please check your connection.') {
    super(message);
    this.name = 'NetworkError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * Type guard to check if an error is an AuthenticationError
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Type guard to check if an error is an AuthorizationError
 */
export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
