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
  subCategory: z.enum(['savings', 'checking', 'cash_on_hand', 'certificates_of_deposit', 'money_market']),
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
  subCategory: z.enum(['inventory', 'trade_goods', 'raw_materials', 'finished_goods', 'work_in_progress']),
  businessType: z.string().max(100).optional(),
  holdingPeriod: z.number().min(0).optional(), // in months
});

// Property asset schema
export const propertyAssetSchema = baseAssetSchema.extend({
  category: z.literal('property'),
  subCategory: z.enum(['residential_investment', 'commercial', 'land', 'agricultural', 'industrial']),
  propertyType: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  rentalIncome: z.number().min(0).optional(), // monthly
});

// Stocks asset schema
export const stocksAssetSchema = baseAssetSchema.extend({
  category: z.literal('stocks'),
  subCategory: z.enum(['individual_stocks', 'mutual_funds', 'etfs', 'bonds', 'index_funds']),
  ticker: z.string().max(20).optional(),
  shares: z.number().min(0).optional(),
  dividendYield: z.number().min(0).max(100).optional(),
});

// Crypto asset schema
export const cryptoAssetSchema = baseAssetSchema.extend({
  category: z.literal('crypto'),
  subCategory: z.enum(['bitcoin', 'ethereum', 'altcoins', 'stablecoins', 'defi_tokens']),
  coinSymbol: z.string().max(20).optional(),
  quantity: z.number().min(0).optional(),
  stakingRewards: z.number().min(0).optional(),
});

// Debts asset schema
export const debtsAssetSchema = baseAssetSchema.extend({
  category: z.literal('debts'),
  subCategory: z.enum(['accounts_receivable', 'personal_loans_given', 'business_loans_given', 'promissory_notes']),
  debtor: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  repaymentSchedule: z.enum(['lump_sum', 'installments', 'on_demand']).optional(),
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
]);

// Generic asset schema for creation/update operations
export const genericAssetSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['cash', 'gold', 'silver', 'business', 'property', 'stocks', 'crypto', 'debts']),
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
  repaymentSchedule: z.enum(['lump_sum', 'installments', 'on_demand']).optional(),
});

// Asset category schema
export const assetCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  zakatRate: z.number().min(0).max(100),
  subCategories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    zakatRate: z.number().min(0).max(100),
    zakatEligible: z.boolean(),
    specificFields: z.array(z.string()).optional(),
  })),
  defaultZakatEligible: z.boolean(),
  nisabApplicable: z.boolean(),
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
export type CreateAssetRequest = z.infer<typeof createAssetRequestSchema>;
export type UpdateAssetRequest = z.infer<typeof updateAssetRequestSchema>;
export type AssetCategoryData = z.infer<typeof assetCategorySchema>;