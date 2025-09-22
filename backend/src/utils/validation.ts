import { z } from 'zod';
import { VALIDATION, createAssetRequestSchema, updateAssetRequestSchema } from '@zakapp/shared';

// Registration validation schema
export const registerSchema = z.object({
  username: z
    .string()
    .min(VALIDATION.USERNAME.MIN_LENGTH, `Username must be at least ${VALIDATION.USERNAME.MIN_LENGTH} characters`)
    .max(VALIDATION.USERNAME.MAX_LENGTH, `Username must not exceed ${VALIDATION.USERNAME.MAX_LENGTH} characters`)
    .regex(VALIDATION.USERNAME.PATTERN, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z
    .string()
    .email('Invalid email address')
    .regex(VALIDATION.EMAIL.PATTERN, 'Invalid email format'),
  password: z
    .string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `Password must not exceed ${VALIDATION.PASSWORD.MAX_LENGTH} characters`)
    .regex(
      VALIDATION.PASSWORD.PATTERN,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Login validation schema
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `Password must not exceed ${VALIDATION.PASSWORD.MAX_LENGTH} characters`)
    .regex(
      VALIDATION.PASSWORD.PATTERN,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Update profile validation schema
export const updateProfileSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .regex(VALIDATION.EMAIL.PATTERN, 'Invalid email format')
    .optional(),
  preferences: z.object({
    currency: z.string(),
    language: z.string(),
    zakatMethod: z.string(),
    calendarType: z.enum(['lunar', 'solar']),
  }).partial().optional(),
});

// Asset validation schemas - now using shared schemas
export const createAssetSchema = createAssetRequestSchema;
export const updateAssetSchema = updateAssetRequestSchema;

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type CreateAssetRequest = z.infer<typeof createAssetSchema>;
export type UpdateAssetRequest = z.infer<typeof updateAssetSchema>;