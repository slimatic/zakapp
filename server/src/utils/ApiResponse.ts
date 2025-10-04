/**
 * API Response Standardization Utility
 * 
 * Constitutional Principles:
 * - User-Centric Design: Consistent, predictable API responses
 * - Transparency & Trust: Clear response structure and metadata
 * - Quality & Reliability: Standardized success/error patterns
 */

import { Response } from 'express';

/**
 * Standard API response structure for all endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
    pagination?: PaginationMeta;
    performance?: PerformanceMeta;
  };
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Performance metadata for monitoring
 */
export interface PerformanceMeta {
  processingTime: number;
  queryCount?: number;
  cacheHit?: boolean;
}

/**
 * List response with pagination
 */
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Options for API responses
 */
interface ResponseOptions {
  requestId?: string;
  version?: string;
  includePerformance?: boolean;
  processingStartTime?: number;
}

/**
 * API Response Builder for consistent response formatting
 */
export class ApiResponseBuilder {
  private static readonly API_VERSION = process.env.API_VERSION || '1.0.0';

  /**
   * Create successful response
   */
  public static success<T>(
    res: Response,
    data: T,
    statusCode = 200,
    options: ResponseOptions = {}
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      meta: this.buildMeta(options)
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Create successful response without data (e.g., for delete operations)
   */
  public static successNoData(
    res: Response,
    statusCode = 204,
    options: ResponseOptions = {}
  ): Response {
    if (statusCode === 204) {
      return res.status(204).end();
    }

    const response: ApiResponse = {
      success: true,
      meta: this.buildMeta(options)
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Create paginated list response
   */
  public static list<T>(
    res: Response,
    items: T[],
    pagination: PaginationMeta,
    statusCode = 200,
    options: ResponseOptions = {}
  ): Response {
    const listData: ListResponse<T> = {
      items,
      pagination
    };

    const response: ApiResponse<ListResponse<T>> = {
      success: true,
      data: listData,
      meta: {
        ...this.buildMeta(options),
        pagination
      }
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Create error response
   */
  public static error(
    res: Response,
    code: string,
    message: string,
    statusCode = 400,
    details?: any,
    options: ResponseOptions = {}
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId: options.requestId
      },
      meta: this.buildMeta(options)
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Create validation error response
   */
  public static validationError(
    res: Response,
    errors: Array<{ field: string; message: string; code?: string }>,
    options: ResponseOptions = {}
  ): Response {
    return this.error(
      res,
      'VALIDATION_ERROR',
      'Validation failed',
      400,
      { validationErrors: errors },
      options
    );
  }

  /**
   * Create authentication error response
   */
  public static unauthorized(
    res: Response,
    message = 'Authentication required',
    options: ResponseOptions = {}
  ): Response {
    return this.error(
      res,
      'UNAUTHORIZED',
      message,
      401,
      undefined,
      options
    );
  }

  /**
   * Create authorization error response
   */
  public static forbidden(
    res: Response,
    message = 'Access denied',
    options: ResponseOptions = {}
  ): Response {
    return this.error(
      res,
      'FORBIDDEN',
      message,
      403,
      undefined,
      options
    );
  }

  /**
   * Create not found error response
   */
  public static notFound(
    res: Response,
    message = 'Resource not found',
    options: ResponseOptions = {}
  ): Response {
    return this.error(
      res,
      'NOT_FOUND',
      message,
      404,
      undefined,
      options
    );
  }

  /**
   * Create conflict error response
   */
  public static conflict(
    res: Response,
    message = 'Resource conflict',
    details?: any,
    options: ResponseOptions = {}
  ): Response {
    return this.error(
      res,
      'CONFLICT',
      message,
      409,
      details,
      options
    );
  }

  /**
   * Create internal server error response
   */
  public static internalError(
    res: Response,
    message = 'Internal server error',
    options: ResponseOptions = {}
  ): Response {
    return this.error(
      res,
      'INTERNAL_ERROR',
      message,
      500,
      undefined,
      options
    );
  }

  /**
   * Build metadata for response
   */
  private static buildMeta(options: ResponseOptions): any {
    const meta: any = {
      timestamp: new Date().toISOString(),
      version: this.API_VERSION
    };

    if (options.requestId) {
      meta.requestId = options.requestId;
    }

    if (options.includePerformance && options.processingStartTime) {
      meta.performance = {
        processingTime: Date.now() - options.processingStartTime
      };
    }

    return meta;
  }
}

/**
 * Express middleware to add response helpers to res object
 */
export interface ExtendedResponse extends Response {
  apiSuccess: <T>(data: T, statusCode?: number) => Response;
  apiSuccessNoData: (statusCode?: number) => Response;
  apiList: <T>(items: T[], pagination: PaginationMeta, statusCode?: number) => Response;
  apiError: (code: string, message: string, statusCode?: number, details?: any) => Response;
  apiValidationError: (errors: Array<{ field: string; message: string; code?: string }>) => Response;
  apiUnauthorized: (message?: string) => Response;
  apiForbidden: (message?: string) => Response;
  apiNotFound: (message?: string) => Response;
  apiConflict: (message?: string, details?: any) => Response;
  apiInternalError: (message?: string) => Response;
}

/**
 * Middleware to enhance response object with API helpers
 */
export const responseMiddleware = (
  req: any,
  res: ExtendedResponse,
  next: any
): void => {
  const options: ResponseOptions = {
    requestId: req.requestId,
    version: ApiResponseBuilder['API_VERSION'],
    includePerformance: process.env.INCLUDE_PERFORMANCE_METRICS === 'true',
    processingStartTime: Date.now()
  };

  // Add helper methods to response object
  res.apiSuccess = <T>(data: T, statusCode = 200) => 
    ApiResponseBuilder.success(res, data, statusCode, options);

  res.apiSuccessNoData = (statusCode = 204) => 
    ApiResponseBuilder.successNoData(res, statusCode, options);

  res.apiList = <T>(items: T[], pagination: PaginationMeta, statusCode = 200) => 
    ApiResponseBuilder.list(res, items, pagination, statusCode, options);

  res.apiError = (code: string, message: string, statusCode = 400, details?: any) => 
    ApiResponseBuilder.error(res, code, message, statusCode, details, options);

  res.apiValidationError = (errors: Array<{ field: string; message: string; code?: string }>) => 
    ApiResponseBuilder.validationError(res, errors, options);

  res.apiUnauthorized = (message?: string) => 
    ApiResponseBuilder.unauthorized(res, message, options);

  res.apiForbidden = (message?: string) => 
    ApiResponseBuilder.forbidden(res, message, options);

  res.apiNotFound = (message?: string) => 
    ApiResponseBuilder.notFound(res, message, options);

  res.apiConflict = (message?: string, details?: any) => 
    ApiResponseBuilder.conflict(res, message, details, options);

  res.apiInternalError = (message?: string) => 
    ApiResponseBuilder.internalError(res, message, options);

  next();
};

/**
 * Utility functions for pagination
 */
export class PaginationUtils {
  /**
   * Calculate pagination metadata
   */
  public static calculatePagination(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Parse pagination parameters from query
   */
  public static parsePaginationQuery(query: any): { page: number; limit: number } {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    
    return { page, limit };
  }

  /**
   * Calculate skip value for database queries
   */
  public static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}

/**
 * Standardized success messages
 */
export const SuccessMessages = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  RETRIEVED: 'Resource retrieved successfully',
  
  // Auth specific
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  PASSWORD_RESET: 'Password reset successful',
  
  // Zakat specific
  CALCULATION_COMPLETE: 'Zakat calculation completed successfully',
  PAYMENT_RECORDED: 'Zakat payment recorded successfully',
  ASSETS_IMPORTED: 'Assets imported successfully',
  BACKUP_CREATED: 'Data backup created successfully'
} as const;

/**
 * Common HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * Response headers for API consistency
 */
export const setStandardHeaders = (res: Response): void => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};