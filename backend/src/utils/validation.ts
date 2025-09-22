import { z } from 'zod';
import { VALIDATION, ASSET_CATEGORIES } from '@zakapp/shared';

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

// Asset validation schemas
export const createAssetSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.ASSET_NAME.MIN_LENGTH, 'Asset name is required')
    .max(VALIDATION.ASSET_NAME.MAX_LENGTH, `Asset name must not exceed ${VALIDATION.ASSET_NAME.MAX_LENGTH} characters`),
  category: z.enum(['cash', 'gold', 'silver', 'business', 'property', 'stocks', 'crypto', 'debts']),
  subCategory: z
    .string()
    .min(1, 'Subcategory is required')
    .max(50, 'Subcategory must not exceed 50 characters'),
  value: z
    .number()
    .min(VALIDATION.AMOUNT.MIN_VALUE, 'Value must be greater than or equal to 0')
    .max(VALIDATION.AMOUNT.MAX_VALUE, 'Value is too large'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  zakatEligible: z.boolean(),
});

export const updateAssetSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.ASSET_NAME.MIN_LENGTH, 'Asset name is required')
    .max(VALIDATION.ASSET_NAME.MAX_LENGTH, `Asset name must not exceed ${VALIDATION.ASSET_NAME.MAX_LENGTH} characters`)
    .optional(),
  value: z
    .number()
    .min(VALIDATION.AMOUNT.MIN_VALUE, 'Value must be greater than or equal to 0')
    .max(VALIDATION.AMOUNT.MAX_VALUE, 'Value is too large')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  zakatEligible: z.boolean().optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type CreateAssetRequest = z.infer<typeof createAssetSchema>;
export type UpdateAssetRequest = z.infer<typeof updateAssetSchema>;

// Enhanced asset validation with business rules
export const createAssetSchemaEnhanced = createAssetSchema
  .refine(
    (data) => {
      // Validate subcategory against the category
      const validSubcategories = ASSET_CATEGORIES[data.category.toUpperCase() as keyof typeof ASSET_CATEGORIES]?.subCategories || [];
      return validSubcategories.some(sub => sub.id === data.subCategory);
    },
    {
      message: 'Invalid subcategory for the selected asset category',
      path: ['subCategory'],
    }
  )
  .refine(
    (data) => {
      // For debt assets, allow any value since they represent receivables
      return true; // Allow all values - debts are money owed TO you, not liabilities
    },
    {
      message: 'Invalid asset value',
      path: ['value'],
    }
  )
  .refine(
    (data) => {
      // Validate currency is supported
      const supportedCurrencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'TRY', 'INR', 'PKR', 'BDT', 'MYR', 'IDR'];
      return supportedCurrencies.includes(data.currency);
    },
    {
      message: 'Currency not supported. Please use one of: USD, EUR, GBP, SAR, AED, EGP, TRY, INR, PKR, BDT, MYR, IDR',
      path: ['currency'],
    }
  );

// Asset history entry schema
export const assetHistorySchema = z.object({
  historyId: z.string(),
  assetId: z.string(),
  action: z.enum(['created', 'updated', 'deleted']),
  timestamp: z.string(),
  newData: z.any(), // Asset object
  oldData: z.any().optional(), // Previous asset object for updates
});