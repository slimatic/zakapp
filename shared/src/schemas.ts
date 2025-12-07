import { z } from 'zod';

// Base asset schema that all specific asset schemas extend
export const baseAssetSchema = z.object({
  assetId: z.string().uuid(),
  name: z.string().min(1).max(100),
  value: z.number().min(0).max(999999999999),
  currency: z.string().length(3),
  description: z.string().max(500).optional(),
  zakatEligible: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Cash asset schema
export const cashAssetSchema = baseAssetSchema.extend({
  category: z.literal('cash'),
  subCategory: z.enum([
    'savings',
    'checking',
    'cash_on_hand',
    'certificates_of_deposit',
    'money_market',
  ]),
  interestRate: z.number().min(0).max(100).optional(),
  maturityDate: z.string().datetime().optional(),
});

// Gold asset schema
export const goldAssetSchema = baseAssetSchema.extend({
  category: z.literal('gold'),
  subCategory: z.enum(['jewelry', 'coins', 'bars', 'ornaments']),
  weight: z.number().min(0).optional(), // in grams
  purity: z.number().min(1).max(24).optional(), // in karats
});

// Silver asset schema
export const silverAssetSchema = baseAssetSchema.extend({
  category: z.literal('silver'),
  subCategory: z.enum(['jewelry', 'coins', 'bars', 'ornaments', 'utensils']),
  weight: z.number().min(0).optional(), // in grams
  purity: z.number().min(0).max(100).optional(), // percentage
});

// Business asset schema
export const businessAssetSchema = baseAssetSchema.extend({
  category: z.literal('business'),
  subCategory: z.enum([
    'inventory',
    'trade_goods',
    'raw_materials',
    'finished_goods',
    'work_in_progress',
  ]),
  businessType: z.string().max(100).optional(),
  holdingPeriod: z.number().min(0).optional(), // in months
});

// Property asset schema
export const propertyAssetSchema = baseAssetSchema.extend({
  category: z.literal('property'),
  subCategory: z.enum([
    'residential_investment',
    'commercial',
    'land',
    'agricultural',
    'industrial',
  ]),
  propertyType: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  rentalIncome: z.number().min(0).optional(), // monthly
});

// Stocks asset schema
export const stocksAssetSchema = baseAssetSchema.extend({
  category: z.literal('stocks'),
  subCategory: z.enum([
    'individual_stocks',
    'mutual_funds',
    'etfs',
    'bonds',
    'index_funds',
    'retirement_401k',
    'retirement_ira',
    'retirement_other',
    '529_education',
  ]),
  ticker: z.string().max(20).optional(),
  shares: z.number().min(0).optional(),
  dividendYield: z.number().min(0).max(100).optional(),
  // Retirement-specific fields
  employerMatch: z.number().min(0).max(100).optional(), // percentage
  vestingSchedule: z.string().max(200).optional(),
  iraType: z.enum(['traditional', 'roth']).optional(),
  contributionLimit: z.number().min(0).optional(),
  accountType: z.string().max(100).optional(),
});

// Crypto asset schema
export const cryptoAssetSchema = baseAssetSchema.extend({
  category: z.literal('crypto'),
  subCategory: z.enum([
    'bitcoin',
    'ethereum',
    'altcoins',
    'stablecoins',
    'defi_tokens',
  ]),
  coinSymbol: z.string().max(20).optional(),
  quantity: z.number().min(0).optional(),
  stakingRewards: z.number().min(0).optional(),
});

// Debts asset schema
export const debtsAssetSchema = baseAssetSchema.extend({
  category: z.literal('debts'),
  subCategory: z.enum([
    'accounts_receivable',
    'personal_loans_given',
    'business_loans_given',
    'promissory_notes',
  ]),
  debtor: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  repaymentSchedule: z
    .enum(['lump_sum', 'installments', 'on_demand'])
    .optional(),
});

// Expenses asset schema (for deductible expenses)
export const expensesAssetSchema = baseAssetSchema.extend({
  category: z.literal('expenses'),
  subCategory: z.enum([
    'debts_owed',
    'essential_needs',
    'family_obligations',
    'business_liabilities',
  ]),
  creditor: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  expenseType: z.string().max(100).optional(),
  frequency: z.enum(['monthly', 'yearly', 'one_time']).optional(),
  dependentCount: z.number().min(0).optional(),
  supportType: z.string().max(100).optional(),
  businessType: z.string().max(100).optional(),
  liabilityType: z.string().max(100).optional(),
});

// Union schema for all asset types
export const assetSchema = z.discriminatedUnion('category', [
  cashAssetSchema,
  goldAssetSchema,
  silverAssetSchema,
  businessAssetSchema,
  propertyAssetSchema,
  stocksAssetSchema,
  cryptoAssetSchema,
  debtsAssetSchema,
  expensesAssetSchema,
]);

// Generic asset schema for creation/update operations
export const genericAssetSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum([
    'cash',
    'gold',
    'silver',
    'business',
    'property',
    'stocks',
    'crypto',
    'debts',
    'expenses',
  ]),
  subCategory: z.string().min(1).max(50),
  value: z.number().min(0).max(999999999999),
  currency: z.string().length(3),
  description: z.string().max(500).optional(),
  zakatEligible: z.boolean(),
  // Optional specific fields based on category
  interestRate: z.number().min(0).max(100).optional(),
  maturityDate: z.string().datetime().optional(),
  weight: z.number().min(0).optional(),
  purity: z.number().min(0).max(100).optional(),
  businessType: z.string().max(100).optional(),
  holdingPeriod: z.number().min(0).optional(),
  propertyType: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  rentalIncome: z.number().min(0).optional(),
  ticker: z.string().max(20).optional(),
  shares: z.number().min(0).optional(),
  dividendYield: z.number().min(0).max(100).optional(),
  coinSymbol: z.string().max(20).optional(),
  quantity: z.number().min(0).optional(),
  stakingRewards: z.number().min(0).optional(),
  debtor: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(),
  repaymentSchedule: z
    .enum(['lump_sum', 'installments', 'on_demand'])
    .optional(),
  // Retirement account fields
  employerMatch: z.number().min(0).max(100).optional(),
  vestingSchedule: z.string().max(200).optional(),
  iraType: z.enum(['traditional', 'roth']).optional(),
  contributionLimit: z.number().min(0).optional(),
  accountType: z.string().max(100).optional(),
  // Expenses fields
  creditor: z.string().max(100).optional(),
  expenseType: z.string().max(100).optional(),
  frequency: z.enum(['monthly', 'yearly', 'one_time']).optional(),
  dependentCount: z.number().min(0).optional(),
  supportType: z.string().max(100).optional(),
  liabilityType: z.string().max(100).optional(),
});

// Asset category schema
export const assetCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  zakatRate: z.number().min(0).max(100),
  subCategories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      zakatRate: z.number().min(0).max(100),
      zakatEligible: z.boolean(),
      specificFields: z.array(z.string()).optional(),
    })
  ),
  defaultZakatEligible: z.boolean(),
  nisabApplicable: z.boolean(),
});

// Form validation schema for frontend forms
export const assetFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Asset name is required')
    .max(100, 'Asset name must be 100 characters or less'),
  category: z.enum([
    'cash',
    'gold',
    'silver',
    'business',
    'property',
    'stocks',
    'crypto',
    'debts',
    'expenses',
  ]),
  subCategory: z
    .string()
    .min(1, 'Subcategory is required')
    .max(50, 'Subcategory must be 50 characters or less'),
  value: z
    .number()
    .min(0, 'Value must be non-negative')
    .max(999999999999, 'Value exceeds maximum limit'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  zakatEligible: z.boolean(),
  // Optional specific fields based on category
  interestRate: z
    .number()
    .min(0, 'Interest rate must be non-negative')
    .max(100, 'Interest rate cannot exceed 100%')
    .optional()
    .or(z.nan().transform(() => undefined)),
  maturityDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true; // Allow empty
      try {
        const date = new Date(val);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    }, 'Invalid date format'),
  weight: z.number().min(0, 'Weight must be non-negative').optional(),
  purity: z
    .number()
    .min(0, 'Purity must be non-negative')
    .max(100, 'Purity cannot exceed 100%')
    .optional(),
  businessType: z
    .string()
    .max(100, 'Business type must be 100 characters or less')
    .optional(),
  holdingPeriod: z
    .number()
    .min(0, 'Holding period must be non-negative')
    .optional(),
  propertyType: z
    .string()
    .max(100, 'Property type must be 100 characters or less')
    .optional(),
  location: z
    .string()
    .max(200, 'Location must be 200 characters or less')
    .optional(),
  rentalIncome: z
    .number()
    .min(0, 'Rental income must be non-negative')
    .optional(),
  ticker: z.string().max(20, 'Ticker must be 20 characters or less').optional(),
  shares: z.number().min(0, 'Shares must be non-negative').optional(),
  dividendYield: z
    .number()
    .min(0, 'Dividend yield must be non-negative')
    .max(100, 'Dividend yield cannot exceed 100%')
    .optional(),
  coinSymbol: z
    .string()
    .max(20, 'Coin symbol must be 20 characters or less')
    .optional(),
  quantity: z.number().min(0, 'Quantity must be non-negative').optional(),
  stakingRewards: z
    .number()
    .min(0, 'Staking rewards must be non-negative')
    .optional(),
  debtor: z
    .string()
    .max(100, 'Debtor name must be 100 characters or less')
    .optional(),
  dueDate: z.string().datetime('Invalid date format').optional(),
  repaymentSchedule: z
    .enum(['lump_sum', 'installments', 'on_demand'])
    .optional(),
  // Retirement account fields
  employerMatch: z.number().min(0).max(100).optional(),
  vestingSchedule: z.string().max(200).optional(),
  iraType: z.enum(['traditional', 'roth']).optional(),
  contributionLimit: z.number().min(0).optional(),
  accountType: z.string().max(100).optional(),
  // Expenses fields
  creditor: z.string().max(100).optional(),
  expenseType: z.string().max(100).optional(),
  frequency: z.enum(['monthly', 'yearly', 'one_time']).optional(),
  dependentCount: z.number().min(0).optional(),
  supportType: z.string().max(100).optional(),
  liabilityType: z.string().max(100).optional(),
});

// Request/response schemas for API operations
export const createAssetRequestSchema = genericAssetSchema;
export const updateAssetRequestSchema = genericAssetSchema.partial().omit({
  // These fields cannot be updated
});

// Export inferred types from Zod schemas
export type CashAssetZod = z.infer<typeof cashAssetSchema>;
export type GoldAssetZod = z.infer<typeof goldAssetSchema>;
export type SilverAssetZod = z.infer<typeof silverAssetSchema>;
export type BusinessAssetZod = z.infer<typeof businessAssetSchema>;
export type PropertyAssetZod = z.infer<typeof propertyAssetSchema>;
export type StocksAssetZod = z.infer<typeof stocksAssetSchema>;
export type CryptoAssetZod = z.infer<typeof cryptoAssetSchema>;
export type DebtsAssetZod = z.infer<typeof debtsAssetSchema>;
export type AssetUnion = z.infer<typeof assetSchema>;
export type GenericAsset = z.infer<typeof genericAssetSchema>;
export type AssetFormData = z.infer<typeof assetFormSchema>;
export type CreateAssetRequest = z.infer<typeof createAssetRequestSchema>;
export type UpdateAssetRequest = z.infer<typeof updateAssetRequestSchema>;
export type AssetCategoryData = z.infer<typeof assetCategorySchema>;
