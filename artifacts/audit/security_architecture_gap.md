# Security & Architecture Gap Analysis

## 1. Executive Summary
The current "ZakApp" architecture is a traditional **Model-View-Controller (MVC)** web application relying on a Node.js/Express backend and a Prisma/SQLite database. This architecture **fundamentally violates** the "Project Ikhlas" Local-First / Privacy-First mandate. Sensitive user data (assets, financial records) is transmitted to the server, processed in memory, and stored in a server-side database.

## 2. Critical Violations ("Privacy-First" Mandate)

### 2.1 Server-Side Data Storage (Major Violation)
- **Current State**: All asset data is stored in `server/prisma/schema.prisma` (`Asset` model) and persisted in a server-side SQLite database.
- **Target State**: Data must reside **only** on the user's device (IndexedDB/RxDB). The server should effectively be "stateless" or nonexistent for core logic.
- **Location**: `server/prisma/schema.prisma`, `server/src/services/ZakatCalculationService.ts`

### 2.2 Server-Side Logic & Calculations
- **Current State**: Zakat calculations occur on the server (`ZakatCalculationService.ts`). This requires unencrypted value transmission.
- **Target State**: All calculation logic must be pure TypeScript functions running in the browser (Client Components).
- **Location**: `server/src/services/ZakatCalculationService.ts`

### 2.3 Authentication & Session Management
- **Current State**: Uses JWT (Access + Refresh tokens) with server-side session tracking (`UserSession` model).
- **Target State**: Local-First auth (e.g., password used to derive encryption key). No "login" to a remote server needed for core function. Syncing is optional.
- **Location**: `server/src/controllers/AuthController.ts`

## 3. Security Vulnerabilities

### 3.1 Hardcoded Secrets (Critical)
- **Finding**: Hardcoded fallback keys for encryption and JWT signing.
- **Location**: 
    - `server/src/utils/jwt.ts`: `const JWT_SECRET = process.env.JWT_SECRET || '[REDACTED]';`
    - `server/src/services/ZakatCalculationService.ts`: `const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '[REDACTED]';`
- **Risk**: If this code is deployed or open-sourced without change, user data is trivially decryptable.

### 3.2 Insecure Encryption Implementation
- **Finding**: Using `EncryptionService` (likely `crypto` module) on the server.
- **Risk**: Key management on the server is the single point of failure.
- **Target**: Client-side `window.crypto.subtle` (Web Crypto API) with keys that **never** leave the client.

## 4. Architectural Recommendations
1.  **Migrate to Client-Side DB**: Replace Prisma/SQLite with RxDB + sqlite-wasm.
2.  **Move Logic to Client**: Port `ZakatCalculationService` to `src/core/calculations/`.
3.  **Eliminate Backend Dependencies**: Remove Express server for the core app; it should be a Static SPA/PWA.
4.  **Implement E2EE**: User password -> KDF -> Encryption Key (in memory only).
