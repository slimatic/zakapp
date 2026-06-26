# Development Environment Setup

This document describes the mono-repo setup and development tools configuration for the zakapp project.

## Project Structure

```
zakapp/
├── frontend/              # React TypeScript frontend
├── backend/               # Node.js TypeScript backend
├── shared/                # Shared types and utilities
├── package.json           # Root package with mono-repo scripts
├── tsconfig.json          # Root TypeScript configuration
├── .prettierrc            # Prettier formatting configuration
└── .prettierignore        # Prettier ignore patterns
```

## Technology Stack

- **TypeScript**: Configured across all packages with project references
- **ESLint**: TypeScript-aware linting for all packages
- **Prettier**: Consistent code formatting
- **React**: Frontend framework with TypeScript
- **Node.js/Express**: Backend API with TypeScript
- **Vite**: Frontend build tool with hot reload

## Available Scripts

### Root Level Scripts

```bash
# Development
npm run dev                # Start both frontend and backend in development mode
npm run client:dev         # Start only frontend development server
npm run server:dev         # Start only backend development server

# Building
npm run build              # Build all packages (shared, backend, frontend)
npm run build:shared       # Build only shared package
npm run build:backend      # Build only backend
npm run build:frontend     # Build only frontend

# Code Quality
npm run lint               # Lint all packages
npm run lint:fix           # Fix auto-fixable linting issues in all packages
npm run format             # Format all code with Prettier
npm run format:check       # Check if code is properly formatted
npm run type-check         # Type check all packages

# Testing
npm run test               # Run tests for all packages

# Dependencies
npm run install:all        # Install dependencies for all packages
```

### Package-Specific Scripts

Each package (frontend, backend, shared) has its own scripts:

```bash
# In any package directory
npm run dev                # Start development server
npm run build              # Build the package
npm run lint               # Lint the package
npm run lint:fix           # Fix linting issues
npm run format             # Format code with Prettier
npm run type-check         # Type check the package
npm run test               # Run tests
```

## Development Workflow

1. **Initial Setup**:

   ```bash
   npm run install:all
   ```

2. **Start Development**:

   ```bash
   npm run dev  # Starts both frontend and backend
   ```

3. **Before Committing**:
   ```bash
   npm run lint:fix     # Fix linting issues
   npm run format       # Format code
   npm run type-check   # Ensure no type errors
   npm run build        # Ensure everything builds
   ```

## TypeScript Configuration

- **Root tsconfig.json**: Defines project references and shared compiler options
- **Package-specific tsconfigs**: Each package has its own TypeScript configuration
- **Project References**: Backend and frontend reference the shared package
- **Path Mapping**: Configured for clean imports (e.g., `@/components/*`)

## ESLint Configuration

- **TypeScript Support**: All packages use `@typescript-eslint` for TypeScript-aware linting
- **React Support**: Frontend includes React-specific ESLint rules
- **Consistent Rules**: Same base rules across all packages
- **Auto-fixable**: Many rules can be automatically fixed with `npm run lint:fix`

## Prettier Configuration

- **Consistent Formatting**: Single configuration for all packages
- **Integration**: Works with ESLint to avoid conflicts
- **Automatic**: Can be run on save in most editors

## Editor Setup

For the best development experience, configure your editor with:

1. **TypeScript Language Server**: For IntelliSense and type checking
2. **ESLint Extension**: For real-time linting
3. **Prettier Extension**: For automatic formatting on save
4. **Format on Save**: Enable in your editor settings

### VS Code Settings

Add to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

## Package Dependencies

Each package manages its own dependencies:

- **shared/**: Basic TypeScript utilities and type definitions
- **backend/**: Express.js, TypeScript, testing libraries
- **frontend/**: React, Vite, Tailwind CSS, testing libraries

## Next Steps

The foundation is now set up. Next development phases include:

1. Docker configuration and containerization
2. Development environment with hot reloading
3. Basic authentication system implementation
4. Foundational UI components and layout

## Troubleshooting

If you encounter issues:

1. **Dependencies**: Run `npm run install:all` to ensure all packages have their dependencies
2. **TypeScript Errors**: Run `npm run type-check` to see detailed type errors
3. **Linting Issues**: Run `npm run lint` to see all linting problems
4. **Build Issues**: Run `npm run build` to see build errors
5. **Formatting**: Run `npm run format:check` to see formatting issues

For more help, check the individual package README files or the main project documentation.
