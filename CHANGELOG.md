# Changelog

All notable changes to ZakApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
