# Data Model: Profile Settings Page

**Feature**: 010-profile-settings-page  
**Date**: 2025-12-05  
**Status**: Complete

---

## Entity Definitions

### User (existing entity)

The core user identity entity, already defined in `shared/src/types.ts`.

```typescript
interface User {
  userId: string;          // Unique identifier (UUID)
  username: string;        // Editable, must be unique
  email: string;           // Editable, must be valid email format
  createdAt: string;       // ISO 8601 timestamp
  lastLogin?: string;      // ISO 8601 timestamp, optional
  preferences: UserPreferences;
}
```

**Validation Rules**:
- `username`: Required, unique across all users, alphanumeric with underscores
- `email`: Required, valid email format (RFC 5322)
- `createdAt`: Immutable, set on registration

**State Transitions**:
- Created → Active (on registration)
- Active → Deleted (on account deletion - all data removed)

---

### UserPreferences (existing entity)

User-configurable settings that affect Zakat calculations and UI.

```typescript
interface UserPreferences {
  currency: string;        // Default currency for display
  language: string;        // UI language preference
  zakatMethod: string;     // Calculation methodology
  calendarType: 'lunar' | 'solar';  // Hawl calculation basis
}
```

**Allowed Values**:

| Field | Allowed Values |
|-------|----------------|
| `currency` | USD, EUR, GBP, SAR, AED, EGP, PKR, INR, MYR, IDR |
| `language` | en (English), ar (Arabic), ur (Urdu), id (Indonesian), ms (Malay) |
| `zakatMethod` | standard, hanafi, shafi, custom |
| `calendarType` | lunar (354 days), solar (365 days) |

**Defaults**:
- `currency`: USD
- `language`: en
- `zakatMethod`: standard
- `calendarType`: lunar

---

### PrivacySettings (logical entity)

Privacy preferences displayed in the Privacy & Data tab. Not stored as separate entity - embedded in user settings.

```typescript
interface PrivacySettings {
  dataEncryption: boolean;      // Always true (AES-256) - read-only display
  localDataStorage: boolean;    // Always true - read-only display
  anonymousUsageStats: boolean; // User-controllable toggle
}
```

**Validation Rules**:
- `dataEncryption`: Read-only, always displays "Enabled"
- `localDataStorage`: Read-only, always displays "Active"
- `anonymousUsageStats`: User-modifiable, defaults to false

---

### PasswordChangeRequest (transient)

Request payload for password change operations.

```typescript
interface PasswordChangeRequest {
  currentPassword: string;  // Current password for verification
  newPassword: string;      // New password (min 8 characters)
}
```

**Validation Rules**:
- `currentPassword`: Required, must match stored hash
- `newPassword`: Required, minimum 8 characters

**Frontend Addition**:
```typescript
interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;  // Must match newPassword
}
```

---

### ExportRequest (transient)

Data export request and status tracking.

```typescript
interface ExportRequest {
  id: string;               // Unique request identifier
  status: 'processing' | 'completed' | 'failed';
  format: 'json';           // Only JSON supported currently
  progress?: number;        // 0-100 percentage
  downloadUrl?: string;     // Available when status = 'completed'
  createdAt: string;        // ISO 8601 timestamp
  completedAt?: string;     // ISO 8601 timestamp
  expiresAt?: string;       // ISO 8601 timestamp (24 hours from completion)
}
```

**State Transitions**:
- Created (processing) → Completed → Expired (after 24h)
- Created (processing) → Failed

---

### AuditLogEntry (implicit)

Security audit trail for user actions.

```typescript
interface AuditLogEntry {
  id: string;
  action: 'login' | 'password_change' | 'profile_update' | 'asset_created' | 'account_deleted';
  timestamp: string;        // ISO 8601 timestamp
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}
```

---

## Database Schema (Prisma)

The underlying Prisma schema supports these entities:

```prisma
model User {
  id            String    @id @default(uuid())
  username      String    @unique
  email         String    @unique
  password      String    // Bcrypt hashed
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLogin     DateTime?
  
  // Preferences stored as encrypted JSON
  preferences   String?   // AES-256 encrypted
  
  // Relations
  assets        Asset[]
  calculations  ZakatCalculation[]
  payments      ZakatPayment[]
}
```

---

## Relationships

```
User (1) ─────────── (1) UserPreferences (embedded)
  │
  ├──── (1:N) ─────── Asset
  ├──── (1:N) ─────── ZakatCalculation
  └──── (1:N) ─────── ZakatPayment
```

---

## FR Coverage

| Entity | Functional Requirements |
|--------|------------------------|
| User | FR-001, FR-002, FR-003, FR-030 |
| UserPreferences | FR-004, FR-005, FR-006, FR-007 |
| PrivacySettings | FR-018, FR-019, FR-020 |
| PasswordChangeRequest | FR-010, FR-011, FR-012, FR-013, FR-014 |
| ExportRequest | FR-021, FR-022, FR-023 |
| (Deletion) | FR-024, FR-025, FR-026, FR-027, FR-028, FR-029 |

---

*Data model documented as part of /plan command execution*
