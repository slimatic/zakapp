import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse, AuthTokens, User } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    // Mock implementation - will be replaced with real logic
    const { email, password, username } = req.body;
    
    // Basic validation
    if (!email || !password || !username) {
      throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    // Create a simple user ID based on email hash
    const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;

    // Mock user creation
    const mockUser: User = {
      id: userId,
      email,
      name: username,
      settings: {
        preferredMethodology: 'standard',
        currency: 'USD',
        language: 'en'
      },
      createdAt: new Date().toISOString()
    };

    // Create token that includes user ID
    const mockTokens: AuthTokens = {
      accessToken: `token-${userId}`,
      refreshToken: `refresh-${userId}`,
      expiresIn: 900 // 15 minutes
    };

    const response: ApiResponse = {
      success: true,
      message: 'Account created successfully',
      user: mockUser,
      tokens: mockTokens
    };

    res.status(201).json(response);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Missing email or password', 400, 'MISSING_CREDENTIALS');
    }

    // Create consistent user ID based on email
    const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;

    // Mock login response
    const mockUser: User = {
      id: userId,
      email,
      name: email.split('@')[0], // Use email prefix as name
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const mockTokens: AuthTokens = {
      accessToken: `token-${userId}`,
      refreshToken: `refresh-${userId}`,
      expiresIn: 900
    };

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      user: mockUser,
      tokens: mockTokens
    };

    res.status(200).json(response);
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      tokens: {
        accessToken: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
        expiresIn: 900
      }
    };

    res.status(200).json(response);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      message: 'Logged out successfully'
    };

    res.status(200).json(response);
  });

  me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const mockUser: User = {
      id: 'mock-user-id',
      email: 'user@example.com',
      name: 'Mock User',
      settings: {
        preferredMethodology: 'standard',
        currency: 'USD',
        language: 'en',
        reminders: true,
        calendarType: 'lunar'
      },
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      user: mockUser
    };

    res.status(200).json(response);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      message: 'Password reset email sent'
    };

    res.status(200).json(response);
  });

  confirmReset = asyncHandler(async (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      message: 'Password reset successfully'
    };

    res.status(200).json(response);
  });
}