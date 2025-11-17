# API Error Handling with React Router Navigation

## Overview

This implementation replaces the use of `window.location.href` for navigation in the API service with a React Router-based approach. This change preserves the Single Page Application (SPA) behavior and prevents full page reloads when authentication errors occur.

## Problem

The original implementation used `window.location.href = '/login'` to redirect users when a 401 Unauthorized error was received:

```typescript
// OLD IMPLEMENTATION (api.ts line 66)
if (response.status === 401) {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';  // ❌ Full page reload
  throw new Error('Session expired. Please login again.');
}
```

### Issues with `window.location.href`:

1. **Full Page Reload**: Causes the browser to perform a complete page reload, losing all SPA benefits
2. **Lost State**: React Router state and context are lost
3. **Poor UX**: Creates a jarring experience with page flash and reload
4. **Performance**: Slower than client-side navigation (re-downloads assets, re-initializes app)

## Solution

The solution involves three key components:

### 1. Custom Error Types (`apiErrors.ts`)

Created typed error classes that can be caught and handled by React components:

```typescript
export class AuthenticationError extends ApiError {
  constructor(message = 'Session expired. Please login again.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}
```

**Benefits:**
- Type-safe error handling
- Can be caught with `instanceof` checks
- Includes additional context (status code, error code)
- Extensible for other error types (403, 404, 400, etc.)

### 2. Updated API Service (`api.ts`)

Modified the `handleResponse` method to throw custom errors instead of using `window.location.href`:

```typescript
// NEW IMPLEMENTATION
if (response.status === 401) {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  throw new AuthenticationError('Session expired. Please login again.');  // ✅ Throw error
}
```

**Benefits:**
- ApiService remains agnostic to React Router
- Error handling is centralized
- No direct navigation from service layer

### 3. Global Error Handler (`useGlobalErrorHandler` + `ErrorHandlerWrapper`)

Created a global error handler that catches `AuthenticationError` instances and navigates using React Router:

```typescript
export const useGlobalErrorHandler = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        onError: (error: any) => {
          if (isAuthenticationError(error)) {
            queryClient.clear();
            navigate('/login', { replace: true });  // ✅ React Router navigation
          }
        }
      }
    });
  }, [navigate, queryClient]);
};
```

**Benefits:**
- Centralized error handling for all React Query operations
- Uses React Router's `navigate` function (preserves SPA behavior)
- Clears query cache to prevent stale data
- Easy to extend for other global error handling needs

### 4. Integration in App Component (`App.tsx`)

Wrapped the app routes with `ErrorHandlerWrapper` to enable global error handling:

```typescript
<Router>
  <ErrorHandlerWrapper>
    <div className="App">
      <Routes>
        {/* routes */}
      </Routes>
    </div>
  </ErrorHandlerWrapper>
</Router>
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Action                           │
│         (e.g., fetch data with expired token)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Service (api.ts)                       │
│                                                               │
│  1. Makes fetch request                                      │
│  2. Receives 401 response                                    │
│  3. Clears localStorage tokens                               │
│  4. Throws AuthenticationError ──────────────────────┐       │
└──────────────────────────────────────────────────────┼───────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                React Query Error Handler                     │
│             (useGlobalErrorHandler hook)                     │
│                                                               │
│  1. Catches AuthenticationError                              │
│  2. Clears React Query cache                                 │
│  3. Calls navigate('/login') ─────────────────────┐          │
└───────────────────────────────────────────────────┼──────────┘
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Router                              │
│                                                               │
│  Client-side navigation to /login (NO page reload)           │
└─────────────────────────────────────────────────────────────┘
```

## Error Types

| Error Class | Status Code | Use Case |
|------------|-------------|----------|
| `AuthenticationError` | 401 | Session expired, invalid token |
| `AuthorizationError` | 403 | Insufficient permissions |
| `ValidationError` | 400 | Invalid request data |
| `NotFoundError` | 404 | Resource not found |
| `NetworkError` | N/A | Network connectivity issues |
| `ApiError` | Any | Generic API errors |

## Testing

Comprehensive unit tests are provided in `client/tests/services/apiErrors.test.ts`:

- ✅ Error class instantiation
- ✅ Error properties (message, statusCode, code, name)
- ✅ Error inheritance chain
- ✅ Type guard functions (`isAuthenticationError`, etc.)
- ✅ Custom messages and validation error details

Run tests:
```bash
cd client
npm test apiErrors.test.ts
```

## Benefits of This Approach

### User Experience
- ✅ Smooth, instant navigation (no page reload)
- ✅ Preserves application state where possible
- ✅ Better perceived performance
- ✅ No flash of blank page

### Developer Experience
- ✅ Type-safe error handling with TypeScript
- ✅ Centralized error handling logic
- ✅ Easy to extend with new error types
- ✅ Testable error handling
- ✅ Clear separation of concerns

### Architecture
- ✅ ApiService remains UI-agnostic
- ✅ React Router integration is contained to one place
- ✅ Easy to add custom error handling per component if needed
- ✅ Follows React best practices

## Migration from Old Approach

### Before
```typescript
// api.ts
if (response.status === 401) {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';  // Full page reload
  throw new Error('Session expired. Please login again.');
}
```

### After
```typescript
// api.ts
if (response.status === 401) {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  throw new AuthenticationError('Session expired. Please login again.');
}

// App.tsx (global handler)
<ErrorHandlerWrapper>
  {/* app routes */}
</ErrorHandlerWrapper>
```

## Future Enhancements

1. **Per-Component Error Handling**: Components can catch specific errors and show custom UI
2. **Error Recovery**: Implement retry logic for network errors
3. **Error Tracking**: Integrate with error monitoring services (Sentry, etc.)
4. **User Notifications**: Show toast notifications for different error types
5. **Offline Support**: Handle network errors gracefully in PWA mode

## Files Changed

- `client/src/services/apiErrors.ts` - New custom error classes
- `client/src/services/api.ts` - Updated to throw custom errors
- `client/src/hooks/useGlobalErrorHandler.ts` - New global error handler hook
- `client/src/components/common/ErrorHandlerWrapper.tsx` - New wrapper component
- `client/src/App.tsx` - Integrated ErrorHandlerWrapper
- `client/src/services/queryClient.tsx` - Updated retry logic for custom errors
- `client/tests/services/apiErrors.test.ts` - Comprehensive error class tests

## Related Issues

Addresses feedback from: https://github.com/slimatic/zakapp/pull/209#discussion_r2535767063

> Using `window.location.href` for navigation in a React Router application bypasses the router and causes a full page reload, losing the SPA benefits. Consider using React Router's navigation context (via useNavigate hook or NavigateFunction) for client-side routing.
