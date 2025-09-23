# npm Installation Issues and Solutions

This document addresses common npm installation issues in the zakapp project and provides containerized solutions to eliminate host OS dependency problems.

## Common Issues

### 1. Permission Denied Errors (EACCES)

```
npm error code EACCES
npm error syscall mkdir
npm error path /path/to/project/node_modules/@package
npm error errno -13
npm error Error: EACCES: permission denied
```

### 2. Shared Package Resolution Failures

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@zakapp/shared/'
```

### 3. Node Version Compatibility Issues

- Different Node.js versions across development environments
- npm version mismatches
- Package compatibility issues

## Solutions

### Option 1: Containerized npm (Recommended)

Use the containerized npm environment to completely eliminate host OS npm issues:

```bash
# Setup with containerized npm
./scripts/setup-npm.sh --docker

# Or use npm scripts directly
npm run docker:npm:install

# Start development with Docker
npm run docker:dev
```

Benefits:

- ✅ No permission issues
- ✅ Consistent Node.js/npm versions
- ✅ Isolated from host OS
- ✅ Reproducible across environments

### Option 2: Local npm with Fixes

If you prefer to use local npm, use the improved setup process:

```bash
# Setup with local npm
./scripts/setup-npm.sh --local

# Or manual setup with proper order
npm install
cd shared && npm install && npm run build
cd ../backend && npm install
cd ../frontend && npm install
```

## Development Workflows

### Using Containerized Development

```bash
# Start development environment
npm run docker:dev

# View logs
npm run docker:dev:logs

# Stop development environment
npm run docker:dev:down

# Reinstall dependencies
npm run docker:npm:install

# Run containerized npm commands
npm run npm:containerized npm audit
npm run npm:containerized npm update
```

### Using Local Development

```bash
# Start development environment
npm run dev

# Install all dependencies with proper build order
npm run install:all

# Individual package operations
cd shared && npm run build
cd backend && npm run dev
cd frontend && npm run dev
```

## Troubleshooting

### If you get permission errors:

1. **First, try containerized approach:**

   ```bash
   ./scripts/setup-npm.sh --docker
   ```

2. **If you must use local npm:**

   ```bash
   # Create .npmrc in your home directory
   echo "cache=/tmp/.npm" >> ~/.npmrc
   echo "tmp=/tmp" >> ~/.npmrc

   # Or use different cache directory
   npm install --cache /tmp/.npm
   ```

### If shared package isn't found:

1. **Ensure shared package is built:**

   ```bash
   cd shared
   npm run build
   ls -la dist/  # Should show compiled files
   ```

2. **Check package.json references:**
   ```bash
   # Should be "file:../shared" not "workspace:*"
   grep "@zakapp/shared" */package.json
   ```

### If Docker build fails:

1. **Clean Docker cache:**

   ```bash
   docker system prune -f
   docker compose build --no-cache
   ```

2. **Check Docker permissions:**
   ```bash
   # Make sure user is in docker group
   groups $USER | grep docker
   ```

## Migration Guide

### From Manual Setup to Containerized

1. **Stop any running services:**

   ```bash
   # Stop local services
   pkill -f "npm run dev"

   # Stop existing Docker containers
   docker compose down
   ```

2. **Clean existing node_modules:**

   ```bash
   rm -rf node_modules */node_modules
   ```

3. **Setup with containers:**
   ```bash
   ./scripts/setup-npm.sh --docker
   npm run docker:dev
   ```

### From Old Docker Setup to New

1. **Update Docker files:**

   ```bash
   git pull origin main  # Get latest Docker improvements
   ```

2. **Rebuild containers:**
   ```bash
   docker compose down
   docker system prune -f
   npm run docker:dev
   ```

## npm Scripts Reference

| Script                       | Purpose                            | Environment |
| ---------------------------- | ---------------------------------- | ----------- |
| `npm run docker:dev`         | Start containerized development    | Docker      |
| `npm run docker:npm:install` | Install deps in container          | Docker      |
| `npm run npm:containerized`  | Run npm commands in container      | Docker      |
| `npm run install:all`        | Install all deps with proper order | Local       |
| `npm run dev`                | Start local development            | Local       |

## Best Practices

1. **Use containerized approach for new setups**
2. **Commit package-lock.json files**
3. **Build shared package before other packages**
4. **Use exact versions in package.json**
5. **Regular dependency updates via container**

## Support

If you continue to experience issues:

1. Check [GitHub Issues](https://github.com/slimatic/zakapp/issues)
2. Create new issue with:
   - OS and Node.js version
   - Full error output
   - Steps to reproduce
