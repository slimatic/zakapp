# PRD: Provide Prebuilt Docker Images with Unified Compose File

## Overview
ZakApp currently requires users to build Docker images from source using multiple compose files (docker-compose.yml, docker-compose.prod.yml, etc.), which can lead to errors and complexity for new users. This PRD outlines the implementation of prebuilt Docker images hosted on a secure registry, along with a unified docker-compose file to simplify bootstrapping while maintaining security best practices.

## Problem Statement
- Multiple docker-compose files exist with different configurations
- Users must build images locally, which can fail due to dependencies or environment issues
- Complex setup discourages new users from trying ZakApp
- No easy "one-command" deployment option

## Goals
- Provide prebuilt, secure Docker images for all components
- Create a single, unified docker-compose file for easy deployment
- Maintain security by using trusted registries and signed images
- Ensure images are built from the same source code with transparency

## User Stories

### Story 1: Quick Start with Docker
As a new user wanting to try ZakApp,
I want a simple docker-compose command,
So that I can run the full application without building or complex setup.

**Acceptance Criteria:**
- Run `docker-compose up -d` from project root
- Application starts on localhost:3000
- No build step required
- Works on Linux, Mac, Windows with Docker

### Story 2: Production Deployment
As a system administrator deploying ZakApp,
I want prebuilt images for production,
So that deployment is fast and reliable.

**Acceptance Criteria:**
- Images tagged with version numbers
- Separate production compose file available
- Images optimized for production (multi-stage builds)

### Story 3: Security Assurance
As a security-conscious user,
I want assurance that prebuilt images are safe,
So that I can trust the deployment.

**Acceptance Criteria:**
- Images hosted on GitHub Container Registry (ghcr.io)
- Images signed with cosign or similar
- SBOM (Software Bill of Materials) available
- Images built from verified source commits

### Story 4: Development Override
As a developer contributing to ZakApp,
I want to easily override with local builds,
So that I can test changes without rebuilding everything.

**Acceptance Criteria:**
- Compose file supports build overrides
- Can switch between prebuilt and local builds
- Development workflow unchanged

## Technical Requirements

### Images to Create
1. `ghcr.io/slimatic/zakapp-frontend:latest`
   - Built from Dockerfile.production target frontend-production
   - Includes Nginx serving built React app

2. `ghcr.io/slimatic/zakapp-backend:latest`  
   - Built from Dockerfile.production target backend-production
   - Includes Node.js backend with Prisma

3. CouchDB: Use existing `apache/couchdb:3.5.1` (already prebuilt)

### Unified Compose File
- Single `docker-compose.yml` for all environments
- Environment-specific overrides via profiles or separate files
- Clear documentation on usage

### CI/CD Pipeline
- GitHub Actions workflow to build and push images
- Triggered on releases and main branch pushes
- Includes security scanning (Trivy, etc.)
- Signs images with cosign

### Security Measures
- Images built in isolated environments
- No secrets baked into images
- Vulnerability scanning before push
- Image signing verification

## Implementation Plan

### Phase 1: Image Building Pipeline
- Set up GitHub Actions for multi-arch builds
- Configure GHCR permissions
- Test image builds locally first

### Phase 2: Unified Compose
- Create new docker-compose.yml pulling prebuilt images
- Maintain backward compatibility with existing files
- Update documentation

### Phase 3: Security Hardening
- Implement image signing
- Add SBOM generation
- Security scanning integration

### Phase 4: Testing & Documentation
- Test unified setup on different platforms
- Update README with new quick start
- Deprecate old compose files with migration guide

## Success Metrics
- Reduce setup time from 15+ minutes to <5 minutes
- Increase successful first-time setups by 80%
- Zero security incidents from prebuilt images
- Maintain development workflow flexibility

## Risks & Mitigations
- **Risk**: Image bloat or vulnerabilities
  - **Mitigation**: Regular security scans, minimal base images

- **Risk**: Breaking changes in dependencies
  - **Mitigation**: Automated testing of images, semantic versioning

- **Risk**: Registry outages
  - **Mitigation**: Fallback instructions for local builds

## Dependencies
- GitHub Container Registry access
- CI/CD pipeline setup
- Security tooling (cosign, Trivy)

## Timeline
- Phase 1: 1 week
- Phase 2: 1 week  
- Phase 3: 1 week
- Phase 4: 1 week

Total: 4 weeks