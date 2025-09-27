<!--
Sync Impact Report:
Version change: [CONSTITUTION_VERSION] → 1.0.0 (Initial constitution creation)
Modified principles: 
- Added 6 core principles: Lovable UI/UX, User-Centric Design, Privacy and Security First, Spec-Driven Development, Simplicity & Clarity, Open and Extensible
Added sections:
- Governance framework
- Contribution & Processes
- Documentation requirements
- Security standards
Templates requiring updates: ⚠ pending review of .specify/templates/* files
Follow-up TODOs: Review and align all template files with new constitution principles
-->

# zakapp Constitution

## Core Principles

### I. Lovable UI/UX
Prioritize a delightful, modern, and intuitive experience. All user interface decisions must contribute to user satisfaction and ease of use. Design decisions are validated through user feedback and usability testing. The application must feel approachable and welcoming while maintaining professional Islamic compliance standards.

### II. User-Centric Design
All decisions favor user needs and simplicity. Feature development begins with understanding user requirements and pain points. Complex financial calculations are presented in digestible, guided steps. User workflows are optimized for efficiency while maintaining accuracy and Islamic compliance.

### III. Privacy and Security First (NON-NEGOTIABLE)
Data security and self-hosting are mandatory. All user data must be encrypted at rest using AES-256-CBC. Authentication uses JWT tokens with secure session management. No third-party data sharing without explicit user consent. Self-hosting capabilities are maintained to ensure complete user control over sensitive financial data.

### IV. Spec-Driven Development
All work is guided by repository specifications. Features are documented before implementation. API contracts are defined and validated. Changes require specification updates before code changes. Clear acceptance criteria drive development priorities.

### V. Simplicity & Clarity
Zakat calculation is made clear, simple, and well-explained. Complex Islamic finance rules are presented with educational context. Calculation methodologies reference authoritative sources. User guidance includes explanations of Islamic principles behind calculations.

### VI. Open and Extensible
Architecture is ready for future features and integrations. Modular design supports plugin development. APIs enable third-party integrations. Code structure facilitates community contributions while maintaining security standards.

## Quality Standards

Performance and reliability requirements:
- >90% test coverage for all calculation logic
- <2s page load times across all interfaces
- Zero critical security vulnerabilities
- WCAG 2.1 AA accessibility compliance
- Accurate Zakat calculations per Islamic scholarly consensus

## Development Workflow

All contributions follow established processes:
- Feature development follows spec-driven approach
- Pull requests require security and principle alignment review
- Islamic compliance validation for calculation changes
- Documentation updates accompany all feature additions
- Transparent issue tracking and feature request management

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
- Regular security audits and vulnerability assessments

## Governance

This repository abides by the MIT License. Code ownership defined in .github/CODEOWNERS. All work follows the development plan and roadmap documentation. Constitution compliance verified in all pull requests and architectural decisions.

Amendment procedure: Constitutional changes require documentation of rationale, impact assessment, and migration plan for existing implementations. Changes affecting Islamic compliance require scholarly validation.

**Version**: 1.0.0 | **Ratified**: 2025-09-27 | **Last Amended**: 2025-09-27