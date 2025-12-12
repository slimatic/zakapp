<!--
Sync Impact Report:
Version change: 1.0.0 → 0.2.0 (reclassified as pre-release series)
Modified principles:
- Lovable UI/UX → Professional & Modern User Experience
- Privacy and Security First → Privacy & Security First (zero-trust expansion)
- Spec-Driven Development → Spec-Driven & Clear Development
- NEW: Quality & Performance
- NEW: Foundational Islamic Guidance emphasis
Removed principles:
- User-Centric Design (merged into Principle I)
- Simplicity & Clarity (covered by Principles I & III)
- Open and Extensible (governed through Principle IV)
Added sections:
- None (content revised)
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .github/copilot-instructions.md
- ✅ .specify/templates/spec-template.md (alignment verified)
- ✅ .specify/templates/tasks-template.md (alignment verified)
Follow-up TODOs:
- TODO(update-legacy-docs): Audit historical reports referencing retired principle names
-->

# zakapp Constitution

## Core Principles

### I. Professional & Modern User Experience
Deliver a polished, intuitive interface that removes friction from Zakat responsibilities. Every workflow MUST translate complex calculations into guided, confidence-inspiring steps reinforced by clear data visualizations and contextual education. All UI changes REQUIRE documented usability validation and WCAG 2.1 AA accessibility checks to confirm that professional quality standards are met without compromising Islamic compliance.

### II. Privacy & Security First (NON-NEGOTIABLE)
Operate on a zero-trust model that keeps users in full control of their financial data. The platform MUST remain self-hostable and Docker-native (via Docker Compose), encrypt all sensitive information at rest with AES-256, and prohibit transmission of financial data to third parties. Logging MUST exclude any sensitive values, and authentication MUST pair JWT access tokens with secure refresh rotation and continuous intrusion monitoring.

### III. Spec-Driven & Clear Development
Define what to build before deciding how to build it. Every change MUST start from a written, testable specification that references authoritative Islamic sources for complex rulings. Requirements MUST remain unambiguous, measurable, and traceable to acceptance criteria. No implementation work MAY proceed while open [NEEDS CLARIFICATION] markers exist.

### IV. Quality & Performance
Reliability, performance, and maintainability are mandatory outcomes. Calculation logic MUST retain >90% automated test coverage, page loads MUST stay below 2 seconds on reference hardware, and services MUST expose observability hooks for proactive monitoring. Regression budgets MUST be defined and honored before shipping.

### V. Foundational Islamic Guidance
All educational content, methodologies, and UX language MUST align with the Simple Zakat Guide video series and SimpleZakatGuide.com. Additional scholarly sources MAY be incorporated when properly cited and documented. When disagreements arise, the project MUST document scholarly consultation and the resulting chosen stance before implementation.

## Quality Standards

Performance and reliability requirements:
- >90% test coverage for all calculation logic
- <2s page load times across all interfaces
- Zero critical security vulnerabilities
- WCAG 2.1 AA accessibility compliance
- Accurate Zakat calculations per Islamic scholarly consensus
- Docker-native architecture for full portability

## Development Workflow

All contributions follow established processes:
- Feature development follows spec-driven approach with closed [NEEDS CLARIFICATION] items
- Pull requests require security and principle alignment review
- Islamic compliance validation for calculation changes
- Documentation updates accompany all feature additions
- Transparent issue tracking and feature request management

### Git Workflow and Milestone Commits

**Mandatory milestone commit strategy:**
- Commit changes after each completed milestone/phase
- Use logical, descriptive commit messages following conventional commit format
- Separate commits by functional area (e.g., specifications, dependencies, database, tests)
- Never commit sensitive data (encrypted files, databases, .env files, user data)
- Update .gitignore proactively to protect sensitive files
- Each milestone should represent a complete, reviewable unit of work

**Commit message format:**
```
<type>: <description>

<body explaining what was accomplished>
<specific features, counts, or completion status>
<security considerations if applicable>
```

**Required commit types for milestones:**
- `feat:` for new features and major milestone completions
- `docs:` for specification and documentation updates  
- `test:` for test suite additions (TDD phases)
- `refactor:` for code structure improvements
- `security:` for security-related changes
- `data:` for database schema and migration changes

## Documentation Requirements

Documentation standards:
- All architectural decisions documented in docs/ folder
- Zakat calculation methodology includes scholarly references
- User stories and acceptance criteria maintained
- API documentation kept current with implementation
- Security configuration guides for deployment

## Security Framework

Authentication, encryption, and privacy enforced at all stages:
- JWT-based authentication with refresh token rotation
- AES-256-CBC encryption for all user financial data
- Rate limiting and CORS protection on all endpoints
- Input validation and sanitization throughout
- Security configuration mandatory for all deployment scenarios
- Continuous monitoring for intrusion attempts and anomaly detection
- Regular security audits and vulnerability assessments

## Foundational Resources

zakapp is governed and inspired by the teachings and practical guidance of the Simple Zakat Guide, including its video series. All calculation methodologies, user education, and interface design should reflect the clarity, accuracy, and accessibility promoted by the following resources:
- **Simple Zakat Guide Video Series:**
    - [001 - Read Along and Explanation](https://www.youtube.com/watch?v=apMf80Osj5U)
    - [002 - Read Along and Explanation](https://www.youtube.com/watch?v=yJiajXDd9ss)
    - [003 - Read Along and Explanation](https://www.youtube.com/watch?v=RG3N5wX3AZM)
    - [004 - Read Along and Explanation](https://www.youtube.com/watch?v=x60-90TpjVk)
    - [005 - Read Along and Explanation](https://www.youtube.com/watch?v=6qX83hi1sAs)
    - [006 - Read Along and Explanation](https://www.youtube.com/watch?v=AFssV3NksEM)
    - [007 - Read Along and Explanation](https://www.youtube.com/watch?v=5EEbUKPDoc0)
    - [008 - Read Along and Explanation](https://www.youtube.com/watch?v=A6uC8SBahHA)
    - [009 - Read Along and Explanation](https://www.youtube.com/watch?v=fTNayQyCtgU)
    - [010 - Read Along and Explanation](https://www.youtube.com/watch?v=rV3vJVx_XmU)
    - [Full Series Playlist](https://youtube.com/playlist?list=PLXguldgkbZPffh6p4efOetXkTeJATAbcS&si=CoJ4JB5dLrJDgNS7)
- **SimpleZakatGuide.com**

All contributors, designers, and reviewers are encouraged to reference these resources when making decisions or implementing features. The Simple Zakat Guide and its materials form the foundational basis for zakapp’s methodologies and user education. However, zakapp is open to support from other practical guidance and teachings. Such sources may be incorporated—provided they are properly cited and documented—to enable modular and flexible interpretation of different Zakat calculation methodologies.

## Governance & Open Source Standards

**Open Source Commitment:**
This project is strictly open source and community-driven. We adhere to global open source best practices:
- **Licensing**: Released under the MIT License.
- **Versioning**: Follows Semantic Versioning (SemVer) 2.0.0.
- **Community Files**: Maintains up-to-date `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md`.
- **Transparency**: All architectural decisions, roadmaps, and issue tracking occur publicly.

**Code Ownership:**
Defined in `.github/CODEOWNERS`. All work follows the development plan and roadmap documentation. Constitution compliance verified in all pull requests and architectural decisions.

**Amendment Procedure:**
Constitutional changes require documentation of rationale, impact assessment, and migration plan for existing implementations. Changes affecting Islamic compliance require scholarly validation.
