# ZakApp Development Quickstart Guide

## Overview
This guide will help you set up the development environment and begin implementing the ZakApp privacy-first Zakat calculator.

## Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher 
- **Git**: Latest version
- **Code Editor**: VS Code recommended

### Development Tools
```bash
# Install development dependencies globally
npm install -g typescript tsx nodemon

# Optional but recommended
npm install -g @types/node eslint prettier
```

## Project Setup

### 1. Repository Structure
```
zakapp/
├── server/           # Backend Express.js application
├── client/           # Frontend React application  
├── shared/           # Shared types and utilities
├── specs/            # Project specifications
├── .specify/         # Project memory and constitution
└── docs/             # Additional documentation
```

### 2. Environment Setup

Create environment files:

**server/.env.development**
```bash
# Database
DATABASE_URL="file:./data/zakapp.db"

# Authentication  
JWT_SECRET="your-super-secure-jwt-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption (AES-256-CBC)
ENCRYPTION_KEY="your-32-character-encryption-key-here"
ENCRYPTION_IV="your-16-character-iv-here"

# API Keys
GOLD_PRICE_API_KEY="your-precious-metals-api-key"

# Server Configuration
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3001"

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=100    # requests per window

# Logging
LOG_LEVEL="debug"
```

**client/.env.development**
```bash
# Backend API
REACT_APP_API_URL="http://localhost:3000/api"

# Application
REACT_APP_NAME="ZakApp"
REACT_APP_VERSION="1.0.0"
REACT_APP_ENVIRONMENT="development"
```

### 3. Initial Installation

```bash
# Clone and setup
cd zakapp

# Install server dependencies
cd server
npm init -y
npm install express cors helmet morgan bcryptjs jsonwebtoken
npm install sqlite3 better-sqlite3 prisma @prisma/client
npm install crypto-js axios date-fns hijri-date
npm install --save-dev @types/express @types/cors @types/bcryptjs
npm install --save-dev @types/jsonwebtoken typescript ts-node nodemon

# Install client dependencies  
cd ../client
npx create-react-app . --template typescript
npm install @tanstack/react-query axios react-router-dom
npm install @headlessui/react @heroicons/react tailwindcss
npm install date-fns react-hook-form zod @hookform/resolvers
npm install --save-dev @types/crypto-js

# Return to root
cd ..
```

## Database Setup

### 1. Initialize Prisma

```bash
cd server
npx prisma init
```

### 2. Database Schema

Create **server/prisma/schema.prisma**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String   @unique  
  password  String   // bcrypt hash
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Encrypted user preferences
  preferences String? // JSON blob, encrypted
  
  // Relations
  assets        Asset[]
  calculations  ZakatCalculation[]
  payments      ZakatPayment[]
  snapshots     AssetSnapshot[]
  
  @@map("users")
}

model Asset {
  id          String   @id @default(cuid())
  userId      String
  category    String   // cash, gold, silver, crypto, etc.
  name        String
  value       Float
  currency    String   @default("USD")
  metadata    String?  // Encrypted JSON for sensitive details
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("assets")
}

// Add other models based on data-model.md...
```

### 3. Generate Database

```bash
# Generate Prisma client
npx prisma generate

# Create and migrate database
npx prisma migrate dev --name init
```

## Backend Development

### 1. Server Structure

Create the following structure in `server/`:
```
src/
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── services/        # Business logic
├── utils/          # Helper functions
├── types/          # TypeScript definitions
├── routes/         # API route definitions
└── app.ts          # Express application setup
```

### 2. Key Implementation Files

**server/src/app.ts**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
// Import other route files...

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
// Add other routes...

export default app;
```

**server/src/utils/encryption.ts**
```typescript
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

export const encrypt = (data: any): string => {
  const jsonString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  return encrypted;
};

export const decrypt = (encryptedData: string): any => {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
  return JSON.parse(jsonString);
};
```

## Frontend Development

### 1. Client Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── services/       # API service layer
├── utils/          # Helper functions
├── types/          # TypeScript definitions
├── contexts/       # React contexts
└── App.tsx         # Main application component
```

### 2. API Service Layer

**client/src/services/api.ts**
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle token refresh logic here
    return Promise.reject(error);
  }
);
```

## Development Workflow

### 1. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev  # Uses nodemon to watch for changes
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start    # Starts React dev server on port 3001
```

### 2. Development Commands

```bash
# Backend
npm run dev          # Start with hot reload
npm run build        # Build for production
npm run test         # Run test suite
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed development data

# Frontend  
npm start            # Development server
npm run build        # Production build
npm run test         # Run tests
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

## Implementation Phases

### Phase 1: Authentication & User Management
1. Implement user registration/login endpoints
2. JWT token management with refresh tokens
3. Password reset functionality
4. Basic user profile management

### Phase 2: Asset Management
1. CRUD operations for assets
2. Encrypted storage of sensitive data
3. Asset categorization and validation
4. Currency conversion support

### Phase 3: Zakat Calculation Engine
1. Multiple methodology support
2. Nisab threshold calculation
3. Real-time precious metal prices
4. Educational content delivery

### Phase 4: Data Management & Export
1. Asset snapshots for yearly tracking
2. Payment recording and history
3. Data export functionality
4. Privacy-compliant data management

## Testing Strategy

### Backend Testing
```bash
# Install testing dependencies
npm install --save-dev jest supertest @types/jest @types/supertest

# Test structure
__tests__/
├── unit/           # Unit tests for services/utils
├── integration/    # API endpoint tests
└── fixtures/       # Test data
```

### Frontend Testing
```bash
# Built into Create React App
npm test            # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

## Security Checklist

- [ ] Environment variables properly configured
- [ ] Database encryption implemented
- [ ] JWT tokens with proper expiration
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Helmet security headers enabled
- [ ] Password hashing with bcrypt
- [ ] Sensitive data encryption
- [ ] SQL injection protection (Prisma ORM)

## Deployment Preparation

### Production Environment
- Set up production database
- Configure environment variables
- Set up reverse proxy (nginx)
- Enable HTTPS/SSL certificates
- Configure logging and monitoring
- Set up automated backups

### Build Process
```bash
# Backend production build
cd server
npm run build
npm run start

# Frontend production build  
cd client
npm run build
# Deploy built files to web server
```

## Next Steps

1. **Review the API Contracts**: Study the detailed API specifications in `contracts/` directory
2. **Implement Core Services**: Start with authentication and user management
3. **Set Up Database Models**: Implement the complete Prisma schema
4. **Build Core Components**: Create reusable UI components
5. **Integrate Encryption**: Implement client-side and server-side encryption
6. **Add Zakat Logic**: Implement the calculation algorithms
7. **Testing**: Write comprehensive tests for all functionality
8. **Security Audit**: Review and test all security measures

## Resources

- [API Contracts Documentation](./contracts/)
- [Data Model Specification](./data-model.md)
- [Research and Technology Decisions](./research.md)
- [Project Constitution](./.specify/memory/constitution.md)
- [Complete Feature Specification](./spec.md)

## Support

For questions or issues during development:
1. Review the comprehensive specifications in this directory
2. Check the constitutional principles for decision guidance
3. Refer to the research document for technology rationale
4. Consult the API contracts for implementation details