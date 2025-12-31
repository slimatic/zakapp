# Data Model: zakapp Entities and Relationships

## Entity Definitions

### User
**Purpose**: Represents a Muslim individual using the application for Zakat management  
**Key Attributes**:
- `id`: Unique identifier (UUID)
- `email`: Primary authentication credential (unique, validated)
- `passwordHash`: bcrypt-hashed password (12+ rounds)
- `profile`: Personal information (name, location, preferred calculation methodology)
- `settings`: Application preferences (currency, language, calendar type, reminders)
- `createdAt`: Account creation timestamp
- `lastLoginAt`: Last authentication timestamp
- `isActive`: Account status flag

**Relationships**: 
- One-to-many with Asset, Liability, AssetSnapshot, ZakatPayment
- Associated with UserSession for authentication

**Validation Rules**:
- Email must be valid format and unique
- Password must meet strength requirements (8+ chars, mixed case, numbers, symbols)
- Profile name required for Islamic personalization
- Settings must specify default calculation methodology

### Asset
**Purpose**: Financial holdings subject to Zakat calculation  
**Key Attributes**:
- `id`: Unique identifier (UUID)
- `userId`: Foreign key to User owner
- `category`: Asset type enum (cash, gold, silver, business, property, stocks, crypto)
- `name`: User-defined asset name/description
- `value`: Current monetary value (decimal)
- `currency`: Currency code (ISO 4217)
- `acquisitionDate`: When asset was acquired (for nisab timing)
- `metadata`: Category-specific details (JSON)
  - Gold/Silver: weight, purity, current market price
  - Business: equity percentage, valuation method
  - Property: property type, ownership percentage
  - Stocks/Crypto: symbol, quantity, current price
- `isActive`: Whether asset is included in calculations
- `notes`: User notes and context
- `createdAt`: Entry creation timestamp
- `updatedAt`: Last modification timestamp

**Relationships**: 
- Many-to-one with User
- Referenced in AssetSnapshot for historical tracking
- Used in ZakatCalculation for obligation computation

**Validation Rules**:
- Value must be positive number
- Category must be valid enum value
- Currency must be valid ISO code
- Acquisition date cannot be future
- Metadata must match category schema requirements

### Liability
**Purpose**: Debts and obligations that reduce zakatable wealth  
**Key Attributes**:
- `id`: Unique identifier (UUID)
- `userId`: Foreign key to User owner
- `type`: Liability type enum (loan, mortgage, credit_card, business_debt, other)
- `name`: User-defined liability description
- `amount`: Current outstanding amount (decimal)
- `currency`: Currency code (ISO 4217)
- `creditor`: Lender or creditor name
- `dueDate`: When liability must be paid (affects current year calculation)
- `isActive`: Whether liability reduces current Zakat calculation
- `notes`: Additional context and details
- `createdAt`: Entry creation timestamp
- `updatedAt`: Last modification timestamp

**Relationships**: 
- Many-to-one with User
- Referenced in AssetSnapshot for net worth calculation
- Used in ZakatCalculation for liability deduction

**Validation Rules**:
- Amount must be positive number
- Due date affects whether liability counts for current year
- Currency must be valid ISO code
- Type must be valid enum value

### ZakatCalculation
**Purpose**: Complete Zakat calculation result with methodology and breakdown  
**Key Attributes**:
- `id`: Unique identifier (UUID)
- `userId`: Foreign key to User owner
- `calculationDate`: When calculation was performed
- `methodology`: Calculation method used (standard, hanafi, shafi_i, custom)
- `calendarType`: Lunar (Hijri) or Solar (Gregorian) year basis
- `totalAssets`: Sum of all zakatable assets (decimal)
- `totalLiabilities`: Sum of all deductible liabilities (decimal)
- `netWorth`: Assets minus liabilities (decimal)
- `nisabThreshold`: Minimum wealth threshold for obligation (decimal)
- `nisabSource`: Gold or silver price basis for threshold
- `isZakatObligatory`: Whether net worth exceeds nisab
- `zakatAmount`: Calculated obligation amount (decimal)
- `zakatRate`: Rate applied (typically 2.5% but varies by methodology)
- `breakdown`: Detailed calculation steps (JSON)
- `assetsIncluded`: Snapshot of assets used in calculation (JSON)
- `liabilitiesIncluded`: Snapshot of liabilities used (JSON)
- `regionalAdjustments`: Local scholarly preferences applied (JSON)

**Relationships**: 
- Many-to-one with User
- References AssetSnapshot for historical consistency
- Referenced by ZakatPayment for payment tracking

**Validation Rules**:
- Calculation date cannot be future
- Methodology must be valid enum value
- Nisab threshold must be positive
- Zakat rate must be between 0% and 25%
- All monetary values must be in same base currency

### AssetSnapshot
**Purpose**: Point-in-time capture of complete financial portfolio  
**Key Attributes**:
- `id`: Unique identifier (UUID)
- `userId`: Foreign key to User owner
- `snapshotDate`: Date of portfolio capture
- `snapshotType`: Purpose enum (annual, custom, backup)
- `totalValue`: Combined value of all assets (decimal)
- `assetCount`: Number of assets included
- `assetsData`: Complete asset details at snapshot time (JSON)
- `liabilitiesData`: Complete liability details at snapshot time (JSON)
- `exchangeRates`: Currency conversion rates used (JSON)
- `notes`: User notes about snapshot context
- `isLocked`: Whether snapshot can be modified (historical preservation)

**Relationships**: 
- Many-to-one with User
- Referenced by ZakatCalculation for historical calculations
- Used for year-to-year comparison analytics

**Validation Rules**:
- Snapshot date cannot be future
- Total value must match sum of included assets
- Assets and liabilities data must be complete JSON objects
- Locked snapshots cannot be modified
- Snapshot type must be valid enum value

### ZakatPayment
**Purpose**: Record of actual Zakat disbursement with recipient tracking  
**Key Attributes**:
- `id`: Unique identifier (UUID)
- `userId`: Foreign key to User owner
- `calculationId`: Foreign key to ZakatCalculation that motivated payment
- `paymentDate`: When Zakat was actually disbursed
- `amount`: Amount paid out (decimal)
- `currency`: Currency of payment (ISO 4217)
- `recipients`: List of payment recipients with amounts (JSON array)
- `paymentMethod`: How payment was made (cash, bank_transfer, crypto, etc.)
- `receiptNumber`: External transaction reference
- `islamicYear`: Hijri year for which Zakat was paid
- `notes`: Additional context and verification details
- `status`: Payment status enum (pending, completed, verified)
- `verificationDetails`: Supporting documentation references (JSON)

**Relationships**: 
- Many-to-one with User
- Many-to-one with ZakatCalculation (multiple payments can fulfill one calculation)

**Validation Rules**:
- Payment amount must be positive
- Payment date cannot be future
- Recipients array must have at least one valid recipient
- Currency must be valid ISO code
- Status must be valid enum value
- Islamic year must align with payment date

### CalculationMethodology
**Purpose**: Islamic scholarly approaches and rules for Zakat calculation  
**Key Attributes**:
- `id`: Unique identifier (UUID)
- `name`: Methodology name (Standard, Hanafi, Shafi'i, Custom)
- `description`: Detailed explanation of approach
- `scholarlySource`: Islamic authority or reference for methodology
- `nisabCalculation`: How nisab threshold is determined (JSON rules)
- `assetRules`: How different asset types are handled (JSON rules)
- `liabilityRules`: How liabilities are deducted (JSON rules)
- `calendarRules`: Lunar vs solar year requirements (JSON rules)
- `zakatRates`: Rates by asset category (JSON mapping)
- `regionalVariations`: Local adaptations allowed (JSON)
- `isActive`: Whether methodology is available for selection

**Relationships**: 
- Referenced by User for default methodology preference
- Referenced by ZakatCalculation for specific calculation approach

**Validation Rules**:
- Name must be unique
- Scholarly source required for credibility
- Rules must be valid JSON objects
- Zakat rates must be within reasonable bounds (0-25%)
- At least one regional variation must be defined

### NisabThreshold
**Purpose**: Current gold and silver prices for minimum wealth requirements  
**Key Attributes**:
- `id`: Unique identifier (UUID)
- `effectiveDate`: Date when prices became effective
- `goldPricePerGram`: Current gold price (decimal)
- `silverPricePerGram`: Current silver price (decimal)
- `currency`: Base currency for prices (typically USD)
- `goldNisabGrams`: Grams of gold for nisab threshold (typically 87.48g)
- `silverNisabGrams`: Grams of silver for nisab threshold (typically 612.36g)
- `goldNisabValue`: Calculated gold-based nisab threshold
- `silverNisabValue`: Calculated silver-based nisab threshold
- `priceSource`: Where prices were obtained (API, manual entry)
- `exchangeRates`: Currency conversion rates (JSON)
- `isActive`: Whether these are current thresholds

**Relationships**: 
- Referenced by ZakatCalculation for threshold determination
- Used globally by all users for consistent calculations

**Validation Rules**:
- Effective date cannot be future
- Prices must be positive numbers
- Nisab gram amounts must match Islamic scholarly consensus
- Only one record can be active at a time
- Exchange rates must include major currencies

### UserSession
**Purpose**: Secure authentication session management  
**Key Attributes**:
- `id`: Unique identifier (UUID)
- `userId`: Foreign key to User
- `accessToken`: JWT access token (short-lived)
- `refreshToken`: JWT refresh token (longer-lived)
- `ipAddress`: Client IP address for security audit
- `userAgent`: Client browser/device information
- `issuedAt`: Token creation timestamp
- `expiresAt`: Token expiration timestamp
- `refreshedAt`: Last token refresh timestamp
- `isActive`: Whether session is valid
- `terminatedAt`: When session was ended
- `terminationReason`: Why session ended (logout, expire, security)

**Relationships**: 
- Many-to-one with User
- Used for JWT token validation and refresh

**Validation Rules**:
- Access token must be valid JWT format
- Expiration time must be after issue time
- IP address must be valid format
- Only active sessions can be used for authentication
- Termination reason required when session ends

## Entity Relationships Summary

```
User (1) ←→ (M) Asset
User (1) ←→ (M) Liability  
User (1) ←→ (M) AssetSnapshot
User (1) ←→ (M) ZakatCalculation
User (1) ←→ (M) ZakatPayment
User (1) ←→ (M) UserSession

ZakatCalculation (1) ←→ (M) ZakatPayment
AssetSnapshot (1) ←→ (M) ZakatCalculation

CalculationMethodology (M) ←→ (1) User [default preference]
CalculationMethodology (M) ←→ (1) ZakatCalculation [specific usage]

NisabThreshold (1) ←→ (M) ZakatCalculation [shared global reference]
```

## Data Storage Implementation Notes

### File Structure
```
data/
├── users/
│   └── {userId}/
│       ├── profile.json        # User entity (encrypted)
│       ├── assets.json         # Asset entities (encrypted)
│       ├── liabilities.json    # Liability entities (encrypted)
│       ├── snapshots.json      # AssetSnapshot entities (encrypted)
│       ├── calculations.json   # ZakatCalculation entities (encrypted)
│       ├── payments.json       # ZakatPayment entities (encrypted)
│       └── sessions.json       # UserSession entities (encrypted)
├── global/
│   ├── methodologies.json      # CalculationMethodology entities
│   ├── nisab.json             # NisabThreshold entities
│   └── user-index.json        # Username→userId mapping (encrypted)
└── backups/                   # Automated backup storage
```

### Encryption Strategy
- All user-specific files encrypted with AES-256-CBC
- User-specific encryption key derived from password + salt
- Global files use application-level encryption key
- Index files enable efficient user lookup without decryption
- Backup files maintain same encryption as source files