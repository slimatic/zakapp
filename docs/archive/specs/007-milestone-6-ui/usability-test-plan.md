# Usability Test Plan - Milestone 6: UI/UX Enhancements

**Product**: ZakApp - Privacy-first Islamic Zakat Calculator  
**Test Date**: October 26, 2025  
**Test Type**: Remote Moderated Usability Testing  
**Duration**: 30 minutes per session  
**Sample Size**: 10 participants

## Executive Summary

This usability test plan evaluates the effectiveness, efficiency, and satisfaction of ZakApp's new UI/UX enhancements (Milestone 6). The study will measure task completion rates, time-on-task, error rates, and user satisfaction to ensure the interface meets our constitutional principle of "Professional & Modern User Experience."

### Success Criteria

- **Task Completion Rate**: ≥80%
- **User Satisfaction (SUS)**: ≥4.0/5.0
- **Critical Errors**: 0
- **Time-on-Task**: Within benchmark ranges

---

## Test Objectives

### Primary Objectives
1. Validate that new UX improvements increase task completion rates
2. Measure user satisfaction with visual feedback systems
3. Identify usability issues before production release
4. Verify accessibility features work for diverse users

### Secondary Objectives
1. Gather qualitative feedback on UI design
2. Test comprehension of Islamic terminology tooltips
3. Validate error message clarity and recovery guidance
4. Assess mobile usability improvements

---

## Participant Screening Criteria

### Target Participants
- **N = 10 participants**
- **Recruitment Method**: Social media, Islamic centers, online communities
- **Compensation**: $50 USD gift card per participant

### Inclusion Criteria

**Demographics**:
- Age: 18-65 years
- Familiarity with Islamic Zakat obligations (required for proper testing)
- Mix of tech proficiency levels (beginner to advanced)
- Geographic diversity (different time zones for remote testing)

**Technical Requirements**:
- Stable internet connection
- Desktop/laptop or mobile device
- Working microphone and camera
- Screen sharing capability

**Diversity Targets**:
- 50% mobile users, 50% desktop users
- 30% screen reader users or keyboard-only navigation
- 40% non-technical users (low digital literacy)
- 60% technical users (high digital literacy)
- Gender balance: 50/50 split
- Age distribution: 20% 18-25, 40% 26-40, 30% 41-55, 10% 56-65

### Exclusion Criteria
- Participants who worked on ZakApp development
- Professional UX designers/researchers (to avoid bias)
- Participants with no understanding of Zakat (cannot evaluate accuracy)

---

## Test Scenarios & Tasks

### Scenario 1: First-Time User Onboarding (8 minutes)

**Context**: "You've just heard about ZakApp and want to calculate your Zakat for the first time. You have approximately $15,000 in cash savings, $3,000 in gold jewelry, and $10,000 in investments."

**Tasks**:
1. **T1.1**: Create a new account and log in
   - **Success Criteria**: Account created and user logged in
   - **Benchmark Time**: 90 seconds
   - **Measured**: Completion rate, time, errors

2. **T1.2**: Add your first cash asset
   - **Success Criteria**: Cash asset saved with correct amount
   - **Benchmark Time**: 60 seconds
   - **Test**: Empty state guidance, form validation, help tooltips

3. **T1.3**: Add gold and investment assets
   - **Success Criteria**: All three assets added accurately
   - **Benchmark Time**: 120 seconds
   - **Test**: Multi-asset workflow, category selection

**Post-Task Questions**:
- How clear was the guidance for adding your first asset?
- Did you understand what information was needed for each field?
- Were the help tooltips useful?
- Rating (1-5): How easy was it to add assets?

---

### Scenario 2: Calculate Zakat (7 minutes)

**Context**: "Your assets are now in the system. You want to calculate how much Zakat you owe this year using the Standard methodology."

**Tasks**:
2. **T2.1**: Navigate to the Zakat calculator
   - **Success Criteria**: Calculator page loaded
   - **Benchmark Time**: 15 seconds
   - **Test**: Navigation clarity

3. **T2.2**: Calculate Zakat with Standard methodology
   - **Success Criteria**: Calculation completed successfully
   - **Benchmark Time**: 45 seconds
   - **Test**: Wizard progress indicators, form validation

4. **T2.3**: Understand the calculation result
   - **Success Criteria**: User can explain Zakat amount and why
   - **Benchmark Time**: 30 seconds
   - **Test**: Result clarity, methodology explanation tooltips

5. **T2.4**: View calculation history
   - **Success Criteria**: History page shows the calculation
   - **Benchmark Time**: 20 seconds
   - **Test**: Navigation, data visualization

**Post-Task Questions**:
- How confident are you in the calculation accuracy?
- Did you understand the methodology being used?
- Was the result presented clearly?
- Rating (1-5): How easy was it to calculate Zakat?

---

### Scenario 3: Error Recovery (5 minutes)

**Context**: "You realize you entered the wrong amount for your gold assets. It should be $5,000 instead of $3,000."

**Tasks**:
6. **T3.1**: Edit the gold asset value
   - **Success Criteria**: Asset updated with new value
   - **Benchmark Time**: 45 seconds
   - **Test**: Edit workflow, save confirmation

7. **T3.2**: Trigger a validation error by entering negative value
   - **Success Criteria**: Error message shown, user corrects error
   - **Benchmark Time**: 30 seconds
   - **Test**: Error message clarity, recovery guidance

8. **T3.3**: Delete an asset, then undo deletion within 5 seconds
   - **Success Criteria**: Asset deleted, then restored via undo
   - **Benchmark Time**: 20 seconds
   - **Test**: Undo functionality, toast notifications

**Post-Task Questions**:
- How easy was it to fix your mistake?
- Were the error messages helpful?
- Did you notice the undo option?
- Rating (1-5): How well does the app help you recover from errors?

---

### Scenario 4: Accessibility & Mobile (5 minutes)

**For Keyboard/Screen Reader Users**:

**Tasks**:
9. **T4.1**: Navigate the app using only keyboard
   - **Success Criteria**: All interactive elements accessible via keyboard
   - **Benchmark**: All elements reachable, focus visible
   - **Test**: Skip links, focus management, keyboard shortcuts

10. **T4.2**: Use screen reader to add an asset
    - **Success Criteria**: Screen reader announces all labels and states
    - **Benchmark**: No missing labels, clear form structure
    - **Test**: ARIA labels, semantic HTML

**For Mobile Users**:

**Tasks**:
11. **T4.3**: Add an asset on mobile device
    - **Success Criteria**: Asset added without zooming issues
    - **Benchmark**: 90 seconds
    - **Test**: Touch target sizes, mobile form usability

12. **T4.4**: Calculate Zakat on mobile
    - **Success Criteria**: Calculation completed successfully
    - **Benchmark**: 60 seconds
    - **Test**: Mobile wizard navigation, readability

**Post-Task Questions**:
- (Keyboard/SR users): Were there any parts you couldn't access?
- (Mobile users): Did you have trouble tapping any buttons?
- Rating (1-5): How accessible/mobile-friendly is the app?

---

### Scenario 5: Advanced Features (5 minutes)

**Context**: "You want to explore some of ZakApp's advanced features."

**Tasks**:
13. **T5.1**: Use the help tooltips to understand 'nisab'
    - **Success Criteria**: User can explain nisab
    - **Benchmark**: 45 seconds
    - **Test**: Tooltip discoverability, content clarity

14. **T5.2**: Compare calculation methodologies
    - **Success Criteria**: User understands difference between Standard and Hanafi
    - **Benchmark**: 90 seconds
    - **Test**: Methodology selector, comparison tooltips

15. **T5.3**: Export calculation results
    - **Success Criteria**: PDF or CSV downloaded
    - **Benchmark**: 30 seconds
    - **Test**: Export button discoverability, format selection

**Post-Task Questions**:
- Did you find the tooltips helpful for learning?
- Would you use the export feature?
- Rating (1-5): How useful are the educational features?

---

## Moderator Script

### Introduction (3 minutes)

"Thank you for participating in today's usability test for ZakApp, a privacy-first Islamic Zakat calculator. This session will take approximately 30 minutes.

**What We're Testing**: We're testing the interface, not you. There are no wrong answers. If you have difficulty with anything, it's because we need to improve the design, not because you made a mistake.

**Think Aloud Protocol**: Please verbalize your thoughts as you work through the tasks. Tell me what you're looking for, what you're trying to do, what you're thinking. This helps us understand your experience.

**Recording**: With your permission, I'll be recording this session. The recording is used only for analysis and will be kept confidential. Is that okay?

**Questions Before We Begin?**

Let's get started..."

### Task Administration

For each task:
1. Read the scenario and task aloud
2. Ask "Do you have any questions before you begin?"
3. Start timer when user begins
4. Observe silently, only intervene if stuck for >2 minutes
5. Take notes on:
   - Hesitations and confusion points
   - Error occurrences
   - Verbal feedback ("I expected...", "I wish...")
   - Non-verbal cues (facial expressions, sighs)
6. Stop timer when task completed or abandoned
7. Ask post-task questions
8. Mark completion status: Success / Partial / Fail

### Post-Test Questions (3 minutes)

1. **Overall Impression**: "What was your overall impression of ZakApp?"
2. **Best Feature**: "What did you like most about the interface?"
3. **Biggest Problem**: "What was the most frustrating part?"
4. **Improvements**: "If you could change one thing, what would it be?"
5. **Comparison**: "Have you used other Zakat calculators? How does this compare?"
6. **Likelihood to Use**: "How likely are you to use ZakApp? (1-5)"
7. **Recommendation**: "Would you recommend it to friends/family?"

---

## Post-Test Questionnaire

### System Usability Scale (SUS)

**Instructions**: For each statement, select the number that best reflects your agreement (1 = Strongly Disagree, 5 = Strongly Agree)

1. I think I would like to use ZakApp frequently
2. I found ZakApp unnecessarily complex
3. I thought ZakApp was easy to use
4. I think I would need technical support to use ZakApp
5. I found the various functions in ZakApp were well integrated
6. I thought there was too much inconsistency in ZakApp
7. I would imagine most people would learn to use ZakApp very quickly
8. I found ZakApp very cumbersome to use
9. I felt very confident using ZakApp
10. I needed to learn a lot of things before I could get going with ZakApp

**SUS Score Calculation**: [(Sum of odd items - 5) + (25 - sum of even items)] × 2.5

### Additional Questions

**Visual Design** (1-5):
- The interface was visually appealing
- Colors and contrast were comfortable
- Text was easy to read

**Functionality** (1-5):
- Features worked as I expected
- Error messages were clear and helpful
- The app responded quickly to my actions

**Learnability** (1-5):
- It was easy to get started
- Help was available when I needed it
- I felt I could use the app without training

**Islamic Accuracy** (1-5):
- I trust the Zakat calculations
- Islamic terminology was explained clearly
- Methodology options were appropriate

---

## Data Collection & Analysis

### Quantitative Metrics

**Task-Level Metrics**:
- Completion Rate: % of users who successfully complete each task
- Time-on-Task: Mean and median seconds per task
- Error Rate: # of errors per task
- Efficiency: Tasks completed per minute

**Overall Metrics**:
- System Usability Scale (SUS) score: Target ≥70 (above average)
- Task Success Rate: % of all tasks completed successfully
- User Satisfaction: Average rating across all post-task questions

### Qualitative Data

**Observation Notes**:
- Paths taken (successful and unsuccessful)
- Verbalized confusion or delight
- Feature discovery rate
- Common pain points

**Interview Themes**:
- Most mentioned positive features
- Most mentioned problems
- Suggested improvements
- Comparison to competitors

---

## Analysis Framework

### Severity Rating for Issues

**Critical (P0)**:
- Prevents task completion
- Causes data loss
- Violates Islamic principles
- **Action**: Fix before launch

**Major (P1)**:
- Causes significant frustration
- Requires workaround
- Affects >50% of users
- **Action**: Fix in next sprint

**Minor (P2)**:
- Causes minor inconvenience
- Affects <25% of users
- Has easy workaround
- **Action**: Add to backlog

**Enhancement (P3)**:
- Nice-to-have improvement
- Suggested by users
- **Action**: Consider for future releases

---

## Deliverables

1. **Usability Findings Report** (specs/007-milestone-6-ui/usability-findings.md)
   - Executive summary
   - Task completion rates
   - Time-on-task analysis
   - Error analysis
   - SUS score and interpretation
   - Issue severity matrix
   - Recommendations prioritized by severity

2. **Session Recordings** (confidential)
   - 10 individual session videos
   - Highlight reel of key findings (5 minutes)

3. **Raw Data** (spreadsheet)
   - Per-user task completion
   - Time-on-task data
   - SUS responses
   - Post-test questionnaire responses

4. **Action Items** (added to tasks.md)
   - P0 issues blocking launch
   - P1 issues for next sprint
   - P2/P3 issues for backlog

---

## Timeline

- **Week 1**: Recruit participants, finalize test materials
- **Week 2**: Conduct 10 usability sessions (2 per day)
- **Week 3**: Analyze data, create report, present findings
- **Total Duration**: 3 weeks

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Low recruitment | Over-recruit by 20%, offer higher incentive |
| Technical issues | Pre-test all screen sharing tools, have backup |
| Biased sample | Actively recruit diverse demographics |
| Incomplete data | Record sessions, take detailed notes |
| Participant no-shows | Confirm 24h before, have standby participants |

---

## Appendix: Test Environment

### Testing URL
- **Staging**: https://staging.zakapp.example.com
- **Version**: Milestone 6 (commit: 4c27670)

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

### Assistive Technology
- NVDA (Windows screen reader)
- JAWS (Windows screen reader)
- VoiceOver (macOS/iOS screen reader)

---

**Prepared by**: ZakApp Development Team  
**Approved by**: Product Owner  
**Status**: Ready for Execution
