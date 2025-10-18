/**
 * Comprehensive Error Handling Middleware
 * 
 * Constitutional Principles:
 * - Privacy & Security First: Sanitized error messages, no sensitive data leaks
 * - User-Centric Design: User-friendly error messages and guidance
 * - Quality & Reliability: Comprehensive error tracking and logging
 * - Transparency & Trust: Clear error explanations without security risks
 */

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Database & Resource
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  
  // Business Logic
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_CALCULATION = 'INVALID_CALCULATION',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  NISAB_THRESHOLD_ERROR = 'NISAB_THRESHOLD_ERROR',
  
  // Asset Management
  ASSET_NOT_FOUND = 'ASSET_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  IMPORT_FAILED = 'IMPORT_FAILED',
  
  // Encryption & Security
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  DECRYPTION_ERROR = 'DECRYPTION_ERROR',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  
  // Islamic Compliance
  METHODOLOGY_ERROR = 'METHODOLOGY_ERROR',
  HARAM_ASSET_DETECTED = 'HARAM_ASSET_DETECTED',
  CALCULATION_METHOD_INVALID = 'CALCULATION_METHOD_INVALID'
}

/**
 * Application error class with structured error information
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly userMessage?: string;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    userMessage?: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.userMessage = userMessage;
    this.timestamp = new Date();
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response format for API consistency
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    userMessage?: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Request interface with additional properties
 */
interface ExtendedRequest extends Request {
  requestId?: string;
  userId?: string;
}

/**
 * Error logging service
 */
class ErrorLogger {
  private static instance: ErrorLogger;

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log error with context information
   */
  public logError(
    error: Error, 
    req: ExtendedRequest, 
    additionalContext?: any
  ): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as AppError).code || 'UNKNOWN'
      },
      request: {
        id: req.requestId,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.userId
      },
      context: additionalContext
    };

    // In production, this would integrate with proper logging service
    console.error('Application Error:', JSON.stringify(errorInfo, null, 2));
    
    // For critical errors, could trigger alerts
    if ((error as AppError).statusCode >= 500) {
      this.triggerAlert(errorInfo);
    }
  }

  /**
   * Trigger alert for critical errors
   */
  private triggerAlert(errorInfo: any): void {
    // In production, integrate with alerting service (e.g., PagerDuty, Slack)
    console.error('🚨 CRITICAL ERROR ALERT:', errorInfo);
  }
}

/**
 * Convert various error types to AppError
 */
export class ErrorConverter {
  /**
   * Convert Prisma errors to AppError
   */
  public static fromPrismaError(error: any): AppError {
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return new AppError(
            'Unique constraint violation',
            409,
            ErrorCode.DUPLICATE_RECORD,
            'A record with this information already exists',
            { field: error.meta?.target }
          );
        case 'P2025':
          return new AppError(
            'Record not found',
            404,
            ErrorCode.RECORD_NOT_FOUND,
            'The requested resource was not found'
          );
        case 'P2003':
          return new AppError(
            'Foreign key constraint violation',
            400,
            ErrorCode.FOREIGN_KEY_VIOLATION,
            'Cannot perform this operation due to related data constraints'
          );
        default:
          return new AppError(
            'Database operation failed',
            500,
            ErrorCode.DATABASE_ERROR,
            'A database error occurred. Please try again.'
          );
      }
    }

    if (error instanceof PrismaClientValidationError) {
      return new AppError(
        'Database validation error',
        400,
        ErrorCode.VALIDATION_ERROR,
        'The provided data is invalid',
        { originalError: error.message }
      );
    }

    return new AppError(
      'Database error',
      500,
      ErrorCode.DATABASE_ERROR,
      'A database error occurred. Please try again.'
    );
  }

  /**
   * Convert Zod validation errors to AppError
   */
  public static fromZodError(error: ZodError): AppError {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));

    return new AppError(
      'Validation failed',
      400,
      ErrorCode.VALIDATION_ERROR,
      'Please check your input and try again',
      { validationErrors: formattedErrors }
    );
  }

  /**
   * Convert JWT errors to AppError
   */
  public static fromJWTError(error: Error): AppError {
    if (error.name === 'TokenExpiredError') {
      return new AppError(
        'Token has expired',
        401,
        ErrorCode.TOKEN_EXPIRED,
        'Your session has expired. Please log in again.'
      );
    }

    if (error.name === 'JsonWebTokenError') {
      return new AppError(
        'Invalid token',
        401,
        ErrorCode.UNAUTHORIZED,
        'Authentication failed. Please log in again.'
      );
    }

    return new AppError(
      'Authentication error',
      401,
      ErrorCode.UNAUTHORIZED,
      'Authentication failed. Please log in again.'
    );
  }
}

/**
 * Main error handling middleware
 */
export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): void => {
  const logger = ErrorLogger.getInstance();
  let appError: AppError;

  // Convert different error types to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error.name.includes('Prisma')) {
    appError = ErrorConverter.fromPrismaError(error);
  } else if (error instanceof ZodError) {
    appError = ErrorConverter.fromZodError(error);
  } else if (error.name.includes('JsonWebToken') || error.name.includes('Token')) {
    appError = ErrorConverter.fromJWTError(error);
  } else {
    // Unknown error - don't expose details
    appError = new AppError(
      'Internal server error',
      500,
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred. Please try again.',
      undefined,
      false // Mark as non-operational
    );
  }

  // Log the error
  logger.logError(appError, req);

  // Create response
  const response: ErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.userMessage || appError.message,
      timestamp: appError.timestamp.toISOString(),
      requestId: req.requestId
    }
  };

  // Include details only in development
  if (process.env.NODE_ENV === 'development') {
    response.error.details = appError.details;
    response.error.message = appError.message; // Use technical message in dev
  }

  // Send response
  res.status(appError.statusCode).json(response);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    ErrorCode.RECORD_NOT_FOUND,
    'The requested resource was not found'
  );
  
  next(error);
};

/**
 * Async error wrapper to catch promise rejections
 */
export const asyncHandler = (
  fn: (req: ExtendedRequest, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: ExtendedRequest, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error helper
 */
export const createValidationError = (
  message: string,
  field?: string,
  details?: any
): AppError => {
  return new AppError(
    message,
    400,
    ErrorCode.VALIDATION_ERROR,
    'Please check your input and try again',
    { field, ...details }
  );
};

/**
 * Authentication error helper
 */
export const createAuthError = (
  message = 'Authentication required',
  userMessage = 'Please log in to access this resource'
): AppError => {
  return new AppError(
    message,
    401,
    ErrorCode.UNAUTHORIZED,
    userMessage
  );
};

/**
 * Authorization error helper
 */
export const createAuthorizationError = (
  message = 'Access denied',
  userMessage = 'You do not have permission to access this resource'
): AppError => {
  return new AppError(
    message,
    403,
    ErrorCode.FORBIDDEN,
    userMessage
  );
};

/**
 * Islamic compliance error helper
 */
export const createIslamicComplianceError = (
  message: string,
  userMessage: string,
  details?: any
): AppError => {
  return new AppError(
    message,
    400,
    ErrorCode.METHODOLOGY_ERROR,
    userMessage,
    details
  );
};

/**
 * Request ID middleware for error tracking
 */
export const requestIdMiddleware = (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): void => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Process uncaught exceptions and rejections
 */
export const setupGlobalErrorHandlers = (): void => {
  const logger = ErrorLogger.getInstance();

  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    logger.logError(error, {} as ExtendedRequest, { type: 'uncaughtException' });
    
    // Graceful shutdown
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logger.logError(
      new Error(reason), 
      {} as ExtendedRequest, 
      { type: 'unhandledRejection' }
    );
    
    // Graceful shutdown
    process.exit(1);
  });
};

export { ErrorLogger };