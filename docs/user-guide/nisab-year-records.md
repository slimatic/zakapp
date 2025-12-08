# Managing Nisab Year Records

**User Guide**: Complete walkthrough for tracking and managing your Zakat obligations using Nisab Year Records

---

## Table of Contents

1. [Understanding Nisab and Hawl](#understanding-nisab-and-hawl)
2. [Getting Started](#getting-started)
3. [Managing Your Nisab Year Records](#managing-your-nisab-year-records)
4. [Finalizing and Unlocking Records](#finalizing-and-unlocking-records)
5. [Common Scenarios](#common-scenarios)
6. [Troubleshooting](#troubleshooting)

---

## Understanding Nisab and Hawl

### What You Need to Know

Before diving into the technical features, it's important to understand two key Islamic concepts:

**Nisab** (النصاب): The minimum wealth threshold (currently equivalent to 87.48g of gold or 612.36g of silver) you must maintain for Zakat to become obligatory.

**Hawl** (الحول): A complete lunar year (~354 days) during which your wealth must stay at or above Nisab before Zakat is due.

**Simple Explanation**: 
- If your total zakatable wealth reaches $5,000 (for example, based on current gold prices)
- And it stays above that amount for approximately 354 days
- Then you owe Zakat (2.5%) on your wealth at the end of that period

**For detailed explanations**: See the [Nisab and Hawl Education Guide](../../client/src/content/nisabEducation.md)

---

## Getting Started

### Prerequisites

Before ZakApp can track your Nisab Year Records, you need:

1. **Assets Added**: Add all your zakatable assets in the Assets page
   - Cash and bank accounts
   - Gold and silver holdings
   - Investments and cryptocurrency
   - Business inventory

2. **Nisab Preference Set**: Choose gold or silver standard in Settings
   - Default: Gold standard (higher threshold)
   - Recommended by some scholars: Silver standard (lower threshold, benefits more recipients)

### Automatic Hawl Detection

ZakApp monitors your wealth **automatically**:

- Every hour, the system checks your total zakatable wealth
- When you cross above the Nisab threshold, a DRAFT record is created
- You'll see a notification: "Hawl period started!"
- The dashboard updates with your countdown and progress

**You don't need to do anything** - the tracking happens in the background.

---

## Managing Your Nisab Year Records

### Viewing Your Records

**Navigation**: Dashboard → "Nisab Year Records" or Main Menu → "Nisab Records"

### The Records List

<screenshot: nisab-year-records-list>

Each record shows:

- **Status Badge**: 
  - 🟡 **DRAFT**: Hawl in progress (tracking actively)
  - 🟢 **FINALIZED**: Completed and locked
  - 🔵 **UNLOCKED**: Opened for corrections

- **Hawl Period**: Start and completion dates (both Gregorian and Hijri)
- **Wealth Summary**: Current wealth vs Nisab threshold
- **Days Remaining**: Countdown to Hawl completion
- **Zakat Amount**: Estimated 2.5% calculation

### Status Tabs

Filter your records by status:

- **All**: View all records regardless of status
- **Draft**: Active Hawl periods currently tracking
- **Finalized**: Completed records (locked)
- **Unlocked**: Records opened for corrections

### Understanding DRAFT Records

**What you'll see**:

<screenshot: hawl-progress-indicator>

1. **Hawl Progress Bar**: Visual representation of time elapsed
2. **Days Remaining**: Countdown to 354-day completion
3. **Live Wealth Tracking**: Updates as you add/modify assets
4. **Nisab Comparison**: Your wealth vs locked threshold

**Live Updates**: As you add or modify assets, DRAFT records update automatically to show your current Zakat obligation.

**Important**: The Nisab threshold is **locked** when your Hawl starts and won't change even if gold/silver prices fluctuate.

### Hawl Interruption Warning

If your wealth drops below Nisab during the Hawl period, you'll see:

<screenshot: hawl-interruption-warning>

**What this means**:
- Different scholars have different opinions on whether this "resets" your Hawl
- ZakApp preserves the record and lets you decide
- You can finalize when you're ready, or consult a scholar

**Options**:
1. **Continue tracking**: If your wealth recovers, keep the current Hawl
2. **Wait for new Hawl**: Let the system start a fresh 354-day period
3. **Consult scholar**: Get guidance for your specific situation

---

## Finalizing and Unlocking Records

### Finalizing a Record

**When to finalize**: After your Hawl period completes (~354 days from start)

**Steps**:

1. Navigate to your DRAFT record
2. Click the "Finalize" button
3. Review the finalization summary:

<screenshot: finalization-modal>

The modal shows:
- Hawl start and completion dates
- Total zakatable wealth at completion
- Deductible liabilities (if applicable)
- **Final Zakat amount** (2.5% of zakatable wealth)
- Asset breakdown

4. Confirm you've reviewed the calculation
5. Click "Finalize Record"

**Result**: 
- Record status changes to FINALIZED
- All values are locked and can't be edited
- Audit trail records the finalization event
- You can now track when you pay your Zakat

### Premature Finalization Warning

<screenshot: premature-finalization-warning>

If you try to finalize before 354 days, you'll see a warning:

**"Hawl period incomplete: 45 days remaining. Finalize anyway?"**

**Why this matters**: The Hawl requirement is a fundamental Islamic principle. Finalizing early may not fulfill your religious obligation.

**When to proceed**:
- You have a valid Islamic reason (some scholars permit early payment)
- You're rectifying a historical record
- You've consulted with a scholar

**Recommendation**: Wait until the Hawl completes unless you have a specific need.

### Unlocking a Finalized Record

**Why unlock?**: To make corrections after finalizing (e.g., discovered a missed asset, calculation error)

**Steps**:

1. Navigate to your FINALIZED record
2. Click "Unlock Record"
3. Provide a clear, descriptive reason:

<screenshot: unlock-reason-dialog>

**Good reasons**:
- "Discovered $2,000 in savings account not included in original calculation"
- "Correcting asset valuation: gold jewelry was appraised $500 higher than estimated"
- "Adding cryptocurrency holdings I forgot to include"

**Bad reasons** (too vague):
- "Fix error"
- "Mistake"

**Minimum**: 10 characters required

4. Click "Unlock"

**Result**:
- Record status changes to UNLOCKED
- You can now edit all fields
- Audit trail records the unlock with your reason
- You can re-finalize after making corrections

### Re-Finalizing

After making corrections to an UNLOCKED record:

1. Review your changes
2. Click "Re-Finalize"
3. Confirm the updated calculation
4. Record becomes FINALIZED again

**Audit Trail**: All changes are logged:
- When unlocked (with reason)
- What changed (before/after values)
- When re-finalized

### Viewing Audit Trail

<screenshot: audit-trail-view>

For FINALIZED or UNLOCKED records, view the complete history:

**Navigation**: Record Details → "Audit Trail" tab

**What you'll see**:
- **CREATED**: Initial record creation
- **FINALIZED**: When you first finalized
- **UNLOCKED**: Unlock events with reasons
- **EDITED**: Changes made while unlocked
- **REFINALIZED**: Re-finalization after corrections

**Timestamps**: All events show exact date/time

**Purpose**: Maintains complete accountability and transparency

---

## Common Scenarios

### Scenario 1: First-Time User

**"I just started using ZakApp. How do I begin?"**

1. **Add your assets**: Go to Assets page and add all zakatable holdings
2. **Set Nisab preference**: Settings → Zakat Preferences → Choose gold or silver
3. **Wait for automatic detection**: If your wealth ≥ Nisab, a DRAFT record appears within an hour
4. **Monitor your Hawl**: Dashboard shows countdown and progress
5. **Finalize when complete**: After ~354 days, review and finalize

### Scenario 2: Wealth Fluctuates During Hawl

**"My wealth goes up and down. Will this affect my Zakat?"**

**Answer**: This is normal and expected!

- **Minor fluctuations**: Don't worry if your wealth dips slightly during the year
- **What matters**: Your wealth at the **end** of the Hawl period (354 days)
- **Hawl interruption**: If wealth drops significantly below Nisab, you'll be notified

**ZakApp tracks everything**, so you can make an informed decision at finalization time.

### Scenario 3: Multiple Hawl Periods

**"I have 2 DRAFT records. What does this mean?"**

This can happen if:
- Your wealth dropped below Nisab, then rose again (new Hawl started)
- You manually created a historical record
- System detected rapid wealth changes

**What to do**:
- Review both records
- The **oldest** DRAFT record is typically the one to track
- You can delete newer DRAFT records if they're not needed (Settings → Delete)

### Scenario 4: Historical Record Entry

**"I want to enter Zakat from a previous year"**

1. Click "Create Record" button
2. Select **Manual Entry**
3. Enter the historical Hawl start date
4. Fill in wealth details from that time period
5. Set status to FINALIZED (if already calculated and paid)

**Tip**: Use this to maintain a complete Zakat history for tax or record-keeping purposes.

### Scenario 5: I Made a Mistake

**"I finalized my record but forgot to include an asset!"**

**Solution**: Use the Unlock feature

1. Click "Unlock" on the FINALIZED record
2. Explain: "Forgot to include $3,000 in retirement account"
3. Add the missing asset in Assets page
4. The record updates automatically
5. Review the new calculation
6. Click "Re-Finalize"

**Your audit trail** will show the complete history of changes.

### Scenario 6: Nisab Threshold Changed

**"Gold prices went up. Does my Nisab threshold change?"**

**Answer**: Not for an active Hawl period!

- **During Hawl**: Threshold is **locked** at the value when your Hawl started
- **Future Hawls**: New Hawl periods will use current prices
- **Why**: Ensures consistency throughout your 354-day period

**Example**:
```
Jan 1, 2024: Hawl starts, Nisab locked at $5,000
Jun 1, 2024: Gold price rises, new Nisab would be $5,500
Your Hawl: Still uses $5,000 (locked value)
```

---

## Troubleshooting

### "I haven't received a Hawl notification"

**Possible reasons**:
1. **Wealth below Nisab**: Check Assets page - is your total ≥ Nisab?
2. **Hourly check pending**: System checks every hour, wait up to 60 minutes
3. **Nisab preference**: Verify your gold/silver setting in Zakat Preferences

**Solution**: 
- Navigate to Dashboard
- If wealth ≥ Nisab and no record appears after 1 hour, contact support

### "My Zakat amount seems wrong"

**Check these items**:
1. **All assets included?**: Review Assets page for completeness
2. **Asset values accurate?**: Update any outdated valuations
3. **Liabilities entered?**: If following Hanafi opinion, enter debts
4. **Methodology correct?**: Settings → Zakat Preferences → Review calculation method

**Calculation**:
```
Zakatable Wealth = (Total Assets) - (Liabilities if applicable)
Zakat Amount = Zakatable Wealth × 2.5%
```

### "Days remaining shows negative number"

**This means**: Your Hawl period has **ended** - it's time to finalize!

**What to do**:
1. Review the DRAFT record carefully
2. Click "Finalize"
3. Complete your Zakat payment
4. Track payment in the Payments tab

### "I can't delete a record"

**Reason**: Only DRAFT records can be deleted

**Why**: FINALIZED and UNLOCKED records cannot be deleted to maintain audit integrity

**Solution**: 
- For corrections: Use Unlock → Edit → Re-Finalize
- For errors: Contact support if you need assistance

### "What if I disagree with the calculation?"

**Remember**: ZakApp is a **tool**, not a religious authority.

**Steps**:
1. Review your assets and settings carefully
2. Consult the [Nisab Education Guide](../../client/src/content/nisabEducation.md)
3. If you follow a different scholarly opinion:
   - Use Unlock → Edit to adjust manually
   - Add notes explaining your methodology
4. Consult a qualified Islamic scholar for your specific situation

**Educational Resources**: Settings → Help → Islamic Guidance

---

## Payment Integration

> **✨ NEW in Milestone 5**: Track Zakat payments directly linked to Nisab Year Records for accurate compliance monitoring.

### Understanding Payment Tracking

Each Nisab Year Record can have multiple **Zakat payments** linked to it. This allows you to:

- Track which year's Zakat obligation you're fulfilling
- Calculate outstanding balances per year
- Monitor payment progress with visual indicators
- Maintain accurate compliance records

**Key Concept**: Payments are always linked to a specific Nisab Year Record, creating a clear connection between obligation and fulfillment.

### Viewing Payments in Nisab Year Record

**Navigation**: Nisab Year Record Detail Page → Scroll to "Payments" section

#### Payment Progress Indicator

At the top of each Nisab Year Record card, you'll see a **payment progress bar**:

**Visual Elements:**
- Progress bar showing payment percentage
- Percentage label above bar (e.g., "75% Paid")
- Color-coded based on progress

**Color Coding:**
- 🟢 **Green** (≥100%): Fully paid or overpaid
- 🟡 **Yellow** (1-99%): Partially paid
- 🔴 **Red** (0%): No payments recorded yet

**Calculation:**
```
Progress = (Total Paid ÷ Zakat Due) × 100%
```

**Example:**
- Zakat Due: $1,000
- Total Paid: $750
- Progress: 75% (Yellow bar, partially paid)
- Outstanding: $250

#### Payments Summary Section

**What You'll See:**
- **Total Paid**: Sum of all payments for this Nisab Year
- **Outstanding Balance**: Zakat Due - Total Paid
- **Payment Count**: Number of payments recorded
- **Last Payment**: Date of most recent payment
- **Payment List**: Chronological list of all linked payments

**Payment Details:**
Each payment shows:
- Amount and date
- Recipient category (e.g., Al-Fuqara, Al-Masakin)
- Recipient name (if provided)
- Payment method (if provided)
- Action buttons (View, Edit, Delete)

### Adding Payments from Nisab Year Record

**Quick Add:**

1. Navigate to Nisab Year Record detail page
2. Scroll to "Payments" section
3. Click **"Add Payment"** button
4. Payment form opens with this Nisab Year pre-selected
5. Enter payment details (amount, date, recipient, etc.)
6. Click "Save Payment"

**Benefit**: The Nisab Year is automatically pre-selected, saving time and ensuring correct linkage.

**Alternative**: Navigate to main Payments page and select Nisab Year manually.

### Outstanding Balance Calculation

**Automatic Updates:**

When you record a payment:
1. ✅ Payment amount added to "Total Paid"
2. ✅ Outstanding Balance recalculated (Zakat Due - Total Paid)
3. ✅ Progress bar updated with new percentage
4. ✅ Analytics charts refreshed
5. ✅ Dashboard compliance metrics updated

**Example Workflow:**

**Initial State:**
- Zakat Due: $1,000
- Total Paid: $0
- Outstanding: $1,000
- Progress: 0% (Red)

**After First Payment ($400):**
- Zakat Due: $1,000
- Total Paid: $400
- Outstanding: $600
- Progress: 40% (Yellow)

**After Second Payment ($600):**
- Zakat Due: $1,000
- Total Paid: $1,000
- Outstanding: $0
- Progress: 100% (Green)

### Overpayment Handling

**What Happens:**

If you pay more than the Zakat due amount:
- Progress bar shows >100% (Green)
- Outstanding balance shows $0 (or negative for overpayment)
- System displays "Fully Paid" badge
- Overpayment treated as additional Sadaqah (voluntary charity)

**Example:**
- Zakat Due: $1,000
- Total Paid: $1,200
- Progress: 120% (Green)
- Note: "$200 paid as additional Sadaqah"

**Islamic Guidance**: Paying more than required Zakat is permissible and rewarded. The excess is considered voluntary charity (Sadaqah).

### Payment History Per Nisab Year

**Why This Matters:**

Each Nisab Year Record shows only payments linked to that specific year. This provides:

- Clear separation between different years' obligations
- Accurate compliance tracking per year
- Easy audit trail for each Hawl period
- Year-specific payment reports

**Example Scenario:**

You have 3 Nisab Year Records:
- 1444 AH (2023): 5 payments, $1,500 total → Fully paid
- 1445 AH (2024): 3 payments, $800 total → Partially paid
- 1446 AH (2025): 0 payments, $0 total → Not paid yet

Each record's detail page shows only its own payments and calculates its own outstanding balance independently.

### Payment Filtering

**From Main Payments Page:**

To view payments for a specific Nisab Year:
1. Navigate to main **Payments** page
2. Click "Filter by Nisab Year" dropdown
3. Select desired Nisab Year (e.g., "1445 AH (2024)")
4. List updates to show only payments for that year

**Benefits:**
- Focus on specific year's payments
- Verify payment totals match expectations
- Review payment distribution across categories
- Audit year-specific compliance

### Unlocking and Payment Impact

**Important Note:**

When you unlock a FINALIZED Nisab Year Record to make corrections:
- Existing payments remain linked
- If you change the Zakat Due amount, outstanding balance recalculates
- Payment progress percentage updates automatically
- Payments themselves are NOT modified

**Example:**

Original:
- Zakat Due: $1,000
- Total Paid: $500
- Outstanding: $500
- Progress: 50%

After Unlocking and Editing (Zakat Due changed to $1,200):
- Zakat Due: $1,200 (changed)
- Total Paid: $500 (unchanged)
- Outstanding: $700 (recalculated)
- Progress: 42% (recalculated)

**Best Practice**: Review payment totals after unlocking and re-finalizing to ensure they still align with your records.

### Deleting Nisab Year Records with Payments

**Warning:**

If you attempt to delete a Nisab Year Record that has linked payments:
1. System shows warning: "This record has X payment(s) linked to it"
2. You must choose action:
   - **Option A**: Delete payments too (recommended if entry was error)
   - **Option B**: Unlink payments (payments remain but no longer associated with a year)
   - **Option C**: Cancel deletion

**Recommendation**: Avoid deleting FINALIZED records with payments. Use Unlock → Edit for corrections instead.

---

## Best Practices

### 1. Keep Assets Updated

**Recommendation**: Update asset values monthly

**Why**: Ensures accurate wealth tracking and Zakat calculation

**How**:
- Assets page → Edit icon → Update current value
- DRAFT records update automatically

### 2. Review Before Finalizing

**Checklist**:
- ✅ All assets included?
- ✅ Values are current and accurate?
- ✅ Liabilities entered (if following Hanafi opinion)?
- ✅ Hawl period complete (~354 days)?
- ✅ Ready to pay Zakat?

**Take your time** - once finalized, the record is locked.

### 3. Document Your Reasoning

**Use the Notes field**:
- Explain your methodology choices
- Reference scholarly opinions you're following
- Note any unusual circumstances

**Example**:
> "Following Hanafi opinion, deducted $5,000 mortgage payment due within year. Calculated on net zakatable wealth."

### 4. Maintain Audit Trail

**Don't delete records unnecessarily**:
- Audit trails provide accountability
- Historical records help with tax reporting
- Shows your diligence in fulfilling religious obligations

### 5. Set Reminders

**Outside ZakApp**:
- Calendar reminder 1 week before Hawl completion
- Annual reminder to review Nisab preference
- Quarterly reminder to update asset valuations

---

## Keyboard Shortcuts

For power users:

| Action | Shortcut |
|--------|----------|
| Navigate to Nisab Records | `Alt + N` |
| Finalize current DRAFT | `Ctrl + F` |
| Unlock selected record | `Ctrl + U` |
| Create new record | `Ctrl + Shift + N` |
| Open audit trail | `Alt + A` |

**Accessibility**: All features fully accessible via keyboard navigation (Tab, Enter, Escape)

---

## Related Documentation

- [Nisab and Hawl Education](../../client/src/content/nisabEducation.md)
- [API Documentation: Nisab Year Records](../api/nisab-year-records.md)
- [Zakat Calculation Methodologies](../methodology-guide.md)
- [Asset Management Guide](./tracking.md)

---

## Getting Help

**Questions?** 
- FAQ: Settings → Help → Frequently Asked Questions
- Support: Contact support@zakapp.com
- Islamic Guidance: Consult a qualified scholar

**Report an Issue**:
- GitHub: [zakapp/issues](https://github.com/your-org/zakapp/issues)
- Email: support@zakapp.com

---

**Last Updated**: 2025-10-30  
**Feature**: 008-nisab-year-record  
**Version**: 1.0

**Note**: Screenshots referenced in this guide will be added after UI implementation is complete and production-ready.
