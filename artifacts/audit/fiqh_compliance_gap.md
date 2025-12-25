# Fiqh Compliance Gap Analysis

## 1. Executive Summary
The current application provides a basic framework for Zakat calculation but lacks the nuance required for a professional-grade Islamic financial instrument. The logic is overly simplified, particularly regarding modern asset classes (401k, Crypto) and Hawl (lunar year) tracking.

## 2. Calculation Logic Gaps

### 2.1 Retirement Accounts (401k/IRA) - **MISSING**
- **Current State**: Retirement assets are likely lumped under "Investment Account" or "Other" without specific logic.
- **Fiqh Requirement**: 
    - **Strong Opinion**: Zakat is due on the "Net Withdrawable Balance" (Balance - Taxes - Early Withdrawal Penalty).
    - **Conservative Opinion**: Zakat due on 100% of balance.
- **Gap**: No logic exists to calculate "Net Withdrawable" value. The user currently has to do this math manually.
- **Recommendation**: Add a specific `AssetType.RETIREMENT` subclass with a toggle for "Compute Net Withdrawable".

### 2.2 Cryptocurrency Valuation - **SIMPLISTIC**
- **Current State**: treated as a generic asset.
- **Fiqh Requirement**: 
    - **Trading**: Zakat on Market Value (100%).
    - **HODL/Exchange**: Nuanced opinions exist.
- **Gap**: Lacks features to link to live price feeds or API w/ offline fallback.

### 2.3 Hawl (Lunar Year) Tracking - **INACCURATE**
- **Current State**: Uses an approximation formula: `(gregorianYear - 622) * 1.031`.
- **Fiqh Requirement**: Zakat is due precisely one lunar year after reaching Nisab.
- **Gap**: This formula drifts by days over time.
- **Recommendation**: Implement `hijri-converter` or `umm-al-qura` based calendar for precise date tracking.

## 3. Nisab Handling
- **Current State**: `ZakatCalculationService` fetches a single `NisabThreshold` record from the server DB.
- **Gap**: 
    - Reliance on server connectivity for Nisab.
    - No offline fallback (or user-defined manual entry fallback is not obvious in the flow).
- **Recommendation**: Allow users to input Gold/Silver spot prices manually if offline, or cache last known values in `localStorage`.

## 4. Asset Categorization Nuance
- **Current State**: Broad categories (`BUSINESS`, `REAL_ESTATE`).
- **Fiqh Requirement**: 
    - **Real Estate**: Rental Property (Zakat on income) vs Trade Property (Zakat on value).
    - **Business**: Fixed Assets (exempt) vs Inventory (zakatable).
- **Gap**: The schema `Asset` model is too flat.
- **Recommendation**: Refactor `Asset` model to use a `Discriminated Union` in TypeScript to enforce category-specific fields (e.g., `RentalAsset` vs `TradeAsset`).
