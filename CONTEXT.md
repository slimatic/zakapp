# ZakApp

## Language

**Zakat Calculation**: The mandatory Islamic practice of giving 2.5% of one's net worth that exceeds the Nisab threshold, calculated annually after owning wealth for one lunar year (Hawl).

**Nisab Threshold**: The minimum wealth level that makes a Muslim liable for Zakat, traditionally defined as either 87.48 grams of gold or 612.36 grams of silver (converted to local currency).

**Hawl**: The Islamic lunar year (354-355 days) that wealth must be possessed before becoming liable for Zakat, tracked using the Hijri calendar.

**Zakatable Wealth**: Assets that qualify for Zakat calculation, varying by Islamic school of thought but typically including cash, gold, silver, business assets, and investments.

**Liability Deduction**: Debts that can be subtracted from total zakatable wealth, with rules varying by school of thought on which types and how much can be deducted.

**Madhab/Methodology**: The four main Sunni schools of Islamic jurisprudence (Hanafi, Shafi'i, Maliki, Hanbali) that differ in Zakat calculation specifics like Nisab source and liability deductions.

**Asset Type**: Categorization of wealth items (CASH, GOLD, SILVER, CRYPTOCURRENCY, BUSINESS_ASSETS, INVESTMENT_ACCOUNT, RETIREMENT, REAL_ESTATE, DEBTS_OWED_TO_YOU, OTHER) that determines zakatability.

**Client-Side Encryption**: Zero-knowledge encryption where payment recipients and notes are encrypted with the user's password before sync, making server-side data unreadable.

**Local-First Storage**: Offline-capable database system (RxDB with IndexedDB/SQLite) that stores all data locally before optional encrypted synchronization.

**Wealth Calculator**: Core algorithm that sums zakatable assets, deducts eligible liabilities, and determines if Zakat is due based on Nisab thresholds.

**Retirement Account Calculation**: Specialized zakat calculation for retirement accounts that accounts for withdrawal penalties and taxes using methodologies like preserved growth (0.5% rule) or net withdrawal value.

**Passive Investment Rule**: Calculation modifier that applies a 30% valuation rule to certain passive investments for Zakat purposes.

_Avoid_: Zakat app, Zakat calculator, wealth management

## Architecture Overview

ZakApp follows a privacy-first, client-side architecture:
1. **Client Layer** - React/Vite frontend with local-only data storage and encryption
2. **Encryption Layer** - Web Crypto API powered AES-256-GCM encryption with PBKDF2 key derivation
3. **Storage Layer** - RxDB local database with optional CouchDB synchronization
4. **Calculation Engine** - Core zakat algorithms supporting multiple madhabs with precise Fiqh compliance
5. **UI Components** - Modular React components for asset management, calculation, and payment tracking
6. **Sync System** - Encrypted data synchronization between devices while maintaining zero-knowledge security

## Relationships
- Users → ZakApp Client: Input asset/liability data and perform zakat calculations
- ZakApp Client → Local Storage: Store encrypted financial data with offline-first approach
- ZakApp Client → CouchDB Sync: Optional encrypted synchronization between devices
- ZakApp Calculation Engine → Users: Provide Fiqh-compliant zakat calculations per selected madhab
- External Price APIs → ZakApp Client: Fetch current gold/silver prices for Nisab calculation