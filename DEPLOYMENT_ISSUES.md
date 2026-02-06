# ZakApp Deployment Issues & Improvements

## Issues Found During Deployment

### Issue #1: Prebuilt Images Not Publicly Accessible
**Problem**: The `docker-compose.simple.yml` references prebuilt images from GitHub Container Registry (`ghcr.io/slimatic/zakapp-backend:latest` and `ghcr.io/slimatic/zakapp-frontend:latest`) that are not publicly accessible.

**Error**: `error from registry: denied`

**Solution**: Use the local build compose file (`docker-compose.local.yml`) that builds from source.

### Issue #2: wget Not Available in Backend Container
**Problem**: The backend health check uses `wget`, but the `node:20-slim` base image doesn't include wget, causing the container to be marked as unhealthy.

**Error**: `exec: "wget": executable file not found in $PATH`

**Solution**: Install wget in the backend Dockerfile or change health check to use curl/node.

### Issue #3: No Simple One-Command Setup Script
**Problem**: Users need to manually:
1. Generate secrets with openssl
2. Copy and edit .env file
3. Know which docker-compose file to use
4. Understand Docker concepts

**Solution**: Create a simple setup script that automates this.

### Issue #4: Missing .env.docker.example File for Docker Deployments
**Problem**: The .env.example file has many options that aren't needed for simple Docker deployments.

**Solution**: Create a minimal .env.docker.example with only required variables.

## Recommended Fixes

### 1. Update docker-compose.simple.yml
Change from prebuilt images to build from source for users without registry access.

### 2. Fix Dockerfile.production
Add wget or curl to the backend-production stage for health checks.

### 3. Create deploy.sh Script
A simple script that:
- Checks prerequisites (Docker, docker-compose)
- Generates secrets automatically
- Creates .env file
- Builds and starts the application

### 4. Create QUICKSTART.md
A minimal guide for non-technical users.
