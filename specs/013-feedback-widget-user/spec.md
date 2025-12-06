# Feature Specification: User Feedback Widget

**Feature Branch**: `013-feedback-widget-user`  
**Created**: 2025-12-06  
**Status**: Draft  
**Input**: User description: "i want to create a feedback bubble that can be clicked like a chat window anywhere on the website. it should be descrete but easy to access to i can use it to collect feedback from by users, i will be using it to create something like a webhook form which i will use to do things like create issues in github. for now the focus is just to be able to effortless provide a way for my beta test and site evaluaters to provide honest feedback and report issues in the easiest possible way. this feature should be somewhat embeddedable so i can turn it off or on when needed on the frontend."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit Feedback via Floating Widget (Priority: P1)

A beta tester visits the ZakApp website and notices an issue with the Zakat calculation. They click the discrete feedback bubble in the corner, type their feedback, and submit it instantly without leaving the page or interrupting their workflow.

**Why this priority**: This is the core MVP - the ability to collect feedback effortlessly. Without this, the feature has no value. This delivers immediate value to both users (easy reporting) and the team (collecting feedback).

**Independent Test**: Can be fully tested by opening the widget, typing feedback, and submitting. Delivers immediate value by capturing user input even without webhook integration.

**Acceptance Scenarios**:

1. **Given** user is on any page of ZakApp, **When** they click the feedback bubble, **Then** a chat-like widget opens with a feedback form
2. **Given** the feedback widget is open, **When** user types feedback and clicks "Submit", **Then** the feedback is captured and user sees a success message
3. **Given** user submits feedback, **When** submission is successful, **Then** the widget closes automatically and shows a brief "Thank you" notification
4. **Given** the feedback widget is open, **When** user clicks outside the widget or presses ESC, **Then** the widget closes without submitting
5. **Given** user clicks the feedback bubble, **When** the widget opens, **Then** the bubble icon changes to indicate active state (e.g., "X" to close)

---

### User Story 2 - Categorize Feedback Type (Priority: P2)

A site evaluator wants to report a bug they found. They open the feedback widget and select "Bug Report" from a category dropdown before describing the issue. This helps the development team prioritize and route feedback appropriately.

**Why this priority**: Categorization improves the quality and actionability of feedback. While not essential for MVP, it significantly increases the value of collected feedback by making it easier to triage.

**Independent Test**: Can be tested by selecting different feedback categories and verifying they are captured with submissions. Delivers value by enabling better feedback organization even without full webhook setup.

**Acceptance Scenarios**:

1. **Given** user opens the feedback widget, **When** they view the form, **Then** they see a category selector with options: "General Feedback", "Bug Report", "Feature Request", "Question"
2. **Given** user selects a feedback category, **When** they submit feedback, **Then** the category is included with the submission
3. **Given** user hasn't selected a category, **When** they try to submit, **Then** "General Feedback" is used as default (no blocking validation)

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]


### User Story 3 - Include User Context Automatically (Priority: P2)

When a logged-in user submits feedback, their email and current page URL are automatically included with the submission. This allows the team to follow up with users and understand the context of their feedback without requiring extra manual input.

**Why this priority**: Context makes feedback actionable. Knowing who submitted feedback and where they were on the site is crucial for following up and reproducing issues. This is P2 because basic feedback collection works without it, but it significantly increases feedback quality.

**Independent Test**: Can be tested by submitting feedback while logged in and verifying user email and page URL are captured. Delivers value by making feedback immediately actionable.

**Acceptance Scenarios**:

1. **Given** user is logged in and submits feedback, **When** feedback is submitted, **Then** their email address is automatically included
2. **Given** user submits feedback from any page, **When** feedback is submitted, **Then** the current page URL/route is automatically included
3. **Given** user is not logged in and submits feedback, **When** feedback is submitted, **Then** feedback is still accepted with "anonymous" as the user identifier
4. **Given** user submits feedback, **When** context is captured, **Then** browser information (browser type, viewport size) is included for bug reports

---

### User Story 4 - Toggle Widget Visibility (Priority: P3)

The development team wants to enable the feedback widget only for beta testers and disable it for production users. An admin can toggle the widget on/off via an environment variable or configuration setting without code changes.

**Why this priority**: Control over visibility is important for production readiness but not essential for initial beta testing. The feature can be manually enabled/disabled during development. This is P3 because it's more about deployment flexibility than core functionality.

**Independent Test**: Can be tested by changing configuration and verifying widget visibility changes. Delivers value by enabling controlled rollout without code deployments.

**Acceptance Scenarios**:

1. **Given** feedback widget is enabled in configuration, **When** user visits any page, **Then** the feedback bubble is visible
2. **Given** feedback widget is disabled in configuration, **When** user visits any page, **Then** the feedback bubble is not rendered at all
3. **Given** widget visibility changes, **When** page is refreshed, **Then** the new visibility state takes effect immediately
4. **Given** widget is disabled mid-session, **When** user tries to interact with it, **Then** it gracefully disappears without errors

---

### User Story 5 - Prepare for Webhook Integration (Priority: P3)

The feedback submission handler is designed to accept a webhook URL configuration, preparing for future integration with external services like GitHub Issues. For now, feedback is stored locally or logged, but the architecture supports easy webhook addition.

**Why this priority**: This is infrastructure preparation rather than user-facing functionality. While important for future extensibility, the feature works perfectly fine without webhooks initially. This is P3 because it's about future-proofing, not immediate value.

**Independent Test**: Can be tested by submitting feedback and verifying it's logged/stored in a format that can be easily sent to a webhook. Delivers value by reducing future refactoring work.

**Acceptance Scenarios**:

1. **Given** feedback is submitted, **When** no webhook is configured, **Then** feedback is logged to console or stored locally
2. **Given** feedback submission structure is defined, **When** inspected, **Then** it matches common webhook payload formats (e.g., JSON with timestamp, user, message, metadata)
3. **Given** a webhook URL is configured (future), **When** feedback is submitted, **Then** the system is ready to POST the feedback payload to that URL

---

### Edge Cases

- What happens when user submits empty feedback? (Allow but warn, or block with gentle validation message)
- What happens when network request fails? (Show user-friendly error, offer to retry, potentially store locally for later retry)
- What happens when user rapidly clicks the feedback bubble? (Debounce clicks to prevent multiple widget instances)
- What happens when user has JavaScript disabled? (Widget gracefully doesn't render, no console errors)
- What happens when widget is open and user navigates to another page? (Widget closes automatically on navigation)
- What happens when feedback content contains special characters or very long text? (Validate and sanitize, set reasonable character limits)
- What happens if same user submits feedback multiple times quickly? (Allow it, no artificial throttling for beta testing)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a discrete floating feedback bubble on all pages when feature is enabled
- **FR-002**: System MUST open a chat-like widget interface when user clicks the feedback bubble
- **FR-003**: System MUST allow users to enter free-form text feedback (minimum 10 characters, maximum 2000 characters)
- **FR-004**: System MUST capture feedback submissions with timestamp, user identifier (email if logged in, "anonymous" if not), and current page URL
- **FR-005**: System MUST provide immediate visual confirmation when feedback is submitted successfully
- **FR-006**: System MUST allow users to close the widget without submitting (ESC key or click outside)
- **FR-007**: System MUST support feedback categorization with predefined options: "General Feedback", "Bug Report", "Feature Request", "Question"
- **FR-008**: System MUST automatically include browser context (user agent, viewport size) with bug report submissions
- **FR-009**: System MUST be configurable to enable/disable widget visibility via environment variable or config setting
- **FR-010**: System MUST handle submission failures gracefully with user-friendly error messages and retry option
- **FR-011**: System MUST prevent multiple simultaneous widget instances if user clicks bubble rapidly
- **FR-012**: System MUST log feedback submissions in a structured format compatible with future webhook integration
- **FR-013**: Widget MUST be responsive and functional on mobile devices (minimum viewport: 320px)
- **FR-014**: Widget MUST not block or interfere with main application functionality
- **FR-015**: System MUST sanitize user input to prevent XSS or injection attacks

### Key Entities

- **Feedback Submission**: Represents a single piece of user feedback
  - Attributes: id, timestamp, userId/email, userAgent, pageUrl, category, message, browserInfo
  - Relationships: Associated with User (if authenticated), associated with Page/Route
  
- **Feedback Category**: Represents the type of feedback
  - Attributes: value (enum: "general", "bug", "feature", "question"), label (display text)
  
- **Widget Configuration**: Represents widget settings
  - Attributes: enabled (boolean), webhookUrl (optional string), position (corner placement)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Beta testers can submit feedback in under 30 seconds from clicking the bubble to successful submission
- **SC-002**: Feedback widget loads and renders in under 500ms without blocking page load
- **SC-003**: 90% of beta testers successfully submit at least one piece of feedback without errors
- **SC-004**: Widget is visible and functional on all major browsers (Chrome, Firefox, Safari, Edge) and mobile devices
- **SC-005**: Zero console errors or warnings related to feedback widget in production builds
- **SC-006**: Feedback submissions contain all required context (user, page, timestamp, category) 100% of the time
- **SC-007**: Widget can be toggled on/off via configuration without requiring code deployment or restart
- **SC-008**: No user reports of feedback widget interfering with main application functionality during beta testing

## Technical Considerations *(optional guidance)*

### Frontend Implementation Notes

- Consider using a React context or state management for widget open/close state
- Position the bubble using fixed positioning (e.g., bottom-right: 20px from edges)
- Use CSS animations for smooth open/close transitions
- Consider using a modal/dialog pattern for accessibility (focus management, ESC handling)
- Store feedback temporarily in component state, clear on successful submission
- Use React portals if widget needs to render outside normal component hierarchy

### Styling Guidelines

- Widget should match ZakApp's existing design system (colors, fonts, border radius)
- Bubble should be ~60px × 60px, circular, with feedback icon (e.g., message or comment icon)
- Widget panel should be ~400px wide × 500px tall (adjust for mobile)
- Use subtle drop shadow for depth
- Consider z-index layering (bubble: 1000, widget panel: 1001, overlay: 999)
- Smooth transitions: 200-300ms ease-in-out

### Data Storage

- For MVP: Log to console or store in browser localStorage temporarily
- Structure feedback as JSON for easy webhook integration later
- Include metadata: userAgent, timestamp (ISO 8601), pageUrl, category, message
- Prepare for backend endpoint: `POST /api/feedback` (future implementation)

### Configuration

- Use environment variable: `REACT_APP_FEEDBACK_ENABLED=true/false`
- Consider feature flag pattern for more granular control
- Default to enabled in development, disabled in production initially

### Security

- Sanitize all user input before displaying or storing
- Rate limit submissions if needed (client-side: max 5 per minute)
- Validate message length client-side and backend (10-2000 chars)
- Do not expose sensitive user data in feedback payloads

### Future Webhook Integration

- Design payload structure to match GitHub Issues API or generic webhook format
- Consider retry logic with exponential backoff for failed webhook calls
- Plan for webhook URL configuration in backend environment variables
- Consider queue system for reliable delivery (future enhancement)

## Non-Goals *(optional)*

- **Not in scope**: Building a full customer support ticketing system
- **Not in scope**: Real-time chat or live support functionality
- **Not in scope**: Admin dashboard to view collected feedback (future feature)
- **Not in scope**: Email notifications when feedback is submitted
- **Not in scope**: Attachment uploads (screenshots, files) - consider for future
- **Not in scope**: Feedback analytics or reporting dashboard
- **Not in scope**: Multi-language support for widget (use app's existing i18n)

## Open Questions *(if any)*

1. Should anonymous users be able to provide an optional email address in the widget? (Lean: No for MVP, keep it simple)
2. Should the widget show a character counter while typing? (Lean: Yes, simple UX improvement)
3. Should we include a "Take Screenshot" button for bug reports? (Lean: No for MVP, consider P4 future enhancement)
4. Should feedback submissions be persisted to database or just logged? (Lean: Logged for MVP, database in future when webhook integration is added)
5. Should we show a privacy notice in the widget about data collection? (Lean: Yes, brief one-liner about feedback being used to improve the app)

## Dependencies *(if any)*

- Requires access to user authentication state (to capture email if logged in)
- Requires access to React Router location (to capture current page URL)
- May depend on existing UI components from design system (Button, Input, Select components)
- No external API dependencies for MVP (future: webhook endpoint)

## Islamic Compliance Notes *(ZakApp specific)*

- Ensure feedback widget does not obstruct Zakat calculations or interfere with Islamic guidance content
- Position widget carefully to avoid covering important Islamic information
- Consider hiding widget during Zakat calculation flow to minimize distractions
- Respect user privacy - feedback should not expose sensitive financial data
- Ensure feedback submission aligns with Islamic principles of good advice (Nasiha) and constructive communication

