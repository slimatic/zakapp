import { z } from 'zod';
import { VALID_ASSET_CATEGORY_VALUES } from '@zakapp/shared';

// Asset validation schemas
export const AssetCreateSchema = z.object({
  name: z.string().min(1, 'Asset name is required').max(255, 'Asset name too long'),
  category: z.enum([...VALID_ASSET_CATEGORY_VALUES] as [string, ...string[]]),
  value: z.number().min(0, 'Asset value must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  acquisitionDate: z.date().optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const AssetUpdateSchema = AssetCreateSchema.partial();

// Liability validation schemas
export const LiabilityCreateSchema = z.object({
  name: z.string().min(1, 'Liability name is required').max(255, 'Liability name too long'),
  type: z.enum(['LOAN', 'MORTGAGE', 'CREDIT_CARD', 'BUSINESS_DEBT', 'OTHER']),
  amount: z.number().min(0, 'Liability amount must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  dueDate: z.date().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  description: z.string().max(1000, 'Description too long').optional()
});

export const LiabilityUpdateSchema = LiabilityCreateSchema.partial();

// User validation schemas
export const UserRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const UserProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
  dateOfBirth: z.date().max(new Date(), 'Date of birth cannot be in the future').optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  address: z.object({
    street: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional()
  }).optional(),
  preferences: z.object({
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    language: z.string().length(2, 'Language must be 2 characters').default('en'),
    timezone: z.string().default('UTC'),
    zakatMethodology: z.enum(['STANDARD', 'HANAFI', 'SHAFI', 'CUSTOM']).default('STANDARD')
  }).optional()
});

// Zakat calculation validation schemas
export const ZakatCalculationRequestSchema = z.object({
  methodology: z.enum(['STANDARD', 'HANAFI', 'SHAFI', 'CUSTOM']).default('STANDARD'),
  calendarType: z.enum(['lunar', 'solar']).default('lunar'),
  includeAssets: z.array(z.string().uuid()).optional(),
  excludeAssets: z.array(z.string().uuid()).optional(),
  customNisab: z.number().min(0).optional(),
  customRate: z.number().min(0).max(1).optional()
});

// Payment validation schemas
export const PaymentRecipientSchema = z.object({
  name: z.string().min(1, 'Recipient name is required').max(255, 'Recipient name too long'),
  type: z.enum(['individual', 'organization', 'charity']),
  category: z.enum(['poor', 'needy', 'collectors', 'hearts_reconciled', 'slaves', 'debtors', 'path_of_allah', 'travelers']),
  amount: z.number().min(0.01, 'Recipient amount must be positive'),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    address: z.string().max(500).optional()
  }).optional(),
  notes: z.string().max(500).optional()
});

export const PaymentCreateSchema = z.object({
  calculationId: z.string().uuid('Invalid calculation ID'),
  amount: z.number().min(0.01, 'Payment amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  paymentDate: z.date().max(new Date(), 'Payment date cannot be in the future'),
  recipients: z.array(PaymentRecipientSchema).min(1, 'At least one recipient is required'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'online', 'other']),
  receiptNumber: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

// Snapshot validation schemas
export const SnapshotCreateSchema = z.object({
  name: z.string().min(1, 'Snapshot name is required').max(255, 'Snapshot name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  tags: z.array(z.string().max(50)).max(10, 'Too many tags').optional(),
  includeAssets: z.array(z.string().uuid()).optional(),
  includeLiabilities: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export class ValidationService {
  /**
   * Validate asset creation data
   */
  validateAssetCreate(data: any) {
    return AssetCreateSchema.parse(data);
  }

  /**
   * Validate asset update data
   */
  validateAssetUpdate(data: any) {
    return AssetUpdateSchema.parse(data);
  }

  /**
   * Validate liability creation data
   */
  validateLiabilityCreate(data: any) {
    return LiabilityCreateSchema.parse(data);
  }

  /**
   * Validate liability update data
   */
  validateLiabilityUpdate(data: any) {
    return LiabilityUpdateSchema.parse(data);
  }

  /**
   * Validate user registration data
   */
  validateUserRegistration(data: any) {
    return UserRegistrationSchema.parse(data);
  }

  /**
   * Validate user profile data
   */
  validateUserProfile(data: any) {
    return UserProfileSchema.parse(data);
  }

  /**
   * Validate Zakat calculation request
   */
  validateZakatCalculationRequest(data: any) {
    return ZakatCalculationRequestSchema.parse(data);
  }

  /**
   * Validate payment creation data
   */
  validatePaymentCreate(data: any) {
    const validatedData = PaymentCreateSchema.parse(data);
    
    // Additional business logic validation
    this.validatePaymentBusinessRules(validatedData);
    
    return validatedData;
  }

  /**
   * Validate snapshot creation data
   */
  validateSnapshotCreate(data: any) {
    return SnapshotCreateSchema.parse(data);
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password should contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate currency code
   */
  validateCurrency(currency: string): boolean {
    const validCurrencies = [
      'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY',
      'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'EGP',
      'TRY', 'PKR', 'INR', 'BDT', 'MYR', 'IDR', 'THB'
    ];
    
    return validCurrencies.includes(currency.toUpperCase());
  }

  /**
   * Validate UUID format
   */
  validateUUID(uuid: string): boolean {
    const uuidSchema = z.string().uuid();
    try {
      uuidSchema.parse(uuid);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate date range
   */
  validateDateRange(startDate: Date, endDate: Date): boolean {
    return startDate <= endDate;
  }

  /**
   * Validate positive number
   */
  validatePositiveNumber(value: any): boolean {
    const schema = z.number().positive();
    try {
      schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate asset category for Zakat calculation
   */
  validateAssetForZakat(asset: any, methodology: string): { 
    isZakatable: boolean; 
    reason?: string 
  } {
    const category = asset.category?.toUpperCase();
    
    // Basic validation
    if (!category || asset.value <= 0) {
      return { 
        isZakatable: false, 
        reason: 'Invalid asset category or value' 
      };
    }

    switch (methodology) {
      case 'HANAFI':
        if (['CASH', 'GOLD', 'SILVER', 'BUSINESS', 'CRYPTO'].includes(category)) {
          return { isZakatable: true };
        }
        return { 
          isZakatable: false, 
          reason: 'Asset category not zakatable under Hanafi methodology' 
        };

      case 'SHAFI':
        if (['CASH', 'GOLD', 'SILVER', 'CRYPTO'].includes(category)) {
          return { isZakatable: true };
        }
        return { 
          isZakatable: false, 
          reason: 'Asset category not zakatable under Shafi methodology' 
        };

      default: // STANDARD
        if (['CASH', 'GOLD', 'SILVER', 'CRYPTO', 'BUSINESS'].includes(category)) {
          return { isZakatable: true };
        }
        return { 
          isZakatable: false, 
          reason: 'Asset category not zakatable under standard methodology' 
        };
    }
  }

  /**
   * Validate Zakat recipient categories according to Islamic law
   */
  validateRecipientCategory(category: string): { 
    isValid: boolean; 
    description?: string 
  } {
    const validCategories = {
      'poor': 'Al-Fuqara: Those who have no wealth',
      'needy': 'Al-Masakin: Those who have some wealth but not enough for their needs',
      'collectors': 'Al-Amilin: Those appointed to collect and distribute Zakat',
      'hearts_reconciled': 'Al-Muallafat al-Qulub: New Muslims or those whose hearts are to be reconciled',
      'slaves': 'Ar-Riqab: To free slaves or help those in bondage',
      'debtors': 'Al-Gharimin: Those burdened with debt',
      'path_of_allah': 'Fi Sabil Allah: In the path of Allah (for Islamic causes)',
      'travelers': 'Ibn as-Sabil: Travelers in need of assistance'
    };

    if (category in validCategories) {
      return { 
        isValid: true, 
        description: validCategories[category as keyof typeof validCategories]
      };
    }

    return { 
      isValid: false, 
      description: 'Invalid Zakat recipient category' 
    };
  }

  /**
   * Validate Nisab threshold calculation
   */
  validateNisabThreshold(goldPrice: number, silverPrice: number): { 
    isValid: boolean; 
    goldNisab: number; 
    silverNisab: number; 
    errors: string[] 
  } {
    const errors: string[] = [];

    if (goldPrice <= 0) {
      errors.push('Gold price must be positive');
    }

    if (silverPrice <= 0) {
      errors.push('Silver price must be positive');
    }

    // Standard Nisab quantities (in grams)
    const goldNisabGrams = 87.48; // 20 Mithqal
    const silverNisabGrams = 612.36; // 200 Dirhams

    const goldNisab = goldPrice * goldNisabGrams;
    const silverNisab = silverPrice * silverNisabGrams;

    return {
      isValid: errors.length === 0,
      goldNisab,
      silverNisab,
      errors
    };
  }

  /**
   * Validate Islamic date conversion
   */
  validateIslamicDate(gregorianDate: Date): { 
    isValid: boolean; 
    approximateIslamicYear: number;
    errors: string[] 
  } {
    const errors: string[] = [];

    if (!(gregorianDate instanceof Date) || isNaN(gregorianDate.getTime())) {
      errors.push('Invalid date format');
      return { isValid: false, approximateIslamicYear: 0, errors };
    }

    if (gregorianDate.getFullYear() < 622) {
      errors.push('Date cannot be before the Islamic calendar start (622 CE)');
    }

    if (gregorianDate > new Date()) {
      errors.push('Date cannot be in the future');
    }

    // Approximate conversion (simplified)
    const gregorianYear = gregorianDate.getFullYear();
    const approximateIslamicYear = Math.floor((gregorianYear - 622) * 1.031) + 1;

    return {
      isValid: errors.length === 0,
      approximateIslamicYear,
      errors
    };
  }

  /**
   * Private: Validate payment business rules
   */
  private validatePaymentBusinessRules(paymentData: any): void {
    // Check that recipients total equals payment amount
    const recipientsTotal = paymentData.recipients.reduce(
      (sum: number, recipient: any) => sum + recipient.amount, 
      0
    );

    if (Math.abs(recipientsTotal - paymentData.amount) > 0.01) {
      throw new Error('Recipients total must equal payment amount');
    }

    // Validate each recipient category
    for (const recipient of paymentData.recipients) {
      const categoryValidation = this.validateRecipientCategory(recipient.category);
      if (!categoryValidation.isValid) {
        throw new Error(`Invalid recipient category: ${recipient.category}`);
      }
    }

    // Check for reasonable distribution (no single recipient gets more than 80%)
    for (const recipient of paymentData.recipients) {
      const percentage = (recipient.amount / paymentData.amount) * 100;
      if (percentage > 80) {
        throw new Error('Single recipient cannot receive more than 80% of total payment');
      }
    }
  }

  /**
   * Sanitize input to prevent XSS attacks
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate file upload
   */
  validateFileUpload(
    file: any, 
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): { isValid: boolean; errors: string[] } {
    const { 
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['application/json', 'text/csv'],
      allowedExtensions = ['json', 'csv']
    } = options;

    const errors: string[] = [];

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    if (file.size > maxSize) {
      errors.push(`File size exceeds limit of ${maxSize} bytes`);
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed`);
    }

    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        errors.push(`File extension not allowed`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}