/**
 * Security Middleware - Headers, CORS, and Security Policies
 * 
 * Constitutional Principles:
 * - Privacy & Security First: Comprehensive security headers and CORS protection
 * - Quality & Reliability: Defense in depth security approach
 * - User-Centric Design: Secure by default with user-friendly security measures
 */

import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppError, ErrorCode } from './ErrorHandler';

/**
 * CORS configuration options
 */
interface CorsConfig {
  origins: string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  maxAge: number;
}

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

/**
 * Security configuration options
 */
interface SecurityConfig {
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  contentSecurityPolicy: boolean;
  trustProxy: boolean;
  enableHsts: boolean;
  enableXssProtection: boolean;
}

/**
 * Security middleware manager
 */
export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private config: SecurityConfig;

  private constructor() {
    this.config = this.loadSecurityConfig();
  }

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Load security configuration from environment
   */
  private loadSecurityConfig(): SecurityConfig {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      cors: {
        origins: this.parseOrigins(),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
          'X-Request-ID',
          'X-API-Key'
        ],
        maxAge: isProduction ? 86400 : 300 // 24 hours in prod, 5 minutes in dev
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        message: 'Too many requests from this IP, please try again later',
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      contentSecurityPolicy: isProduction,
      trustProxy: isProduction,
      enableHsts: isProduction,
      enableXssProtection: true
    };
  }

  /**
   * Parse allowed origins from environment
   */
  private parseOrigins(): string[] {
    const originsString = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173';
    return originsString.split(',').map(origin => origin.trim());
  }

  /**
   * Configure and get CORS middleware
   */
  public getCorsMiddleware() {
    const corsOptions = {
      origin: (origin: string | undefined, callback: Function) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Check if origin is in allowed list
        if (this.config.cors.origins.includes(origin)) {
          return callback(null, true);
        }

        // Development environment - allow localhost variants
        if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
          return callback(null, true);
        }

        // Reject unauthorized origins
        const error = new AppError(
          `Origin ${origin} not allowed by CORS policy`,
          403,
          ErrorCode.FORBIDDEN,
          'Access denied: Origin not allowed'
        );
        callback(error, false);
      },
      credentials: this.config.cors.credentials,
      methods: this.config.cors.methods,
      allowedHeaders: this.config.cors.allowedHeaders,
      maxAge: this.config.cors.maxAge,
      optionsSuccessStatus: 200 // For legacy browser support
    };

    return cors(corsOptions);
  }

  /**
   * Configure and get Helmet security middleware
   */
  public getHelmetMiddleware() {
    return helmet({
      // Content Security Policy
      contentSecurityPolicy: this.config.contentSecurityPolicy ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
      } : false,

      // HTTP Strict Transport Security
      hsts: this.config.enableHsts ? {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      } : false,

      // X-Frame-Options
      frameguard: { action: 'deny' },

      // X-Content-Type-Options
      noSniff: true,

      // X-XSS-Protection
      xssFilter: this.config.enableXssProtection,

      // Referrer Policy
      referrerPolicy: { policy: 'same-origin' }

      // Note: permissionsPolicy is not part of helmet, handled separately
    });
  }

  /**
   * Configure and get rate limiting middleware
   */
  public getRateLimitMiddleware() {
    return rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        success: false,
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: this.config.rateLimit.message,
          timestamp: new Date().toISOString()
        }
      },
      skipSuccessfulRequests: this.config.rateLimit.skipSuccessfulRequests,
      skipFailedRequests: this.config.rateLimit.skipFailedRequests,
      standardHeaders: true,
      legacyHeaders: false,
      // Custom key generator for user-based rate limiting
      keyGenerator: (req: Request) => {
        // Use user ID if authenticated, otherwise use IP
        return (req as any).userId || req.ip;
      },
      // Custom handler for rate limit exceeded
      handler: (req: Request, res: Response) => {
        const error = new AppError(
          'Rate limit exceeded',
          429,
          ErrorCode.RATE_LIMIT_EXCEEDED,
          'Too many requests. Please slow down and try again later.'
        );

        res.status(429).json({
          success: false,
          error: {
            code: error.code,
            message: error.userMessage,
            timestamp: error.timestamp.toISOString(),
            retryAfter: Math.ceil(this.config.rateLimit.windowMs / 1000)
          }
        });
      }
    });
  }

  /**
   * Strict rate limiter for sensitive endpoints (auth, payment)
   */
  public getStrictRateLimitMiddleware() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Much stricter limit
      message: {
        success: false,
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Too many attempts. Please wait before trying again.',
          timestamp: new Date().toISOString()
        }
      },
      skipSuccessfulRequests: true, // Don't count successful requests
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        // For auth endpoints, use IP + email if available
        const email = req.body?.email || '';
        return `${req.ip}:${email}`;
      }
    });
  }
}

/**
 * Additional security headers middleware
 */
export const additionalSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Remove server information
  res.removeHeader('X-Powered-By');

  // Set custom security headers
  res.setHeader('X-Security-Policy', 'ZakApp-Security-v1.0');
  res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');

  // Privacy headers
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};

/**
 * Request sanitization middleware
 */
export const requestSanitizer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove potentially dangerous characters from query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).replace(/[<>\"']/g, '');
      }
    }
  }

  // Basic request body sanitization (if not JSON)
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove script tags and other dangerous content
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * IP whitelist middleware for admin endpoints
 */
export const ipWhitelistMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
  
  if (allowedIPs.length === 0) {
    // If no whitelist configured, allow all (for development)
    return next();
  }

  const clientIP = req.ip;
  
  if (!allowedIPs.includes(clientIP)) {
    const error = new AppError(
      'IP address not authorized',
      403,
      ErrorCode.FORBIDDEN,
      'Access denied from this location'
    );
    return next(error);
  }

  next();
};

/**
 * Content type validation middleware
 */
export const contentTypeValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only validate POST, PUT, PATCH requests
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const contentType = req.get('Content-Type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const error = new AppError(
      'Invalid content type',
      400,
      ErrorCode.INVALID_INPUT,
      'Content-Type must be application/json'
    );
    return next(error);
  }

  next();
};

/**
 * Initialize all security middleware
 */
export const initializeSecurity = () => {
  const security = SecurityMiddleware.getInstance();
  
  return {
    cors: security.getCorsMiddleware(),
    helmet: security.getHelmetMiddleware(),
    rateLimit: security.getRateLimitMiddleware(),
    strictRateLimit: security.getStrictRateLimitMiddleware(),
    additionalHeaders: additionalSecurityHeaders,
    requestSanitizer,
    ipWhitelist: ipWhitelistMiddleware,
    contentTypeValidation
  };
};

/**
 * Security middleware configuration for different endpoint types
 */
export const SecurityProfiles = {
  PUBLIC: ['cors', 'helmet', 'rateLimit', 'additionalHeaders', 'requestSanitizer'],
  AUTH: ['cors', 'helmet', 'strictRateLimit', 'additionalHeaders', 'requestSanitizer', 'contentTypeValidation'],
  PROTECTED: ['cors', 'helmet', 'rateLimit', 'additionalHeaders', 'requestSanitizer', 'contentTypeValidation'],
  ADMIN: ['cors', 'helmet', 'strictRateLimit', 'additionalHeaders', 'requestSanitizer', 'contentTypeValidation', 'ipWhitelist']
};

export default SecurityMiddleware;