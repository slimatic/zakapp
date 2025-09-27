"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAssetRequestSchema = exports.createAssetRequestSchema = exports.assetFormSchema = exports.assetCategorySchema = exports.genericAssetSchema = exports.assetSchema = exports.expensesAssetSchema = exports.debtsAssetSchema = exports.cryptoAssetSchema = exports.stocksAssetSchema = exports.propertyAssetSchema = exports.businessAssetSchema = exports.silverAssetSchema = exports.goldAssetSchema = exports.cashAssetSchema = exports.baseAssetSchema = void 0;
const zod_1 = require("zod");
// Base asset schema that all specific asset schemas extend
exports.baseAssetSchema = zod_1.z.object({
    assetId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    value: zod_1.z.number().min(0).max(999999999999),
    currency: zod_1.z.string().length(3),
    description: zod_1.z.string().max(500).optional(),
    zakatEligible: zod_1.z.boolean(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
// Cash asset schema
exports.cashAssetSchema = exports.baseAssetSchema.extend({
    category: zod_1.z.literal('cash'),
    subCategory: zod_1.z.enum([
        'savings',
        'checking',
        'cash_on_hand',
        'certificates_of_deposit',
        'money_market',
    ]),
    interestRate: zod_1.z.number().min(0).max(100).optional(),
    maturityDate: zod_1.z.string().datetime().optional(),
});
// Gold asset schema
exports.goldAssetSchema = exports.baseAssetSchema.extend({
    category: zod_1.z.literal('gold'),
    subCategory: zod_1.z.enum(['jewelry', 'coins', 'bars', 'ornaments']),
    weight: zod_1.z.number().min(0).optional(), // in grams
    purity: zod_1.z.number().min(1).max(24).optional(), // in karats
});
// Silver asset schema
exports.silverAssetSchema = exports.baseAssetSchema.extend({
    category: zod_1.z.literal('silver'),
    subCategory: zod_1.z.enum(['jewelry', 'coins', 'bars', 'ornaments', 'utensils']),
    weight: zod_1.z.number().min(0).optional(), // in grams
    purity: zod_1.z.number().min(0).max(100).optional(), // percentage
});
// Business asset schema
exports.businessAssetSchema = exports.baseAssetSchema.extend({
    category: zod_1.z.literal('business'),
    subCategory: zod_1.z.enum([
        'inventory',
        'trade_goods',
        'raw_materials',
        'finished_goods',
        'work_in_progress',
    ]),
    businessType: zod_1.z.string().max(100).optional(),
    holdingPeriod: zod_1.z.number().min(0).optional(), // in months
});
// Property asset schema
exports.propertyAssetSchema = exports.baseAssetSchema.extend({
    category: zod_1.z.literal('property'),
    subCategory: zod_1.z.enum([
        'residential_investment',
        'commercial',
        'land',
        'agricultural',
        'industrial',
    ]),
    propertyType: zod_1.z.string().max(100).optional(),
    location: zod_1.z.string().max(200).optional(),
    rentalIncome: zod_1.z.number().min(0).optional(), // monthly
});
// Stocks asset schema
exports.stocksAssetSchema = exports.baseAssetSchema.extend({
    category: zod_1.z.literal('stocks'),
    subCategory: zod_1.z.enum([
        'individual_stocks',
        'mutual_funds',
        'etfs',
        'bonds',
        'index_funds',
        'retirement_401k',
        'retirement_ira',
        'retirement_other',
    ]),
    ticker: zod_1.z.string().max(20).optional(),
    shares: zod_1.z.number().min(0).optional(),
    dividendYield: zod_1.z.number().min(0).max(100).optional(),
    // Retirement-specific fields
    employerMatch: zod_1.z.number().min(0).max(100).optional(), // percentage
    vestingSchedule: zod_1.z.string().max(200).optional(),
    iraType: zod_1.z.enum(['traditional', 'roth']).optional(),
    contributionLimit: zod_1.z.number().min(0).optional(),
    accountType: zod_1.z.string().max(100).optional(),
});
// Crypto asset schema
exports.cryptoAssetSchema = exports.baseAssetSchema.extend({
    category: zod_1.z.literal('crypto'),
    subCategory: zod_1.z.enum([
        'bitcoin',
        'ethereum',
        'altcoins',
        'stablecoins',
        'defi_tokens',
    ]),
    coinSymbol: zod_1.z.string().max(20).optional(),
    quantity: zod_1.z.number().min(0).optional(),
    stakingRewards: zod_1.z.number().min(0).optional(),
});
// Debts asset schema
exports.debtsAssetSchema = exports.baseAssetSchema.extend({
    category: zod_1.z.literal('debts'),
    subCategory: zod_1.z.enum([
        'accounts_receivable',
        'personal_loans_given',
        'business_loans_given',
        'promissory_notes',
    ]),
    debtor: zod_1.z.string().max(100).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    interestRate: zod_1.z.number().min(0).max(100).optional(),
    repaymentSchedule: zod_1.z
        .enum(['lump_sum', 'installments', 'on_demand'])
        .optional(),
});
// Expenses asset schema (for deductible expenses)
exports.expensesAssetSchema = exports.baseAssetSchema.extend({
    category: zod_1.z.literal('expenses'),
    subCategory: zod_1.z.enum([
        'debts_owed',
        'essential_needs',
        'family_obligations',
        'business_liabilities',
    ]),
    creditor: zod_1.z.string().max(100).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    interestRate: zod_1.z.number().min(0).max(100).optional(),
    expenseType: zod_1.z.string().max(100).optional(),
    frequency: zod_1.z.enum(['monthly', 'yearly', 'one_time']).optional(),
    dependentCount: zod_1.z.number().min(0).optional(),
    supportType: zod_1.z.string().max(100).optional(),
    businessType: zod_1.z.string().max(100).optional(),
    liabilityType: zod_1.z.string().max(100).optional(),
});
// Union schema for all asset types
exports.assetSchema = zod_1.z.discriminatedUnion('category', [
    exports.cashAssetSchema,
    exports.goldAssetSchema,
    exports.silverAssetSchema,
    exports.businessAssetSchema,
    exports.propertyAssetSchema,
    exports.stocksAssetSchema,
    exports.cryptoAssetSchema,
    exports.debtsAssetSchema,
    exports.expensesAssetSchema,
]);
// Generic asset schema for creation/update operations
exports.genericAssetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    category: zod_1.z.enum([
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
    subCategory: zod_1.z.string().min(1).max(50),
    value: zod_1.z.number().min(0).max(999999999999),
    currency: zod_1.z.string().length(3),
    description: zod_1.z.string().max(500).optional(),
    zakatEligible: zod_1.z.boolean(),
    // Optional specific fields based on category
    interestRate: zod_1.z.number().min(0).max(100).optional(),
    maturityDate: zod_1.z.string().datetime().optional(),
    weight: zod_1.z.number().min(0).optional(),
    purity: zod_1.z.number().min(0).max(100).optional(),
    businessType: zod_1.z.string().max(100).optional(),
    holdingPeriod: zod_1.z.number().min(0).optional(),
    propertyType: zod_1.z.string().max(100).optional(),
    location: zod_1.z.string().max(200).optional(),
    rentalIncome: zod_1.z.number().min(0).optional(),
    ticker: zod_1.z.string().max(20).optional(),
    shares: zod_1.z.number().min(0).optional(),
    dividendYield: zod_1.z.number().min(0).max(100).optional(),
    coinSymbol: zod_1.z.string().max(20).optional(),
    quantity: zod_1.z.number().min(0).optional(),
    stakingRewards: zod_1.z.number().min(0).optional(),
    debtor: zod_1.z.string().max(100).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    repaymentSchedule: zod_1.z
        .enum(['lump_sum', 'installments', 'on_demand'])
        .optional(),
    // Retirement account fields
    employerMatch: zod_1.z.number().min(0).max(100).optional(),
    vestingSchedule: zod_1.z.string().max(200).optional(),
    iraType: zod_1.z.enum(['traditional', 'roth']).optional(),
    contributionLimit: zod_1.z.number().min(0).optional(),
    accountType: zod_1.z.string().max(100).optional(),
    // Expenses fields
    creditor: zod_1.z.string().max(100).optional(),
    expenseType: zod_1.z.string().max(100).optional(),
    frequency: zod_1.z.enum(['monthly', 'yearly', 'one_time']).optional(),
    dependentCount: zod_1.z.number().min(0).optional(),
    supportType: zod_1.z.string().max(100).optional(),
    liabilityType: zod_1.z.string().max(100).optional(),
});
// Asset category schema
exports.assetCategorySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    zakatRate: zod_1.z.number().min(0).max(100),
    subCategories: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        zakatRate: zod_1.z.number().min(0).max(100),
        zakatEligible: zod_1.z.boolean(),
        specificFields: zod_1.z.array(zod_1.z.string()).optional(),
    })),
    defaultZakatEligible: zod_1.z.boolean(),
    nisabApplicable: zod_1.z.boolean(),
});
// Form validation schema for frontend forms
exports.assetFormSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'Asset name is required')
        .max(100, 'Asset name must be 100 characters or less'),
    category: zod_1.z.enum([
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
    subCategory: zod_1.z
        .string()
        .min(1, 'Subcategory is required')
        .max(50, 'Subcategory must be 50 characters or less'),
    value: zod_1.z
        .number()
        .min(0, 'Value must be non-negative')
        .max(999999999999, 'Value exceeds maximum limit'),
    currency: zod_1.z.string().length(3, 'Currency must be a 3-letter code'),
    description: zod_1.z
        .string()
        .max(500, 'Description must be 500 characters or less')
        .optional(),
    zakatEligible: zod_1.z.boolean(),
    // Optional specific fields based on category
    interestRate: zod_1.z
        .number()
        .min(0, 'Interest rate must be non-negative')
        .max(100, 'Interest rate cannot exceed 100%')
        .optional()
        .or(zod_1.z.nan().transform(() => undefined)),
    maturityDate: zod_1.z
        .string()
        .optional()
        .refine((val) => {
        if (!val || val === '')
            return true; // Allow empty
        try {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }
        catch {
            return false;
        }
    }, 'Invalid date format'),
    weight: zod_1.z.number().min(0, 'Weight must be non-negative').optional(),
    purity: zod_1.z
        .number()
        .min(0, 'Purity must be non-negative')
        .max(100, 'Purity cannot exceed 100%')
        .optional(),
    businessType: zod_1.z
        .string()
        .max(100, 'Business type must be 100 characters or less')
        .optional(),
    holdingPeriod: zod_1.z
        .number()
        .min(0, 'Holding period must be non-negative')
        .optional(),
    propertyType: zod_1.z
        .string()
        .max(100, 'Property type must be 100 characters or less')
        .optional(),
    location: zod_1.z
        .string()
        .max(200, 'Location must be 200 characters or less')
        .optional(),
    rentalIncome: zod_1.z
        .number()
        .min(0, 'Rental income must be non-negative')
        .optional(),
    ticker: zod_1.z.string().max(20, 'Ticker must be 20 characters or less').optional(),
    shares: zod_1.z.number().min(0, 'Shares must be non-negative').optional(),
    dividendYield: zod_1.z
        .number()
        .min(0, 'Dividend yield must be non-negative')
        .max(100, 'Dividend yield cannot exceed 100%')
        .optional(),
    coinSymbol: zod_1.z
        .string()
        .max(20, 'Coin symbol must be 20 characters or less')
        .optional(),
    quantity: zod_1.z.number().min(0, 'Quantity must be non-negative').optional(),
    stakingRewards: zod_1.z
        .number()
        .min(0, 'Staking rewards must be non-negative')
        .optional(),
    debtor: zod_1.z
        .string()
        .max(100, 'Debtor name must be 100 characters or less')
        .optional(),
    dueDate: zod_1.z.string().datetime('Invalid date format').optional(),
    repaymentSchedule: zod_1.z
        .enum(['lump_sum', 'installments', 'on_demand'])
        .optional(),
    // Retirement account fields
    employerMatch: zod_1.z.number().min(0).max(100).optional(),
    vestingSchedule: zod_1.z.string().max(200).optional(),
    iraType: zod_1.z.enum(['traditional', 'roth']).optional(),
    contributionLimit: zod_1.z.number().min(0).optional(),
    accountType: zod_1.z.string().max(100).optional(),
    // Expenses fields
    creditor: zod_1.z.string().max(100).optional(),
    expenseType: zod_1.z.string().max(100).optional(),
    frequency: zod_1.z.enum(['monthly', 'yearly', 'one_time']).optional(),
    dependentCount: zod_1.z.number().min(0).optional(),
    supportType: zod_1.z.string().max(100).optional(),
    liabilityType: zod_1.z.string().max(100).optional(),
});
// Request/response schemas for API operations
exports.createAssetRequestSchema = exports.genericAssetSchema;
exports.updateAssetRequestSchema = exports.genericAssetSchema.partial().omit({
// These fields cannot be updated
});
//# sourceMappingURL=schemas.js.map