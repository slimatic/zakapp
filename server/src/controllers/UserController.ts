import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export class UserController {
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const mockProfile = {
      id: 'mock-user-id',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      settings: {
        preferredMethodology: 'standard',
        currency: 'USD',
        language: 'en',
        reminders: true,
        calendarType: 'lunar' as const
      },
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      profile: mockProfile
    };

    res.status(200).json(response);
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const updateData = req.body;

    const mockProfile = {
      id: 'mock-user-id',
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      profile: mockProfile
    };

    res.status(200).json(response);
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new passwords are required', 400, 'MISSING_PASSWORDS');
    }

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully'
    };

    res.status(200).json(response);
  });

  getSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const mockSessions = [
      {
        id: 'session-1',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        lastActive: new Date().toISOString(),
        isCurrent: true,
        createdAt: new Date().toISOString()
      }
    ];

    const response: ApiResponse = {
      success: true,
      sessions: mockSessions
    };

    res.status(200).json(response);
  });

  deleteSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const response: ApiResponse = {
      success: true,
      message: 'Session terminated successfully'
    };

    res.status(200).json(response);
  });
}