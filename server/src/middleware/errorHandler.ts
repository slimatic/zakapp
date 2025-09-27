import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
  }

  // Log error for debugging (but not in tests)
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', error);
  }

  const response: ErrorResponse = {
    success: false,
    error: errorCode,
    message
  };

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};