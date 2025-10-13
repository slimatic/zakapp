# 🚀 Feature 004: Getting Started Guide

**Welcome to Feature 004: Enhanced Zakat Calculation Engine!**

This guide will help you get started with implementing the remaining 15% of Milestone 4 to complete the Zakat Calculation Engine.

---

## 📋 What You'll Be Building

You're completing the **Zakat Calculation Engine** by adding:

1. **📅 Calendar System** - Support for both Hijri (Islamic lunar) and Gregorian calendars
2. **🕌 Methodology Selector** - Beautiful UI for choosing between Standard, Hanafi, Shafi'i, or Custom methods
3. **📊 Enhanced Calculator Display** - Visual indicators, breakdowns, and educational content
4. **📈 Calculation History** - Store, view, and compare past calculations with trend analysis

---

## 🎯 Your Mission

### Big Picture
Make ZakApp's Zakat calculator **fully compliant with multiple Islamic methodologies** and give users a **delightful educational experience** when calculating their Zakat obligations.

### Why This Matters
- Different Muslims follow different madhabs (schools of thought)
- Some prefer silver-based nisab (Hanafi), others gold-based (Standard)
- Users need to understand WHY their calculation is what it is
- Historical tracking helps users see their Zakat journey over time

---

## 📊 Current Status

### What's Already Done ✅
- ✅ Basic Zakat calculation working
- ✅ Asset management complete
- ✅ User authentication secure
- ✅ Tracking & analytics (Feature 003) complete
- ✅ Three methodologies researched and documented:
  - Standard (AAOIFI-compliant)
  - Hanafi (silver-based nisab)
  - Shafi'i (detailed categorization)

### What You're Adding 🔄
- 📅 Hijri calendar support
- 🕌 Methodology selection UI
- 📊 Enhanced calculation display
- 📈 Calculation history
- 📚 Educational content

---

## 🗺️ Roadmap (2 Weeks)

### Week 1: Core Functionality
```
Monday (Oct 7)    │ Calendar System Backend
                  │ • T118-T121: Calendar service & API
                  │
Tuesday (Oct 8)   │ Calendar System Frontend  
                  │ • T122-T124: UI components & testing
                  │
Wednesday (Oct 9) │ Methodology Selector - Part 1
                  │ • T125-T128: Cards & educational content
                  │
Thursday (Oct 10) │ Methodology Selector - Part 2
                  │ • T129-T132: Recommendation & integration
                  │
Friday (Oct 11)   │ Testing & Buffer
                  │ • T133: Methodology testing
```

### Week 2: Display & History
```
Monday (Oct 14)   │ Enhanced Display - Part 1
                  │ • T134-T137: Breakdown UI & indicators
                  │
Tuesday (Oct 15)  │ Enhanced Display - Part 2
                  │ • T138-T141: Tooltips & comparison
                  │
Wednesday (Oct 16)│ Calculation History - Part 1
                  │ • T142-T145: Data model & API
                  │
Thursday (Oct 17) │ Calculation History - Part 2
                  │ • T146-T150: Trends & visualization
                  │
Friday (Oct 18)   │ Testing & Documentation
                  │ • T151-T158: All testing & docs
```

---

## 🛠️ Quick Start (Phase 1: Calendar System)

### Step 1: Install Dependencies
```bash
cd /home/lunareclipse/zakapp/server
npm install hijri-converter --save

cd /home/lunareclipse/zakapp/client
npm install hijri-converter --save
```

### Step 2: Create Calendar Service
Create `/home/lunareclipse/zakapp/server/services/CalendarService.js`:

```javascript
const HijriDate = require('hijri-converter');

class CalendarService {
  /**
   * Convert Gregorian date to Hijri
   * @param {Date|string} gregorianDate 
   * @returns {Object} { year, month, day }
   */
  gregorianToHijri(gregorianDate) {
    const date = new Date(gregorianDate);
    const hijri = new HijriDate.Gregorian(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    ).toHijri();
    
    return {
      year: hijri.year,
      month: hijri.month,
      day: hijri.day
    };
  }

  /**
   * Convert Hijri date to Gregorian
   * @param {number} year 
   * @param {number} month 
   * @param {number} day 
   * @returns {Date}
   */
  hijriToGregorian(year, month, day) {
    const hijri = new HijriDate.Hijri(year, month, day);
    const gregorian = hijri.toGregorian();
    
    return new Date(gregorian.year, gregorian.month - 1, gregorian.day);
  }

  /**
   * Calculate Zakat year based on calendar preference
   * @param {string} calendarType - 'hijri' or 'gregorian'
   * @param {Date} lastCalculationDate 
   * @returns {Date}
   */
  calculateNextZakatDate(calendarType, lastCalculationDate) {
    const date = new Date(lastCalculationDate);
    
    if (calendarType === 'hijri') {
      // Add 354 days (lunar year)
      date.setDate(date.getDate() + 354);
    } else {
      // Add 365 days (solar year)
      date.setDate(date.getDate() + 365);
    }
    
    return date;
  }

  /**
   * Format Hijri date for display
   * @param {number} year 
   * @param {number} month 
   * @param {number} day 
   * @returns {string}
   */
  formatHijriDate(year, month, day) {
    const monthNames = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
      'Ramadan', 'Shawwal', 'Dhul-Qadah', 'Dhul-Hijjah'
    ];
    
    return `${day} ${monthNames[month - 1]} ${year} AH`;
  }
}

module.exports = new CalendarService();
```

### Step 3: Add Calendar Routes
Add to `/home/lunareclipse/zakapp/server/routes/user.js` (or create new calendar routes):

```javascript
const calendarService = require('../services/CalendarService');

// Convert Gregorian to Hijri
router.get('/calendar/gregorian-to-hijri', authenticateToken, (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return sendError(res, 'VALIDATION_ERROR', 'Date parameter required', 400);
    }
    
    const hijriDate = calendarService.gregorianToHijri(date);
    return sendSuccess(res, { hijriDate });
  } catch (error) {
    console.error('Calendar conversion error:', error);
    return sendError(res, 'CONVERSION_ERROR', 'Failed to convert date', 500);
  }
});

// Convert Hijri to Gregorian
router.get('/calendar/hijri-to-gregorian', authenticateToken, (req, res) => {
  try {
    const { year, month, day } = req.query;
    if (!year || !month || !day) {
      return sendError(res, 'VALIDATION_ERROR', 'Year, month, and day required', 400);
    }
    
    const gregorianDate = calendarService.hijriToGregorian(
      parseInt(year),
      parseInt(month),
      parseInt(day)
    );
    
    return sendSuccess(res, { gregorianDate });
  } catch (error) {
    console.error('Calendar conversion error:', error);
    return sendError(res, 'CONVERSION_ERROR', 'Failed to convert date', 500);
  }
});
```

### Step 4: Test Calendar Service
Create `/home/lunareclipse/zakapp/server/services/CalendarService.test.js`:

```javascript
const calendarService = require('./CalendarService');

describe('CalendarService', () => {
  test('should convert Gregorian to Hijri', () => {
    const result = calendarService.gregorianToHijri('2025-10-06');
    expect(result.year).toBe(1447);
    expect(result.month).toBe(4); // Rabi' al-Thani
  });

  test('should convert Hijri to Gregorian', () => {
    const result = calendarService.hijriToGregorian(1447, 4, 14);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(9); // October (0-indexed)
  });

  test('should calculate next Zakat date (lunar)', () => {
    const lastDate = new Date('2025-01-01');
    const nextDate = calendarService.calculateNextZakatDate('hijri', lastDate);
    const daysDiff = (nextDate - lastDate) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBe(354);
  });
});
```

---

## 📚 Resources & References

### Islamic Calendar Resources
- **hijri-converter library**: https://www.npmjs.com/package/hijri-converter
- **Islamic Date Calculation**: Understanding lunar vs solar calendars
- **Zakat Due Date**: Based on when wealth reaches nisab threshold

### Zakat Methodologies
1. **Standard Method** (AAOIFI)
   - Modern, widely accepted
   - Gold-based nisab (85g)
   - 2.5% on all zakatable wealth

2. **Hanafi Method**
   - Silver-based OR gold-based (whichever is lower)
   - More inclusive (benefits more people)
   - 2.5% rate

3. **Shafi'i Method**
   - Gold-based nisab
   - Detailed asset categorization
   - Specific business asset rules

### Design References
- **Methodology Cards**: Think "Choose your plan" pricing cards
- **Nisab Indicator**: Progress bar showing position relative to nisab
- **Educational Tooltips**: Question mark icons with helpful explanations

---

## 🎨 UI/UX Guidelines

### Methodology Selector Design
- **Cards**: 3 columns on desktop, stack on mobile
- **Visual Hierarchy**: Standard method should be highlighted as "Most Used"
- **Educational**: Each card has "Learn More" button
- **Comparison**: "Compare Methodologies" button at bottom

### Color Scheme (Already in use)
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)
- **Islamic Green**: #16A34A (for Islamic content)

### Typography
- **Headings**: Inter font (already in use)
- **Body**: Inter font
- **Arabic Text**: Ensure UTF-8 support

---

## ✅ Definition of Done (Per Task)

Before marking a task as complete:

1. ✅ **Code Complete**: Functionality implemented
2. ✅ **Tested**: Unit tests passing (if applicable)
3. ✅ **UI Polished**: Looks good on desktop & mobile
4. ✅ **Documented**: Code comments and JSDoc
5. ✅ **Committed**: Git commit with clear message
6. ✅ **No Errors**: Console clean, no warnings

---

## 🐛 Common Pitfalls to Avoid

### Calendar Issues
- ❌ Don't forget leap years in Gregorian calendar
- ❌ Don't assume Hijri months are 30 days (they're 29 or 30)
- ❌ Don't forget time zones in date calculations
- ✅ Always use UTC for date storage

### Methodology Issues
- ❌ Don't hard-code nisab values (they change)
- ❌ Don't mix methodology rules
- ❌ Don't skip educational content
- ✅ Always validate methodology selection

### UI Issues
- ❌ Don't forget mobile responsiveness
- ❌ Don't use too much text (keep it concise)
- ❌ Don't skip loading states
- ✅ Always provide visual feedback

---

## 🆘 Need Help?

### Stuck on Calendar Conversion?
- Check hijri-converter documentation
- Test with known dates (e.g., Islamic New Year)
- Use online converters to verify: https://www.islamicfinder.org/islamic-calendar/

### Stuck on Methodology Logic?
- Refer to `/specs/004-zakat-calculation-complete/spec.md`
- Review existing ZakatCalculator component
- Check AAOIFI standards documentation

### Stuck on UI/UX?
- Look at similar features in other parts of the app
- Check TailwindCSS documentation
- Review components in `/client/src/components/ui/`

---

## 📊 Progress Tracking

Update `/home/lunareclipse/zakapp/FEATURE_004_TASKS.md` after each task:

1. Change status from ⏳ to 🔄 when starting
2. Add notes if needed
3. Change status to ✅ when complete
4. Update progress percentages
5. Log daily progress

---

## 🎯 First Task: T118

### Task: Install and configure hijri-converter library
**Estimate**: 30 minutes
**Status**: ⏳ Ready to start

**Steps**:
1. Install in server: `cd server && npm install hijri-converter --save`
2. Install in client: `cd client && npm install hijri-converter --save`
3. Verify installation: Check package.json
4. Test basic import: Create quick test file
5. Commit: `git add . && git commit -m "chore: install hijri-converter library"`

**Success Criteria**:
- ✅ Library installed in both server and client
- ✅ No version conflicts
- ✅ Basic import works
- ✅ Committed to git

---

## 🚀 Ready to Start?

When you're ready to begin:

1. **Read the full spec**: `/specs/004-zakat-calculation-complete/spec.md`
2. **Open task tracker**: `/FEATURE_004_TASKS.md`
3. **Start with T118**: Install hijri-converter
4. **Work through Phase 1**: Complete all 7 calendar tasks
5. **Update progress**: Mark tasks complete as you go

---

## 🎉 You Got This!

This is an exciting feature that will make ZakApp truly comprehensive for Muslims around the world. The calendar support and multiple methodologies will serve users of different schools of thought and regional practices.

Remember:
- 📖 **Research first** - Understand before implementing
- 🎨 **Design matters** - Make it beautiful AND functional
- 🧪 **Test thoroughly** - Islamic calculations must be accurate
- 📝 **Document well** - Future you will thank you

**Happy coding! 🕌💻**

---

**Created**: October 6, 2025  
**Feature**: 004-zakat-calculation-complete  
**Branch**: `004-zakat-calculation-complete`  
**Next**: T118 - Install hijri-converter library
