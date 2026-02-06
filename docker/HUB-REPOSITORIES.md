# Docker Hub Repositories

ZakApp Docker images are now available on Docker Hub!

## Repositories

### Frontend
```
docker pull slimatic/zakapp-frontend:latest
```
https://hub.docker.com/r/slimatic/zakapp-frontend

### Backend
```
docker pull slimatic/zakapp-backend:latest
```
https://hub.docker.com/r/slimatic/zakapp-backend

## Usage

### Quick Start with Docker Compose
```bash
# Clone repository
git clone https://github.com/slimatic/zakapp.git && cd zakapp

# Run easy deployment
./deploy-easy.sh
```

### Manual Docker Run
```bash
# Frontend
docker run -d -p 3000:80 slimatic/zakapp-frontend:latest

# Backend
docker run -d -p 3001:3001 \
  -e JWT_SECRET=your-secret \
  -e DATABASE_URL=file:/app/data/prod.db \
  slimatic/zakapp-backend:latest
```

## Tags

- `latest` - Most recent stable build
- Future: `v1.0.0`, `v1.1.0`, etc. for versioned releases

## Build Information

- **Base Images**: node:20-slim (backend), nginx:alpine (frontend)
- **Multi-arch**: linux/amd64, linux/arm64 (future)
- **Size**: ~100MB (frontend), ~1GB (backend includes build tools)

## Automated Builds

GitHub Actions workflow builds and pushes on every push to main branch.

Last updated: 2026-02-06