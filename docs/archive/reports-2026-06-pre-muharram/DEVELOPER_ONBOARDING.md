# zakapp Developer Onboarding Guide

Welcome to zakapp development! This guide will get you up and running quickly with our modern Zakat calculator application.

## 🎯 Project Overview

zakapp is a **75% complete** self-hosted Zakat calculator built with:
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript  
- **Storage**: Encrypted JSON files (no database)
- **Architecture**: Mono-repo with shared packages

**Current Status**: Phases 1-3 complete (Foundation, Authentication, Asset Management)

## ⚡ Quick Setup (2 minutes)

### Prerequisites
- Node.js 18+ OR Docker
- Git

### One-Command Start
```bash
git clone https://github.com/slimatic/zakapp.git
cd zakapp
npm run dev
```

That's it! The application will:
- Auto-install all dependencies  
- Build the shared package
- Start both servers
- Open at http://localhost:3000

## 🏗️ Project Architecture

### Mono-repo Structure
```
zakapp/
├── frontend/          # React app (Port 3000)
├── backend/           # Express API (Port 3001)  
├── shared/            # Common types & utilities
├── docs/              # Documentation
└── scripts/           # Development tools
```

### Key Technologies
- **TypeScript**: 100% TypeScript for type safety
- **React**: Modern hooks-based components
- **Express**: RESTful API with middleware
- **JWT**: Secure authentication
- **Encryption**: AES-256 for data security
- **Tailwind**: Utility-first styling

## 🚀 Development Workflow

### Daily Development
```bash
# Start development servers
npm run dev

# Work on specific areas
cd frontend && npm run dev  # Frontend only
cd backend && npm run dev   # Backend only
```

### Code Quality
```bash
npm run lint          # Check code quality
npm run lint:fix      # Auto-fix issues
npm run format        # Format with Prettier
npm run type-check    # TypeScript validation
```

### Building
```bash
npm run build         # Build everything
npm run build:frontend # Build frontend only
npm run build:backend  # Build backend only
```

## 📂 Key Directories

### Frontend (`/frontend/src/`)
- `components/ui/` - Reusable UI components
- `components/auth/` - Authentication components
- `hooks/` - Custom React hooks
- `services/` - API communication
- `styles/` - Global styles and Tailwind config

### Backend (`/backend/src/`)  
- `routes/` - API endpoints (auth, assets, users)
- `services/` - Business logic (userService, assetService)
- `middleware/` - Express middleware (auth, validation)
- `utils/` - Utilities (encryption, validation, filesystem)

### Shared (`/shared/src/`)
- `types.ts` - TypeScript type definitions
- `constants.ts` - App constants (currencies, rates)
- `schemas.ts` - Validation schemas

## 🔧 Development Environment

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Auto Rename Tag

### Environment Setup
The app auto-detects and sets up the environment on first run. No manual configuration needed!

### Development URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

## 🎨 UI/UX Guidelines

### Design System
- **Colors**: Islamic green theme with neutral grays
- **Typography**: Modern, readable font stack
- **Components**: Consistent button styles, forms, cards
- **Icons**: Lucide React icon library
- **Responsive**: Mobile-first approach

### Component Standards
- Use TypeScript interfaces for props
- Include proper error handling
- Add loading states for async operations
- Follow existing naming conventions

## 🔒 Security Considerations

### Data Protection
- All user data encrypted at rest (AES-256)
- JWT tokens for authentication
- bcrypt for password hashing
- Input validation with Zod schemas

### Best Practices
- Never log sensitive data
- Validate all user inputs
- Use TypeScript for type safety
- Follow principle of least privilege

## 🧪 Testing (Currently Broken - Needs Fix!)

```bash
# Run tests (currently failing)
npm run test

# Fix test infrastructure first:
# 1. Module resolution issues
# 2. Jest configuration  
# 3. Mock setup
```

**Priority**: Fix test infrastructure for code quality

## 🌟 What's Implemented (Production Ready!)

### ✅ Phase 1: Foundation
- Complete mono-repo setup
- TypeScript configuration
- Development environment
- Build systems

### ✅ Phase 2: Authentication  
- User registration/login
- JWT token system
- Password security
- Encrypted storage
- Beautiful auth UI

### ✅ Phase 3: Asset Management
- Asset CRUD operations
- 8+ asset categories
- Multi-currency support
- Interactive forms
- Real-time calculations
- Professional dashboard

## 🚧 What's In Progress

### Phase 4: Zakat Calculations (25% Complete)
- Basic calculations work
- Need advanced methodologies
- Calendar system integration
- Historical calculations

## 🎯 Current Development Priorities

1. **Fix Testing Infrastructure** (Critical)
2. **Complete Zakat Calculations** (Phase 4)
3. **Add Calendar System** (Lunar/Solar)
4. **Historical Tracking** (Phase 5)

## 🤝 Contributing Guidelines

### Code Style
- Use TypeScript strict mode
- Follow existing patterns
- Add proper error handling
- Include JSDoc for complex functions
- Test your changes locally

### Git Workflow
```bash
git checkout -b feature/amazing-feature
# Make changes
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
# Create pull request
```

### Pull Request Requirements
- Describe changes clearly
- Include screenshots for UI changes  
- Ensure build passes
- Add tests when possible
- Update documentation if needed

## 🆘 Common Issues & Solutions

### Build Failures
```bash
# Clean everything and rebuild
rm -rf node_modules */node_modules
npm run install:all
```

### Module Resolution Errors
```bash
# Rebuild shared package
cd shared && npm run build
```

### Permission Issues (Use Docker)
```bash
npm run docker:dev
```

### Port Conflicts
- Frontend: Change port in vite.config.ts
- Backend: Set PORT environment variable

## 📚 Learning Resources

### Project Documentation
- [Project Status Report](PROJECT_STATUS_REPORT.md) - Current progress
- [Development Plan](development-plan.md) - Detailed roadmap
- [API Specification](api-specification.md) - Backend API docs

### Technology Learning
- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **React**: [React Documentation](https://react.dev/)
- **Tailwind CSS**: [Tailwind Docs](https://tailwindcss.com/docs)
- **Express**: [Express Guide](https://expressjs.com/en/guide/routing.html)

## 🎉 Welcome to the Team!

You're joining a project that's **75% complete** with excellent foundations. The codebase is modern, well-architected, and ready for your contributions!

### Your First Steps
1. ✅ Get the app running locally
2. ✅ Explore the codebase structure
3. ✅ Create a test account and try the features
4. ✅ Look at current issues in GitHub
5. ✅ Pick a task and start contributing!

### Questions or Stuck?
- Check existing documentation first
- Look at similar implementations in the codebase
- Create an issue for bugs or unclear requirements
- Follow the established patterns and conventions

**Happy coding!** 🚀