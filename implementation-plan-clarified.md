# ZakApp Implementation Plan (Post-Clarification)

**Generated**: 2025-09-29
**Based on**: User clarifications on implementation gaps

## Database Architecture Plan

### Primary: SQLite Implementation 
- **File**: `server/prisma/schema.prisma` 
- **Models**: User, Asset, Liability, ZakatCalculation, AssetSnapshot, ZakatPayment, CalculationMethodology
- **Features**: File-based SQLite for self-hosting simplicity
- **Encryption**: Database-level encryption with PRAGMA key

### Optional: PostgreSQL Support
- **Configuration**: Environment-based database switching
- **Migration**: Prisma migration system for both SQLite and PostgreSQL
- **Production**: PostgreSQL for scaling when needed

## Islamic Compliance Implementation

### Calculation Sources
- **Nisab Thresholds**: Based on documented Islamic finance sources
- **Methodologies**: Standard (2.5%), Hanafi (silver-based), Shafi'i (gold-based)
- **References**: Include source citations in calculation responses
- **Validation**: Cross-reference with multiple Islamic finance authorities

### Implementation Files
- `server/src/services/zakatService.ts` - Core calculation logic
- `server/src/data/islamicStandards.json` - Methodology definitions
- `client/src/components/zakat/MethodologyExplainer.tsx` - Educational content

## Testing Strategy (End-to-End Focus)

### Playwright Setup
- **Framework**: Playwright for full user workflow testing
- **Tests**: Complete user journeys from registration to payment tracking
- **Coverage**: All critical user paths must pass E2E tests

### Test Categories
1. **Authentication Flow**: Register → Login → Dashboard
2. **Asset Management**: Create → Edit → Delete → Bulk operations  
3. **Zakat Calculation**: All methodologies → Results → Payment recording
4. **Data Persistence**: Server restart scenarios
5. **Error Handling**: Invalid inputs → Network errors → Recovery

### Implementation Files
- `tests/e2e/` - Playwright test suites
- `tests/playwright.config.ts` - Playwright configuration
- `package.json` - Test scripts and dependencies

## API Standardization (Incremental)

### Response Format Standardization
```typescript
interface StandardApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}
```

### Implementation Strategy
- Fix API inconsistencies as we encounter them during feature development
- Prioritize endpoints that are actively causing issues
- Maintain backward compatibility where possible

## Priority Implementation Tasks

### Phase 1: Database Migration (High Priority)
1. **Setup Prisma with SQLite**
   - Install Prisma dependencies
   - Create schema.prisma with all entities
   - Generate Prisma client
   - Create migration scripts

2. **Data Migration**
   - Migration script from JSON files to SQLite
   - Preserve existing user data
   - Backup strategy for current JSON data

3. **Update Services**
   - Replace file-based storage with Prisma calls
   - Update all CRUD operations
   - Add proper error handling

### Phase 2: Islamic Compliance Enhancement
1. **Research and Documentation**
   - Gather Islamic finance calculation sources
   - Document methodology differences
   - Create reference data structure

2. **Calculation Engine Upgrade**
   - Implement proper nisab calculations
   - Add methodology-specific logic
   - Include source citations

3. **Educational Content**
   - Add methodology explanations
   - Include Islamic guidance
   - Reference scholarly sources

### Phase 3: End-to-End Testing Setup
1. **Playwright Installation**
   - Setup Playwright framework
   - Configure test environment
   - Create base test utilities

2. **Critical Path Testing**
   - Authentication workflow tests
   - Asset management workflow tests
   - Zakat calculation workflow tests

3. **CI/CD Integration**
   - Automated test running
   - Test reporting
   - Failure notifications

### Phase 4: Production Readiness
1. **PostgreSQL Support**
   - Environment-based database switching
   - PostgreSQL-specific optimizations
   - Migration documentation

2. **Security Hardening**
   - Database encryption
   - Input validation improvements
   - Security header enhancements

3. **Performance Optimization**
   - Database indexing
   - Query optimization
   - Caching strategy

## Implementation Quality Gates

### Before marking any task complete:
1. ✅ **Functionality Works**: Feature works end-to-end
2. ✅ **Tests Pass**: Relevant E2E tests pass
3. ✅ **API Contract**: Endpoint matches specification
4. ✅ **Error Handling**: Graceful error scenarios
5. ✅ **Documentation**: Code is documented and clear

### Islamic Compliance Verification:
- Cross-reference calculations with multiple Islamic finance sources
- Include source citations in responses
- Test with known calculation examples
- Document methodology differences clearly

## File Structure Updates Needed

```
server/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations  
│   └── seed.ts               # Seed data
├── src/
│   ├── services/
│   │   ├── zakatService.ts   # Enhanced Islamic calculations
│   │   └── databaseService.ts # Database abstraction
│   ├── data/
│   │   └── islamicStandards.json # Methodology data
│   └── utils/
│       └── migration.ts      # JSON to DB migration

tests/
├── e2e/
│   ├── auth.spec.ts          # Authentication E2E tests
│   ├── assets.spec.ts        # Asset management E2E tests
│   └── zakat.spec.ts         # Zakat calculation E2E tests
└── playwright.config.ts      # Playwright configuration

client/
├── src/
│   ├── components/
│   │   └── zakat/
│   │       └── MethodologyExplainer.tsx # Educational content
│   └── services/
│       └── apiClient.ts      # Standardized API client
```

This plan addresses all the clarifications and provides a roadmap for completing the implementation properly with quality gates to prevent premature completion marking.