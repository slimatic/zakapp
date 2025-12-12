# Feature Specification: Milestone 5 - Tracking & Analytics Activation

**Feature Branch**: `017-milestone-5-ensure`
**Created**: 2025-12-07
**Status**: Draft
**Input**: User description: "Milestone 5. Ensure that this integrates with the Nisab Records functionality as well as the payments integration with nisab records."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Analytics Dashboard (Priority: P1)

As a user, I want to access a dedicated Analytics Dashboard so that I can visualize my wealth tracking and Zakat obligations over time.

**Why this priority**: This is the entry point for the new functionality and provides immediate value by visualizing existing data.

**Independent Test**: Can be fully tested by navigating to the dashboard and verifying charts render with data.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I click "Analytics" in the navigation menu, **Then** I am taken to the Analytics Dashboard page.
2. **Given** I am on the Analytics Dashboard, **When** the page loads, **Then** I see:
   - **Wealth over time**: Asset networth chart showing my total wealth across timeframe
   - **Zakat obligations**: Nisab Record data showing due amounts, payments made, and outstanding per year
   - **Asset distribution**: Breakdown of current assets by category
3. **Given** I view the Analytics Dashboard, **Then** I do NOT see any reference to "snapshots" (only "Nisab Year Records" or "Nisab Years").

---

### User Story 2 - Record Zakat Payments Linked to Nisab Years (Priority: P1)

As a user, I want to record Zakat payments and link them to a specific Nisab Year Record so that I can track which obligation I am fulfilling.

**Why this priority**: Essential for accurate tracking. Payments must be associated with the correct Hawl (Nisab Year) to calculate outstanding balances correctly.

**Independent Test**: Can be fully tested by submitting the payment form and verifying the record appears in the list and is linked to the correct Nisab Year.

**Acceptance Scenarios**:

1. **Given** I am on the Payments page, **When** I click "Record Payment", **Then** a form appears to enter payment details (amount, date, recipient, notes) AND a dropdown to select the "Nisab Year" (displayed as "Nisab Year Record", never "snapshot").
2. **Given** I have filled out the payment form and selected a Nisab Year, **When** I submit it, **Then** the payment is saved and linked to that specific Nisab Year Record.
3. **Given** I am viewing a specific Nisab Year Record, **When** I click "Add Payment", **Then** the payment form opens with that Nisab Year pre-selected.
4. **Given** I am on the Payments page, **When** I view the list, **Then** each payment shows which Nisab Year it belongs to (emphasis on payment actions towards selectable Nisab Records).

---

### User Story 3 - View Payment History (Priority: P2)

As a user, I want to view a list of all my past Zakat payments so that I can audit my records.

**Why this priority**: Provides transparency and allows users to verify their data entry.

**Independent Test**: Can be tested by viewing the payments list after creating records.

**Acceptance Scenarios**:

1. **Given** I have recorded payments, **When** I visit the Payments page, **Then** I see a chronological list of all my past payments.
2. **Given** I view the payment list, **When** I select a payment, **Then** I can see its full details, including which Nisab Year it applies to.

---

### User Story 4 - Historical Comparisons (Priority: P2)

As a user, I want to compare my wealth and Zakat metrics across different years so that I can understand trends.

**Why this priority**: Delivers the "Analytics" value proposition.

**Independent Test**: Can be tested by viewing the comparison charts on the Analytics page.

**Acceptance Scenarios**:

1. **Given** I have asset data for multiple years, **When** I view the Wealth Comparison section, **Then** I see my networth trends over time (based on Assets, not Nisab Records).
2. **Given** I have multiple Nisab Year Records, **When** I view the Zakat Obligations section, **Then** I see side-by-side comparisons of Zakat due, paid, and outstanding per year.

---

### User Story 5 - View Payments in Nisab Record Context (Priority: P2)

As a user, I want to see a summary of payments made towards a specific Nisab Year within that record's details page.

**Why this priority**: Users need to know "How much have I paid for *this* specific year?" without searching through a global list.

**Independent Test**: Can be tested by navigating to a Nisab Year Record details page.

**Acceptance Scenarios**:

1. **Given** I am viewing a Nisab Year Record that has linked payments, **When** I scroll to the "Payments" section, **Then** I see a list of payments for this specific year and a "Total Paid" summary.
2. **Given** the Zakat Due is $1000 and Total Paid is $500, **When** I view the record, **Then** I see an "Outstanding Balance" of $500.

### Edge Cases

- What happens when a user has no historical data? (Should show empty states/onboarding for analytics)
- How does the system handle different currencies in payment history? (Should convert or display original currency)
- What happens if the backend services are offline? (Should show graceful error messages)
- What happens if a user deletes a Nisab Year Record that has payments? (Strictly prohibited. User must delete linked payments first before deleting the Nisab Year Record. Show clear error message).

## Clarifications

### Session 2025-12-07

- Q: Should the Analytics dashboard reference "snapshots" or "Nisab Year Records" in the UI? → A: Use "Nisab Year Records" exclusively. The term "snapshot" should not appear in user-facing UI.
- Q: What data sources should "Wealth over time" visualization use? → A: Track Assets networth over timeframe, independent of Nisab Records. Focus on total networth tracking.
- Q: What should "Zakat obligations" section display? → A: Nisab Record data showing Zakat due, payments made, and outstanding amounts per Nisab Year.
- Q: How should payments be linked on the Payments page? → A: Users select a specific Nisab Record when recording a payment, similar to Nisab Record page but emphasizing payment actions.
- Q: What is the data hierarchy for Analytics/Payments features? → A: Assets → Nisab Records → Payments. Analytics and Payments built on Assets and Nisab Records foundation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enable the `/analytics` and `/payments` routes in the frontend application.
- **FR-002**: System MUST provide navigation links to "Analytics" and "Payments" in the main application sidebar/menu.
- **FR-003**: Users MUST be able to create, read, update, and delete (CRUD) Zakat payment records.
- **FR-004**: System MUST calculate and display total Zakat Due vs. Total Paid for the current Nisab Year (never refer to as "snapshot" in UI).
- **FR-005**: System MUST render charts (Bar/Line/Pie) using the existing charting library to visualize:
  - **Wealth over time**: Asset networth tracking over timeframe (independent of Nisab Records)
  - **Zakat obligations**: Nisab Record data (due, paid, outstanding per year)
  - **Asset distribution**: Current asset breakdown by category
- **FR-006**: The Analytics page MUST fetch data from Assets and Nisab Records (not YearlySnapshot terminology in UI).
- **FR-007**: The Payments page MUST interact with the existing `PaymentService` endpoints and display Nisab Record selection prominently.
- **FR-008**: The Payment creation form MUST allow selecting a Nisab Year Record to link the payment to (label: "Nisab Year", not "Snapshot").
- **FR-009**: The Nisab Year Record details page MUST display a list of linked payments and calculate the remaining balance.
- **FR-010**: System MUST NOT use the term "snapshot" in any user-facing UI elements (navigation, labels, tooltips, error messages).

### Key Entities *(include if feature involves data)*

- **PaymentRecord**: Represents a recorded Zakat payment (Amount, Date, Recipient, Notes). Linked to `YearlySnapshot` (backend) but displayed as linked to "Nisab Year Record" (UI).
- **YearlySnapshot**: Backend entity mapped to `nisab_year_records` table. Represents the Nisab Year / Hawl. **UI Terminology**: Always referred to as "Nisab Year Record" or "Nisab Year" in user-facing elements.
- **Asset**: Represents user's wealth items. Used for "Wealth over time" tracking independent of Nisab Records.
- **AnalyticsMetric**: Calculated metrics for visualization:
  - Wealth Growth: Derived from Assets networth over time
  - Zakat Coverage: Derived from Nisab Record due amounts vs. PaymentRecords
  - Asset Distribution: Current breakdown by asset category

**Data Hierarchy**: Assets → Nisab Records → Payments. Analytics dashboard displays wealth tracking (Assets) and Zakat obligations (Nisab Records + Payments).

Note: These entities already exist in `schema.prisma` and backend services. This feature is primarily about exposing them in the UI with correct terminology and ensuring the integration logic is active.
