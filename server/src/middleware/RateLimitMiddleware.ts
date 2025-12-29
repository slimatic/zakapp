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

import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiting middleware
 * For production, use Redis or similar distributed cache
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Rate limit configuration (can be overridden for testing)
let registrationRateLimitMax = process.env.NODE_ENV === 'test' ? 50 : 100;
let loginRateLimitMax = process.env.NODE_ENV === 'test' ? 50 : 10;

/**
 * Reset rate limit store for testing
 * WARNING: Only use in test environment
 */
export const resetRateLimitStore = () => {
  Object.keys(store).forEach(key => delete store[key]);
};

/**
 * Set registration rate limit max for testing
 * WARNING: Only use in test environment
 */
export const setRegistrationRateLimitMax = (max: number) => {
  registrationRateLimitMax = max;
};

export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    if (store[key] && now > store[key].resetTime) {
      delete store[key];
    }
    
    // Initialize or update rate limit data
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs
      };
    } else {
      store[key].count++;
    }
    
    // Check if rate limit exceeded
    if (store[key].count > options.max) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message || 'Too many requests, please try again later',
          retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
        }
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': options.max.toString(),
      'X-RateLimit-Remaining': Math.max(0, options.max - store[key].count).toString(),
      'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString()
    });
    
    next();
  };
};

// Predefined rate limiters
// Note: Using dynamic max value that can be overridden for specific tests
export const registrationRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const max = registrationRateLimitMax;
  
  // Clean up expired entries
  if (store[key] && now > store[key].resetTime) {
    delete store[key];
  }
  
  // Initialize or update rate limit data
  if (!store[key]) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs
    };
  } else {
    store[key].count++;
  }
  
  // Check if rate limit exceeded
  if (store[key].count > max) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many registration attempts, please try again later',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      }
    });
  }
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': max.toString(),
    'X-RateLimit-Remaining': Math.max(0, max - store[key].count).toString(),
    'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString()
  });
  
  next();
};

export const loginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const max = loginRateLimitMax;
  
  // Clean up expired entries
  if (store[key] && now > store[key].resetTime) {
    delete store[key];
  }
  
  // Initialize or update rate limit data
  if (!store[key]) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs
    };
  } else {
    store[key].count++;
  }
  
  // Check if rate limit exceeded
  if (store[key].count > max) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again later',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      }
    });
  }
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': max.toString(),
    'X-RateLimit-Remaining': Math.max(0, max - store[key].count).toString(),
    'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString()
  });
  
  next();
};