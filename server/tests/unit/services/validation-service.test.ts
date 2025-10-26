import { describe, it, expect } from '@jest/globals';
import { ValidationService } from '../../../src/services/ValidationService';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateAssetCreate', () => {
    it('should validate valid asset creation data', () => {
      const validAsset = {
        name: 'Gold Jewelry',
        category: 'GOLD' as const,
        value: 5000,
        currency: 'USD',
        acquisitionDate: new Date('2023-01-15'),
        description: 'Family heirloom gold jewelry',
        metadata: { purity: '24k', weight: '50g' }
      };

      const result = validationService.validateAssetCreate(validAsset);
      expect(result).toEqual(validAsset);
    });

    it('should throw error for empty asset name', () => {
      const invalidAsset = {
        name: '',
        category: 'CASH' as const,
        value: 1000
      };

      expect(() => validationService.validateAssetCreate(invalidAsset))
        .toThrow('Asset name is required');
    });

    it('should throw error for asset name too long', () => {
      const invalidAsset = {
        name: 'A'.repeat(256), // 256 characters, exceeds limit
        category: 'CASH' as const,
        value: 1000
      };

      expect(() => validationService.validateAssetCreate(invalidAsset))
        .toThrow('Asset name too long');
    });

    it('should throw error for negative asset value', () => {
      const invalidAsset = {
        name: 'Test Asset',
        category: 'CASH' as const,
        value: -100
      };

      expect(() => validationService.validateAssetCreate(invalidAsset))
        .toThrow('Asset value must be non-negative');
    });

    it('should throw error for invalid currency length', () => {
      const invalidAsset = {
        name: 'Test Asset',
        category: 'CASH' as const,
        value: 1000,
        currency: 'US' // Too short
      };

      expect(() => validationService.validateAssetCreate(invalidAsset))
        .toThrow('Currency must be 3 characters');
    });

    it('should throw error for description too long', () => {
      const invalidAsset = {
        name: 'Test Asset',
        category: 'CASH' as const,
        value: 1000,
        description: 'A'.repeat(1001) // Exceeds 1000 character limit
      };

      expect(() => validationService.validateAssetCreate(invalidAsset))
        .toThrow('Description too long');
    });

    it('should handle zero value assets', () => {
      const zeroValueAsset = {
        name: 'Zero Value Asset',
        category: 'OTHER' as const,
        value: 0
      };

      const result = validationService.validateAssetCreate(zeroValueAsset);
      expect(result.value).toBe(0);
    });

    it('should handle very large asset values', () => {
      const largeValueAsset = {
        name: 'Large Asset',
        category: 'REAL_ESTATE' as const,
        value: 999999999.99
      };

      const result = validationService.validateAssetCreate(largeValueAsset);
      expect(result.value).toBe(999999999.99);
    });
  });

  describe('validateUserRegistration', () => {
    it('should validate valid user registration data', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!'
      };

      const result = validationService.validateUserRegistration(validUser);
      expect(result).toEqual(validUser);
    });

    it('should throw error for invalid email format', () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!'
      };

      expect(() => validationService.validateUserRegistration(invalidUser))
        .toThrow('Invalid email format');
    });

    it('should throw error for password too short', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'Short1!',
        confirmPassword: 'Short1!'
      };

      expect(() => validationService.validateUserRegistration(invalidUser))
        .toThrow('Password must be at least 8 characters');
    });

    it('should throw error for password without lowercase letter', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'STRONGPASS123!',
        confirmPassword: 'STRONGPASS123!'
      };

      expect(() => validationService.validateUserRegistration(invalidUser))
        .toThrow('Password must contain at least one lowercase letter');
    });

    it('should throw error for password without uppercase letter', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'strongpass123!',
        confirmPassword: 'strongpass123!'
      };

      expect(() => validationService.validateUserRegistration(invalidUser))
        .toThrow('Password must contain at least one uppercase letter');
    });

    it('should throw error for password without number', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'StrongPass!',
        confirmPassword: 'StrongPass!'
      };

      expect(() => validationService.validateUserRegistration(invalidUser))
        .toThrow('Password must contain at least one number');
    });

    it('should throw error for mismatched passwords', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'DifferentPass123!'
      };

      expect(() => validationService.validateUserRegistration(invalidUser))
        .toThrow("Passwords don't match");
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name+tag@domain.co.uk',
        'test123@gmail.com',
        'user@subdomain.domain.org'
      ];

      validEmails.forEach(email => {
        expect(validationService.validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test @example.com',
        'test@example..com'
      ];

      invalidEmails.forEach(email => {
        expect(validationService.validateEmail(email)).toBe(false);
      });
    });

    it('should handle empty string', () => {
      expect(validationService.validateEmail('')).toBe(false);
    });

    it('should handle very long email addresses', () => {
      const longEmail = 'a'.repeat(200) + '@example.com';
      expect(validationService.validateEmail(longEmail)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure789@',
        'Complex#456Password'
      ];

      strongPasswords.forEach(password => {
        const result = validationService.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject weak passwords and provide specific errors', () => {
      const weakPasswords = [
        { password: 'short', expectedErrors: ['Password must be at least 8 characters long', 'Password must contain at least one uppercase letter', 'Password must contain at least one number', 'Password should contain at least one special character'] },
        { password: 'nouppercase123!', expectedErrors: ['Password must contain at least one uppercase letter'] },
        { password: 'NOLOWERCASE123!', expectedErrors: ['Password must contain at least one lowercase letter'] },
        { password: 'NoNumbers!', expectedErrors: ['Password must contain at least one number'] },
        { password: 'NoSpecialChars123', expectedErrors: ['Password should contain at least one special character'] }
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = validationService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(expectedErrors);
      });
    });

    it('should handle empty password', () => {
      const result = validationService.validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle very long passwords', () => {
      const longPassword = 'A1!' + 'a'.repeat(1000);
      const result = validationService.validatePassword(longPassword);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCurrency', () => {
    it('should validate supported currencies', () => {
      const validCurrencies = [
        'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY',
        'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'EGP',
        'TRY', 'PKR', 'INR', 'BDT', 'MYR', 'IDR', 'THB'
      ];

      validCurrencies.forEach(currency => {
        expect(validationService.validateCurrency(currency)).toBe(true);
        expect(validationService.validateCurrency(currency.toLowerCase())).toBe(true);
      });
    });

    it('should reject unsupported currencies', () => {
      const invalidCurrencies = ['XYZ', 'INVALID', 'US', ''];

      invalidCurrencies.forEach(currency => {
        expect(validationService.validateCurrency(currency)).toBe(false);
      });
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUID formats', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ];

      validUUIDs.forEach(uuid => {
        expect(validationService.validateUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456', // Too short
        '123e4567-e89b-12d3-a456-426614174000-extra', // Too long
        '123e4567-e89b-12d3-a456-42661417400g', // Invalid character
        ''
      ];

      invalidUUIDs.forEach(uuid => {
        expect(validationService.validateUUID(uuid)).toBe(false);
      });
    });
  });

  describe('validateDateRange', () => {
    it('should validate correct date ranges', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      expect(validationService.validateDateRange(startDate, endDate)).toBe(true);
    });

    it('should validate same date range', () => {
      const date = new Date('2024-06-15');

      expect(validationService.validateDateRange(date, date)).toBe(true);
    });

    it('should reject invalid date ranges where start is after end', () => {
      const startDate = new Date('2024-12-31');
      const endDate = new Date('2024-01-01');

      expect(validationService.validateDateRange(startDate, endDate)).toBe(false);
    });
  });

  describe('validatePositiveNumber', () => {
    it('should validate positive numbers', () => {
      const positiveNumbers = [1, 1.5, 100, 0.01, 999999];

      positiveNumbers.forEach(num => {
        expect(validationService.validatePositiveNumber(num)).toBe(true);
      });
    });

    it('should reject non-positive numbers', () => {
      const nonPositiveNumbers = [0, -1, -0.01, -100];

      nonPositiveNumbers.forEach(num => {
        expect(validationService.validatePositiveNumber(num)).toBe(false);
      });
    });

    it('should reject non-numeric values', () => {
      const nonNumericValues = ['123', null, undefined, {}, []];

      nonNumericValues.forEach(value => {
        expect(validationService.validatePositiveNumber(value)).toBe(false);
      });
    });
  });

  describe('validateAssetForZakat', () => {
    it('should validate zakatable assets under standard methodology', () => {
      const zakatableAssets = [
        { category: 'CASH', value: 1000 },
        { category: 'GOLD', value: 5000 },
        { category: 'SILVER', value: 1000 },
        { category: 'CRYPTO', value: 2000 },
        { category: 'BUSINESS', value: 10000 }
      ];

      zakatableAssets.forEach(asset => {
        const result = validationService.validateAssetForZakat(asset, 'STANDARD');
        expect(result.isZakatable).toBe(true);
        expect(result.reason).toBeUndefined();
      });
    });

    it('should reject non-zakatable assets under standard methodology', () => {
      const nonZakatableAssets = [
        { category: 'REAL_ESTATE', value: 100000 },
        { category: 'OTHER', value: 500 }
      ];

      nonZakatableAssets.forEach(asset => {
        const result = validationService.validateAssetForZakat(asset, 'STANDARD');
        expect(result.isZakatable).toBe(false);
        expect(result.reason).toBeDefined();
      });
    });

    it('should validate assets under Hanafi methodology', () => {
      const hanafiZakatable = [
        { category: 'CASH', value: 1000 },
        { category: 'GOLD', value: 5000 },
        { category: 'SILVER', value: 1000 },
        { category: 'BUSINESS', value: 10000 },
        { category: 'CRYPTO', value: 2000 }
      ];

      hanafiZakatable.forEach(asset => {
        const result = validationService.validateAssetForZakat(asset, 'HANAFI');
        expect(result.isZakatable).toBe(true);
      });
    });

    it('should validate assets under Shafi methodology', () => {
      const shafiZakatable = [
        { category: 'CASH', value: 1000 },
        { category: 'GOLD', value: 5000 },
        { category: 'SILVER', value: 1000 },
        { category: 'CRYPTO', value: 2000 }
      ];

      shafiZakatable.forEach(asset => {
        const result = validationService.validateAssetForZakat(asset, 'SHAFI');
        expect(result.isZakatable).toBe(true);
      });
    });

    it('should reject assets with invalid data', () => {
      const invalidAssets = [
        { category: '', value: 1000 },
        { category: 'CASH', value: 0 },
        { category: 'CASH', value: -100 }
      ];

      invalidAssets.forEach(asset => {
        const result = validationService.validateAssetForZakat(asset, 'STANDARD');
        expect(result.isZakatable).toBe(false);
        expect(result.reason).toBe('Invalid asset category or value');
      });
    });
  });

  describe('validateRecipientCategory', () => {
    it('should validate correct Zakat recipient categories', () => {
      const validCategories = [
        'poor', 'needy', 'collectors', 'hearts_reconciled',
        'slaves', 'debtors', 'path_of_allah', 'travelers'
      ];

      validCategories.forEach(category => {
        const result = validationService.validateRecipientCategory(category);
        expect(result.isValid).toBe(true);
        expect(result.description).toBeDefined();
      });
    });

    it('should reject invalid recipient categories', () => {
      const invalidCategories = ['invalid', 'random', '', 'nonexistent'];

      invalidCategories.forEach(category => {
        const result = validationService.validateRecipientCategory(category);
        expect(result.isValid).toBe(false);
        expect(result.description).toBe('Invalid Zakat recipient category');
      });
    });
  });

  describe('validateNisabThreshold', () => {
    it('should calculate valid Nisab thresholds', () => {
      const goldPrice = 2000; // $2000 per gram
      const silverPrice = 25; // $25 per gram

      const result = validationService.validateNisabThreshold(goldPrice, silverPrice);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.goldNisab).toBe(2000 * 87.48); // 87.48g gold
      expect(result.silverNisab).toBe(25 * 612.36); // 612.36g silver
    });

    it('should reject invalid price inputs', () => {
      const invalidInputs = [
        { goldPrice: 0, silverPrice: 25 },
        { goldPrice: -100, silverPrice: 25 },
        { goldPrice: 2000, silverPrice: 0 },
        { goldPrice: 2000, silverPrice: -10 }
      ];

      invalidInputs.forEach(({ goldPrice, silverPrice }) => {
        const result = validationService.validateNisabThreshold(goldPrice, silverPrice);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateIslamicDate', () => {
    it('should validate valid Islamic dates', () => {
      const validDate = new Date('2024-01-15');

      const result = validationService.validateIslamicDate(validDate);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.approximateIslamicYear).toBeGreaterThan(1400);
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        new Date('invalid'),
        null as any,
        undefined as any
      ];

      invalidDates.forEach(date => {
        const result = validationService.validateIslamicDate(date);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject dates before Islamic calendar start', () => {
      const oldDate = new Date('500-01-01');

      const result = validationService.validateIslamicDate(oldDate);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Date cannot be before the Islamic calendar start (622 CE)');
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = validationService.validateIslamicDate(futureDate);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Date cannot be in the future');
    });
  });

  describe('validatePaymentCreate', () => {
    it('should validate valid payment creation data', () => {
      const validPayment = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        recipientName: 'John Doe',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'bank_transfer' as const,
        recipients: [
          {
            name: 'John Doe',
            category: 'poor',
            amount: 1000
          }
        ]
      };

      const result = validationService.validatePaymentCreate(validPayment);
      expect(result).toEqual(validPayment);
    });

    it('should reject payments where recipients total does not match payment amount', () => {
      const invalidPayment = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        recipientName: 'John Doe',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'bank_transfer' as const,
        recipients: [
          {
            name: 'John Doe',
            category: 'poor',
            amount: 500 // Only half the payment amount
          }
        ]
      };

      expect(() => validationService.validatePaymentCreate(invalidPayment))
        .toThrow('Recipients total must equal payment amount');
    });

    it('should reject payments with invalid recipient categories', () => {
      const invalidPayment = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        recipientName: 'John Doe',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'bank_transfer' as const,
        recipients: [
          {
            name: 'John Doe',
            category: 'invalid_category',
            amount: 1000
          }
        ]
      };

      expect(() => validationService.validatePaymentCreate(invalidPayment))
        .toThrow('Invalid recipient category: invalid_category');
    });

    it('should reject payments where single recipient gets more than 80%', () => {
      const invalidPayment = {
        userId: 'user-123',
        snapshotId: 'snapshot-123',
        amount: 1000,
        paymentDate: new Date('2024-01-15'),
        recipientName: 'John Doe',
        recipientType: 'individual' as const,
        recipientCategory: 'poor' as const,
        paymentMethod: 'bank_transfer' as const,
        recipients: [
          {
            name: 'John Doe',
            category: 'poor',
            amount: 850 // 85% of total
          }
        ]
      };

      expect(() => validationService.validatePaymentCreate(invalidPayment))
        .toThrow('Single recipient cannot receive more than 80% of total payment');
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize XSS attack vectors', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '" onclick="alert(\'xss\')"',
        '\' or \'1\'=\'1',
        '<iframe src="malicious.com"></iframe>'
      ];

      const expectedOutputs = [
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;',
        '&quot; onclick=&quot;alert(&#x27;xss&#x27;)&quot;',
        '&#x27; or &#x27;1&#x27;=&#x27;1',
        '&lt;iframe src=&quot;malicious.com&quot;&gt;&lt;/iframe&gt;'
      ];

      maliciousInputs.forEach((input, index) => {
        const result = validationService.sanitizeInput(input);
        expect(result).toBe(expectedOutputs[index]);
      });
    });

    it('should handle normal text without modification', () => {
      const normalText = 'This is normal text without any special characters.';
      const result = validationService.sanitizeInput(normalText);
      expect(result).toBe(normalText);
    });
  });

  describe('validateFileUpload', () => {
    it('should validate valid file uploads', () => {
      const validFile = {
        name: 'data.json',
        size: 1024, // 1KB
        type: 'application/json'
      };

      const result = validationService.validateFileUpload(validFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject files that are too large', () => {
      const largeFile = {
        name: 'large.json',
        size: 10 * 1024 * 1024, // 10MB, exceeds default 5MB limit
        type: 'application/json'
      };

      const result = validationService.validateFileUpload(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size exceeds limit of 5242880 bytes');
    });

    it('should reject files with invalid types', () => {
      const invalidTypeFile = {
        name: 'data.txt',
        size: 1024,
        type: 'text/plain'
      };

      const result = validationService.validateFileUpload(invalidTypeFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File type text/plain not allowed');
    });

    it('should reject files with invalid extensions', () => {
      const invalidExtFile = {
        name: 'data.exe',
        size: 1024,
        type: 'application/json' // Valid type but invalid extension
      };

      const result = validationService.validateFileUpload(invalidExtFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File extension not allowed');
    });

    it('should handle missing files', () => {
      const result = validationService.validateFileUpload(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No file provided');
    });

    it('should accept custom validation options', () => {
      const file = {
        name: 'data.xml',
        size: 1024,
        type: 'application/xml'
      };

      const customOptions = {
        maxSize: 2048,
        allowedTypes: ['application/xml'],
        allowedExtensions: ['xml']
      };

      const result = validationService.validateFileUpload(file, customOptions);
      expect(result.isValid).toBe(true);
    });
  });
});