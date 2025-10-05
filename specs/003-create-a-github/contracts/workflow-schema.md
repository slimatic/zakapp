# GitHub Actions Workflow Schema

**Purpose**: Define the expected structure and validation rules for GitHub Actions workflow files in `.github/workflows/`

## Schema Definition

### Root Level
```yaml
name: string                    # REQUIRED: Workflow display name
on:                             # REQUIRED: Trigger configuration
  push:
    branches: string[]          # Branch patterns (e.g., [main, develop])
  pull_request:
    branches: string[]          # PR target branches

jobs:                           # REQUIRED: Job definitions
  [job_id]: Job                 # At least one job required
```

### Job Definition
```yaml
[job_id]:
  runs-on: string               # REQUIRED: ubuntu-latest, windows-latest, etc.
  strategy:                     # OPTIONAL: Matrix strategy
    matrix:
      node-version: string[]    # e.g., [18.x, 20.x]
  steps:                        # REQUIRED: At least one step
    - Step                      # Step definition
```

### Step Definition
```yaml
- name: string                  # RECOMMENDED: Step display name
  uses: string                  # OPTIONAL: Action to use (e.g., actions/checkout@v4)
  with:                         # OPTIONAL: Action parameters
    [key]: string|number|boolean
  run: string                   # OPTIONAL: Shell command (mutually exclusive with 'uses')
  continue-on-error: boolean    # OPTIONAL: Default false, USE SPARINGLY
  if: string                    # OPTIONAL: Conditional execution
  env:                          # OPTIONAL: Environment variables
    [KEY]: string
```

## Validation Rules

### Workflow Level
- ✅ `name` must be unique across workflow files
- ✅ `on` must include at least one trigger type
- ✅ `jobs` must contain at least one job

### Job Level
- ✅ `runs-on` must be a valid GitHub runner
- ✅ `strategy.matrix` combinations must be reasonable (avoid exponential explosion)
- ✅ `steps` must contain at least one step

### Step Level
- ⚠️ `continue-on-error: true` should only be used for:
  - Optional quality checks (e.g., linting recommendations)
  - Experimental features being validated
  - Documentation generation that shouldn't block CI
- ❌ `continue-on-error: true` should NOT be used for:
  - Unit tests or integration tests
  - Build steps
  - Critical quality gates
  - Coverage generation

### Matrix Testing
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]  # ✅ Test LTS versions
    os: [ubuntu-latest]         # ✅ Single OS unless cross-platform needed
```

## Example: Valid Test Workflow

```yaml
name: Test

on:
  push:
    branches: [main, develop, copilot/**]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
        # NO continue-on-error - tests must pass
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true
        env:
          CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

## Example: Invalid Patterns

### ❌ Bad: continue-on-error on tests
```yaml
- name: Run tests
  run: npm test
  continue-on-error: true  # WRONG: Masks test failures
```

### ❌ Bad: Missing cache configuration
```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: 20.x
    # MISSING: cache: 'npm'
```

### ❌ Bad: Not using npm ci in CI
```yaml
- name: Install dependencies
  run: npm install  # WRONG: Use 'npm ci' for reproducible builds
```

## Validation Checklist

Before committing workflow changes:
- [ ] YAML syntax is valid (no tabs, proper indentation)
- [ ] All `uses` actions specify version tags (@v4, not @latest)
- [ ] Secrets are referenced correctly: `${{ secrets.NAME }}`
- [ ] Matrix strategy is necessary and not excessive
- [ ] No `continue-on-error` on critical steps
- [ ] Caching is configured for npm/dependencies
- [ ] Workflow triggers are appropriate for branch strategy

## Testing Workflow Changes

### Local Validation
```bash
# Install yamllint
pip install yamllint

# Validate workflow syntax
yamllint .github/workflows/*.yml

# Use act to test locally (optional)
act push -W .github/workflows/test.yml
```

### Safe Deployment
1. Create feature branch (e.g., `fix/ci-cd-improvements`)
2. Push workflow changes
3. Verify workflow runs successfully on feature branch
4. Create PR to main/develop
5. Merge after successful CI run

---

**Schema Version**: 1.0  
**Last Updated**: October 4, 2025  
**Applies To**: All `.github/workflows/*.yml` files
