import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ERROR_CODES } from '@zakapp/shared';

/**
 * Validation middleware factory for request body validation
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validationErrors,
          },
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_REQUEST,
          message: 'Invalid request data',
        },
      });
    }
  };
}

/**
 * Validation middleware factory for query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Query validation failed',
            details: validationErrors,
          },
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_REQUEST,
          message: 'Invalid query parameters',
        },
      });
    }
  };
}

/**
 * Validation middleware factory for URL parameters
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Parameter validation failed',
            details: validationErrors,
          },
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_REQUEST,
          message: 'Invalid URL parameters',
        },
      });
    }
  };
}
