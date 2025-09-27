import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any; // Allow additional properties
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  settings?: {
    preferredMethodology?: string;
    currency?: string;
    language?: string;
    reminders?: boolean;
    calendarType?: 'lunar' | 'solar';
  };
  createdAt: string;
  lastLoginAt?: string;
}