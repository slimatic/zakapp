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

/**
 * Calendar Controller - Handles calendar conversion and Zakat year endpoints
 * 
 * Implements API contracts from specs/004-zakat-calculation-complete/contracts/calendar.yaml
 */

import { Request, Response } from 'express';
import { CalendarService } from '../services/calendarService';
import { PrismaClient } from '@prisma/client';

const calendarService = new CalendarService();
const prisma = new PrismaClient();

/**
 * Safely extracts error message from unknown error type
 * @param error - The caught error (unknown type in strict mode)
 * @returns Error message string or default message
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * POST /api/calendar/convert
 * Convert date between Gregorian and Hijri calendars
 */
export const convertDate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, fromCalendar, toCalendar } = req.body;

    // Validation
    if (!date || !fromCalendar || !toCalendar) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'date, fromCalendar, and toCalendar are required'
      });
    }

    if (!['GREGORIAN', 'HIJRI'].includes(fromCalendar)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CALENDAR_TYPE',
        message: 'fromCalendar must be GREGORIAN or HIJRI'
      });
    }

    if (!['GREGORIAN', 'HIJRI'].includes(toCalendar)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CALENDAR_TYPE',
        message: 'toCalendar must be GREGORIAN or HIJRI'
      });
    }

    // Parse date
    const parsedDate = calendarService.parseDate(date);

    // Convert
    const result = calendarService.convertDate(parsedDate, fromCalendar, toCalendar);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Calendar conversion error:', error);

    if (getErrorMessage(error).includes('Invalid date format')) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DATE_FORMAT',
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to convert date'
    });
  }
};

/**
 * POST /api/calendar/zakat-year
 * Calculate Zakat year boundaries
 */
export const calculateZakatYear = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { referenceDate, calendarType } = req.body;

    // Validation
    if (!referenceDate || !calendarType) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'referenceDate and calendarType are required'
      });
    }

    if (!['GREGORIAN', 'HIJRI'].includes(calendarType)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CALENDAR_TYPE',
        message: 'calendarType must be GREGORIAN or HIJRI'
      });
    }

    // Parse reference date
    const parsedDate = calendarService.parseDate(referenceDate);

    // Calculate Zakat year
    const zakatYear = calendarService.calculateZakatYear(parsedDate, calendarType);

    return res.status(200).json({
      success: true,
      zakatYear: {
        startDate: zakatYear.startDate.toISOString(),
        endDate: zakatYear.endDate.toISOString(),
        calendarType: zakatYear.calendarType,
        daysInYear: zakatYear.daysInYear,
        ...(zakatYear.hijriStart && { hijriStart: zakatYear.hijriStart }),
        ...(zakatYear.hijriEnd && { hijriEnd: zakatYear.hijriEnd })
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Zakat year calculation error:', error);

    if (getErrorMessage(error).includes('Invalid date format')) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DATE_FORMAT',
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to calculate Zakat year'
    });
  }
};

/**
 * GET /api/user/calendar-preference
 * Get user's calendar preference
 */
export const getCalendarPreference = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredCalendar: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      calendarType: user.preferredCalendar?.toUpperCase() || 'GREGORIAN'
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get calendar preference error:', error);

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve calendar preference'
    });
  }
};

/**
 * PUT /api/user/calendar-preference
 * Update user's calendar preference
 */
export const updateCalendarPreference = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
    }

    const { calendarType, preferredCalendar, preferredMethodology } = req.body;

    // Log for debugging
    console.log('Update Calendar/Methodology Request:', {
      userId,
      body: req.body
    });

    const typeToUpdate = calendarType || preferredCalendar;
    const updateData: any = {};

    if (typeToUpdate) {
      const normalizedType = typeToUpdate.toUpperCase();
      if (['GREGORIAN', 'HIJRI'].includes(normalizedType)) {
        updateData.preferredCalendar = normalizedType.toLowerCase();
      } else {
        // If invalid type provided but we have methodology, maybe we just ignore this? 
        // Or return error? Sticking to error for now if explicit invalid value given.
        return res.status(400).json({
          success: false,
          error: 'INVALID_CALENDAR_TYPE',
          message: 'calendarType must be GREGORIAN or HIJRI'
        });
      }
    }

    if (preferredMethodology) {
      // Allow common methodologies. Schema allows string, but we should probably normalize/validate slightly
      // Schema default is 'standard'.
      updateData.preferredMethodology = preferredMethodology.toLowerCase();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_UPDATE_FIELDS',
        message: 'At least one of calendarType, preferredCalendar, or preferredMethodology is required'
      });
    }

    // Update user preference
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: updateData
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update calendar preference error:', error);

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update preferences'
    });
  }
};
