# Feature Specification: Milestone 5 - Tracking & Analytics Activation

**Feature Branch**: `016-milestone-5`
**Created**: 2025-12-07
**Status**: Draft
**Input**: User description: "Milestone 5"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Analytics Dashboard (Priority: P1)

As a user, I want to access a dedicated Analytics Dashboard so that I can visualize my Zakat history and progress over time.

**Why this priority**: This is the entry point for the new functionality and provides immediate value by visualizing existing data.

**Independent Test**: Can be fully tested by navigating to the dashboard and verifying charts render with data.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I click "Analytics" in the navigation menu, **Then** I am taken to the Analytics Dashboard page.
2. **Given** I am on the Analytics Dashboard, **When** the page loads, **Then** I see visualizations of my Zakat liability vs. payments over time.

---

### User Story 2 - Record Zakat Payments (Priority: P1)

As a user, I want to record Zakat payments I have made so that I can track my obligations against my actual payments.

**Why this priority**: Essential for the "Tracking" aspect of the milestone. Without recording payments, the analytics are incomplete.

**Independent Test**: Can be fully tested by submitting the payment form and verifying the record appears in the list.

**Acceptance Scenarios**:

1. **Given** I am on the Payments page, **When** I click "Record Payment", **Then** a form appears to enter payment details (amount, date, recipient, notes).
2. **Given** I have filled out the payment form, **When** I submit it, **Then** the payment is saved and the list updates to show the new record.

---

### User Story 3 - View Payment History (Priority: P2)

As a user, I want to view a list of all my past Zakat payments so that I can audit my records.

**Why this priority**: Provides transparency and allows users to verify their data entry.

**Independent Test**: Can be tested by viewing the payments list after creating records.

**Acceptance Scenarios**:

1. **Given** I have recorded payments, **When** I visit the Payments page, **Then** I see a chronological list of all my past payments.
2. **Given** I view the payment list, **When** I select a payment, **Then** I can see its full details.

---

### User Story 4 - Historical Comparisons (Priority: P2)

As a user, I want to compare my Zakat metrics across different years so that I can understand trends in my wealth and charity.

**Why this priority**: Delivers the "Analytics" value proposition.

**Independent Test**: Can be tested by viewing the comparison charts on the Analytics page.

**Acceptance Scenarios**:

1. **Given** I have data for multiple years, **When** I view the Comparison section, **Then** I see side-by-side comparisons of assets, liabilities, and Zakat due.

### Edge Cases

- What happens when a user has no historical data? (Should show empty states/onboarding for analytics)
- How does the system handle different currencies in payment history? (Should convert or display original currency)
- What happens if the backend services are offline? (Should show graceful error messages)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enable the `/analytics` and `/payments` routes in the frontend application.
- **FR-002**: System MUST provide navigation links to "Analytics" and "Payments" in the main application sidebar/menu.
- **FR-003**: Users MUST be able to create, read, update, and delete (CRUD) Zakat payment records.
- **FR-004**: System MUST calculate and display total Zakat Due vs. Total Paid for the current Hawl.
- **FR-005**: System MUST render charts (Bar/Line/Pie) using the existing charting library to visualize asset distribution and payment history.
- **FR-006**: The Analytics page MUST fetch data using the existing `AnalyticsService` endpoints.
- **FR-007**: The Payments page MUST interact with the existing `PaymentService` endpoints.

### Key Entities *(include if feature involves data)*

- **Payment**: Represents a recorded Zakat payment (Amount, Date, Recipient, Notes).
- **YearlySnapshot**: Aggregated data for a specific Zakat year (Total Assets, Total Zakat Due, Total Paid).
- **AnalyticsMetric**: Calculated metrics for visualization (e.g., Wealth Growth %, Zakat Coverage %).

Note: These entities already exist in `schema.prisma` and backend services. This feature is primarily about exposing them in the UI.
