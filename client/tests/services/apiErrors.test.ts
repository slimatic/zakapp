/**
 * @jest-environment jsdom
 */
import { 
  ApiError, 
  AuthenticationError, 
  AuthorizationError,
  ValidationError,
  NotFoundError,
  NetworkError,
  isAuthenticationError,
  isAuthorizationError,
  isApiError
} from '../../src/services/apiErrors';

describe('API Error Classes', () => {
  describe('ApiError', () => {
    it('should create an ApiError with correct properties', () => {
      const error = new ApiError('Test error', 500, 'TEST_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('ApiError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError with default message', () => {
      const error = new AuthenticationError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Session expired. Please login again.');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should create an AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Custom auth error');
      
      expect(error.message).toBe('Custom auth error');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('AuthorizationError', () => {
    it('should create an AuthorizationError with default message', () => {
      const error = new AuthorizationError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toBe('You do not have permission to perform this action.');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.name).toBe('AuthorizationError');
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with default message', () => {
      const error = new ValidationError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed.');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should store validation errors', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' }
      ];
      const error = new ValidationError('Validation failed', validationErrors);
      
      expect(error.validationErrors).toEqual(validationErrors);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with default message', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Resource not found.');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('NetworkError', () => {
    it('should create a NetworkError with default message', () => {
      const error = new NetworkError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Network error occurred. Please check your connection.');
      expect(error.name).toBe('NetworkError');
    });
  });

  describe('Type guards', () => {
    it('isAuthenticationError should correctly identify AuthenticationError', () => {
      const authError = new AuthenticationError();
      const otherError = new Error('regular error');
      const apiError = new ApiError('api error', 500, 'API_ERROR');
      
      expect(isAuthenticationError(authError)).toBe(true);
      expect(isAuthenticationError(otherError)).toBe(false);
      expect(isAuthenticationError(apiError)).toBe(false);
    });

    it('isAuthorizationError should correctly identify AuthorizationError', () => {
      const authzError = new AuthorizationError();
      const otherError = new Error('regular error');
      const authError = new AuthenticationError();
      
      expect(isAuthorizationError(authzError)).toBe(true);
      expect(isAuthorizationError(otherError)).toBe(false);
      expect(isAuthorizationError(authError)).toBe(false);
    });

    it('isApiError should correctly identify ApiError and its subclasses', () => {
      const apiError = new ApiError('test', 500, 'TEST');
      const authError = new AuthenticationError();
      const validationError = new ValidationError();
      const regularError = new Error('regular error');
      
      expect(isApiError(apiError)).toBe(true);
      expect(isApiError(authError)).toBe(true);
      expect(isApiError(validationError)).toBe(true);
      expect(isApiError(regularError)).toBe(false);
    });
  });
});
