# Changelog

## [0.9.2] - 2026-02-08

### 🔐 Security Enhancement - Encryption Upgrade (CRITICAL)

**This is a critical security upgrade that automatically migrates all encrypted data from AES-256-CBC to AES-256-GCM with authenticated encryption.**

#### Added
- **Automatic Encryption Migration**: Backend now automatically detects and migrates CBC-encrypted data to GCM format on startup
- **GCM Encryption Support**: Upgraded from AES-256-CBC to AES-256-GCM with authentication tags for all sensitive data
- **Database Auto-Backup**: Migration process creates automatic backups before re-encrypting data
- **Migration Documentation**: Comprehensive guide at `docs/MIGRATION.md` with rollback procedures
- **Test Credentials in Environment Variables**: Test credentials moved from hardcoded values to `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` env vars

#### Changed
- **EncryptionService**: Now uses GCM mode with authentication tags (format: `<iv>:<authTag>:<ciphertext>`)
- **Payment Records**: All payment field encryption migrated to GCM (recipient, amount, notes, method, reference)
- **User Profiles**: All profile encryption migrated to GCM (firstName, lastName, phone, address, etc.)
- **Backward Compatibility**: System can read both CBC (old) and GCM (new) formats during migration period

#### Security Improvements
- **Authenticated Encryption**: GCM provides built-in authentication, preventing data tampering
- **Padding Oracle Protection**: GCM eliminates padding oracle attack vectors present in CBC mode
- **Industry Standard Compliance**: Aligns with TLS 1.3 and modern cryptographic best practices
- **Data Integrity Verification**: Each encrypted field includes an authentication tag

#### Fixed
- **Payment Records Test Suite**: Fixed 17/17 contract tests
  - Added `GET /api/zakat/payments/:id` endpoint for fetching individual payment records
  - Implemented soft delete functionality (status: 'cancelled' instead of hard delete)
  - Standardized error responses (400 for invalid operations vs 404 for not found)
  - Fixed receipt URL generation (`/api/zakat/payments/:id/receipt`)
  - Made `calculationId` optional in payment creation
  - Improved error handling for invalid UUIDs and missing records

#### Migration Notes
- **Zero-Downtime Upgrade**: Docker Hub users get automatic migration on container restart
- **First Startup Delay**: Migration may take 5-90 seconds depending on database size
- **Backup Location**: Auto-backup created at `server/prisma/data/prod.db.backup-<timestamp>`
- **Rollback Support**: Full rollback procedure documented in `docs/MIGRATION.md`
- **Verification**: Run `npm run check-encryption` to verify migration status

#### Breaking Changes
- **None for end users**: Migration is transparent and automatic
- **Developers**: Test suites now require `TEST_USER_PASSWORD` env var (defaults provided)

#### Related Issues
- Resolves: zakapp-8wa (Encryption Migration Implementation)
- Resolves: zakapp-4os.1 (Payment Records Contract Tests)
- Part of: zakapp-aer (v0.9.2 Release)

#### Documentation
- Added `docs/MIGRATION.md` - Comprehensive migration guide
- Updated `.env.example` - Added test credential environment variables
- Added `.git-blame-ignore-revs` - Excludes security cleanup commit from blame
- Updated `scripts/check-secrets.js` - Now checks for new test password pattern

#### Deployment
```bash
# Docker Hub users:
docker compose pull
docker compose down
docker compose up -d

# Self-hosted users:
git pull
npm install
npm start
```

See `docs/MIGRATION.md` for detailed upgrade instructions and troubleshooting.

---

## 2025-12-15
- Fix: Robust decryption of payment record fields when storage used alternative separators (e.g., '.=' or '.') between IV and ciphertext. Added runtime normalization and one-off `server/scripts/normalize-payments.ts` to migrate stored records.


All notable changes to ZakApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Milestone 5: Analytics & Payments Integration (v0.3.1)

> **Feature Branch**: `017-milestone-5-ensure`  
> **Completion Date**: December 2025  
> **Priority**: P1 MVP + P2 Enhancements

#### Overview

Milestone 5 activates the Analytics Dashboard and Payments features with full integration into the existing Nisab Year Records system. This release emphasizes user-facing terminology alignment, mobile responsiveness, and comprehensive payment tracking.

#### Core Features

**1. Analytics Dashboard**
- **Wealth Over Time Visualization**: Interactive line/bar/area charts showing total networth growth based on asset data
- **Zakat Obligations Tracking**: Bar charts comparing Zakat due vs. paid for each Nisab Year Record
- **Payment Distribution Analysis**: Pie charts breaking down payments across 8 Islamic recipient categories
- **Summary Statistics Panel**: 5-key metrics (Total Wealth, Zakat Due, Zakat Paid, Outstanding Balance, Compliance Rate)
- **Timeframe Selector**: View data by Last 30 Days, Last 90 Days, Last 12 Months, or All Time
- **Chart Type Selector**: Switch between Line, Bar, Pie, and Area chart visualizations
- **Empty States**: Helpful onboarding messages when no data available
- **Help Section**: Educational resources and Islamic guidance on Zakat calculation

**2. Payment Recording & Management**
- **Nisab Year Integration**: Link each payment to a specific Nisab Year Record for accurate tracking
- **8 Islamic Recipient Categories**: 
  - Al-Fuqara (The Poor)
  - Al-Masakin (The Needy)
  - Al-Amilin (Administrators)
  - Al-Muallafah Qulubuhum (Hearts Reconciled)
  - Ar-Riqab (Freeing Captives)
  - Al-Gharimin (Those in Debt)
  - Fi Sabilillah (Cause of Allah)
  - Ibn as-Sabil (Stranded Travelers)
- **Payment Details**: Amount, date, recipient name, payment method, receipt reference, notes (encrypted)
- **Payment History**: Chronological list with filtering by Nisab Year
- **Payment Cards**: Visual display with progress bars, action buttons (Edit, Delete, View Details)
- **Outstanding Balance Calculation**: Automatic recalculation (Zakat Due - Total Paid)
- **Payment Validation**: Warnings for overpayment scenarios

**3. Nisab Year Record Enhancements**
- **Payment Progress Indicator**: Visual progress bar on each Nisab Year Record card
  - Green (≥100%): Fully paid
  - Yellow (1-99%): Partially paid
  - Red (0%): No payments
- **Payments Summary Section**: Total paid, outstanding balance, payment count, last payment date
- **Quick Add Payment**: Pre-selected Nisab Year when adding payment from record detail page
- **Payment List Per Year**: View all payments linked to specific Nisab Year
- **Overpayment Handling**: Display and track excess payments as Sadaqah

**4. Terminology Standardization (P1 CRITICAL)**
- **Global Find & Replace**: Removed all "snapshot" references from user-facing UI
- **Consistent Terminology**: 
  - Backend: `YearlySnapshot` entity (unchanged for backward compatibility)
  - Frontend: "Nisab Year Record" or "Nisab Year" exclusively
  - API: Responses map `snapshot` → `nisabRecord` for frontend consumption
- **Navigation**: Updated all menu items, breadcrumbs, page titles
- **Labels & Tooltips**: Reviewed and updated 100+ UI strings
- **Error Messages**: Aligned with standard terminology
- **Help Content**: Updated educational sections

**5. Mobile Optimization (P2 Enhancement)**
- **Analytics Page**: Responsive grid layout (5 columns → 2 columns on mobile)
- **Payments Page**: Mobile-friendly payment cards, touch-friendly buttons
- **Charts**: Responsive chart sizing with proper aspect ratios on small screens
- **Forms**: Touch-optimized inputs, proper keyboard handling
- **Navigation**: Hamburger menu, swipe gestures for mobile users

#### Technical Implementation

**Frontend Changes:**
- **New Pages**: 
  - `AnalyticsPage.tsx` - Enhanced with real summary statistics (T027)
  - Payments functionality integrated into existing `PaymentsPage.tsx`
- **Updated Components**:
  - `NisabYearRecordCard.tsx` - Added payment progress indicator (T031)
  - `NisabYearRecordsPage.tsx` - Integrated payment progress bars
  - `PaymentCard.tsx` - Enhanced display with Nisab Year context
  - `AnalyticsChart.tsx` - Support for multiple chart types (Line, Bar, Pie, Area)
  - `PaymentRecordForm.tsx` - Nisab Year dropdown integration
  - `PaymentList.tsx` - Filtering by Nisab Year
- **New Hooks**:
  - Enhanced `useAnalytics` with multi-timeframe support
  - Updated `usePayments` with Nisab Year filtering
  - `useAssets` and `useSnapshots` for dashboard statistics
- **Utilities**:
  - `formatCurrency` - Consistent currency formatting
  - Chart data processors for Recharts integration
  - Progress bar color logic

**Backend Changes:**
- Routes already implemented in previous features
- Enhanced payment validation logic
- Outstanding balance calculation service methods
- Payment-to-Nisab-Year linkage enforcement

**Testing:**
- **Component Tests** (5 suites, 37 test scenarios):
  - `AnalyticsPage.test.tsx` - 8 scenarios (loading, data, empty states, terminology)
  - `PaymentsPage.test.tsx` - 8 scenarios (filtering, summary, form, help)
  - `AnalyticsChart.test.tsx` - 11 scenarios (all chart types, empty states, errors)
  - `PaymentCard.test.tsx` - 10 scenarios (display, progress, actions, calendar)
- **Manual Testing Identified**: 12 manual/integration tests documented (T046-T057)
  - E2E workflows (login → analytics → payment recording)
  - Accessibility testing (keyboard nav, screen readers, color contrast)
  - Performance testing (Lighthouse, React DevTools Profiler)
  - Cross-browser and mobile responsiveness validation

**Documentation:**
- **User Guide Updates**:
  - `docs/user-guide/tracking.md` - Added comprehensive Analytics and Payments sections (500+ new lines)
  - `docs/user-guide/nisab-year-records.md` - Added Payment Integration section (200+ new lines)
- **New Content**:
  - Viewing Analytics Dashboard walkthrough
  - Understanding Wealth Trends guide
  - Tracking Zakat Obligations tutorial
  - Recording Zakat Payments step-by-step
  - Linking Payments to Nisab Years explanation
  - Viewing Payment History instructions
  - Payment progress indicators guide
  - Islamic guidance on payment recording

#### Dependencies & Integration

**Integrates With:**
- Nisab Year Records system (Feature 008) - Primary integration point
- Asset Management (Feature 004) - Data source for wealth trends
- Payment Tracking (Feature 003) - Enhanced with Nisab Year linkage
- Dashboard (existing) - Added Analytics navigation

**External Libraries:**
- Recharts - Chart visualizations (Line, Bar, Pie, Area)
- React Query - Data fetching and caching (5min stale, 10min GC)
- date-fns - Date formatting and manipulation
- Tailwind CSS - Responsive styling and mobile optimization

#### Breaking Changes

**None** - This is a pure enhancement release. Existing features remain fully functional.

#### Migration Notes

**For Existing Users:**
- No data migration required
- Existing payments automatically appear in new Analytics Dashboard
- Existing Nisab Year Records show payment progress indicators
- All historical data preserved

**For Developers:**
- Review terminology changes if extending UI components
- Use `nisabRecord` instead of `snapshot` in new frontend code
- Follow established chart patterns when adding new visualizations
- Refer to test examples for proper mocking strategies

#### Known Issues & Limitations

**Manual Testing Required:**
- T046-T057: 12 manual tests identified for E2E workflows, accessibility, performance, and cross-browser compatibility
- Lighthouse performance audit pending (target: >90 score)
- Accessibility audit with NVDA/JAWS pending (WCAG 2.1 AA compliance)
- Mobile device testing on real devices recommended

**Future Enhancements (Out of Scope):**
- Advanced analytics filters (date range pickers, custom comparisons)
- Export analytics to PDF/CSV
- Payment reminder notifications
- Bulk payment import from CSV
- Multi-currency payment support

#### Contributors

- GitHub Copilot (primary development)
- Specification by user requirements (Milestone 5 brief)
- Islamic guidance based on Simple Zakat Guide methodology

#### Related Issues

- Feature 017: Milestone 5 - Tracking & Analytics Activation
- Feature 008: Nisab Year Records (integration dependency)
- Feature 004: Asset Management (data source)
- Feature 003: Payment Tracking (enhanced)

---

### Added - Tracking & Analytics Feature (v0.3.0)

#### Core Functionality
- **Yearly Snapshots System**
  - Create draft and finalized snapshots of annual financial data
  - Full asset breakdown with 8+ category support
  - Immutable finalized snapshots for data integrity
  - Dual calendar support (Gregorian + Hijri dates)
  - Status tracking (draft, finalized)
  - CRUD operations with proper validation

- **Payment Tracking**
  - Record Zakat payments to 8 Islamic recipient categories:
    - Al-Fuqara (The Poor)
    - Al-Masakin (The Needy)
    - Al-Amilin (Zakat Administrators)
    - Al-Muallafah Qulubuhum (Hearts to be Reconciled)
    - Ar-Riqab (Freeing Slaves/Captives)
    - Al-Gharimin (Those in Debt)
    - Fi Sabilillah (In the Cause of Allah)
    - Ibn as-Sabil (Stranded Travelers)
  - Payment validation against Zakat due
  - Receipt reference tracking
  - Payment history with filtering
  - Annual payment summary

- **Multi-Year Comparison**
  - Compare 2-5 snapshots side-by-side
  - Wealth trend analysis with percentage changes
  - Zakat growth tracking
  - Liability comparison
  - Automatic insights generation
  - Visual trend indicators (positive/negative)
  - Year-over-year growth rate calculations

- **Analytics Dashboard**
  - Interactive charts with Recharts
  - Wealth trend visualization (line, bar, area charts)
  - Zakat due vs. paid comparison
  - Payment distribution by category (pie chart)
  - Monthly payment timeline
  - Customizable date ranges
  - Export analytics to PDF

- **Data Export**
  - Export individual snapshots to PDF
  - Export annual summaries
  - Export comparison reports
  - Batch export multiple snapshots
  - Payment receipt generation
  - Customizable PDF options (watermark, format, etc.)
  - Privacy-focused exports (local download only)

- **Smart Reminders**
  - Zakat anniversary reminders (Hijri calendar-based)
  - Payment due reminders (30+ days unpaid)
  - Calculation update reminders
  - Educational content reminders
  - Priority levels (high, medium, low)
  - Reminder actions (acknowledge, dismiss, snooze, complete)
  - Bulk reminder management
  - Reminder history tracking

- **Dual Calendar System**
  - Hijri-Gregorian conversion utilities
  - `hijri-converter` library integration
  - Anniversary calculation based on Hijri dates
  - Formatted date display (long, short, numeric)
  - Historical date support (1900-2076)
  - Timezone-aware conversions

#### Backend Implementation

**Database Schema (5 new entities):**
- `TrackingSnapshot` - Yearly financial snapshots
- `TrackingPayment` - Payment records with categories
- `TrackingComparison` - Multi-year comparison cache
- `TrackingReminder` - Reminder management
- `TrackingInsight` - Generated insights

**Services (7 new services):**
- `SnapshotService` - Snapshot CRUD and finalization
- `PaymentService` - Payment recording and validation
- `ComparisonService` - Multi-year comparison logic
- `AnalyticsService` - Data aggregation and metrics
- `ReminderService` - Reminder creation and management
- `InsightService` - AI-powered insights generation
- `CalendarService` - Hijri-Gregorian conversion

**API Routes (8 new endpoints):**
- `POST /api/v1/tracking/snapshots` - Create snapshot
- `GET /api/v1/tracking/snapshots` - List snapshots
- `GET /api/v1/tracking/snapshots/:id` - Get snapshot
- `PUT /api/v1/tracking/snapshots/:id` - Update snapshot
- `POST /api/v1/tracking/snapshots/:id/finalize` - Finalize snapshot
- `DELETE /api/v1/tracking/snapshots/:id` - Delete snapshot
- `POST /api/v1/tracking/snapshots/:id/payments` - Record payment
- `GET /api/v1/tracking/snapshots/:id/payments` - List payments
- `POST /api/v1/tracking/comparison` - Compare snapshots

**Security Features:**
- End-to-end encryption for all financial data (AES-256-CBC)
- JWT authentication on all endpoints
- Rate limiting (100 GET, 30 POST per minute)
- Input validation with Zod schemas
- User ownership verification
- CORS protection

**Background Jobs (3 new jobs):**
- Anniversary reminder detection (daily)
- Payment due reminder creation (daily)
- Insight generation (weekly)

#### Frontend Implementation

**Pages (4 new pages):**
- `TrackingDashboard` - Main tracking interface
- `SnapshotDetail` - Snapshot view/edit
- `ComparisonView` - Multi-year comparison
- `RemindersPage` - Reminder management

**Components (9 new components):**
- `SnapshotForm` - Create/edit snapshots
- `SnapshotCard` - Snapshot display card
- `SnapshotList` - Snapshot list view
- `PaymentRecordForm` - Payment recording
- `PaymentList` - Payment history
- `AnalyticsChart` - Chart visualizations
- `ComparisonTable` - Comparison view
- `AnnualSummaryCard` - Yearly summary
- `ReminderBanner` - Reminder notifications

**React Query Hooks (6 new hooks):**
- `useSnapshots` - Fetch snapshots
- `useSnapshotDetail` - Fetch single snapshot
- `useCreateSnapshot` - Create snapshot mutation
- `useUpdateSnapshot` - Update snapshot mutation
- `useFinalizeSnapshot` - Finalize mutation
- `useRecordPayment` - Payment mutation

**Utilities:**
- Calendar conversion utilities
- Date formatting helpers
- Hijri date display functions
- Anniversary calculation logic

#### Testing

**Unit Tests (8 test suites, 42 scenarios):**
- Snapshot service tests
- Payment service tests
- Comparison service tests
- Analytics service tests
- Reminder service tests
- Calendar utility tests
- Insight generation tests
- Background job tests

**E2E Tests (5 test suites, 74 scenarios):**
- Snapshot creation workflow (10 tests)
- Payment recording and summary (12 tests)
- Multi-year comparison (17 tests)
- PDF export (17 tests)
- Reminder acknowledgment (18 tests)

**Test Coverage:**
- ~3,050 lines of unit tests
- ~1,997 lines of E2E tests
- Comprehensive coverage of all workflows
- Playwright framework for E2E testing

#### Documentation

**User Documentation:**
- Comprehensive user guide for tracking features (800+ lines)
- Step-by-step tutorials for all workflows
- Islamic compliance explanations
- FAQ section

**API Documentation:**
- Complete API reference for all tracking endpoints (1,000+ lines)
- Request/response examples
- Error handling documentation
- Rate limiting details

**Developer Documentation:**
- Calendar system developer guide (650+ lines)
- Implementation patterns and best practices
- TypeScript type definitions
- Testing guidelines

**Component Documentation:**
- Storybook stories for all tracking components (6 components)
- Usage examples and variations
- Accessibility considerations

#### Performance Optimizations

- Indexed database queries for snapshots by user and date
- Cached comparison results (30-minute TTL)
- Optimized chart rendering with Recharts
- Lazy-loaded tracking pages
- Memoized calendar conversions
- Background job scheduling with node-cron

#### Islamic Compliance

- 8 Quranic recipient categories properly labeled with Arabic names
- Multiple Zakat calculation methodologies (Standard, Hanafi, Shafi'i, Maliki, Hanbali)
- Gold and silver nisab support
- Hijri calendar integration for anniversary tracking
- Educational content about Zakat obligations
- Proper validation against Islamic principles

## [0.2.0] - 2024-10-01

### Added - Asset Management Feature (v0.2.0)

#### Core Functionality
- **Asset CRUD Operations**
  - Create, Read, Update, Delete assets
  - 8+ asset categories support
  - Custom asset types
  - Bulk operations
  
- **Asset Categories**
  - Cash (Savings, Checking accounts)
  - Gold (Physical gold, jewelry)
  - Silver (Physical silver, jewelry)
  - Cryptocurrency (Bitcoin, Ethereum, etc.)
  - Business Assets (Inventory, receivables)
  - Investments (Stocks, bonds, mutual funds)
  - Real Estate (Investment properties)
  - Agricultural Produce

- **Data Import/Export**
  - JSON import/export
  - CSV import/export
  - PDF export with asset breakdown
  - Bulk import validation

#### Backend Implementation

**Database Schema:**
- `Asset` entity with comprehensive fields
- Encrypted sensitive data (AES-256-CBC)
- User ownership tracking
- Category and subcategory fields
- Current value tracking

**Services:**
- `AssetService` - Core asset operations
- `EncryptionService` - Data encryption/decryption
- `ValidationService` - Input validation

**API Routes (5 endpoints):**
- `POST /api/v1/assets` - Create asset
- `GET /api/v1/assets` - List assets
- `GET /api/v1/assets/:id` - Get asset
- `PUT /api/v1/assets/:id` - Update asset
- `DELETE /api/v1/assets/:id` - Delete asset

#### Frontend Implementation

**Pages:**
- `AssetDashboard` - Asset overview
- `AssetForm` - Create/edit assets
- `AssetList` - Asset list view

**Components:**
- `AssetCard` - Asset display
- `AssetCategoryIcon` - Category icons
- `BulkImportModal` - Import interface

#### Testing
- 52 unit tests
- 18 integration tests
- 8 contract tests
- E2E test coverage

## [0.1.0] - 2024-09-01

### Added - Authentication & Core Features (v0.1.0)

#### Authentication System
- JWT-based authentication with refresh tokens
- Secure password hashing (bcrypt, 12 rounds)
- Session management
- Rate limiting on auth endpoints
- Password reset flow
- Email verification

#### Zakat Calculator
- Multi-methodology support (Standard, Hanafi, Shafi'i)
- Nisab threshold calculations (gold and silver)
- Asset-by-asset breakdown
- Currency conversion support
- Educational content
- Calculation history

#### User Management
- User registration and login
- Profile management
- Password change
- Email preferences
- Account deletion

#### Database & Infrastructure
- SQLite database with Prisma ORM
- Automated migrations
- Database seeding
- Environment-based configuration

#### Security Features
- AES-256-CBC encryption for sensitive data
- CORS protection
- Helmet.js security headers
- Rate limiting (100 requests/15 minutes)
- Input sanitization
- SQL injection protection

#### Frontend
- React 19 with TypeScript
- TailwindCSS for styling
- Responsive mobile-first design
- Islamic-themed UI (emerald green)
- Protected routes
- Form validation

#### Testing
- 78 unit tests
- 45 integration tests
- 32 contract tests
- Test coverage: 85%+

#### Documentation
- API specification
- Development setup guide
- Security documentation
- User stories
- Project principles

---

## Version Numbering

- **v0.1.0**: Authentication & Core Features
- **v0.2.0**: Asset Management
- **v0.3.0**: Tracking & Analytics (current)
- **v0.4.0** (planned): Advanced Features (notifications, reminders, etc.)
- **v1.0.0** (planned): Production Release

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Fixed
- **Asset Duplication**: Fixed an issue where assets could be duplicated due to double-submission on the asset creation form. Added submission state locking and client-side list deduplication.
- **Payment Form Dropdown**: Fixed an issue where the Nisab Year dropdown was empty when "All Payments" filter was selected.
- **Dashboard Nisab Threshold**: Fixed the dashboard widget to display the live Nisab threshold instead of a placeholder value.
- **Help Page Links**: Corrected broken links in the Help section to point to the correct routes.
- **Terminology**: Standardized "Nisab Year Record" terminology across the application (replacing "Snapshot").
