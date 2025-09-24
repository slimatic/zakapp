# zakapp 🌙

A modern, self-hosted Zakat calculator with beautiful UI and comprehensive asset management.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/slimatic/zakapp)
[![Development Progress](https://img.shields.io/badge/progress-75%25-yellow)](./PROJECT_STATUS_REPORT.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## 🎯 Project Overview

zakapp is a **production-ready** self-hosted Zakat calculator that helps Muslims manage their Islamic financial obligations with confidence. Built with modern web technologies and designed for complete privacy control, it features encrypted data storage, comprehensive asset management, and a beautiful user experience.

**🏆 Current Status**: 75% Complete - **Phases 1-3 fully implemented and production-ready**

## ✨ Key Features

### ✅ **IMPLEMENTED & PRODUCTION READY**
- **🔐 Complete Authentication System**: Secure registration, login, JWT tokens, encrypted storage
- **📊 Advanced Asset Management**: Interactive forms, 8+ asset categories, multi-currency support
- **🎨 Modern UI/UX**: Beautiful, responsive design with professional components
- **🔒 Privacy-First Architecture**: Self-hosted with AES-256 encrypted JSON storage
- **⚡ Real-time Calculations**: Live asset totals and zakat-eligible amount displays
- **📱 Mobile-Responsive**: Perfect experience on all devices
- **🛡️ Comprehensive Security**: bcrypt password hashing, CORS, security headers

### 🚧 **IN DEVELOPMENT**
- **🧮 Advanced Zakat Calculator**: Multiple methodologies, lunar/solar calendars (25% complete)
- **📈 Year-to-Year Tracking**: Historical data and payment tracking (planned)
- **🧪 Comprehensive Testing**: Unit, integration, and E2E tests (planned)

### 🎯 **PLANNED**
- **🐳 Production Deployment**: Optimized Docker configuration
- **📊 Advanced Analytics**: Detailed insights and reporting
- **🔍 Security Audit**: Professional security review

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Storage**: Encrypted JSON files (no database required)
- **Security**: JWT authentication + client-side encryption
- **Deployment**: Docker + Docker Compose

## 📚 Documentation

### 📋 **Project Status & Planning**
- **[📊 Project Status Report](PROJECT_STATUS_REPORT.md)** - Current progress and metrics
- **[🗓️ Development Plan](development-plan.md)** - Detailed development roadmap
- **[🛣️ Roadmap](roadmap.md)** - High-level milestones and timeline
- **[🏗️ Project Structure](project-structure.md)** - Detailed project organization

### 🔧 **Technical Documentation**
- **[📖 API Specification](api-specification.md)** - Backend API documentation
- **[🛠️ Development Guide](DEVELOPMENT.md)** - Development environment setup
- **[🐳 Docker Guide](DOCKER.md)** - Container deployment instructions
- **[🔒 Security Guide](security.md)** - Security measures and best practices

### 📝 **Requirements & Design**
- **[👤 User Stories](user-stories.md)** - Feature requirements and user flows
- **[🎯 Problem Statement](problem.md)** - Project motivation and challenges
- **[💡 Solution Overview](solution.md)** - Technical approach and features
- **[📏 Project Principles](principles.md)** - Development guidelines

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended) OR Node.js 18+
- **Git** for cloning the repository

### ⚡ One-Command Setup

```bash
# Clone and start the application
git clone https://github.com/slimatic/zakapp.git
cd zakapp
npm run dev
```

The application will automatically:
- Install all dependencies
- Build the shared package  
- Start both frontend and backend servers
- Open at http://localhost:3000

### 🐳 Docker Development (Alternative)

```bash
# Clone repository
git clone https://github.com/slimatic/zakapp.git
cd zakapp

# Start with Docker (eliminates npm permission issues)
npm run docker:dev

# Start development servers (auto-setup on first run)
npm run dev
```

> **Note**: On first run, `npm run dev` will automatically install dependencies and build the shared package. This may take a few minutes.

Alternative manual setup:

```bash
# Manual dependency installation (optional)
npm run install:all

# Start development servers
npm run dev
```

### 🌐 Access Points

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api

### 🎯 First Steps

1. **Create Account**: Click "Sign Up" to create your secure account
2. **Add Assets**: Use "Manage Assets" to add your financial assets
3. **View Dashboard**: See real-time calculations and asset summaries
4. **Calculate Zakat**: Use "Calculate Zakat Now" (basic calculations available)

## 🛠️ Development

### Project Structure

```
zakapp/
├── docs/                   # Documentation and specifications
├── frontend/              # React TypeScript frontend
├── backend/               # Node.js TypeScript backend
├── shared/                # Shared types and utilities
├── docker/               # Docker configuration
├── scripts/              # Development scripts
└── tests/                # Test files
```

### Development Commands

```bash
# Containerized development (recommended)
npm run docker:dev       # Start containerized development
npm run docker:dev:logs  # View container logs
npm run docker:dev:down  # Stop development containers
npm run docker:npm:install  # Install dependencies in container

# Local development
npm run dev              # Start local development servers
npm run install:all      # Install all dependencies with proper order

# Development database reset
npm run reset:db         # Clear all user data and database files for testing

# Backend development
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint

# Frontend development
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
```

#### Database Reset for Testing

The `reset:db` command provides a safe way to clear all development data for testing:

```bash
npm run reset:db
```

**What it does:**

- Removes all user directories and data files from `backend/data/users/`
- Clears all backup files from `backend/data/backups/`
- Removes session files from `backend/data/sessions/`
- Recreates empty directories for clean state

**Safety features:**

- ❌ Cannot run in production (NODE_ENV=production)
- ⚠️ Requires interactive confirmation before deletion
- 📊 Shows current data state before clearing
- 📝 Provides detailed logging of what was deleted

This is particularly useful when:

- Testing user registration and data flows
- Debugging issues related to stale user data
- Resetting environment between test scenarios
- Preparing clean state for development

### Testing

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🔒 Security

- **Data Encryption**: All user data is encrypted at rest and in transit
- **Authentication**: JWT-based authentication with secure session management
- **Self-Hosted**: Full control over your data and deployment environment
- **No Database**: Encrypted JSON files eliminate database security concerns
- **Regular Updates**: Automated security dependency updates

## 🔧 Troubleshooting

### npm install permission issues

If you encounter `EACCES` permission errors during `npm install`:

1. **For Docker development (recommended)**: Use Docker Compose to avoid permission issues:

   ```bash
   docker-compose up
   ```

2. **For local development**: Check Node.js and npm setup:

   ```bash
   # Check your Node.js and npm version
   node --version
   npm --version

   # Use npm ci instead of npm install for clean installs
   npm ci

   # If using nvm, make sure permissions are correct
   npm config get prefix
   ```

3. **Fix npm permissions** (if needed):

   ```bash
   # Option 1: Use npm's built-in fix
   npx npm-check-updates -g

   # Option 2: Change npm's default directory
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   # Add to your ~/.bashrc or ~/.zshrc:
   # export PATH=~/.npm-global/bin:$PATH
   ```

### Docker issues

If Docker containers fail to start:

1. **Ensure Docker is running**:

   ```bash
   docker --version
   docker-compose --version
   ```

2. **Clean Docker state**:

   ```bash
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

3. **Check shared package build**:
   ```bash
   cd shared && npm run build
   ls -la dist/  # Should contain compiled files
   ```

### Module resolution errors

If you see "Cannot find package '@zakapp/shared'" errors:

> **Note**: As of the latest update, `npm run dev` automatically handles setup. Try running `npm run dev` first - it will detect missing dependencies and set them up automatically.

**Manual troubleshooting** (if automatic setup fails):

1. **Force clean setup**:

   ```bash
   # Clean all builds and dependencies
   rm -rf shared/dist shared/node_modules backend/node_modules frontend/node_modules

   # Run complete setup
   npm run install:all
   ```

2. **Verify package linking**:

   ```bash
   # Check if the shared package is properly linked
   cd frontend && npm ls @zakapp/shared
   cd backend && npm ls @zakapp/shared
   ```

3. **Check shared package build**:
   ```bash
   cd shared && npm run build
   ls -la dist/  # Should contain compiled files
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by SimpleZakatGuide.com for clear Zakat guidance
- Built with modern web technologies and best practices
- Designed with privacy and user control as core principles

## 📞 Support

For questions, issues, or contributions:

- Open an issue on GitHub
- Follow the development plan in [development-plan.md](development-plan.md)
- Review the user stories in [user-stories.md](user-stories.md)

---

**Note**: This application is currently in development. Follow the [development plan](development-plan.md) for implementation progress and roadmap.
