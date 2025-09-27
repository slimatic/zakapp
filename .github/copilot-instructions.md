# GitHub Copilot Agent Instructions

## Project Overview
ZakApp is a privacy-first Islamic Zakat calculator with comprehensive asset management and yearly tracking capabilities. This application prioritizes user privacy, data security, and Islamic compliance in all features.

## Constitutional Principles (NON-NEGOTIABLE)
1. **Privacy & Security First**: All sensitive data must be encrypted. Never store financial information in plain text.
2. **Islamic Compliance**: All calculations and methodologies must align with Islamic jurisprudence.
3. **User-Centric Design**: Every feature must solve real user problems with intuitive interfaces.
4. **Lovable UI/UX**: Beautiful, accessible, and delightful user experiences.
5. **Transparency & Trust**: Clear explanations, educational content, and open source approach.
6. **Quality & Reliability**: Robust testing, error handling, and performance optimization.

## Technology Stack
- **Backend**: Node.js + Express.js + TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Encryption**: AES-256-CBC for sensitive data
- **Testing**: Jest + Supertest + React Testing Library

## Code Standards

### General Guidelines
- Use TypeScript strictly - no `any` types
- Implement comprehensive error handling
- Add JSDoc comments for all functions
- Follow security-first development practices
- Encrypt all sensitive user data
- Validate all inputs rigorously

### Backend Patterns
```typescript
// Service layer example
export class AssetService {
  /**
   * Creates a new asset with encrypted sensitive data
   * @param userId - User identifier
   * @param assetData - Asset information to create
   * @throws {ValidationError} When asset data is invalid
   * @throws {EncryptionError} When encryption fails
   */
  async createAsset(userId: string, assetData: CreateAssetDto): Promise<Asset> {
    // Implementation with encryption
  }
}

// Controller example  
export const createAsset = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const asset = await assetService.createAsset(req.userId, req.body);
    res.status(201).json({ success: true, asset });
  } catch (error) {
    handleServiceError(error, res);
  }
};
```

### Frontend Patterns
```typescript
// Custom hook example
export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: () => assetApi.getAllAssets(),
    select: (data) => data.assets,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Component example with proper error handling
export const AssetList: React.FC = () => {
  const { data: assets, isLoading, error } = useAssets();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!assets?.length) return <EmptyState />;

  return (
    <div className="grid gap-4">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
};
```

## Security Requirements

### Data Encryption
- Encrypt sensitive data before database storage
- Use environment variables for encryption keys
- Implement client-side encryption for extra security
- Never log encrypted data or keys

### Authentication & Authorization
- Implement JWT with short expiration + refresh tokens
- Add rate limiting on all endpoints
- Validate user ownership of all resources
- Use bcrypt for password hashing (12+ rounds)

### Input Validation
- Validate all inputs server-side using Zod or similar
- Sanitize data before database operations
- Implement proper error messages without data leaks
- Use parameterized queries (Prisma ORM handles this)

## Islamic Compliance Guidelines

### Zakat Calculation
- Support multiple methodologies (Standard, Hanafi, Shafi'i, etc.)
- Use current nisab thresholds (gold/silver based)
- Apply 2.5% rate correctly based on methodology
- Handle lunar vs solar calendar calculations
- Provide educational content explaining calculations

### Asset Categories
- **Cash & Bank**: Fully zakatable
- **Gold**: Zakatable above nisab threshold
- **Silver**: Zakatable above nisab threshold  
- **Cryptocurrency**: Treat as currency (zakatable)
- **Business Assets**: Calculate based on inventory value
- **Investment Accounts**: Include current market value
- **Real Estate**: Generally not zakatable unless for trade
- **Debts Owed to You**: Include if collectible

## Implementation Priorities

### Phase 1: Core Authentication
1. User registration/login with encryption
2. JWT token management
3. Password reset functionality
4. Basic profile management

### Phase 2: Asset Management
1. CRUD operations with encryption
2. Asset categorization and validation
3. Currency conversion support
4. Import/export functionality

### Phase 3: Zakat Engine
1. Multiple calculation methodologies
2. Nisab threshold integration
3. Educational content delivery
4. Historical calculation tracking

### Phase 4: Advanced Features
1. Yearly snapshots and comparisons
2. Payment tracking and receipts
3. Data export and privacy compliance
4. Multi-language support

## Common Patterns

### Error Handling
```typescript
// Service layer error handling
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
  }
}

// Global error handler
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.code,
      message: error.message
    });
  }
  
  // Log unexpected errors
  logger.error('Unexpected error:', error);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  });
};
```

### Database Operations
```typescript
// Always use transactions for multi-table operations
export const transferAsset = async (fromUserId: string, toUserId: string, assetId: string) => {
  return await prisma.$transaction(async (tx) => {
    const asset = await tx.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.userId !== fromUserId) {
      throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
    }
    
    return await tx.asset.update({
      where: { id: assetId },
      data: { userId: toUserId }
    });
  });
};
```

### API Response Format
```typescript
// Success response
{
  success: true,
  data: any,
  message?: string
}

// Error response
{
  success: false,
  error: string, // Error code
  message: string, // Human readable message
  details?: any[] // Validation errors or additional context
}
```

## Testing Guidelines

### Unit Tests
- Test all service layer functions
- Mock external dependencies
- Test both success and error cases
- Achieve >90% code coverage

### Integration Tests
- Test all API endpoints
- Use test database
- Test authentication flows
- Verify data encryption/decryption

### Frontend Tests
- Test user interactions
- Mock API calls
- Test error states
- Test accessibility compliance

## Performance Considerations

### Backend Optimization
- Use database indexes appropriately
- Implement caching for expensive operations
- Add request rate limiting
- Optimize database queries

### Frontend Optimization
- Use React Query for data fetching
- Implement proper loading states
- Use code splitting for large bundles
- Optimize images and assets

## When Making Changes

### Before Writing Code
1. Review constitutional principles
2. Check API contracts for endpoint specifications
3. Verify Islamic compliance requirements
4. Consider security implications
5. Plan error handling approach

### During Implementation
1. Write TypeScript with strict types
2. Add comprehensive error handling
3. Implement proper validation
4. Add meaningful comments
5. Follow existing patterns

### After Implementation
1. Write corresponding tests
2. Update API documentation if needed
3. Verify security measures
4. Test edge cases and error scenarios
5. Consider performance impact

## Key Files & Directories

### Specifications
- `specs/001-zakapp-specification-complete/spec.md` - Complete feature specification
- `specs/001-zakapp-specification-complete/contracts/` - API contract definitions
- `specs/001-zakapp-specification-complete/data-model.md` - Database schema
- `.specify/memory/constitution.md` - Project constitution and principles

### Implementation  
- `server/src/` - Backend application code
- `client/src/` - Frontend React application
- `shared/` - Shared TypeScript types and utilities
- `server/prisma/` - Database schema and migrations

## Remember
- Always prioritize user privacy and data security
- Islamic compliance is non-negotiable
- User experience should be delightful and intuitive
- Every feature should solve a real user problem
- Quality and reliability are essential
- When in doubt, refer to the constitutional principles