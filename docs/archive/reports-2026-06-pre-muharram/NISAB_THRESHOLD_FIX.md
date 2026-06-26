# Nisab Threshold Fix - Issue Resolution

**Date**: 2025-11-13  
**Issue**: Nisab threshold showing $0 and no UI to select Gold vs Silver basis

## Problems Identified

1. **Nisab showing $0**: The `useNisabThreshold` hook was calling a non-existent endpoint format
2. **No Nisab basis selection**: Users couldn't choose between Gold (87.48g) and Silver (612.36g) standards
3. **Poor UX**: No explanation of what Nisab basis means or which to choose

## Solutions Implemented

### 1. Fixed `useNisabThreshold` Hook

**File**: `client/src/hooks/useNisabThreshold.ts`

**Change**: Updated `fetchNisabThreshold()` to work with existing `/api/zakat/nisab` endpoint

**Before**:
```typescript
const response = await fetch(`/api/zakat/nisab?currency=${currency}&basis=${nisabBasis}`);
// Expected format that didn't exist
```

**After**:
```typescript
const response = await fetch(`/api/zakat/nisab`);
// Use existing endpoint that returns both gold and silver data
const nisabAmount = nisabBasis === 'GOLD' ? goldPrice.nisabValue : silverPrice.nisabValue;
```

### 2. Added Nisab Basis Selector UI

**File**: `client/src/pages/NisabYearRecordsPage.tsx`

**Changes**:
1. Added state: `const [nisabBasis, setNisabBasis] = useState<'GOLD' | 'SILVER'>('GOLD')`
2. Added visual selector in create modal with:
   - Two-column card layout
   - Clear labeling: "Gold (87.48g)" vs "Silver (612.36g)"
   - Descriptive text: "Most commonly used" vs "Lower threshold"
   - Educational note explaining the difference
   - Visual feedback (blue border + checkmark when selected)

3. Connected nisabBasis to record creation:
   ```typescript
   nisabBasis: nisabBasis, // Use selected basis instead of hardcoded 'GOLD'
   ```

### UI Design

```
┌─────────────────────────────────────────────┐
│ Nisab Threshold Basis                       │
├─────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────────────┐ │
│ │ Gold (87.48g)  ✓ │  │ Silver (612.36g) │ │
│ │ Most commonly    │  │ Lower threshold  │ │
│ │ used standard    │  │ (more obligated) │ │
│ └──────────────────┘  └──────────────────┘ │
│                                             │
│ ℹ️ This determines the minimum wealth      │
│    threshold for Zakat obligation.          │
│    Gold: ~$5,686  Silver: ~$459             │
└─────────────────────────────────────────────┘
```

## Expected Behavior Now

### Scenario 7: Nisab Threshold Calculation

**Before**:
- Nisab Threshold: $0
- No way to switch between Gold/Silver
- Confusing for users

**After**:
1. User creates new record
2. Sees Nisab Basis selector before asset selection
3. Can choose:
   - **Gold (87.48g)**: ~$5,686 threshold (default)
   - **Silver (612.36g)**: ~$459 threshold
4. Nisab Threshold displays correctly: 
   - For Gold: $5,686 (87.48g × $65/g)
   - For Silver: $459 (612.36g × $0.75/g)
5. Widget shows: "✓ Above Nisab" with correct percentage

## API Endpoints Used

### GET /api/zakat/nisab

**Response Format**:
```json
{
  "success": true,
  "data": {
    "goldPrice": {
      "pricePerGram": 65.0,
      "currency": "USD",
      "nisabGrams": 87.48,
      "nisabValue": 5686.2
    },
    "silverPrice": {
      "pricePerGram": 0.75,
      "currency": "USD", 
      "nisabGrams": 612.36,
      "nisabValue": 459.27
    },
    "recommendation": "gold",
    "lastUpdated": "2025-11-13T..."
  }
}
```

## Fallback Pricing

Since METALS_API_KEY is not configured, the system uses fallback prices:
- **Gold**: $65/gram (approximate October 2025 rate)
- **Silver**: $0.75/gram (approximate October 2025 rate)

These are defined in `server/src/services/nisabCalculationService.ts`:
```typescript
if (goldPrice === 0) {
  goldPrice = 65.0; // Fallback
}
if (silverPrice === 0) {
  silverPrice = 0.75; // Fallback
}
```

## Testing Checklist

- [ ] Create new record - Nisab selector visible
- [ ] Select Gold - Record created with goldNisab
- [ ] Select Silver - Record created with silverNisab
- [ ] Widget shows correct Nisab amount (not $0)
- [ ] Widget shows "✓ Above Nisab" or "✗ Below Nisab"
- [ ] Percentage calculation correct
- [ ] UI clearly explains Gold vs Silver choice

## Files Modified

1. `client/src/hooks/useNisabThreshold.ts` - Fixed API call
2. `client/src/pages/NisabYearRecordsPage.tsx` - Added UI selector and state

## Next Steps

If user wants to use real-time precious metals pricing:
1. Sign up for metals-api.com (free tier: 50 requests/month)
2. Add `METALS_API_KEY=your_key_here` to `.env`
3. Prices will update automatically (24-hour cache)

---

**Status**: ✅ READY FOR TESTING  
**Test Scenario**: Scenario 7 should now pass completely
