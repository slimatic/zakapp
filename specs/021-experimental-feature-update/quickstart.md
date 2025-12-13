# Quickstart Guide: Asset Modifiers Implementation

**Feature**: 021-experimental-feature-update  
**Date**: 2025-12-12  
**Audience**: Developers implementing this feature

## Overview

This quickstart provides step-by-step instructions for implementing dynamic asset eligibility checkboxes with calculation modifiers.

---

## Prerequisites

- ZakApp development environment set up
- Node.js 16+ and npm installed
- Docker and Docker Compose installed
- PostgreSQL or SQLite database running
- Familiarity with TypeScript, React, and Prisma

---

## Implementation Phases

### Phase 0: Database Migration ✅

**Estimated Time**: 30 minutes

1. **Create Prisma Migration**:

```bash
cd server
npx prisma migrate dev --name add_asset_modifiers
```

2. **Verify Migration File**:

Location: `server/prisma/migrations/YYYYMMDD_add_asset_modifiers/migration.sql`

Should contain:
```sql
ALTER TABLE assets ADD COLUMN calculation_modifier DECIMAL(3,2) DEFAULT 1.00 NOT NULL;
ALTER TABLE assets ADD COLUMN is_passive_investment BOOLEAN DEFAULT 0 NOT NULL;
ALTER TABLE assets ADD COLUMN is_restricted_account BOOLEAN DEFAULT 0 NOT NULL;
ALTER TABLE assets ADD CONSTRAINT valid_modifier CHECK (calculation_modifier IN (0.00, 0.30, 1.00));

ALTER TABLE asset_snapshots ADD COLUMN calculation_modifier DECIMAL(3,2) NULL;
ALTER TABLE asset_snapshots ADD COLUMN is_passive_investment BOOLEAN NULL;
ALTER TABLE asset_snapshots ADD COLUMN is_restricted_account BOOLEAN NULL;
```

3. **Run Migration**:

```bash
npx prisma migrate deploy
```

4. **Generate Prisma Client**:

```bash
npx prisma generate
```

5. **Verify Schema**:

```bash
npx prisma studio
# Open in browser, check assets table for new columns
```

**Validation**:
- ✅ Three new columns in `assets` table
- ✅ Three new nullable columns in `asset_snapshots` table
- ✅ Database constraint on `calculation_modifier`
- ✅ All existing assets have default values (1.00, false, false)

---

### Phase 1: Shared Types ✅

**Estimated Time**: 20 minutes

1. **Update Shared Asset Types**:

File: `shared/src/types/asset.ts`

```typescript
export enum CalculationModifier {
  RESTRICTED = 0.0,
  PASSIVE = 0.3,
  FULL = 1.0,
}

export const PASSIVE_INVESTMENT_TYPES = [
  'Stock',
  'ETF',
  'Mutual Fund',
  'Roth IRA',
] as const;

export const RESTRICTED_ACCOUNT_TYPES = [
  '401k',
  'Traditional IRA',
  'Pension',
  'Roth IRA',
] as const;

export interface Asset {
  // ... existing fields ...
  calculationModifier: number;
  isPassiveInvestment: boolean;
  isRestrictedAccount: boolean;
}

export interface CreateAssetDto {
  // ... existing fields ...
  isPassiveInvestment?: boolean;
  isRestrictedAccount?: boolean;
}

export interface UpdateAssetDto {
  // ... existing fields ...
  isPassiveInvestment?: boolean;
  isRestrictedAccount?: boolean;
}
```

2. **Rebuild Shared Package**:

```bash
cd shared
npm run build
cd ..
```

**Validation**:
- ✅ TypeScript compiles without errors
- ✅ Types exported correctly

---

### Phase 2: Backend - Utility Functions ✅

**Estimated Time**: 30 minutes

1. **Create Modifier Utility File**:

File: `server/src/utils/assetModifiers.ts`

```typescript
import { Asset } from '@zakapp/shared';

export function determineModifier(asset: {
  isRestrictedAccount: boolean;
  isPassiveInvestment: boolean;
}): number {
  if (asset.isRestrictedAccount) return 0.0;
  if (asset.isPassiveInvestment) return 0.3;
  return 1.0;
}

export function calculateZakatableAmount(
  asset: { value: number; calculationModifier: number },
  exchangeRate: number = 1.0
): number {
  const valueInBaseCurrency = asset.value * exchangeRate;
  return valueInBaseCurrency * asset.calculationModifier;
}

export function calculateAssetZakat(
  asset: { value: number; calculationModifier: number },
  exchangeRate: number = 1.0
): number {
  const ZAKAT_RATE = 0.025;
  const zakatableAmount = calculateZakatableAmount(asset, exchangeRate);
  return zakatableAmount * ZAKAT_RATE;
}

export function getModifierLabel(modifier: number): string {
  switch (modifier) {
    case 0.0: return 'Deferred - Restricted';
    case 0.3: return '30% Rule Applied';
    case 1.0: return 'Full Value';
    default: return 'Unknown';
  }
}
```

2. **Write Unit Tests**:

File: `server/src/__tests__/utils/assetModifiers.test.ts`

```typescript
import { determineModifier, calculateAssetZakat } from '../../utils/assetModifiers';

describe('Asset Modifiers', () => {
  describe('determineModifier', () => {
    it('returns 0.0 for restricted account', () => {
      expect(determineModifier({ isRestrictedAccount: true, isPassiveInvestment: false })).toBe(0.0);
    });

    it('returns 0.3 for passive investment', () => {
      expect(determineModifier({ isRestrictedAccount: false, isPassiveInvestment: true })).toBe(0.3);
    });

    it('returns 1.0 for default', () => {
      expect(determineModifier({ isRestrictedAccount: false, isPassiveInvestment: false })).toBe(1.0);
    });

    it('restricted takes precedence over passive', () => {
      expect(determineModifier({ isRestrictedAccount: true, isPassiveInvestment: true })).toBe(0.0);
    });
  });

  describe('calculateAssetZakat', () => {
    it('calculates correctly with passive modifier', () => {
      const asset = { value: 10000, calculationModifier: 0.3 };
      expect(calculateAssetZakat(asset)).toBe(75); // 10000 * 0.3 * 0.025
    });

    it('calculates correctly with restricted modifier', () => {
      const asset = { value: 100000, calculationModifier: 0.0 };
      expect(calculateAssetZakat(asset)).toBe(0);
    });

    it('calculates correctly with full modifier', () => {
      const asset = { value: 5000, calculationModifier: 1.0 };
      expect(calculateAssetZakat(asset)).toBe(125); // 5000 * 1.0 * 0.025
    });
  });
});
```

**Validation**:
```bash
cd server
npm test -- assetModifiers.test.ts
```

---

### Phase 3: Backend - Validation ✅

**Estimated Time**: 40 minutes

1. **Update Validation Schema**:

File: `server/src/middleware/validators/assetValidator.ts` (or create if needed)

```typescript
import { z } from 'zod';
import { PASSIVE_INVESTMENT_TYPES, RESTRICTED_ACCOUNT_TYPES } from '@zakapp/shared';

export const createAssetSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1).max(255),
  value: z.number().min(0),
  currency: z.string().length(3).default('USD'),
  acquisitionDate: z.coerce.date(),
  metadata: z.string().optional(),
  notes: z.string().max(1000).optional(),
  isPassiveInvestment: z.boolean().default(false),
  isRestrictedAccount: z.boolean().default(false),
})
.refine(
  (data) => {
    if (data.isPassiveInvestment && !PASSIVE_INVESTMENT_TYPES.includes(data.category as any)) {
      return false;
    }
    return true;
  },
  { message: 'Passive investment flag can only be set for Stock, ETF, Mutual Fund, or Roth IRA' }
)
.refine(
  (data) => {
    if (data.isRestrictedAccount && !RESTRICTED_ACCOUNT_TYPES.includes(data.category as any)) {
      return false;
    }
    return true;
  },
  { message: 'Restricted account flag can only be set for 401k, Traditional IRA, Pension, or Roth IRA' }
)
.refine(
  (data) => !(data.isPassiveInvestment && data.isRestrictedAccount),
  { message: 'Asset cannot be both passive investment and restricted account' }
);

export const updateAssetSchema = createAssetSchema.partial();
```

2. **Test Validation**:

File: `server/src/__tests__/middleware/assetValidator.test.ts`

```typescript
import { createAssetSchema } from '../../middleware/validators/assetValidator';

describe('Asset Validation', () => {
  it('allows passive flag for Stock', () => {
    const data = { category: 'Stock', isPassiveInvestment: true };
    expect(() => createAssetSchema.parse(data)).not.toThrow();
  });

  it('rejects passive flag for Cash', () => {
    const data = { category: 'Cash', isPassiveInvestment: true };
    expect(() => createAssetSchema.parse(data)).toThrow();
  });

  it('rejects both flags set simultaneously', () => {
    const data = { category: 'Stock', isPassiveInvestment: true, isRestrictedAccount: true };
    expect(() => createAssetSchema.parse(data)).toThrow();
  });
});
```

---

### Phase 4: Backend - Service Layer ✅

**Estimated Time**: 1 hour

1. **Update Asset Service**:

File: `server/src/services/assetService.ts`

```typescript
import { determineModifier } from '../utils/assetModifiers';
import { createAssetSchema, updateAssetSchema } from '../middleware/validators/assetValidator';

export class AssetService {
  async createAsset(userId: string, assetData: any) {
    // Validate input
    const validated = createAssetSchema.parse(assetData);
    
    // Determine modifier
    const calculationModifier = determineModifier({
      isRestrictedAccount: validated.isRestrictedAccount,
      isPassiveInvestment: validated.isPassiveInvestment,
    });
    
    // Create asset with modifier
    const asset = await prisma.asset.create({
      data: {
        ...validated,
        userId,
        calculationModifier,
      },
    });
    
    return asset;
  }

  async updateAsset(userId: string, assetId: string, updateData: any) {
    // Verify ownership
    const existing = await prisma.asset.findUnique({
      where: { id: assetId },
    });
    
    if (!existing || existing.userId !== userId) {
      throw new Error('Asset not found');
    }
    
    // Validate update
    const validated = updateAssetSchema.parse(updateData);
    
    // Recalculate modifier if flags changed
    let calculationModifier = existing.calculationModifier;
    if ('isRestrictedAccount' in validated || 'isPassiveInvestment' in validated) {
      calculationModifier = determineModifier({
        isRestrictedAccount: validated.isRestrictedAccount ?? existing.isRestrictedAccount,
        isPassiveInvestment: validated.isPassiveInvestment ?? existing.isPassiveInvestment,
      });
    }
    
    // Update asset
    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        ...validated,
        calculationModifier,
      },
    });
    
    return asset;
  }
}
```

2. **Update Zakat Service**:

File: `server/src/services/zakatService.ts`

```typescript
import { calculateAssetZakat } from '../utils/assetModifiers';

export class ZakatService {
  async calculateTotalZakat(userId: string) {
    const assets = await prisma.asset.findMany({
      where: { userId, isActive: true },
    });
    
    const calculations = assets.map(asset => ({
      ...asset,
      zakatableAmount: asset.value * asset.calculationModifier,
      zakatOwed: calculateAssetZakat(asset),
      modifierApplied: asset.calculationModifier === 0.0 ? 'restricted' :
                       asset.calculationModifier === 0.3 ? 'passive' : 'full',
    }));
    
    const totalZakat = calculations.reduce((sum, calc) => sum + calc.zakatOwed, 0);
    
    return {
      assets: calculations,
      totalZakat,
    };
  }
}
```

---

### Phase 5: Backend - API Endpoints ✅

**Estimated Time**: 45 minutes

1. **Update Asset Controller**:

File: `server/src/controllers/assetController.ts`

```typescript
import { Request, Response } from 'express';
import { AssetService } from '../services/assetService';

const assetService = new AssetService();

export const createAsset = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const asset = await assetService.createAsset(req.userId, req.body);
    
    // Include Zakat info in response
    const zakatInfo = {
      zakatableAmount: asset.value * asset.calculationModifier,
      zakatOwed: asset.value * asset.calculationModifier * 0.025,
      modifierApplied: asset.calculationModifier === 0.0 ? 'restricted' :
                       asset.calculationModifier === 0.3 ? 'passive' : 'full',
    };
    
    res.status(201).json({ success: true, asset, zakatInfo });
  } catch (error) {
    handleServiceError(error, res);
  }
};

export const updateAsset = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const asset = await assetService.updateAsset(req.userId, req.params.id, req.body);
    
    const zakatInfo = {
      zakatableAmount: asset.value * asset.calculationModifier,
      zakatOwed: asset.value * asset.calculationModifier * 0.025,
      modifierApplied: asset.calculationModifier === 0.0 ? 'restricted' :
                       asset.calculationModifier === 0.3 ? 'passive' : 'full',
    };
    
    res.json({ success: true, asset, zakatInfo });
  } catch (error) {
    handleServiceError(error, res);
  }
};
```

2. **Test API Endpoints**:

```bash
# Run integration tests
npm test -- --testPathPattern=integration
```

---

### Phase 6: Frontend - Types & Utils ✅

**Estimated Time**: 30 minutes

1. **Update Frontend Types**:

File: `client/src/types/asset.types.ts`

```typescript
export { Asset, CreateAssetDto, UpdateAssetDto, PASSIVE_INVESTMENT_TYPES, RESTRICTED_ACCOUNT_TYPES } from '@zakapp/shared';
```

2. **Create Modifier Utilities**:

File: `client/src/utils/assetModifiers.ts`

```typescript
import { PASSIVE_INVESTMENT_TYPES, RESTRICTED_ACCOUNT_TYPES } from '@zakapp/shared';

export function shouldShowPassiveCheckbox(assetType: string, isRestricted: boolean): boolean {
  return PASSIVE_INVESTMENT_TYPES.includes(assetType as any) && !isRestricted;
}

export function shouldShowRestrictedCheckbox(assetType: string): boolean {
  return RESTRICTED_ACCOUNT_TYPES.includes(assetType as any);
}

export function getModifierBadge(modifier: number): { text: string; color: string } {
  switch (modifier) {
    case 0.0:
      return { text: 'Deferred', color: 'gray' };
    case 0.3:
      return { text: '30% Rule', color: 'blue' };
    case 1.0:
    default:
      return { text: 'Full Value', color: 'green' };
  }
}
```

---

### Phase 7: Frontend - Asset Form ✅

**Estimated Time**: 2 hours

1. **Update AssetForm Component**:

File: `client/src/components/assets/AssetForm.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreateAssetDto } from '@zakapp/shared';
import { shouldShowPassiveCheckbox, shouldShowRestrictedCheckbox } from '../../utils/assetModifiers';
import InfoTooltip from '../common/InfoTooltip';

export function AssetForm({ onSubmit, initialData }: AssetFormProps) {
  const { register, watch, setValue } = useForm<CreateAssetDto>();
  
  const category = watch('category');
  const isRestrictedAccount = watch('isRestrictedAccount');
  
  // Auto-default restricted checkbox for retirement accounts
  useEffect(() => {
    if (['401k', 'Traditional IRA', 'Pension'].includes(category)) {
      setValue('isRestrictedAccount', true);
    }
  }, [category]);
  
  // Disable passive checkbox when restricted
  useEffect(() => {
    if (isRestrictedAccount) {
      setValue('isPassiveInvestment', false);
    }
  }, [isRestrictedAccount]);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Existing form fields... */}
      
      {/* Passive Investment Checkbox */}
      {shouldShowPassiveCheckbox(category, isRestrictedAccount) && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPassiveInvestment"
            {...register('isPassiveInvestment')}
            disabled={isRestrictedAccount}
          />
          <label htmlFor="isPassiveInvestment">
            Passive Long-Term Investment?
          </label>
          <InfoTooltip content={PASSIVE_INVESTMENT_TOOLTIP} />
        </div>
      )}
      
      {/* Restricted Account Checkbox */}
      {shouldShowRestrictedCheckbox(category) && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRestrictedAccount"
            {...register('isRestrictedAccount')}
          />
          <label htmlFor="isRestrictedAccount">
            Restricted/Inaccessible Account?
          </label>
          <InfoTooltip content={RESTRICTED_ACCOUNT_TOOLTIP} />
        </div>
      )}
      
      <button type="submit">Save Asset</button>
    </form>
  );
}
```

2. **Create Tooltip Content**:

File: `client/src/content/zakatGuidance.ts`

```typescript
export const PASSIVE_INVESTMENT_TOOLTIP = `
For passive investors who hold stocks/funds long-term without active trading, 
scholars permit calculating Zakat on 30% of the value, representing the estimated 
liquid assets of underlying companies. If you actively trade, leave unchecked to 
calculate on full value.
`;

export const RESTRICTED_ACCOUNT_TOOLTIP = `
Accounts you cannot access without penalty (401k, traditional IRA, pensions) are 
generally exempt from Zakat until withdrawal, as Zakat is only due on accessible 
wealth. Uncheck if you can access these funds without penalty.
`;
```

---

### Phase 8: Frontend - Asset Display ✅

**Estimated Time**: 1 hour

1. **Update AssetCard Component**:

File: `client/src/components/assets/AssetCard.tsx`

```typescript
import { Asset } from '@zakapp/shared';
import { getModifierBadge } from '../../utils/assetModifiers';

export function AssetCard({ asset }: { asset: Asset }) {
  const badge = getModifierBadge(asset.calculationModifier);
  
  return (
    <div className="asset-card">
      <h3>{asset.name}</h3>
      <p>Value: ${asset.value.toLocaleString()}</p>
      <p>Zakatable: ${(asset.value * asset.calculationModifier).toLocaleString()}</p>
      
      {/* Modifier Badge */}
      <span className={`badge badge-${badge.color}`}>
        {badge.text}
      </span>
    </div>
  );
}
```

---

### Phase 9: Testing ✅

**Estimated Time**: 3 hours

1. **Backend Unit Tests**:

```bash
cd server
npm test
# Target: >90% coverage for modifier logic
```

2. **Backend Integration Tests**:

```bash
npm test -- --testPathPattern=integration
```

3. **Frontend Component Tests**:

```bash
cd client
npm test
```

4. **E2E Tests** (Playwright):

File: `tests/e2e/asset-modifiers.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('create stock with passive investment checkbox', async ({ page }) => {
  await page.goto('/assets');
  await page.click('text=Add Asset');
  await page.fill('[name="name"]', 'Apple Inc.');
  await page.selectOption('[name="category"]', 'Stock');
  await page.fill('[name="value"]', '10000');
  await page.check('[name="isPassiveInvestment"]');
  await page.click('text=Save');
  
  await expect(page.locator('text=30% Rule')).toBeVisible();
  await expect(page.locator('text=$3,000')).toBeVisible(); // Zakatable amount
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (>90% coverage for modifier logic)
- [ ] Database migration tested on staging
- [ ] API documentation updated
- [ ] Frontend tooltips reviewed for Islamic accuracy
- [ ] Accessibility audit completed (WCAG 2.1 AA)
- [ ] Performance testing (<2s page loads)
- [ ] Security review completed

### Deployment Steps

1. **Database Migration**:
```bash
# On production server
cd server
npx prisma migrate deploy
```

2. **Backend Deployment**:
```bash
npm run build
pm2 restart zakapp-server
```

3. **Frontend Deployment**:
```bash
cd client
npm run build
# Deploy build/ to web server
```

4. **Verification**:
```bash
# Health check
curl https://zakapp.example.com/api/health

# Test asset creation
curl -X POST https://zakapp.example.com/api/assets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"Stock","name":"Test","value":10000,"isPassiveInvestment":true}'
```

### Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Verify existing assets unaffected (all have default modifiers)
- [ ] Test user workflows in production
- [ ] Update user documentation
- [ ] Announce feature to users

---

## Troubleshooting

### Issue: Migration fails on production

**Solution**:
```bash
# Rollback migration
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Fix issue and re-run
npx prisma migrate deploy
```

### Issue: Existing calculations changed

**Check**:
```sql
SELECT COUNT(*) FROM assets WHERE calculation_modifier != 1.00;
-- Should be 0 for existing assets
```

### Issue: Validation errors in production

**Debug**:
```typescript
// Add logging in validator
console.log('Validation input:', data);
console.log('Category:', data.category);
console.log('Passive flag:', data.isPassiveInvestment);
```

---

## Success Metrics

Monitor these metrics post-deployment:

- **Adoption**: % of new assets using modifiers
- **Calculation Accuracy**: Spot-check Zakat calculations
- **Performance**: API response times
- **Errors**: Validation error rate
- **User Feedback**: Support tickets related to modifiers

---

## Next Steps

After successful deployment:

1. Gather user feedback on tooltip clarity
2. Consider adding more educational content
3. Monitor for edge cases not covered in testing
4. Plan for additional asset types if needed
5. Consider adding modifier history/audit trail

---

## Support Resources

- **Specification**: `specs/021-experimental-feature-update/spec.md`
- **Data Model**: `specs/021-experimental-feature-update/data-model.md`
- **API Contracts**: `specs/021-experimental-feature-update/contracts/assets-api.md`
- **Islamic Research**: `specs/021-experimental-feature-update/research.md`

**Questions?** Refer to the specification documents or consult the development team.
