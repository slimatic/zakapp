import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import { z } from 'zod';

// Extend Request type for file uploads
interface RequestWithFile extends Request {
  file?: {
    mimetype: string;
    size: number;
    filename: string;
    originalname: string;
  };
}

/**
 * Input validation middleware for ZakApp API endpoints
 * Follows ZakApp constitutional principle: Privacy & Security First
 */

// Zod schemas for common data types
const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const currencySchema = z.string().length(3, 'Currency must be 3 characters (ISO 4217)');
const positiveNumberSchema = z.number().positive('Value must be positive');
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Handles validation errors and returns standardized error response
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : error.type,
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: validationErrors
      }
    });
  }
  
  next();
};

/**
 * Validates Zod schema against request body
 */
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: (err as any).received
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            details: validationErrors
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Validation processing failed'
      });
    }
  };
};

/**
 * User registration validation
 */
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must be 2-50 characters and contain only letters and spaces'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must be 2-50 characters and contain only letters and spaces'),
  
  // Optional fields validation
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid phone number format'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
    
  // Remove validation handler from here - it will be called separately
];

/**
 * User login validation
 */
export const validateUserLogin = [
  body('username')
    .optional()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  // Custom validator to ensure at least one of username or email is provided
  body().custom((value, { req }) => {
    if (!req.body.username && !req.body.email) {
      throw new Error('Username or email is required');
    }
    return true;
  }),
  
  handleValidationErrors
];

/**
 * Asset creation validation
 */
export const validateAssetCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Asset name is required and must be less than 255 characters'),
  
  body('category')
    .isIn(['cash', 'gold', 'silver', 'crypto', 'business', 'investment', 'property', 'other'])
    .withMessage('Invalid asset category'),
  
  body('value')
    .isFloat({ gt: 0 })
    .withMessage('Asset value must be a positive number'),
  
  body('currency')
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('Currency must be 3-letter ISO code'),
  
  body('acquisitionDate')
    .isISO8601()
    .toDate()
    .withMessage('Valid acquisition date is required'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must be less than 2000 characters'),
  
  handleValidationErrors
];

/**
 * Asset update validation
 */
export const validateAssetUpdate = [
  param('id')
    .isUUID()
    .withMessage('Valid asset ID is required'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Asset name must be less than 255 characters'),
  
  body('value')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Asset value must be a positive number'),
  
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .isAlpha()
    .toUpperCase()
    .withMessage('Currency must be 3-letter ISO code'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  handleValidationErrors
];

/**
 * Zakat calculation validation
 */
export const validateZakatCalculation = [
  body('methodology')
    .isIn(['standard', 'hanafi', 'shafii', 'hanbali', 'maliki'])
    .withMessage('Invalid Islamic methodology'),
  
  body('nisabDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid nisab date is required'),
  
  body('includeGrowth')
    .optional()
    .isBoolean()
    .withMessage('Include growth must be boolean'),
  
  body('deductLiabilities')
    .optional()
    .isBoolean()
    .withMessage('Deduct liabilities must be boolean'),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isAlpha()
    .withMessage('Sort field must contain only letters'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  handleValidationErrors
];

/**
 * ID parameter validation
 */
export const validateIdParam = [
  param('id')
    .isUUID()
    .withMessage('Valid ID is required'),
  
  handleValidationErrors
];

/**
 * Zod schema for asset creation
 */
export const assetCreateSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.enum(['cash', 'gold', 'silver', 'crypto', 'business', 'investment', 'property', 'other']),
  value: positiveNumberSchema,
  currency: currencySchema,
  acquisitionDate: z.string().datetime().or(z.date()),
  description: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

/**
 * Zod schema for user registration
 */
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Must accept terms and conditions'
  })
});

/**
 * Zod schema for user login
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1)
});

/**
 * Zod schema for Zakat calculation
 */
export const zakatCalculationSchema = z.object({
  methodology: z.enum(['standard', 'hanafi', 'shafii', 'hanbali', 'maliki']),
  nisabDate: z.string().datetime().optional(),
  includeGrowth: z.boolean().optional(),
  deductLiabilities: z.boolean().optional(),
  customNisab: positiveNumberSchema.optional()
});

/**
 * Generic sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return obj.trim();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Rate limiting by user ID middleware
 */
export const validateRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId || req.ip;
    const now = Date.now();
    
    const userRequests = requests.get(userId);
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }
    
    userRequests.count++;
    next();
  };
};

/**
 * File upload validation
 */
export const validateFileUpload = (
  allowedTypes: string[],
  maxSizeBytes: number
) => {
  return (req: RequestWithFile, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'File is required'
      });
    }
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      });
    }
    
    if (req.file.size > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `File too large. Maximum size: ${maxSizeBytes} bytes`
      });
    }
    
    next();
  };
};

/**
 * Comprehensive request validation combining multiple validations
 */
export const validateRequest = (validations: any[]) => {
  return [
    sanitizeInput,
    ...validations,
    handleValidationErrors
  ];
};