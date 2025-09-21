# zakapp Project Structure

This document outlines the detailed project structure for the zakapp implementation.

## Root Directory Structure

```
zakapp/
├── docs/                           # Project documentation and specifications
│   ├── README.md
│   ├── problem.md
│   ├── solution.md
│   ├── principles.md
│   ├── security.md
│   ├── development-plan.md
│   ├── api-specification.md        # API documentation
│   ├── user-stories.md             # User story mapping
│   └── deployment-guide.md         # Deployment instructions
├── frontend/                       # React TypeScript frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── common/             # Generic components (Button, Input, etc.)
│   │   │   ├── forms/              # Form-specific components
│   │   │   ├── layout/             # Layout components (Header, Sidebar, etc.)
│   │   │   ├── charts/             # Data visualization components
│   │   │   └── index.ts            # Component exports
│   │   ├── pages/                  # Page components and routing
│   │   │   ├── auth/               # Authentication pages
│   │   │   ├── dashboard/          # Dashboard and overview
│   │   │   ├── assets/             # Asset management pages
│   │   │   ├── zakat/              # Zakat calculation pages
│   │   │   ├── profile/            # User profile pages
│   │   │   └── index.ts            # Page exports
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.ts          # Authentication hook
│   │   │   ├── useAssets.ts        # Asset management hook
│   │   │   ├── useZakat.ts         # Zakat calculation hook
│   │   │   └── index.ts            # Hook exports
│   │   ├── store/                  # Zustand state management
│   │   │   ├── authStore.ts        # Authentication state
│   │   │   ├── assetStore.ts       # Asset management state
│   │   │   ├── zakatStore.ts       # Zakat calculation state
│   │   │   └── index.ts            # Store exports
│   │   ├── services/               # API service layer
│   │   │   ├── api.ts              # Base API configuration
│   │   │   ├── authService.ts      # Authentication services
│   │   │   ├── assetService.ts     # Asset management services
│   │   │   ├── zakatService.ts     # Zakat calculation services
│   │   │   └── index.ts            # Service exports
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── auth.ts             # Authentication types
│   │   │   ├── assets.ts           # Asset-related types
│   │   │   ├── zakat.ts            # Zakat calculation types
│   │   │   ├── api.ts              # API response types
│   │   │   └── index.ts            # Type exports
│   │   ├── utils/                  # Utility functions
│   │   │   ├── encryption.ts       # Client-side encryption utilities
│   │   │   ├── validation.ts       # Form validation utilities
│   │   │   ├── formatting.ts       # Data formatting utilities
│   │   │   ├── dates.ts            # Date manipulation utilities
│   │   │   └── index.ts            # Utility exports
│   │   ├── styles/                 # Global styles and themes
│   │   │   ├── globals.css         # Global CSS
│   │   │   ├── components.css      # Component-specific styles
│   │   │   └── themes.ts           # Theme configuration
│   │   ├── App.tsx                 # Main application component
│   │   ├── index.tsx               # Application entry point
│   │   └── router.tsx              # Application routing configuration
│   ├── package.json                # Frontend dependencies and scripts
│   ├── tsconfig.json               # TypeScript configuration
│   ├── vite.config.ts              # Vite build configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── .eslintrc.js                # ESLint configuration
│   └── .prettierrc                 # Prettier configuration
├── backend/                        # Node.js TypeScript backend
│   ├── src/
│   │   ├── routes/                 # Express route handlers
│   │   │   ├── auth.ts             # Authentication routes
│   │   │   ├── users.ts            # User management routes
│   │   │   ├── assets.ts           # Asset management routes
│   │   │   ├── zakat.ts            # Zakat calculation routes
│   │   │   └── index.ts            # Route exports
│   │   ├── middleware/             # Express middleware
│   │   │   ├── auth.ts             # Authentication middleware
│   │   │   ├── validation.ts       # Request validation middleware
│   │   │   ├── encryption.ts       # Data encryption middleware
│   │   │   ├── errorHandler.ts     # Error handling middleware
│   │   │   └── index.ts            # Middleware exports
│   │   ├── services/               # Business logic services
│   │   │   ├── authService.ts      # Authentication business logic
│   │   │   ├── userService.ts      # User management logic
│   │   │   ├── assetService.ts     # Asset management logic
│   │   │   ├── zakatService.ts     # Zakat calculation logic
│   │   │   ├── fileService.ts      # File system operations
│   │   │   └── index.ts            # Service exports
│   │   ├── models/                 # Data models and schemas
│   │   │   ├── User.ts             # User data model
│   │   │   ├── Asset.ts            # Asset data model
│   │   │   ├── ZakatRecord.ts      # Zakat calculation model
│   │   │   ├── schemas.ts          # Validation schemas
│   │   │   └── index.ts            # Model exports
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── auth.ts             # Authentication types
│   │   │   ├── assets.ts           # Asset-related types
│   │   │   ├── zakat.ts            # Zakat calculation types
│   │   │   ├── database.ts         # Data storage types
│   │   │   └── index.ts            # Type exports
│   │   ├── utils/                  # Utility functions
│   │   │   ├── encryption.ts       # Server-side encryption utilities
│   │   │   ├── validation.ts       # Data validation utilities
│   │   │   ├── fileSystem.ts       # File system utilities
│   │   │   ├── auth.ts             # Authentication utilities
│   │   │   └── index.ts            # Utility exports
│   │   ├── config/                 # Configuration files
│   │   │   ├── database.ts         # Data storage configuration
│   │   │   ├── security.ts         # Security configuration
│   │   │   ├── server.ts           # Server configuration
│   │   │   └── index.ts            # Configuration exports
│   │   ├── app.ts                  # Express application setup
│   │   └── server.ts               # Server entry point
│   ├── data/                       # Data storage directory
│   │   ├── users/                  # User data files (encrypted)
│   │   └── backups/                # Data backups
│   ├── package.json                # Backend dependencies and scripts
│   ├── tsconfig.json               # TypeScript configuration
│   ├── .eslintrc.js                # ESLint configuration
│   └── .prettierrc                 # Prettier configuration
├── shared/                         # Shared types and utilities
│   ├── types/                      # Common type definitions
│   │   ├── api.ts                  # API contract types
│   │   ├── domain.ts               # Domain model types
│   │   └── index.ts                # Type exports
│   ├── utils/                      # Common utilities
│   │   ├── constants.ts            # Application constants
│   │   ├── validators.ts           # Shared validation functions
│   │   └── index.ts                # Utility exports
│   ├── package.json                # Shared package configuration
│   └── tsconfig.json               # TypeScript configuration
├── docker/                         # Docker configuration
│   ├── Dockerfile.frontend         # Frontend container
│   ├── Dockerfile.backend          # Backend container
│   ├── Dockerfile.production       # Production container
│   └── nginx.conf                  # Nginx configuration for production
├── scripts/                        # Development and deployment scripts
│   ├── setup.sh                    # Development environment setup
│   ├── build.sh                    # Build script
│   ├── test.sh                     # Test execution script
│   ├── deploy.sh                   # Deployment script
│   └── backup.sh                   # Data backup script
├── tests/                          # Test files
│   ├── e2e/                        # End-to-end tests
│   ├── integration/                # Integration tests
│   └── fixtures/                   # Test data fixtures
├── .github/                        # GitHub workflow configurations
│   └── workflows/                  # CI/CD workflows
│       ├── test.yml                # Test automation
│       ├── build.yml               # Build automation
│       └── security.yml            # Security scanning
├── docker-compose.yml              # Development environment
├── docker-compose.prod.yml         # Production environment
├── .gitignore                      # Git ignore configuration
├── .dockerignore                   # Docker ignore configuration
├── package.json                    # Root package configuration
└── README.md                       # Updated main README
```

## Data Storage Structure

```
backend/data/
├── users/
│   ├── {userId}/
│   │   ├── profile.json.enc        # Encrypted user profile
│   │   ├── assets.json.enc         # Encrypted asset data
│   │   ├── zakat-records.json.enc  # Encrypted Zakat calculation history
│   │   └── settings.json.enc       # Encrypted user preferences
│   └── index.json.enc              # Encrypted user index (username -> userId mapping)
└── backups/
    ├── daily/                      # Daily automated backups
    ├── weekly/                     # Weekly automated backups
    └── manual/                     # Manual backup storage
```

## Key Architecture Decisions

### Frontend Architecture
- **Single Page Application**: React with client-side routing
- **State Management**: Zustand for lightweight, type-safe state management
- **Styling**: Tailwind CSS for utility-first styling approach
- **Form Handling**: React Hook Form with Zod for validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **RESTful API**: Express.js with TypeScript for type safety
- **Authentication**: JWT-based stateless authentication
- **Data Storage**: Encrypted JSON files with structured organization
- **Middleware Pattern**: Modular middleware for cross-cutting concerns
- **Service Layer**: Separation of business logic from route handlers

### Security Architecture
- **Client-Side Encryption**: WebCrypto API for sensitive data encryption
- **Server-Side Encryption**: Node.js crypto for data at rest
- **Key Management**: User password-derived keys for data encryption
- **Authentication**: JWT tokens with secure HTTP-only cookies
- **Data Validation**: Comprehensive input validation on both client and server

### Development Architecture
- **Monorepo Structure**: Organized by feature and layer
- **Shared Types**: Common type definitions between frontend and backend
- **Hot Reloading**: Development environment with instant feedback
- **Testing Strategy**: Unit, integration, and end-to-end test coverage
- **Code Quality**: Automated linting, formatting, and type checking

This structure provides a solid foundation for implementing the zakapp solution while maintaining scalability, security, and developer productivity.