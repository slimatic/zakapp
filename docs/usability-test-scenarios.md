# Usability Testing Scenarios - Milestone 6

**Purpose**: Define key task scenarios for usability testing to validate UI/UX enhancements  
**Target**: Achieve 80%+ task completion rate and 4.0/5.0 satisfaction score  
**Participants**: 10 diverse users (40% new to Zakat, 30% with disabilities, 30% age 50+, gender-balanced)

---

## Test Setup

### Equipment
- Testing device (laptop/tablet/mobile)
- Screen recording software (OBS, QuickTime)
- Note-taking template
- Consent form
- Pre/post-test questionnaires

### Metrics to Track
1. **Task Completion Rate**: % of tasks completed successfully
2. **Time on Task**: How long each task takes
3. **Error Rate**: Number of mistakes or wrong paths taken
4. **Satisfaction**: Post-task ratings (1-5 scale)
5. **Accessibility**: WCAG compliance validation with real users
6. **Performance Perception**: Subjective speed and responsiveness

---

## Scenario 1: First-Time Zakat Calculation (Critical Path)

**User Profile**: New to Zakat calculation, Muslim, basic tech skills  
**Context**: User wants to calculate their Zakat for the first time  
**Success Criteria**: User completes calculation within 5 minutes with <2 errors

### Task Steps:
1. **Start**: "You need to calculate your Zakat for this year. Please use ZakApp to do this."
2. Navigate to Zakat Calculator
3. Select calculation methodology (e.g., Standard)
4. Enter assets (minimum 2: cash and gold)
5. Review calculated Zakat amount
6. Understand the result and next steps

### What to Observe:
- Can user find the calculator easily?
- Do tooltips and help text provide sufficient guidance?
- Are Islamic terms explained clearly?
- Does the user understand nisab threshold?
- Is the result presentation clear?

### Success Indicators:
- ✅ Task completed without assistance
- ✅ User understands what Zakat they owe
- ✅ User feels confident in the calculation
- ✅ Time < 5 minutes
- ✅ Satisfaction rating ≥ 4/5

---

## Scenario 2: Adding and Managing Assets (Common Workflow)

**User Profile**: Returning user, has some assets already  
**Context**: User wants to add a new investment account and update existing gold holdings  
**Success Criteria**: Successfully adds 1 asset and updates 1 existing asset

### Task Steps:
1. **Start**: "You just bought $5,000 in stocks and need to add this to your assets. Also, you want to update your gold holdings from 50g to 75g."
2. Navigate to Assets page
3. Add new asset (Stocks, $5,000)
4. Find existing gold asset
5. Update gold value to 75g
6. Verify changes on Dashboard

### What to Observe:
- Is the "Add Asset" button obvious?
- Can user easily find and edit existing assets?
- Are form fields self-explanatory?
- Does the dashboard reflect changes immediately?
- Are empty states helpful for first-time users?

### Success Indicators:
- ✅ Both tasks completed successfully
- ✅ User navigates without getting lost
- ✅ Dashboard updates are noticed
- ✅ Time < 3 minutes
- ✅ Satisfaction rating ≥ 4/5

---

## Scenario 3: Accessibility - Keyboard Navigation (WCAG Validation)

**User Profile**: User with motor disability who relies on keyboard navigation  
**Context**: User wants to calculate Zakat using only keyboard (no mouse)  
**Success Criteria**: Complete full Zakat calculation using keyboard only

### Task Steps:
1. **Start**: "Please calculate your Zakat using only the keyboard. Do not use your mouse."
2. Use Tab to navigate to Calculator
3. Tab through form fields
4. Enter values using keyboard
5. Submit calculation using Enter/Space
6. Navigate to view results

### What to Observe:
- Is skip-to-content link visible on focus?
- Is focus indicator clearly visible on all elements?
- Are all interactive elements keyboard accessible?
- Is tab order logical and predictable?
- Can user submit forms with Enter key?
- Are dropdowns and modals keyboard accessible?

### Success Indicators:
- ✅ All interactive elements reachable via keyboard
- ✅ Focus indicators visible (3:1 contrast)
- ✅ Logical tab order maintained
- ✅ No keyboard traps encountered
- ✅ User completes task successfully
- ✅ Satisfaction rating ≥ 4/5

---

## Scenario 4: Accessibility - Screen Reader (WCAG Validation)

**User Profile**: Blind user using NVDA/JAWS/VoiceOver  
**Context**: User wants to review their Zakat history  
**Success Criteria**: Navigate to history and understand past calculations using screen reader only

### Task Steps:
1. **Start**: "Please review your Zakat calculation history using your screen reader."
2. Navigate to History page
3. Find most recent calculation
4. Understand: date, amount, status
5. Access calculation details
6. Return to Dashboard

### What to Observe:
- Are landmarks properly announced?
- Are headings in logical hierarchy?
- Are images described with alt text?
- Are form fields properly labeled?
- Are error messages announced?
- Are tables properly structured?
- Is dynamic content announced (ARIA live regions)?

### Success Indicators:
- ✅ User navigates using landmarks
- ✅ All content is announced clearly
- ✅ No confusing or missing labels
- ✅ Tables are understandable
- ✅ User completes task independently
- ✅ Satisfaction rating ≥ 4/5

---

## Scenario 5: Performance Perception Test

**User Profile**: Mobile user on slower connection  
**Context**: User wants to check their Zakat status while on the go  
**Success Criteria**: User perceives app as fast and responsive

### Task Steps:
1. **Start**: "You're checking your Zakat status on your phone. Please open the app and view your Dashboard."
2. Open ZakApp on mobile device (simulated 3G)
3. Navigate to Dashboard
4. View Zakat summary
5. Open an asset for editing
6. Make a quick change and save

### What to Observe:
- Does initial load feel fast? (FCP < 1.5s)
- Are loading skeletons shown?
- Does the app feel responsive?
- Are interactions immediate (<100ms feedback)?
- Does content shift during load (CLS)?

### Success Indicators:
- ✅ User perceives app as "fast"
- ✅ No complaints about waiting
- ✅ Immediate visual feedback on all actions
- ✅ No unexpected layout shifts
- ✅ Satisfaction rating ≥ 4/5

---

## Scenario 6: PWA Installation and Offline Use

**User Profile**: User wanting to install app and use offline  
**Context**: User wants ZakApp available as a standalone app  
**Success Criteria**: Install app and verify offline functionality

### Task Steps:
1. **Start**: "Please install ZakApp as an app on your device and then try using it without internet."
2. Look for install prompt or option
3. Install the app
4. Open installed app (standalone mode)
5. Turn off internet connection
6. Try to view existing assets (should work offline)
7. Try to add a new asset (should queue for sync)

### What to Observe:
- Is install prompt discoverable?
- Is installation process smooth?
- Does standalone app look native?
- Does offline message appear when appropriate?
- Can user still access cached data?
- Is background sync working?

### Success Indicators:
- ✅ User successfully installs app
- ✅ Offline functionality works
- ✅ User understands what's available offline
- ✅ Background sync queues offline actions
- ✅ Satisfaction rating ≥ 4/5

---

## Post-Test Questionnaire

### Satisfaction Questions (1-5 scale)
1. How easy was it to complete the tasks?
2. How clear and helpful were the error messages?
3. How confident do you feel in the Zakat calculations?
4. How would you rate the visual design?
5. How fast did the app feel?
6. Would you recommend ZakApp to others?

### Open-Ended Questions
1. What did you like most about ZakApp?
2. What frustrated you the most?
3. What features or improvements would you suggest?
4. (For users with disabilities) Were there any accessibility barriers?
5. How does ZakApp compare to other apps you've used?

---

## Analysis Criteria

### Task Completion Rate
- **Target**: ≥80% of tasks completed successfully
- **Calculation**: (Completed tasks / Total tasks) × 100
- **Pass/Fail**: Average across all scenarios must meet target

### User Satisfaction
- **Target**: Average rating ≥4.0/5.0
- **Calculation**: Sum of all ratings / Number of ratings
- **Pass/Fail**: Overall satisfaction must meet target

### Accessibility Compliance
- **Target**: 100% of accessibility scenarios completed
- **Validation**: Users with disabilities complete tasks without assistance
- **Pass/Fail**: Zero critical accessibility barriers reported

### Performance Perception
- **Target**: >80% of users rate performance as "fast" or "very fast"
- **Validation**: Subjective feedback + Web Vitals metrics
- **Pass/Fail**: Performance satisfaction ≥4.0/5.0

---

## Testing Protocol

### Session Structure (30 minutes)
1. **Introduction (5 min)**: Explain purpose, get consent, pre-test questionnaire
2. **Task Scenarios (20 min)**: Guide through 3-4 scenarios
3. **Debrief (5 min)**: Post-test questionnaire, gather feedback

### Facilitation Tips
- **Think Aloud**: Ask users to verbalize their thoughts
- **Non-Leading**: Don't guide or suggest solutions
- **Observation**: Note hesitations, errors, expressions
- **Recording**: Record screen and audio (with consent)
- **Notes**: Capture direct quotes and pain points

### Participant Recruitment
- **Diversity**: Ensure demographic and ability diversity
- **Screener**: Pre-qualify participants for relevant profiles
- **Incentive**: Offer compensation for time ($25-50 gift card)
- **Consent**: Obtain signed consent for recording

---

## Expected Outcomes

Based on Milestone 6 improvements, we expect:
- ✅ 80%+ task completion rate (target met)
- ✅ 4.0+/5.0 satisfaction score (target met)
- ✅ Zero critical accessibility issues (WCAG 2.1 AA compliant)
- ✅ Strong performance perception (Core Web Vitals optimized)
- ✅ Positive PWA adoption (installation and offline use)
- ✅ Improved confidence in Zakat calculations (better UX)

---

**Next Steps**: 
1. Recruit 10 diverse participants
2. Schedule testing sessions
3. Conduct sessions and record findings
4. Analyze results (T065)
5. Implement critical improvements
6. Re-test if major issues found

*This document fulfills Task T063: Create Usability Test Scenarios*
