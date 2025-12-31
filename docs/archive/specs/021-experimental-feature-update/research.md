## Phase 0 — Research: Modifier Visibility & Nisab Records

Summary
- Goal: Surface asset modifiers (passive 30% and restricted 0%) prominently in the UI and replace the historical Yearly Snapshot concept with `NisabRecord` to store historical modifier state.
- Approach: Server suggests a default (`suggestedPassiveDefault`) using simple heuristics (asset type + metadata), while the UI displays a visible checkbox under the asset value with tooltip, immediate recalculation preview, and an override that persists to the `Asset` model. Historical records are preserved in `NisabRecord` at snapshot times.

Heuristics for suggested default
- Stocks, ETFs, Mutual Funds → suggest passive=true when no recent trade history metadata exists.
- Retirement accounts (401k, Pension, Traditional IRA) → suggested restricted=true.
- Roth IRA → suggested restricted=true by default, but allow override to accessible and then allow passive suggestion.

Risks
- Misleading users if heuristics are wrong — mitigate via prominent tooltip and ability to override.
- Accessibility and performance: ensure live previews are debounced and keyboard accessible (WCAG 2.1 AA).

Data migration considerations
- `Yearly Snapshot` data (if present) must be migrated into `NisabRecord` during migration or archived externally. Migration helper optional.

References
- Spec: `/specs/021-experimental-feature-update/spec.md`
# Research: Dynamic Asset Eligibility Checkboxes

**Phase**: 0 - Research  
**Date**: 2025-12-12  
**Feature**: 021-experimental-feature-update

## Islamic Scholarly Research

### 30% Rule for Passive Investments

**Scholarly Basis**:
The 30% rule distinguishes between two types of stock ownership:

1. **Active Trading** (`'urūḍ al-tijārah` - trade goods): Buying and selling stocks for profit. Zakat is due on 100% of market value.

2. **Passive Investing** (long-term shareholding): Owning shares as part of company ownership. Zakat is due only on the zakatable portion of the company's assets.

**Contemporary Scholarly Support**:
- **AAOIFI Sharia Standard No. 35**: Distinguishes between trading stocks and investment stocks
- **Sheikh Dr. Monzer Kahf**: Advocates for the 30% methodology for passive investors
- **Accounting and Auditing Organization for Islamic Financial Institutions**: Recognizes this methodology

**30% Estimation Rationale**:
Since most companies hold a mix of:
- Zakatable assets: cash, inventory, accounts receivable (~30%)
- Non-zakatable assets: fixed assets, property, equipment (~70%)

Scholars estimate approximately 30% of a typical company's value represents liquid, zakatable assets.

**Application in ZakApp**:
- Users holding stocks/ETFs/mutual funds for long-term growth (not day trading)
- Checkbox labeled "Passive Long-Term Investment?"
- When checked: Zakatable Amount = Asset Value × 0.30
- Educational tooltip explains when to use this option

**Simple Zakat Guide Alignment**: 
The Simple Zakat Guide video series discusses different methodologies for stocks and investments. This implementation provides flexibility while maintaining Islamic compliance.

---

### Restricted Account Exception

**Scholarly Basis**:
Zakat is only obligatory on wealth that meets certain conditions:

1. **Complete Ownership** (`milk tāmm`): The owner has full legal possession
2. **Accessibility**: The owner can use or access the wealth without prohibition or penalty
3. **Above Nisab**: Value exceeds the minimum threshold
4. **One Lunar Year Passage**: Wealth has been owned for a full lunar year

**Application to Retirement Accounts**:

**401k and Traditional IRA**:
- Early withdrawal incurs 10% penalty (before age 59½)
- Subject to income tax on withdrawal
- Not freely accessible = does not meet accessibility condition

**Scholarly Opinion**:
Many contemporary scholars hold that Zakat is deferred on inaccessible retirement accounts until:
1. The account becomes accessible (age/penalty-free withdrawal)
2. Funds are actually withdrawn

Upon withdrawal, Zakat is paid on the amount for ONE year only (not retroactively for all years it was restricted).

**Sources**:
- European Council for Fatwa and Research
- Fiqh Council of North America
- Various contemporary scholars addressing modern financial instruments

**Analogy**:
Similar to pledged assets (`marhūn`) or debt, which may reduce zakatable wealth.

**Application in ZakApp**:
- Checkbox labeled "Restricted/Inaccessible Account?"
- Default checked for 401k, Traditional IRA, Pension
- When checked: Zakatable Amount = 0 (Zakat deferred)
- Educational tooltip explains the accessibility principle

---

### Roth IRA Considerations

**Complexity**:
Roth IRA combines both considerations:
1. **Accessibility**: May be restricted (5-year rule + age requirement) OR accessible
2. **Investment Strategy**: May be passive long-term OR actively managed

**Scholarly Approach**:
1. **If Restricted**: Zakat deferred (0% calculation) regardless of investment strategy
2. **If Accessible**: User can choose based on investment approach:
   - Active management: 100% calculation
   - Passive investment: 30% rule can apply

**Application in ZakApp**:
- Show both checkboxes for Roth IRA
- Disable passive investment checkbox when account is marked restricted
- When accessible, allow user to choose calculation method

---

## Technical Research

### Database Schema Approach

**Evaluated Options**:

1. ✅ **Add Fields to Existing Asset Model** (Selected)
   - `calculationModifier` DECIMAL(3,2): Numeric multiplier (0.00, 0.30, 1.00)
   - `isPassiveInvestment` BOOLEAN: Flag for 30% rule
   - `isRestrictedAccount` BOOLEAN: Flag for accessibility exception
   - **Pros**: Simple, maintains referential integrity, easy to query
   - **Cons**: Adds nullable fields to all assets (acceptable, only 3 fields)

2. ❌ **Separate Modifier Table** (Rejected)
   - Create `AssetModifiers` table with foreign key to Asset
   - **Pros**: Normalized, keeps Asset table clean
   - **Cons**: Unnecessary complexity, additional joins, harder to query, violates YAGNI

3. ❌ **Store in metadata JSON field** (Rejected)
   - Use existing `metadata` field (encrypted JSON)
   - **Pros**: No schema change required
   - **Cons**: Can't query or index, calculation logic becomes complex, breaks type safety

**Decision**: Option 1 - Direct fields on Asset model for simplicity, performance, and type safety.

---

### Calculation Engine Modification

**Current Formula**:
```typescript
totalZakat = assets.reduce((sum, asset) => {
  return sum + (asset.value * ZAKAT_RATE); // ZAKAT_RATE = 0.025
}, 0);
```

**Updated Formula**:
```typescript
totalZakat = assets.reduce((sum, asset) => {
  const modifier = asset.calculationModifier ?? 1.0; // Default to 100%
  return sum + (asset.value * modifier * ZAKAT_RATE);
}, 0);
```

**Modifier Determination Logic**:
```typescript
function determineModifier(asset: Asset): number {
  if (asset.isRestrictedAccount) return 0.0;  // Deferred
  if (asset.isPassiveInvestment) return 0.3;  // 30% rule
  return 1.0;  // Default 100%
}
```

**Validation**:
- Server-side Zod schema ensures modifier is one of: 0.0, 0.3, 1.0
- Database constraint enforces valid values
- Front-end validation prevents invalid combinations

---

### UI/UX Research

**Conditional Rendering Strategy**:

```typescript
const PASSIVE_INVESTMENT_TYPES = ['Stock', 'ETF', 'Mutual Fund', 'Roth IRA'];
const RESTRICTED_ACCOUNT_TYPES = ['401k', 'Traditional IRA', 'Pension', 'Roth IRA'];

function shouldShowPassiveCheckbox(assetType: string, isRestricted: boolean): boolean {
  return PASSIVE_INVESTMENT_TYPES.includes(assetType) && !isRestricted;
}

function shouldShowRestrictedCheckbox(assetType: string): boolean {
  return RESTRICTED_ACCOUNT_TYPES.includes(assetType);
}
```

**Educational Tooltips**:
- Use Radix UI Tooltip component (already in project)
- Info icon next to each checkbox
- Tooltip content stored in `client/src/content/zakatGuidance.ts`
- Mobile-friendly (tap to show, not just hover)

**Accessibility**:
- ARIA labels for checkboxes
- Keyboard navigation support
- Screen reader announcements for modifier changes
- High contrast mode support
- Focus indicators

---

### Historical Snapshot Preservation

**Challenge**: Yearly snapshots must preserve modifier values as they were at snapshot time.

**Solution**:
```typescript
// AssetSnapshot already exists in schema
model AssetSnapshot {
  id              String   @id @default(cuid())
  snapshotId      String
  assetId         String
  value           Float
  // ADD THESE FIELDS:
  calculationModifier  Float?   // Preserve modifier at snapshot time
  isPassiveInvestment  Boolean?
  isRestrictedAccount  Boolean?
  // ... other fields
}
```

**Migration Strategy**:
1. Add new fields to AssetSnapshot with NULL default
2. For new snapshots, copy modifier values from Asset
3. Historical snapshots remain NULL (treated as modifier = 1.0 for backward compatibility)

---

### Currency Conversion Integration

**Current Flow**:
1. Asset value stored in original currency
2. Converted to user's base currency for calculation
3. Zakat calculated on converted amount

**With Modifiers**:
```typescript
function calculateZakatableAmount(asset: Asset, exchangeRate: number): number {
  const valueInBaseCurrency = asset.value * exchangeRate;
  const modifier = determineModifier(asset);
  return valueInBaseCurrency * modifier;
}
```

**Order of Operations**:
1. Convert currency: `valueInBaseCurrency = asset.value × exchangeRate`
2. Apply modifier: `zakatableAmount = valueInBaseCurrency × modifier`
3. Calculate Zakat: `zakat = zakatableAmount × 0.025`

This ensures modifier is applied to the final currency-converted value.

---

## Performance Considerations

**Database Indexing**:
```sql
-- Existing indexes on assets table
@@index([userId])
@@index([category])
@@index([userId, isActive])

-- NEW: Composite index for filtering by modifiers
@@index([userId, isPassiveInvestment])
@@index([userId, isRestrictedAccount])
```

**Query Optimization**:
- Modifier fields are small (BOOLEAN, DECIMAL(3,2))
- No additional joins required
- Calculation performed in application layer (already cached)

**Caching Strategy**:
- TanStack Query already caches asset data
- Cache key includes asset IDs and updatedAt timestamps
- Modifier changes trigger cache invalidation
- No additional caching needed

**Expected Impact**:
- Database query time: +0-5ms (negligible)
- Calculation time: +0-1ms per asset (multiplication operation)
- UI render time: +10-20ms (conditional checkbox rendering)
- **Total impact**: Well within <100ms calculation budget

---

## Security Analysis

**Threat Model**:

1. **Modifier Manipulation**:
   - **Risk**: User sends invalid modifier value (e.g., 0.5, 2.0)
   - **Mitigation**: Server-side validation with Zod, database constraint

2. **Checkbox State Tampering**:
   - **Risk**: Client-side manipulation to reduce Zakat
   - **Mitigation**: Server recalculates modifier from checkbox states, ignores client-sent modifier value

3. **Data Exposure**:
   - **Risk**: Modifier data reveals investment strategy
   - **Assessment**: Modifier is not sensitive (unlike asset value). Stored unencrypted but only accessible to authenticated user.

4. **Audit Trail**:
   - **Risk**: Changes to modifier not logged
   - **Mitigation**: Asset updates trigger audit logs (existing system)

**Security Recommendations**:
- ✅ Server-side validation of modifier values
- ✅ Database constraint enforcement
- ✅ Audit logging of modifier changes
- ✅ Rate limiting on asset update endpoints (already implemented)
- ✅ JWT authentication required for all asset operations (already implemented)

---

## Testing Strategy

### Unit Tests (Target: >90% coverage)

**Backend**:
```typescript
describe('Zakat Calculation with Modifiers', () => {
  test('applies 30% modifier for passive investment', () => {
    const asset = { value: 10000, calculationModifier: 0.3 };
    expect(calculateZakat(asset)).toBe(75); // 10000 * 0.3 * 0.025 = 75
  });
  
  test('applies 0% modifier for restricted account', () => {
    const asset = { value: 100000, calculationModifier: 0.0 };
    expect(calculateZakat(asset)).toBe(0);
  });
  
  test('defaults to 100% for standard assets', () => {
    const asset = { value: 5000, calculationModifier: 1.0 };
    expect(calculateZakat(asset)).toBe(125); // 5000 * 1.0 * 0.025 = 125
  });
});
```

**Frontend**:
```typescript
describe('AssetForm Checkbox Logic', () => {
  test('shows passive checkbox for Stock asset type', () => {
    render(<AssetForm assetType="Stock" />);
    expect(screen.getByLabelText(/Passive Long-Term Investment/)).toBeInTheDocument();
  });
  
  test('hides passive checkbox when account is restricted', () => {
    render(<AssetForm assetType="Stock" isRestricted={true} />);
    expect(screen.queryByLabelText(/Passive Long-Term Investment/)).not.toBeInTheDocument();
  });
});
```

### Integration Tests

**API Endpoints**:
- Create asset with modifiers
- Update asset modifiers
- Retrieve assets with modifiers
- Calculate total Zakat with mixed modifiers

**Database**:
- Constraint validation
- Migration rollback/forward
- Snapshot creation with modifiers

### E2E Tests (Playwright)

**User Workflows**:
1. Create Stock asset → Check passive checkbox → Verify calculation
2. Create 401k asset → Verify restricted default → Verify 0% calculation
3. Create Roth IRA → Uncheck restricted → Check passive → Verify 30% calculation
4. Edit existing asset → Change modifier → Verify recalculation
5. View Zakat summary → Verify modifier badges displayed

---

## Migration Plan

### Phase 1: Database Schema
1. Create migration to add new fields
2. Set defaults: `calculationModifier = 1.0`, booleans = `false`
3. Add database constraint for valid modifiers
4. Test migration on development database

### Phase 2: Backend Implementation
1. Update Prisma types
2. Modify calculation engine
3. Update API endpoints to accept modifier fields
4. Add server-side validation
5. Write unit tests

### Phase 3: Frontend Implementation
1. Update TypeScript types
2. Add conditional checkbox rendering
3. Create educational tooltips
4. Update asset forms and displays
5. Write component tests

### Phase 4: Testing & Validation
1. Run full test suite
2. Manual testing of all user stories
3. Accessibility audit
4. Performance testing
5. Islamic compliance review

### Phase 5: Deployment
1. Database migration in production
2. Backend deployment
3. Frontend deployment
4. Monitoring and observability
5. User documentation update

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing calculations | Low | High | Default modifier = 1.0 ensures backward compatibility |
| Islamic compliance issues | Medium | Critical | Scholarly review required before release |
| User confusion | Medium | Medium | Clear tooltips, educational content, usability testing |
| Performance degradation | Low | Medium | Benchmarking, optimization, caching |
| Security vulnerabilities | Low | High | Server-side validation, audit logging |
| Migration failures | Low | High | Thorough testing, rollback plan |

---

## Dependencies

**External**:
- None (all dependencies already in project)

**Internal**:
- Prisma ORM (existing)
- Zod validation (existing)
- TanStack Query (existing)
- Radix UI Tooltip (existing)

**New Dependencies**:
- None required

---

## Conclusion

This research validates the technical and Islamic scholarly feasibility of implementing dynamic asset eligibility checkboxes. The approach is:

- ✅ **Islamically Sound**: Aligned with contemporary scholarly opinions and Simple Zakat Guide
- ✅ **Technically Simple**: Extends existing models without architectural changes
- ✅ **Performant**: Minimal impact on calculation and rendering performance
- ✅ **Secure**: Proper validation and audit trails
- ✅ **Testable**: Clear test strategy with >90% coverage target
- ✅ **Backward Compatible**: Existing assets unaffected (default modifier = 1.0)

**Recommendation**: Proceed to Phase 1 (Data Model Design) with confidence.
