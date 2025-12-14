# Feature Specification: Dynamic Asset Eligibility Checkboxes for Zakat Calculation

**Feature Branch**: `021-experimental-feature-update`  
**Created**: 2025-12-12  
**Status**: Draft  
**Input**: User description: "Experimental Feature to Update the Asset to support dynamic eligibility checkboxes based on the Asset Type"

## Clarifications

### Session 2025-12-13

- Q: Default state for the "Passive Long-Term Investment?" checkbox → A: C (Auto-set based on detected asset type/rules). The checkbox remains visible and editable so users can override the suggested state.

- Q: When a user edits an asset date, should the change update historical snapshots? → A: A (Update only the asset — do not modify historical snapshots). Historical yearly snapshots must remain immutable and reflect the values at snapshot time.

- Q: Which historical-records model should we use for preserving modifier state? → A: B (Replace Yearly Snapshots with Nisab Records—store historical modifier state in Nisab Records instead.)


## User Scenarios & Testing *(mandatory)*

### User Story 1 - Passive Investment Zakat Calculation (Priority: P1)

As a Muslim investor with stocks, ETFs, or mutual funds held as long-term passive investments, I want to calculate Zakat using the 30% rule so that I only pay Zakat on the estimated liquid assets portion of my holdings rather than the full market value.

**Why this priority**: This is the most common scenario for modern Muslim investors who hold retirement accounts and passive index funds. The 30% rule is a widely accepted scholarly opinion for passive investors who do not trade actively. Implementing this first provides immediate value to the largest user segment.

**Independent Test**: Can be fully tested by creating a Stock/ETF/Mutual Fund asset, checking the "Passive Long-Term Investment" checkbox, and verifying that the zakatable amount is calculated as 30% of the asset value (e.g., $10,000 asset → $300 zakatable amount → $7.50 Zakat at 2.5%).

**Acceptance Scenarios**:

1. **Given** a user is adding a Stock asset worth $10,000, **When** they check the "Passive Long-Term Investment?" checkbox, **Then** the zakatable amount should be calculated as $3,000 (30% of $10,000) and Zakat owed should be $75 (2.5% of $3,000)

2. **Given** a user is adding an ETF asset worth $50,000, **When** they leave the "Passive Long-Term Investment?" checkbox unchecked (active trader), **Then** the zakatable amount should be $50,000 (100%) and Zakat owed should be $1,250 (2.5% of $50,000)

3. **Given** a user has an existing Mutual Fund asset marked as passive investment, **When** they edit the asset and uncheck the "Passive Long-Term Investment?" checkbox, **Then** the zakatable amount should recalculate to 100% of the asset value

4. **Given** a user is viewing their Zakat calculation summary, **When** they have multiple stock assets with different modifiers, **Then** each asset should display its modifier status and contribute the correct amount to total Zakat

---

### User Story 2 - Restricted Account Accessibility Exception (Priority: P2)

As a Muslim with a 401k, Traditional IRA, or pension account that I cannot access without penalty, I want to mark my account as "Restricted/Inaccessible" so that Zakat is deferred until I can actually withdraw the funds, in accordance with scholarly guidance on inaccessible assets.

**Why this priority**: This addresses a critical Islamic compliance question for many American Muslims with retirement accounts. While less common than passive investments overall, it's essential for users with restricted accounts to have the correct calculation. It's P2 because it can be implemented independently after P1 and serves a specific user segment.

**Independent Test**: Can be fully tested by creating a 401k or Traditional IRA asset, verifying the "Restricted/Inaccessible Account?" checkbox is checked by default, and confirming that the zakatable amount is $0 regardless of account value.

**Acceptance Scenarios**:

1. **Given** a user is adding a 401k account worth $100,000, **When** the "Restricted/Inaccessible Account?" checkbox is checked (default), **Then** the zakatable amount should be $0 and no Zakat should be calculated for this asset

2. **Given** a user is adding a Traditional IRA worth $75,000, **When** they uncheck the "Restricted/Inaccessible Account?" checkbox (indicating they can access it), **Then** the zakatable amount should be $75,000 (100%) and Zakat owed should be $1,875

3. **Given** a user is adding a Pension account, **When** the asset type is selected, **Then** the "Restricted/Inaccessible Account?" checkbox should appear checked by default

4. **Given** a user has marked their 401k as restricted, **When** they view their total Zakat calculation, **Then** the 401k should appear in the asset list but contribute $0 to the total Zakat owed

---

### User Story 3 - Roth IRA with Optional 30% Rule (Priority: P3)

As a Muslim with a Roth IRA that I can access (having met the 5-year rule and age requirement), I want the option to apply either the 100% calculation or the 30% passive investment rule so that I can calculate Zakat based on my specific investment strategy within the Roth account.

**Why this priority**: This is a more nuanced scenario combining accessibility with investment strategy. It's P3 because it requires both P1 and P2 logic to be in place, and it serves users with accessible Roth IRAs who want flexibility in calculation methodology.

**Independent Test**: Can be fully tested by creating a Roth IRA asset, unchecking the accessibility restriction (making it accessible), and verifying that the passive investment checkbox becomes available, allowing the user to choose between 100% and 30% calculation.

**Acceptance Scenarios**:

1. **Given** a user is adding a Roth IRA worth $50,000 that is accessible, **When** they uncheck "Restricted/Inaccessible Account?" and check "Passive Long-Term Investment?", **Then** the zakatable amount should be $15,000 (30% of $50,000) and Zakat owed should be $375

2. **Given** a user is adding a Roth IRA worth $50,000 that is accessible, **When** they uncheck "Restricted/Inaccessible Account?" but leave "Passive Long-Term Investment?" unchecked, **Then** the zakatable amount should be $50,000 (100%) and Zakat owed should be $1,250

3. **Given** a user has a Roth IRA marked as restricted, **When** they view the asset form, **Then** the "Passive Long-Term Investment?" checkbox should be disabled/hidden until they mark the account as accessible

---

### User Story 4 - Educational Context and Transparency (Priority: P3)

As a Muslim user unfamiliar with these Zakat calculation methodologies, I want to understand what each checkbox means and why it affects my Zakat calculation so that I can make informed decisions aligned with Islamic scholarship.

**Why this priority**: This supports Constitutional Principle I (Professional & Modern User Experience) and Principle V (Foundational Islamic Guidance). While essential for user confidence, it's P3 because it enhances existing functionality rather than enabling core calculations.

**Independent Test**: Can be fully tested by viewing the asset form for applicable asset types and verifying that info icons/tooltips provide clear explanations with scholarly references for each checkbox option.

**Acceptance Scenarios**:

1. **Given** a user is viewing the "Passive Long-Term Investment?" checkbox, **When** they hover over or click an info icon, **Then** they should see an explanation stating: "For passive investors who hold stocks/funds long-term without active trading, scholars permit calculating Zakat on 30% of the value, representing the estimated liquid assets of underlying companies. If you actively trade, leave unchecked to calculate on full value."

2. **Given** a user is viewing the "Restricted/Inaccessible Account?" checkbox, **When** they hover over or click an info icon, **Then** they should see an explanation stating: "Accounts you cannot access without penalty (401k, traditional IRA, pensions) are generally exempt from Zakat until withdrawal, as Zakat is only due on accessible wealth. Uncheck if you can access these funds without penalty."

3. **Given** a user is viewing their Zakat calculation summary, **When** they see assets with modifiers applied, **Then** each asset should display a badge or indicator showing which rule is applied (e.g., "30% rule applied" or "Deferred - Restricted")

---

### Edge Cases

- What happens when a user marks a non-applicable asset type (e.g., Cash, Gold) with passive investment status? System should not display these checkboxes for asset types where they don't apply.

- How does the system handle a user who checks both "Restricted" and attempts to apply the 30% rule? System should disable the passive investment checkbox when the account is marked as restricted, as restricted assets have 0% zakatable amount regardless of investment strategy.

- What happens when a user changes an asset type from "Stock" to "Cash" after checking the passive investment box? System should remove the checkbox and reset the calculation modifier to 1.0 (100%).

 - How does the system handle historical Nisab Records where an asset had a modifier applied? Historical calculations should preserve the modifier that was in effect at the time of the Nisab Record.

- What happens when a user has $0 or negative values in restricted accounts? System should still show $0 zakatable amount; validation should prevent negative asset values during input.

- How does the system handle currency conversion with modifiers? Modifier should be applied after currency conversion to user's base currency (e.g., convert foreign stock value to USD first, then apply 30% modifier).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a "Passive Long-Term Investment?" checkbox for asset types: Stock, ETF, and Mutual Fund
  
- **FR-002**: System MUST default the "Passive Long-Term Investment?" checkbox to be auto-set based on detected asset type and business rules (no fixed UI default). The checkbox must still be visible to users and remain editable so users can override the auto-set value.

- **FR-003**: System MUST calculate zakatable amount as 30% of asset value when "Passive Long-Term Investment?" is checked

- **FR-004**: System MUST calculate zakatable amount as 100% of asset value when "Passive Long-Term Investment?" is unchecked for applicable asset types

- **FR-005**: System MUST display a "Restricted/Inaccessible Account?" checkbox for asset types: 401k, Pension, and Traditional IRA

- **FR-006**: System MUST default the "Restricted/Inaccessible Account?" checkbox to checked (restricted assumption)

- **FR-007**: System MUST calculate zakatable amount as 0% (zero) of asset value when "Restricted/Inaccessible Account?" is checked

- **FR-008**: System MUST calculate zakatable amount as 100% of asset value when "Restricted/Inaccessible Account?" is unchecked for applicable asset types

- **FR-009**: System MUST allow Roth IRA assets to display both accessibility and passive investment checkboxes when marked as accessible

- **FR-010**: System MUST disable or hide the "Passive Long-Term Investment?" checkbox when "Restricted/Inaccessible Account?" is checked

- **FR-011**: System MUST persist the checkbox states (calculation modifiers) with each asset record in the database

- **FR-012**: System MUST apply modifiers to asset values before calculating the 2.5% Zakat rate using the formula: Total Zakat = Σ (Asset Value × Modifier × 0.025)

- **FR-013**: System MUST display the current modifier status for each asset in the asset list and calculation summary views

- **FR-014**: System MUST preserve historical modifier values when creating Nisab Records

- **FR-015**: System MUST provide educational tooltips or info icons explaining each checkbox's Islamic basis and calculation impact

- **FR-016**: System MUST only display applicable checkboxes based on the selected asset type (no checkboxes for Cash, Gold, Silver, etc.)

- **FR-017**: System MUST reset/remove modifiers when a user changes an asset type to one where modifiers don't apply

- **FR-018**: System MUST validate that modifier values are one of: 0.0 (restricted), 0.3 (passive), or 1.0 (full/default)

- **FR-019**: System MUST recalculate total Zakat whenever a user changes a modifier checkbox state

- **FR-020**: System MUST maintain Islamic compliance by aligning all educational content with Simple Zakat Guide methodologies and scholarly consensus on passive investments and restricted accounts

### Key Entities

- **Asset**: Existing entity representing user's zakatable assets. Will be extended to include:
  - `calculationModifier` (decimal): Multiplier applied to asset value (0.0, 0.3, or 1.0)
  - `isPassiveInvestment` (boolean): Flag indicating if 30% rule applies
  - `isRestrictedAccount` (boolean): Flag indicating if account is inaccessible
  - Relationships: Belongs to User, included in Snapshots

- **Asset Type**: Existing categorization system that determines which checkboxes are displayed:
  - Investment assets (Stock, ETF, Mutual Fund) → Show passive investment checkbox
  - Retirement assets (401k, Pension, Traditional IRA) → Show restricted account checkbox
  - Roth IRA → Show both checkboxes (conditional on accessibility)
  - Other assets (Cash, Gold, Silver, etc.) → No special checkboxes

- **Zakat Calculation**: The calculation engine that applies the formula:
  - `Total Zakat = Σ (Asset Value × Modifier × 0.025)`
  - Where Modifier defaults to 1.0, becomes 0.3 for passive investments, and 0.0 for restricted accounts

- **Yearly Snapshot**: Historical record of assets and calculations at a point in time. Must preserve:
  - Asset values as they were
  - Modifier flags as they were set
  - Calculated Zakat amounts using those modifiers
 - **Nisab Record**: Historical record of assets and calculations at a point in time (replacement for Yearly Snapshots). Must preserve:
  - Asset values as they were
  - Modifier flags as they were set
  - Calculated Zakat amounts using those modifiers


## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users with stocks/ETFs/mutual funds can successfully apply the 30% passive investment rule and see their zakatable amount reduce to 30% of the asset value within 30 seconds of checking the box

- **SC-002**: Users with restricted retirement accounts (401k, Traditional IRA, Pension) can mark accounts as restricted and see $0 Zakat calculated for those assets regardless of account value

- **SC-003**: The total Zakat calculation accurately reflects all modifiers across all assets, with 100% accuracy validated through automated tests covering all modifier combinations

- **SC-004**: Educational tooltips/info icons provide clear explanations for each checkbox, validated through user testing showing >90% comprehension of when to use each option

- **SC-005**: System performance remains under 2 seconds for page loads even with modifier calculations, as measured on reference hardware with 50+ assets

- **SC-006**: Nisab Records preserve modifier states with 100% accuracy, ensuring users can review past Zakat calculations with the modifiers that were in effect at that time

- **SC-007**: >95% of users successfully complete asset creation with appropriate modifiers on first attempt, as measured through usability testing

- **SC-008**: All educational content and methodology explanations align with Simple Zakat Guide teachings, verified through scholarly review before release

- **SC-009**: Modifier logic is covered by >90% automated test coverage, including unit tests for calculation engine and integration tests for UI interactions

- **SC-010**: Users report increased confidence in Zakat calculations for investment accounts, measured through post-implementation survey showing >80% satisfaction with the new functionality

## Islamic Scholarly Basis

### 30% Rule for Passive Investments

The 30% rule for passive investments is based on scholarly opinion that distinguishes between active trading (buying/selling stocks for profit) and passive long-term investing (holding stocks as part of a diversified portfolio). 

**Scholarly Reasoning**:
- When actively trading, Zakat is due on the full market value as merchandise (`'urūḍ al-tijārah`)
- When passively investing long-term, the investor owns shares of companies that themselves contain both zakatable (cash, inventory, receivables) and non-zakatable (fixed assets, property) components
- Scholars estimate that approximately 30% of a typical company's value represents liquid, zakatable assets
- This methodology is supported by contemporary scholars including Sheikh Dr. Monzer Kahf and the AAOIFI Sharia Standard

**Application in ZakApp**:
This feature MUST align with Simple Zakat Guide's treatment of investment assets and provide clear educational content explaining when each method applies.

### Restricted Account Exception

The restricted account exception is based on the Islamic principle that Zakat is only obligatory on wealth that is:
1. In the owner's possession (`milk tāmm` - complete ownership)
2. Accessible and usable by the owner

**Scholarly Reasoning**:
- Accounts with early withdrawal penalties (401k, Traditional IRA, pensions) do not meet the accessibility criterion until the owner can withdraw without penalty
- Many scholars defer Zakat on such accounts until distribution/withdrawal
- Upon withdrawal, the owner would pay Zakat on the withdrawn amount for one year (not retroactively for all years of restriction)
- This is analogous to the treatment of debt or pledged assets

**Application in ZakApp**:
This feature MUST provide clear guidance that aligns with Simple Zakat Guide's principles and includes appropriate disclaimers encouraging users to consult with scholars for their specific situations.

## Implementation Notes

### Database Schema Changes

```sql
-- Add new columns to assets table
ALTER TABLE assets ADD COLUMN calculation_modifier DECIMAL(3,2) DEFAULT 1.00;
ALTER TABLE assets ADD COLUMN is_passive_investment BOOLEAN DEFAULT FALSE;
ALTER TABLE assets ADD COLUMN is_restricted_account BOOLEAN DEFAULT FALSE;

-- Add check constraint to ensure valid modifier values
ALTER TABLE assets ADD CONSTRAINT valid_modifier 
  CHECK (calculation_modifier IN (0.00, 0.30, 1.00));
```

### Calculation Engine Update

The `calculateTotalZakat()` function must be updated to:
1. Retrieve all assets for the user
2. For each asset, apply the stored `calculation_modifier`
3. Sum the modified values: `totalZakatable = Σ(asset.value × asset.calculation_modifier)`
4. Calculate Zakat: `totalZakat = totalZakatable × 0.025`

### UI Conditional Rendering Logic

```typescript
// Pseudo-code for checkbox display logic
function shouldShowPassiveInvestmentCheckbox(assetType: string): boolean {
  return ['Stock', 'ETF', 'Mutual Fund', 'Roth IRA'].includes(assetType);
}

function defaultPassiveCheckboxState(assetType: string, assetMetadata: any): boolean {
  // Auto-set the checkbox based on detected asset type and available heuristics
  // e.g., treat ETFs/mutual funds as passive by default if no recent trade history
  // Implemented as a server-side rule so UI only receives the suggested default.
  return shouldShowPassiveInvestmentCheckbox(assetType) && /* server-provided suggestion */ true;
}

function shouldShowRestrictedAccountCheckbox(assetType: string): boolean {
  return ['401k', 'Pension', 'Traditional IRA', 'Roth IRA'].includes(assetType);
}

function shouldDisablePassiveCheckbox(isRestricted: boolean): boolean {
  return isRestricted === true;
}
```

### Migration Strategy

For existing assets in the database:
1. All existing assets should be migrated with `calculation_modifier = 1.00` (default 100%)
2. `is_passive_investment = FALSE`
3. `is_restricted_account = FALSE`
4. This ensures backward compatibility and does not change existing calculations

### Educational Content Requirements

Each checkbox must have an associated info icon/tooltip with:
- Clear explanation of what the option means
- Guidance on when to use it
- Islamic scholarly basis (simplified)
- Reference to Simple Zakat Guide where applicable
- Disclaimer encouraging consultation with scholars for complex situations

### Testing Strategy

1. **Unit Tests**: Test calculation engine with all modifier combinations
2. **Integration Tests**: Test UI interaction with backend calculation updates
3. **E2E Tests**: Test complete user flows for each user story
4. **Nisab Record Tests**: Verify historical Nisab Record preservation of modifiers
5. **Accessibility Tests**: Ensure checkboxes and tooltips meet WCAG 2.1 AA standards
6. **Islamic Compliance Review**: Scholarly validation of educational content and methodology

### Security Considerations

- All modifier values must be validated server-side
- Modifier changes should be logged for audit trail
- Encrypted asset data must remain encrypted; modifiers stored separately
- Rate limiting on calculation endpoints to prevent abuse

### Performance Considerations

- Modifiers should be indexed in database for efficient querying
- Calculation caching should include modifier state as part of cache key
- Frontend should debounce checkbox changes to avoid excessive recalculations

## Open Questions / Needs Clarification

None at this time. The specification is complete based on the provided user requirements and Islamic scholarly guidance. All functional requirements are testable and implementation details are clear.

## References

- Simple Zakat Guide Video Series (Full Playlist): https://youtube.com/playlist?list=PLXguldgkbZPffh6p4efOetXkTeJATAbcS&si=CoJ4JB5dLrJDgNS7
- SimpleZakatGuide.com
- AAOIFI Sharia Standards on Zakat
- Contemporary scholarly opinions on Zakat for modern investment vehicles
- ZakApp Constitutional Principles (Principles I, III, IV, V)

## Next Steps

1. Scholarly review of this specification to validate Islamic compliance
2. Create detailed implementation plan following spec-driven development workflow
3. Update data model and run database migrations
4. Implement calculation engine modifications with comprehensive test coverage
5. Build UI components with conditional rendering logic
6. Create educational content and tooltips aligned with Simple Zakat Guide
7. Conduct usability testing with target users
8. Perform Islamic compliance validation
9. Security audit of implementation
10. Deployment following established security and privacy protocols
