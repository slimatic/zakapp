# Nisab and Hawl: Understanding Islamic Zakat Requirements

This educational content explains the Islamic principles of Nisab and Hawl that govern Zakat calculation in ZakApp.

---

## What is Nisab? (النصاب)

### Definition

**Nisab** is the minimum amount of wealth a Muslim must possess for a full lunar year before Zakat becomes obligatory. It represents the threshold below which a person is not required to pay Zakat.

### Historical Origins

The Nisab is based on values established during the time of Prophet Muhammad (peace be upon him):

- **Gold Standard**: 87.48 grams (approximately 20 mithqals or 2.8 troy ounces)
- **Silver Standard**: 612.36 grams (approximately 200 dirhams or 19.7 troy ounces)

These measurements come from authentic hadith narrations and represent the minimum wealth at which Zakat becomes obligatory.

### How ZakApp Calculates Nisab

ZakApp uses current precious metal prices to calculate the Nisab threshold in your currency:

1. **Gold Basis**: 87.48g × current gold price per gram = Nisab threshold
2. **Silver Basis**: 612.36g × current silver price per gram = Nisab threshold

**Example**: If gold is $60/gram:
- Nisab threshold = 87.48g × $60 = $5,248.80

### Gold vs Silver: Which Should You Use?

**Traditional Position**: Most contemporary scholars recommend using the **silver standard** because:
- It results in a lower Nisab threshold
- This means more people qualify to pay Zakat
- More Zakat is distributed to those in need

**ZakApp Default**: Gold standard (more commonly used in modern applications)

**Your Choice**: You can select either standard in your profile settings. The choice affects which threshold is used for your Hawl tracking.

**Important**: Once a Hawl period begins, the Nisab value is **locked** at that level for the entire year, ensuring consistency.

---

## What is Hawl? (الحول)

### Definition

**Hawl** is the lunar year period (approximately 354 days) during which your wealth must continuously remain at or above the Nisab threshold for Zakat to become due.

### The Lunar Year Requirement

Islamic months follow the lunar calendar, not the Gregorian solar calendar:

- **Lunar year**: 354-355 days (12 lunar months)
- **Solar year**: 365 days (12 solar months)

This means your Zakat year is approximately 11 days shorter than a regular calendar year.

**Quranic Basis**: *"Indeed, the number of months with Allah is twelve [lunar] months..."* (Quran 9:36)

### Why 354 Days?

The lunar calendar is tied to the phases of the moon, which has been the Islamic calendar system since the time of the Prophet (peace be upon him). Using lunar months ensures:

1. **Religious consistency**: All Islamic dates use the lunar calendar
2. **Historical precedent**: Zakat has always been calculated this way
3. **Scholarly consensus**: All major schools of Islamic jurisprudence agree on the lunar year

### How Hawl Tracking Works in ZakApp

#### 1. Hawl Start Detection

Your Hawl period begins **automatically** when your aggregate zakatable wealth first reaches or exceeds the Nisab threshold:

```
Day 1: Wealth = $4,000 (below Nisab of $5,000)
       → No Hawl tracking yet

Day 2: Wealth = $6,000 (above Nisab of $5,000)
       → Hawl begins! Start date recorded
       → Completion date calculated (~354 days later)
       → Nisab threshold locked at $5,000 for this Hawl
```

#### 2. Live Tracking During Hawl

Throughout your Hawl period, ZakApp shows:

- **Days remaining** until Hawl completion
- **Current wealth** vs locked Nisab threshold
- **Estimated Zakat** (2.5% of zakatable wealth)
- **Hawl progress** visualization

Your wealth can fluctuate during this period, and ZakApp tracks it in real-time without any action required from you.

#### 3. Hawl Interruption

If your wealth drops **below** the Nisab threshold during the Hawl period:

**Traditional View**: Some scholars say the Hawl "resets" and you must begin a new 354-day period when wealth rises above Nisab again.

**ZakApp Approach**: We inform you of the interruption but preserve the record, allowing you to:
- Continue tracking if wealth quickly recovers
- Make the final decision at finalization time
- Consult with a scholar for your specific situation

**Note**: Different schools of thought have varying positions on Hawl interruption. ZakApp provides the information so you can follow your preferred scholarly opinion.

#### 4. Hawl Completion

After ~354 days of maintaining wealth at or above Nisab:

1. **Notification**: ZakApp alerts you that your Hawl is complete
2. **Finalization**: You review the wealth summary and Zakat calculation
3. **Lock Record**: The record becomes FINALIZED and immutable
4. **Payment Tracking**: You can track when and how you paid your Zakat

---

## The Aggregate Approach

### What "Aggregate Zakatable Wealth" Means

ZakApp automatically sums **all** your zakatable assets to determine if you've reached Nisab:

**Zakatable Assets** (included in calculation):
- 💰 Cash and bank accounts
- 📊 Stocks, bonds, and investment accounts
- 💎 Gold and silver jewelry (excluding necessary personal items)
- 💵 Cryptocurrency
- 🏪 Business inventory and trade goods
- 📈 Retirement accounts (accessible funds)

**Non-Zakatable Assets** (excluded from calculation):
- 🏠 Primary residence
- 🚗 Personal vehicle for transportation
- 👗 Personal clothing and necessary household items
- 📚 Books and tools needed for your profession

### Why Aggregate?

Islamic scholars agree that Zakat is calculated on the **total** zakatable wealth, not individual asset categories:

**Example**: 
```
Gold jewelry: $2,000
Bank account: $1,500
Crypto: $2,000
Total: $5,500 → Above Nisab ($5,000)
```

Even though no single asset reaches Nisab, the total does, so Hawl tracking begins.

**Hadith Reference**: The Prophet (peace be upon him) said, *"There is no Zakat on less than five camels, and there is no Zakat on less than five awsuq of dates, and there is no Zakat on less than five awaq of silver."* (Sahih Bukhari)

The principle: A minimum threshold must be reached before Zakat is due.

---

## Zakat Calculation at Hawl Completion

### The 2.5% Rate

When your Hawl completes, Zakat is calculated as **2.5%** (or 1/40th) of your total zakatable wealth:

```
Zakatable Wealth: $10,000
Zakat Due: $10,000 × 0.025 = $250
```

### What Amount Is Zakatable?

**Method 1 (Standard - ZakApp Default)**:
- Zakat is calculated on the **entire** amount above Nisab

**Example**:
```
Total Wealth: $10,000
Nisab Threshold: $5,000
Zakatable Amount: $10,000 (entire wealth)
Zakat Due: $10,000 × 2.5% = $250
```

**Method 2 (Some Hanafi scholars)**:
- Zakat calculated on amount **exceeding** Nisab

**Example**:
```
Total Wealth: $10,000
Nisab Threshold: $5,000
Zakatable Amount: $5,000 (excess above Nisab)
Zakat Due: $5,000 × 2.5% = $125
```

**ZakApp Position**: We follow the majority opinion (Method 1) which applies 2.5% to the entire zakatable wealth above Nisab. This is the view of Maliki, Shafi'i, and Hanbali schools and many contemporary scholars.

---

## Deductible Liabilities

### Can You Deduct Debts?

**Scholarly Difference**:

1. **Yes, deduct debts** (Hanafi school):
   - Immediate debts can be subtracted from zakatable wealth
   - Only pay Zakat on the net amount

2. **No, don't deduct** (Maliki, Shafi'i, Hanbali schools):
   - Calculate Zakat on gross zakatable wealth
   - Debts don't affect the obligation

**ZakApp Approach**: 
- We allow you to enter liabilities in your records
- The calculation respects your preference
- Educational tooltips explain both opinions
- **Default**: No deductions (majority opinion)

**Example**:
```
Zakatable Assets: $10,000
Outstanding Debts: $3,000

Calculation A (with deduction):
Zakatable Wealth: $7,000
Zakat: $7,000 × 2.5% = $175

Calculation B (without deduction):
Zakatable Wealth: $10,000
Zakat: $10,000 × 2.5% = $250
```

**Recommendation**: Consult with a scholar you trust to determine which method to follow.

---

## Frequently Asked Questions

### Q: What if my wealth fluctuates during the Hawl year?

**A**: This is normal! Your wealth will naturally go up and down throughout the year. What matters is:

1. **At Hawl Start**: Did you have wealth ≥ Nisab? (This starts the clock)
2. **At Hawl End**: What is your wealth after 354 days? (This is what you calculate Zakat on)

Minor dips below Nisab during the year are common. Scholars differ on whether this "resets" the Hawl. ZakApp notifies you of interruptions so you can make an informed decision.

### Q: Can I finalize my Zakat calculation before 354 days?

**A**: Generally **no**. The Hawl (lunar year) requirement is a fundamental principle of Zakat. However, ZakApp allows early finalization with an acknowledgment in case you:
- Have a valid Islamic reason (some scholars permit early payment)
- Are rectifying a historical record
- Need to finalize for tax or administrative purposes

**Caution**: Consult a scholar before finalizing early, as it may not fulfill your religious obligation.

### Q: What if I discover an error after finalizing?

**A**: ZakApp has an "Unlock" feature for this exact situation:

1. Click "Unlock" on the finalized record
2. Provide a reason (min 10 characters) - this creates an audit trail
3. Make your corrections
4. Re-finalize the record

All changes are logged for accountability.

### Q: How does ZakApp know when I reach Nisab?

**A**: ZakApp runs an automated check every hour:
- Calculates your total zakatable wealth (from your Assets page)
- Compares to current Nisab threshold
- If you cross above Nisab, starts a new DRAFT Nisab Year Record
- Notifies you via dashboard

You don't need to do anything - the tracking happens automatically.

### Q: Why is my Zakat year different from the calendar year?

**A**: Your Zakat year is tied to when **you personally** first reached Nisab, not to January 1st. This means:

- Everyone's Zakat due date is different
- It's based on **your** financial situation
- Follows the Islamic lunar calendar (354 days)

**Example**: If you reached Nisab on March 15, 2024, your Zakat becomes due approximately on February 27, 2025 (354 days later), not December 31st.

---

## Educational Resources

### Recommended Reading

1. **Simple Zakat Guide** (simpletax.guide/zakat)
   - Comprehensive video series and written guide
   - Explains Nisab, Hawl, and calculation methods
   - Cited throughout ZakApp's educational content

2. **Fiqh us-Sunnah** by Sayyid Sabiq
   - Classical reference on Zakat rulings
   - Available in English translation

3. **Reliance of the Traveller** (Umdat as-Salik)
   - Section h1: Zakat
   - Detailed coverage of Nisab thresholds and calculation

### Scholarly Opinions

ZakApp's methodology is based on:
- **Primary**: Simple Zakat Guide (contemporary, accessible)
- **Secondary**: Majority opinion of the four Sunni schools
- **Tertiary**: Contemporary fatawa from recognized scholars

**Important**: We are not scholars. The information provided is for educational purposes. When in doubt, consult a qualified Islamic scholar for your specific situation.

---

## Terminology Glossary

| Arabic Term | English | Definition |
|-------------|---------|------------|
| **Nisab** (النصاب) | Minimum Threshold | Minimum wealth required for Zakat obligation |
| **Hawl** (الحول) | Lunar Year | 354-day period wealth must remain above Nisab |
| **Zakat** (الزكاة) | Almsgiving | Obligatory charity, one of the Five Pillars of Islam |
| **Mithqal** (مثقال) | Gold Weight | ~4.374 grams (20 mithqals = 87.48g) |
| **Dirham** (درهم) | Silver Weight | ~3.062 grams (200 dirhams = 612.36g) |
| **Qamari** (قمري) | Lunar | Based on moon phases (Islamic calendar) |
| **Shamsi** (شمسي) | Solar | Based on sun (Gregorian calendar) |

---

## Quick Reference

### Key Numbers

- **Gold Nisab**: 87.48 grams
- **Silver Nisab**: 612.36 grams
- **Hawl Duration**: 354 days (lunar year)
- **Zakat Rate**: 2.5% (1/40th)

### Status Meanings

- **DRAFT**: Hawl in progress, tracking wealth changes
- **FINALIZED**: Hawl complete, Zakat calculated and locked
- **UNLOCKED**: Finalized record reopened for corrections

### Important Dates

Your Nisab Year Records show both:
- **Gregorian dates**: Standard calendar (2024-01-15)
- **Hijri dates**: Islamic lunar calendar (1445-07-03)

---

**Last Updated**: 2025-10-30  
**Based on**: Simple Zakat Guide, Classical Fiqh texts, Contemporary scholarly consensus  
**Feature**: 008-nisab-year-record

**Disclaimer**: This educational content is for informational purposes only and does not constitute religious legal advice. For specific situations, please consult a qualified Islamic scholar.
