# Data Model: Tracking & Analytics System

**Feature**: 006-milestone-5  
**Date**: October 26, 2025  
**Status**: ✅ Implemented (Retrospective Documentation)

---

## Overview

This document describes the data model for the Tracking & Analytics System, including database schema, relationships, encryption approach, and validation rules. Created retrospectively from the actual Prisma implementation.

---

## Entity Relationship Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1:N
       │
       ├──────────────────┬──────────────────┬──────────────────┐
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Payment    │    │  Reminder   │    │   Zakat     │    │  Analytics  │
│   Record    │    │   Event     │    │ Calculation │    │  (computed) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Core Entities

### 1. PaymentRecord

**Purpose**: Store individual Zakat payment records with encryption

**Implementation**: `server/src/models/payment.ts` (Task T014)

#### Schema Definition

```prisma
model PaymentRecord {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Financial data (encrypted)
  amount            Decimal  @db.Decimal(10, 2)
  encryptedAmount   String   // AES-256 encrypted
  
  // Payment details
  date              DateTime
  recipient         String   // Encrypted
  recipientCategory String?  // Optional categorization
  paymentMethod     String?  // e.g., "Cash", "Bank Transfer", "Online"
  notes             String?  // Encrypted, optional
  
  // Association with calculations
  calculationId     String?
  calculation       ZakatCalculation? @relation(fields: [calculationId], references: [id])
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId, date])
  @@index([userId, createdAt])
  @@map("payment_records")
}
```

#### Field Specifications

| Field | Type | Encrypted | Required | Validation | Purpose |
|-------|------|-----------|----------|------------|---------|
| `id` | String (CUID) | No | Yes | Auto-generated | Unique identifier |
| `userId` | String | No | Yes | Valid user ID | Owner reference |
| `amount` | Decimal(10,2) | **Yes** | Yes | > 0 | Payment amount |
| `encryptedAmount` | String | N/A | Yes | AES-256 | Encrypted storage |
| `date` | DateTime | No | Yes | Valid date, not future | Payment date |
| `recipient` | String | **Yes** | Yes | 2-100 chars | Recipient name/org |
| `recipientCategory` | String | No | No | Enum or free text | Optional category |
| `paymentMethod` | String | No | No | 2-50 chars | How paid |
| `notes` | Text | **Yes** | No | Max 1000 chars | Additional details |
| `calculationId` | String | No | No | Valid calc ID | Link to Zakat calc |
| `createdAt` | DateTime | No | Yes | Auto | Record creation |
| `updatedAt` | DateTime | No | Yes | Auto | Last modified |

#### Encryption Strategy

**Fields Encrypted**:
- `amount` → `encryptedAmount`
- `recipient` → Stored encrypted
- `notes` → Stored encrypted

**Encryption Method**: AES-256-CBC
- Key derivation: User-specific key from master encryption key
- IV: Randomly generated per field
- Storage format: `IV:EncryptedData` (base64)

**Implementation** (Task T003):
```typescript
// server/src/utils/encryption.ts
encryptField(data: string, userKey: string): string
decryptField(encrypted: string, userKey: string): string
```

#### Validation Rules

**Zod Schema** (Task T004):
```typescript
const PaymentRecordSchema = z.object({
  amount: z.number().positive(),
  date: z.date().max(new Date()),
  recipient: z.string().min(2).max(100),
  recipientCategory: z.string().optional(),
  paymentMethod: z.string().min(2).max(50).optional(),
  notes: z.string().max(1000).optional(),
  calculationId: z.string().cuid().optional()
});
```

#### Indexes

```sql
-- Performance optimization for common queries
CREATE INDEX idx_payment_user_date ON payment_records(userId, date DESC);
CREATE INDEX idx_payment_user_created ON payment_records(userId, createdAt DESC);
```

**Rationale**:
- `userId + date`: Fast chronological payment history retrieval
- `userId + createdAt`: Recent payments queries

---

### 2. ReminderEvent

**Purpose**: Store reminder notifications for upcoming Zakat due dates

**Implementation**: `server/src/models/reminder.ts` (Task T015)

#### Schema Definition

```prisma
model ReminderEvent {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Reminder timing
  dueDate       DateTime
  reminderDate  DateTime  // Calculated: dueDate - 30 days
  
  // Reminder content
  title         String
  message       String
  type          String    @default("ZAKAT_DUE")  // Future: other reminder types
  
  // Status tracking
  isRead        Boolean   @default(false)
  isDismissed   Boolean   @default(false)
  readAt        DateTime?
  dismissedAt   DateTime?
  
  // Metadata
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId, reminderDate])
  @@index([userId, isRead, isDismissed])
  @@map("reminder_events")
}
```

#### Field Specifications

| Field | Type | Required | Default | Validation | Purpose |
|-------|------|----------|---------|------------|---------|
| `id` | String (CUID) | Yes | Auto | - | Unique identifier |
| `userId` | String | Yes | - | Valid user ID | Owner reference |
| `dueDate` | DateTime | Yes | - | Future date | When Zakat is due |
| `reminderDate` | DateTime | Yes | Calculated | Before dueDate | When to show reminder |
| `title` | String | Yes | - | 5-100 chars | Reminder title |
| `message` | String | Yes | - | 10-500 chars | Reminder content |
| `type` | String | Yes | "ZAKAT_DUE" | Enum | Reminder category |
| `isRead` | Boolean | Yes | false | - | User has seen it |
| `isDismissed` | Boolean | Yes | false | - | User dismissed it |
| `readAt` | DateTime | No | null | - | When marked read |
| `dismissedAt` | DateTime | No | null | - | When dismissed |
| `createdAt` | DateTime | Yes | Auto | - | Record creation |
| `updatedAt` | DateTime | Yes | Auto | - | Last modified |

#### Validation Rules

**Zod Schema** (Task T004):
```typescript
const ReminderEventSchema = z.object({
  dueDate: z.date().min(new Date()),
  title: z.string().min(5).max(100),
  message: z.string().min(10).max(500),
  type: z.enum(['ZAKAT_DUE', 'GOAL_REMINDER', 'CUSTOM']).default('ZAKAT_DUE')
});
```

#### Business Logic

**Reminder Calculation** (Task T018):
```typescript
// Default: 30 days before due date
reminderDate = dueDate - 30 days

// User preference override (future):
reminderDate = dueDate - user.reminderDaysBefore
```

**No Encryption Needed**: Reminders contain no sensitive financial data

#### Indexes

```sql
CREATE INDEX idx_reminder_user_date ON reminder_events(userId, reminderDate);
CREATE INDEX idx_reminder_status ON reminder_events(userId, isRead, isDismissed);
```

**Rationale**:
- `userId + reminderDate`: Fetch upcoming reminders
- `userId + status`: Filter unread/active reminders

---

### 3. ZakatCalculation (Existing, Extended)

**Purpose**: Link payments to their originating Zakat calculations

**Status**: Pre-existing entity, extended with payment relationship

#### Schema Extension

```prisma
model ZakatCalculation {
  // ... existing fields ...
  
  // NEW: Relationship to payments
  payments      PaymentRecord[]
  
  @@map("zakat_calculations")
}
```

**Impact**: Enables tracking which Zakat calculation led to which payments

---

## Computed Entities (Not Stored)

### 4. AnalyticsData

**Purpose**: Aggregated statistics for analytics dashboard

**Status**: Computed on-demand, not persisted

**Rationale**:
- ✅ Always fresh data (no cache staleness)
- ✅ Simple for single-user application
- ✅ Fast enough with proper indexing (<500ms)

#### Analytics Structure

```typescript
interface AnalyticsData {
  // Summary metrics
  totalPayments: number;
  totalAmount: Decimal;
  
  // Trends
  monthlyTrends: MonthlyTrend[];
  yearlyComparison: YearlyComparison[];
  
  // Breakdown
  categoryBreakdown: CategoryBreakdown[];
  
  // Time period
  startDate: Date;
  endDate: Date;
  userId: string;
}

interface MonthlyTrend {
  month: number;       // 1-12
  year: number;
  paymentCount: number;
  totalAmount: Decimal;
}

interface YearlyComparison {
  year: number;
  totalAmount: Decimal;
  paymentCount: number;
  growthPercentage?: number;  // vs previous year
}

interface CategoryBreakdown {
  category: string;
  paymentCount: number;
  totalAmount: Decimal;
  percentage: number;  // of total
}
```

#### Calculation Queries

**Implementation**: `server/src/services/analytics-service.ts` (Task T017)

```typescript
// Monthly trends
const monthlyTrends = await prisma.paymentRecord.groupBy({
  by: ['date'],
  where: { userId, date: { gte: startDate, lte: endDate } },
  _sum: { amount: true },
  _count: true
});

// Category breakdown
const categoryBreakdown = await prisma.paymentRecord.groupBy({
  by: ['recipientCategory'],
  where: { userId },
  _sum: { amount: true },
  _count: true
});

// Year-over-year
const yearlyData = await prisma.paymentRecord.groupBy({
  by: ['date'],
  where: { userId },
  _sum: { amount: true },
  _count: true
});
```

---

## Data Relationships

### User → PaymentRecord (1:N)

- One user can have multiple payment records
- Cascade delete: Deleting user removes all payments
- Privacy: Users only see their own payments

### User → ReminderEvent (1:N)

- One user can have multiple reminders
- Cascade delete: Deleting user removes all reminders
- Active reminders checked on login/dashboard load

### ZakatCalculation → PaymentRecord (1:N)

- One calculation can be linked to multiple payments
- Optional: Payments can exist without calculation link
- Orphan handling: Deleting calculation doesn't delete payments

---

## Migration Strategy

### Database Migrations

**Implementation**: Task T002

#### Migration 001: Add Payment Tracking

```sql
-- Create payment_records table
CREATE TABLE payment_records (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  encryptedAmount TEXT NOT NULL,
  date DATETIME NOT NULL,
  recipient TEXT NOT NULL,
  recipientCategory TEXT,
  paymentMethod TEXT,
  notes TEXT,
  calculationId TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (calculationId) REFERENCES zakat_calculations(id)
);

-- Create indexes
CREATE INDEX idx_payment_user_date ON payment_records(userId, date DESC);
CREATE INDEX idx_payment_user_created ON payment_records(userId, createdAt DESC);
```

#### Migration 002: Add Reminder System

```sql
-- Create reminder_events table
CREATE TABLE reminder_events (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  dueDate DATETIME NOT NULL,
  reminderDate DATETIME NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'ZAKAT_DUE',
  isRead BOOLEAN DEFAULT 0,
  isDismissed BOOLEAN DEFAULT 0,
  readAt DATETIME,
  dismissedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_reminder_user_date ON reminder_events(userId, reminderDate);
CREATE INDEX idx_reminder_status ON reminder_events(userId, isRead, isDismissed);
```

#### Prisma Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name add_payment_tracking

# Apply to production
npx prisma migrate deploy

# Reset development database
npx prisma migrate reset
```

---

## Data Validation

### Input Validation Layers

1. **Frontend Validation** (Client-side):
   - Immediate user feedback
   - Basic format checks
   - Not trusted for security

2. **API Validation** (Middleware):
   - Zod schema validation
   - Type coercion and sanitization
   - Task T032

3. **Database Constraints**:
   - NOT NULL constraints
   - Foreign key integrity
   - Check constraints (where supported)

### Validation Examples

**Payment Creation**:
```typescript
// Zod schema
const createPaymentSchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  date: z.coerce.date().max(new Date()),
  recipient: z.string().trim().min(2).max(100),
  recipientCategory: z.string().trim().max(50).optional(),
  paymentMethod: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(1000).optional(),
  calculationId: z.string().cuid().optional()
});

// Middleware usage
app.post('/api/payments', 
  validateRequest(createPaymentSchema),
  createPaymentController
);
```

**Reminder Creation**:
```typescript
const createReminderSchema = z.object({
  dueDate: z.coerce.date().min(new Date()),
  title: z.string().trim().min(5).max(100),
  message: z.string().trim().min(10).max(500)
}).refine(data => {
  // Ensure due date is at least 1 day in future
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return data.dueDate >= tomorrow;
}, "Due date must be at least 1 day in the future");
```

---

## Security Considerations

### Encryption Implementation

**Zero-Knowledge Architecture** (FR-002):

1. **Per-User Encryption Keys**:
   ```typescript
   // Derive user-specific key from master key
   const userKey = deriveKey(masterKey, userId);
   ```

2. **Field-Level Encryption**:
   ```typescript
   // Encrypt before save
   const encryptedAmount = encryptField(amount.toString(), userKey);
   const encryptedRecipient = encryptField(recipient, userKey);
   
   // Decrypt after retrieve
   const amount = parseFloat(decryptField(record.encryptedAmount, userKey));
   const recipient = decryptField(record.recipient, userKey);
   ```

3. **Encryption Metadata**:
   - Algorithm: AES-256-CBC
   - IV: Random per field, stored with ciphertext
   - Format: `base64(IV):base64(CipherText)`

### Data Access Control

**Authorization Checks** (Task T032):

```typescript
// Middleware: Ensure user owns resource
async function authorizePaymentAccess(req, res, next) {
  const payment = await prisma.paymentRecord.findUnique({
    where: { id: req.params.id }
  });
  
  if (!payment || payment.userId !== req.user.id) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  
  req.payment = payment;
  next();
}
```

### Audit Logging

**Non-Sensitive Audit Trail**:
- Login attempts (success/failure)
- Password changes
- Payment CRUD operations (IDs only, no amounts)
- Export requests
- **Never logged**: Amounts, recipients, notes, encrypted data

---

## Performance Optimization

### Query Optimization

**Pagination** (Large datasets):
```typescript
// Cursor-based pagination for payment history
const payments = await prisma.paymentRecord.findMany({
  where: { userId },
  orderBy: { date: 'desc' },
  take: 20,
  skip: (page - 1) * 20,
  cursor: cursor ? { id: cursor } : undefined
});
```

**Selective Field Loading**:
```typescript
// Don't load encrypted fields when not needed
const summaries = await prisma.paymentRecord.findMany({
  where: { userId },
  select: {
    id: true,
    date: true,
    // Omit: encryptedAmount, recipient, notes
  }
});
```

### Caching Strategy

**Client-Side**:
- React Query with 5-minute stale time
- Optimistic updates for better UX

**Server-Side**:
- No caching (data freshness priority)
- Future: Redis for analytics aggregations

---

## Testing Strategy

### Data Integrity Tests

**Unit Tests** (Task T005):
```typescript
describe('PaymentRecord', () => {
  it('encrypts sensitive fields before save', async () => {
    const payment = await createPayment({ amount: 100, recipient: 'Masjid' });
    expect(payment.encryptedAmount).toBeDefined();
    expect(payment.encryptedAmount).not.toContain('100');
  });
  
  it('decrypts fields on retrieval', async () => {
    const payment = await getPayment(paymentId);
    expect(payment.amount).toBe(100);
    expect(payment.recipient).toBe('Masjid');
  });
});
```

### Integration Tests

**API Tests** (Task T009):
```typescript
describe('POST /api/payments', () => {
  it('creates payment with valid data', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 100, date: '2025-01-15', recipient: 'Charity' })
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(100);
  });
  
  it('rejects invalid amount', async () => {
    await request(app)
      .post('/api/payments')
      .send({ amount: -100, date: '2025-01-15', recipient: 'Test' })
      .expect(400);
  });
});
```

---

## Future Enhancements

### Potential Schema Extensions

1. **PaymentRecurrence**:
   ```prisma
   model RecurringPayment {
     id            String @id
     userId        String
     template      PaymentRecord  // Copy these values
     frequency     String         // "MONTHLY", "YEARLY"
     nextDueDate   DateTime
     isActive      Boolean
   }
   ```

2. **PaymentCategories**:
   ```prisma
   model PaymentCategory {
     id          String @id
     userId      String
     name        String
     description String?
     iconName    String?
     colorHex    String?
     payments    PaymentRecord[]
   }
   ```

3. **AuditLog**:
   ```prisma
   model AuditLog {
     id          String @id
     userId      String
     action      String     // "CREATE_PAYMENT", "DELETE_PAYMENT"
     entityType  String
     entityId    String
     timestamp   DateTime
     ipAddress   String?
   }
   ```

---

## References

- **Spec**: `/specs/006-milestone-5/spec.md`
- **Plan**: `/specs/006-milestone-5/plan.md`
- **Tasks**: `/specs/006-milestone-5/tasks.md`
- **Prisma Schema**: `/server/prisma/schema.prisma`
- **Migration Files**: `/server/prisma/migrations/`

---

**Data Model Status**: ✅ Implemented and Production-Ready  
**Last Updated**: October 26, 2025  
**Version**: 1.0.0 (Retrospective)
