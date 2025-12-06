# ZakApp Documentation Hub 📚

Welcome to the comprehensive documentation for ZakApp - a privacy-first Islamic Zakat calculator.

## 🗂️ Documentation Structure

### 📖 Getting Started

**New to ZakApp?** Start here:

1. **[Main README](../README.md)** - Project overview, quick start, and installation
2. **[Developer Onboarding](reports/DEVELOPER_ONBOARDING.md)** - Complete guide for new developers
3. **[Development Setup](reports/DEVELOPMENT_SETUP.md)** - Detailed environment setup instructions
4. **[Development Guide](reports/DEVELOPMENT.md)** - Development workflow and best practices

### 🏗️ Architecture & Design

**Understanding the system:**

- **[Project Structure](project-structure.md)** - Repository organization and directory layout
- **[API Specification](api/api-specification.md)** - Complete REST API documentation
- **[Database Schema](../server/prisma/schema.prisma)** - Prisma database model
- **[User Stories](user-stories.md)** - Feature requirements and user flows
- **[Project Principles](principles.md)** - Development guidelines and philosophy

### 🚀 Deployment & Operations

**Running ZakApp in production:**

- **[Deployment Guide](deployment-guide.md)** - General deployment instructions
- **[Production Setup Guide](guides/PHASE2_PRODUCTION_SETUP_GUIDE.md)** - Production deployment automation
- **[Staging Deployment Guide](guides/STAGING_DEPLOYMENT_GUIDE.md)** - Staging environment setup
- **[Docker Guide](reports/DOCKER.md)** - Container deployment instructions
- **[CI/CD Setup](guides/CI-CD-SETUP.md)** - Continuous integration/deployment configuration
- **[Cloudflare Tunnel Setup](guides/CLOUDFLARE_TUNNEL_SETUP.md)** - Secure tunnel configuration
- **[Cloudflare Tunnel Quick Start](guides/CLOUDFLARE_TUNNEL_QUICK.md)** - Quick Cloudflare setup

### 🔧 Configuration & Troubleshooting

**Configuration and problem-solving:**

- **[Port Configuration Guide](guides/PORT_CONFIGURATION_GUIDE.md)** - Configure custom ports, fix "Failed to fetch" errors
- **[Database Management](reports/DATABASE_MANAGEMENT.md)** - Database cleanup, reset, backup, and troubleshooting
- **[Database Portability Guide](guides/DATABASE_PORTABILITY_GUIDE.md)** - Database migration and portability
- **[Manual Testing Guide](guides/MANUAL_TESTING_GUIDE.md)** - Manual testing procedures

### 🔐 Security

**Security best practices:**

- **[Security Guide](security.md)** - Security measures, authentication, encryption, and best practices

### 📊 Project Status & Planning

**Current state and roadmap:**

- **[Final Implementation Report](reports/FINAL_IMPLEMENTATION_REPORT.md)** - Complete 500+ line report on all 53 features
- **[Development Plan](development-plan.md)** - Detailed development roadmap
- **[Roadmap](roadmap.md)** - High-level milestones and timeline
- **[Tasks](tasks.md)** - Current task tracking
- **[Changelog](../CHANGELOG.md)** - Version history and changes

### 📚 API Documentation

**Detailed API references:**

- **[Zakat API](api/zakat.md)** - Zakat calculation endpoints
- **[Calculations API](api/calculations.md)** - Calculation history endpoints
- **[Calendar API](api/calendar.md)** - Hijri calendar and date conversion
- **[Tracking API](api/tracking.md)** - Snapshot and tracking features

### 🕌 Islamic Zakat Research

**Islamic compliance and methodologies:**

- **[Methodology Guide](methodology-guide.md)** - Detailed explanation of calculation methodologies
- **[Zakat Methodologies Research](zakat-calculation-methodologies-research.md)** - Research on different calculation approaches
- **[Zakat Implementation Summary](zakat-methodologies-implementation-summary.md)** - Implementation details
- **[Research Bibliography](zakat-research-bibliography.md)** - References and sources

### 🧪 Testing

**Quality assurance:**

- **[Manual Testing Guide](guides/MANUAL_TESTING_GUIDE.md)** - Manual testing procedures
- **[Test Suite](../server/tests/)** - 175+ automated tests
- **[Performance Tests](../performance-tests/)** - API load testing results

### 📦 Historical Documentation

**Archive of completed work:**

- **[Documentation Archive Index](archive/ARCHIVE_INDEX.md)** - Comprehensive index of archived documentation
- **[Completion Reports](archive/completion-reports/)** - Feature and phase completion reports
- **[Fix Reports](archive/fix-reports/)** - Bug fixes and issue resolutions
- **[Phase Reports](archive/phase-reports/)** - Development phase tracking
- **[Task Reports](archive/task-reports/)** - T-numbered task completion reports
- **[Technical Reports](archive/technical-reports/)** - TypeScript migration, Docker, database reports
- **[Session Reports](archive/session-reports/)** - Development session summaries

### 🔍 Code Quality & Analysis

**Repository maintenance:**

- **[Code Analysis Findings](../CODE_ANALYSIS_FINDINGS.md)** - Comprehensive code analysis
- **[Cleanup Summary](../CLEANUP_SUMMARY.md)** - Documentation cleanup tracking
- **[Before/After Visualization](../BEFORE_AFTER_VISUALIZATION.md)** - Visual impact of cleanup

---

## 🎯 Quick Links by Role

### For New Contributors
1. Start with [Main README](../README.md)
2. Follow [Developer Onboarding](../DEVELOPER_ONBOARDING.md)
3. Set up environment: [Development Setup](../DEVELOPMENT_SETUP.md)
4. Learn workflow: [Development Guide](../DEVELOPMENT.md)
5. Understand structure: [Project Structure](../project-structure.md)

### For Backend Developers
1. Review [API Specification](../api-specification.md)
2. Study [Database Schema](../server/prisma/schema.prisma)
3. Check [Security Guide](../security.md)
4. Understand [Islamic Zakat methodologies](methodology-guide.md)
5. Run [Tests](../server/tests/)

### For Frontend Developers
1. See [Component Library](../client/src/components/)
2. Review [API Specification](../api-specification.md)
3. Check [User Stories](../user-stories.md)
4. Study Islamic UI requirements in [Principles](../principles.md)

### For DevOps/SRE
1. Read [Deployment Guide](../deployment-guide.md)
2. Review [Production Setup](guides/PHASE2_PRODUCTION_SETUP_GUIDE.md)
3. Configure [CI/CD](guides/CI-CD-SETUP.md)
4. Set up [Cloudflare Tunnels](guides/CLOUDFLARE_TUNNEL_SETUP.md)
5. Learn [Database Management](../DATABASE_MANAGEMENT.md)

### For QA/Testing
1. Follow [Manual Testing Guide](guides/MANUAL_TESTING_GUIDE.md)
2. Run automated [Test Suite](../server/tests/)
3. Review [Performance Tests](../performance-tests/)
4. Check [User Stories](../user-stories.md) for acceptance criteria

---

## 📝 Contributing to Documentation

When adding or updating documentation:

1. **Keep it organized** - Use the structure above
2. **Link related docs** - Add navigation between related documents
3. **Update this index** - Add new docs to the appropriate section
4. **Archive old docs** - Move historical docs to [archive/](archive/)
5. **Use clear titles** - Make it easy to find information
6. **Add examples** - Include code samples and use cases

---

## 🆘 Need Help?

- **Issues**: [GitHub Issues](https://github.com/slimatic/zakapp/issues)
- **Questions**: Review [FAQ sections](../README.md#-troubleshooting) in main README
- **Security**: See [Security Policy](../security.md)

---

**Last Updated**: 2025-10-13  
**Maintained By**: ZakApp Contributors
