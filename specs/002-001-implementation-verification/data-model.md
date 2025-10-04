# Data Model: ZakApp Implementation Verification

**Input**: Entities extracted from feature specification
**Purpose**: Define data structures for implementation verification and quality assurance

## Core Entities

### Test Result
**Purpose**: Track outcomes of verification tests across the application

**Fields**:
- `id`: string (UUID) - Unique identifier for test result
- `testType`: enum - Type of test executed
  - `UNIT` - Individual component testing
  - `INTEGRATION` - Component interaction testing  
  - `E2E` - End-to-end user workflow testing
  - `CONTRACT` - API specification compliance testing
  - `SECURITY` - Security vulnerability testing
  - `PERFORMANCE` - Performance benchmark testing
- `testName`: string - Descriptive name of the test
- `status`: enum - Test execution outcome
  - `PASSED` - Test completed successfully
  - `FAILED` - Test failed with errors
  - `SKIPPED` - Test was skipped
  - `PENDING` - Test queued for execution
- `executionTime`: number - Test execution time in milliseconds
- `coverage`: number - Code coverage percentage (0-100)
- `errors`: string[] - Array of error messages if test failed
- `metadata`: object - Additional test context and environment info
- `createdAt`: timestamp - When test was executed
- `feature`: string - Feature being tested (e.g., "authentication", "zakat-calculation")

**Relationships**:
- Belongs to Implementation Gap (many-to-one)
- References Quality Metric (one-to-many)

**Validation Rules**:
- Test name must be unique within test type
- Coverage must be between 0 and 100
- Execution time must be positive number
- Feature must match known application features

### Implementation Gap
**Purpose**: Track differences between specification requirements and actual implementation

**Fields**:
- `id`: string (UUID) - Unique identifier for gap
- `category`: enum - Type of implementation gap
  - `MISSING_FEATURE` - Required feature not implemented
  - `INCOMPLETE_FEATURE` - Feature partially implemented
  - `SECURITY_VIOLATION` - Security requirement not met
  - `PERFORMANCE_ISSUE` - Performance requirement not met
  - `COMPLIANCE_VIOLATION` - Islamic compliance not met
  - `API_MISMATCH` - API doesn't match contract
- `severity`: enum - Impact level of the gap
  - `CRITICAL` - System unusable or major security risk
  - `HIGH` - Core functionality affected
  - `MEDIUM` - Feature degradation or minor compliance issue
  - `LOW` - Minor improvement or optimization
- `description`: string - Detailed description of the gap
- `expectedBehavior`: string - What should happen according to specification
- `actualBehavior`: string - Current system behavior
- `affectedComponents`: string[] - List of components/files affected
- `constitutionalPrinciple`: string - Which constitutional principle is violated
- `resolutionPlan`: string - How the gap will be resolved
- `estimatedEffort`: number - Estimated hours to resolve
- `assignedTo`: string - Developer/team assigned to resolve
- `status`: enum - Current resolution status
  - `IDENTIFIED` - Gap identified but not addressed
  - `IN_PROGRESS` - Resolution work started
  - `RESOLVED` - Gap has been closed
  - `VERIFIED` - Resolution verified through testing
- `createdAt`: timestamp - When gap was identified
- `resolvedAt`: timestamp - When gap was resolved (null if unresolved)

**Relationships**:
- Has many Test Results (one-to-many)
- References Quality Metrics (many-to-many)

**Validation Rules**:
- Description must be at least 50 characters
- Expected and actual behavior required for all gaps
- Critical gaps must have assignedTo value
- Resolution plan required for HIGH and CRITICAL severity

### Quality Metric
**Purpose**: Measurable indicators of code quality, performance, and compliance

**Fields**:
- `id`: string (UUID) - Unique identifier for metric
- `metricType`: enum - Type of quality measurement
  - `CODE_COVERAGE` - Test coverage percentage
  - `PERFORMANCE` - Response time, throughput metrics
  - `SECURITY_SCORE` - Security assessment score
  - `ACCESSIBILITY_SCORE` - WCAG compliance percentage
  - `ISLAMIC_COMPLIANCE` - Calculation accuracy score
  - `API_CONSISTENCY` - API standardization score
  - `ERROR_RATE` - Application error frequency
- `metricName`: string - Descriptive name of the metric
- `currentValue`: number - Current measured value
- `targetValue`: number - Target value to achieve
- `threshold`: object - Acceptable ranges
  - `min`: number - Minimum acceptable value
  - `max`: number - Maximum acceptable value
  - `optimal`: number - Optimal target value
- `unit`: string - Unit of measurement (%, ms, requests/sec, etc.)
- `measurementDate`: timestamp - When metric was measured
- `component`: string - Component or feature being measured
- `environment`: enum - Environment where measured
  - `DEVELOPMENT` - Local development environment
  - `TESTING` - Automated testing environment
  - `STAGING` - Pre-production environment
  - `PRODUCTION` - Live production environment
- `trend`: enum - Metric trend over time
  - `IMPROVING` - Metric getting better
  - `STABLE` - Metric remaining consistent
  - `DEGRADING` - Metric getting worse
- `automatedCollection`: boolean - Whether metric is automatically collected

**Relationships**:
- References Test Results (many-to-many)
- Tracked by Implementation Gaps (many-to-many)

**Validation Rules**:
- Current value must be numeric
- Target value should be achievable based on historical data
- Threshold min must be less than max
- Component must exist in system
- Automated metrics require collection configuration

### Migration Record
**Purpose**: Track data migration operations from JSON files to database

**Fields**:
- `id`: string (UUID) - Unique identifier for migration
- `migrationName`: string - Descriptive name of migration operation
- `sourceType`: enum - Type of source data
  - `USER_DATA` - User account information
  - `ASSET_DATA` - Financial asset information
  - `CALCULATION_DATA` - Zakat calculation history
  - `SETTINGS_DATA` - User preferences and settings
- `sourceLocation`: string - Path to source JSON file
- `recordCount`: number - Number of records to migrate
- `successCount`: number - Number of successfully migrated records
- `failureCount`: number - Number of failed migrations
- `checksumBefore`: string - Data checksum before migration
- `checksumAfter`: string - Data checksum after migration
- `migrationLog`: object[] - Detailed migration log entries
- `rollbackData`: object - Data needed for rollback if migration fails
- `status`: enum - Migration execution status
  - `PENDING` - Migration queued but not started
  - `IN_PROGRESS` - Migration currently executing
  - `COMPLETED` - Migration finished successfully
  - `FAILED` - Migration failed and rolled back
  - `PARTIALLY_COMPLETED` - Some records migrated, some failed
- `startedAt`: timestamp - When migration began
- `completedAt`: timestamp - When migration finished
- `duration`: number - Migration execution time in seconds

**Relationships**:
- Independent entity (no foreign key relationships)

**Validation Rules**:
- Source location must be valid file path
- Record counts must be non-negative integers
- Success + failure count should equal record count
- Checksums must match for successful migrations
- Duration must be calculated from timestamps

### Compliance Verification
**Purpose**: Validate Islamic calculation accuracy against authoritative sources

**Fields**:
- `id`: string (UUID) - Unique identifier for verification
- `calculationType`: enum - Type of Islamic calculation
  - `ZAKAT_STANDARD` - Standard Zakat calculation methodology
  - `ZAKAT_HANAFI` - Hanafi school calculation methodology
  - `ZAKAT_SHAFII` - Shafi'i school calculation methodology
  - `NISAB_GOLD` - Gold-based nisab threshold calculation
  - `NISAB_SILVER` - Silver-based nisab threshold calculation
- `inputData`: object - Input parameters for calculation
- `expectedResult`: number - Expected result from authoritative source
- `actualResult`: number - Result from system calculation
- `accuracy`: number - Percentage accuracy (0-100)
- `authoritativeSource`: string - Reference to Islamic finance authority
- `sourceCitation`: string - Full citation of the source material
- `verificationDate`: timestamp - When verification was performed
- `methodology`: string - Detailed explanation of calculation methodology
- `currency`: string - Currency used for calculation (USD, EUR, etc.)
- `marketData`: object - Market rates used (gold price, silver price, exchange rates)
- `status`: enum - Verification status
  - `PENDING` - Verification scheduled but not performed
  - `VERIFIED` - Calculation matches authoritative source
  - `DISCREPANCY` - Minor difference within acceptable range
  - `FAILED` - Significant difference requiring investigation
- `notes`: string - Additional verification notes or context

**Relationships**:
- Independent entity with potential references to calculation history

**Validation Rules**:
- Accuracy must be between 0 and 100
- Expected and actual results must be positive numbers
- Authoritative source must be from recognized Islamic finance authority
- Currency must be valid ISO currency code
- Market data must include current rates for calculations

### API Contract
**Purpose**: Define expected endpoint behavior and response format specifications

**Fields**:
- `id`: string (UUID) - Unique identifier for contract
- `endpoint`: string - API endpoint path (e.g., "/api/auth/login")
- `method`: enum - HTTP method
  - `GET` - Retrieve data
  - `POST` - Create new data
  - `PUT` - Update existing data
  - `DELETE` - Remove data
  - `PATCH` - Partial update
- `version`: string - API version (e.g., "v1", "v2")
- `requestSchema`: object - JSON schema for request validation
- `responseSchema`: object - JSON schema for response validation
- `authenticationRequired`: boolean - Whether endpoint requires authentication
- `rateLimiting`: object - Rate limiting configuration
  - `requestsPerMinute`: number
  - `requestsPerHour`: number
  - `burstLimit`: number
- `expectedStatusCodes`: number[] - Valid HTTP status codes
- `errorHandling`: object - Error response specifications
- `lastUpdated`: timestamp - When contract was last modified
- `complianceStatus`: enum - Contract compliance status
  - `COMPLIANT` - Implementation matches contract
  - `PARTIAL` - Some aspects match, others need work
  - `NON_COMPLIANT` - Implementation doesn't match contract
  - `UNTESTED` - Contract not yet validated
- `testCoverage`: number - Percentage of contract covered by tests

**Relationships**:
- Referenced by Test Results for contract testing

**Validation Rules**:
- Endpoint must follow REST conventions
- Request and response schemas must be valid JSON Schema
- Rate limiting values must be positive integers
- Test coverage must be between 0 and 100

### User Workflow
**Purpose**: Complete end-to-end user interactions for testing coverage

**Fields**:
- `id`: string (UUID) - Unique identifier for workflow
- `workflowName`: string - Descriptive name of user workflow
- `description`: string - Detailed description of workflow steps
- `userType`: enum - Type of user performing workflow
  - `NEW_USER` - First-time user registration and setup
  - `RETURNING_USER` - Existing user with data
  - `ADMIN_USER` - Administrative operations
- `steps`: object[] - Sequential workflow steps
  - `stepNumber`: number
  - `action`: string - User action to perform
  - `expectedResult`: string - Expected outcome
  - `component`: string - UI component involved
- `prerequisites`: string[] - Required setup before workflow
- `testAutomated`: boolean - Whether workflow has automated tests
- `criticalPath`: boolean - Whether workflow is critical for application
- `estimatedDuration`: number - Expected time to complete in minutes
- `lastTested`: timestamp - When workflow was last validated
- `successRate`: number - Percentage of successful test executions
- `commonFailures`: string[] - Frequent points of failure
- `browserCompatibility`: object - Browser support status
  - `chrome`: boolean
  - `firefox`: boolean
  - `safari`: boolean
  - `edge`: boolean

**Relationships**:
- May reference API Contracts used in workflow
- Tracked by Test Results for E2E testing

**Validation Rules**:
- Steps must be in sequential order (stepNumber)
- Success rate must be between 0 and 100
- Estimated duration must be positive number
- At least one browser must be supported for web workflows

## Database Schema Implementation

### Indexes
- `test_results`: Index on `(testType, status, createdAt)` for filtering and sorting
- `implementation_gaps`: Index on `(severity, status)` for priority queries
- `quality_metrics`: Index on `(metricType, component, measurementDate)` for trending
- `migration_records`: Index on `(status, sourceType)` for migration tracking
- `compliance_verification`: Index on `(calculationType, status)` for validation queries
- `api_contracts`: Index on `(endpoint, method)` for contract lookup
- `user_workflows`: Index on `(criticalPath, testAutomated)` for test planning

### Constraints
- All entities require non-null `id` and `createdAt` fields
- Enum fields must use defined values only
- Percentage fields (coverage, accuracy, successRate) constrained to 0-100 range
- Foreign key relationships enforced with cascade delete where appropriate

### Encryption Requirements
- No sensitive user data in verification entities
- Migration records contain checksums only, not actual data
- Compliance verification uses anonymized calculation examples
- All fields use standard database encryption at rest