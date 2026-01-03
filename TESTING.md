# ZakApp Testing Guide

## Philosophy (@qa)
We adhere to a Zero-Tolerance Policy for regression. Tests must be strict, financial logic must be property-tested, and UI components must be accessible.

## The `test-utils` Helper
To ensure components are tested within their required Contexts (Auth, React Query, Router), **ALWAYS** import `render` from `test-utils` instead of `@testing-library/react`.

### Usage
```tsx
// BAD
import { render } from '@testing-library/react';
render(<MyComponent />); // Will fail if component uses useAuth()

// GOOD
import { render } from '../../test-utils'; // Adjust path as needed
render(<MyComponent />); // Automatically wrapped in AuthProvider, QueryProvider, MemoryRouter
```

### Customizing Auth State
You can override the default mock user by passing a `user` option:

```tsx
render(<MyComponent />, { 
  user: { id: 'admin', role: 'admin' } 
});
```

## Mocking Hooks
For external hooks (like `useNisabThreshold`), use `vi.mock`:

```tsx
vi.mock('../../hooks/useNisabThreshold', () => ({
  useNisabThreshold: () => ({ nisabAmount: 5000, isLoading: false }),
}));
```

## Running Tests
- **Unit/Integration**: `npm test` or `npx vitest`
- **Coverage**: `npm run test:coverage`
