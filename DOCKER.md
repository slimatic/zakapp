# Docker Setup Guide

## Overview

The zakapp project uses Docker for development and production environments. This guide covers setup, usage, and troubleshooting.

## Development Environment

### Prerequisites

- Docker 20.10+ 
- Docker Compose v2+
- Node.js 18+ (for local development)

### Quick Start

1. **Clone and Setup**
```bash
git clone <repository-url>
cd zakapp
npm run install:all
```

2. **Start Development Environment**
```bash
# Using Docker Compose
docker compose up -d

# Or start services individually  
npm run dev
```

3. **Access Services**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api

### Development Commands

```bash
# Build all services
docker compose build

# Start services in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild and restart
docker compose down && docker compose build && docker compose up -d
```

## Service Configuration

### Frontend Service
- **Port**: 3000
- **Hot Reload**: Enabled
- **Environment**: Development
- **Build Context**: ./frontend

### Backend Service  
- **Port**: 3001
- **Hot Reload**: Enabled
- **Environment**: Development
- **Data Volume**: ./backend/data:/app/data

## File Structure

```
docker/
├── Dockerfile.frontend      # Frontend development
├── Dockerfile.backend       # Backend development  
├── Dockerfile.production    # Production multi-stage build
└── nginx.conf              # Production Nginx config
```

## Production Deployment

### Building Production Image

```bash
# Build production image
docker build -f docker/Dockerfile.production -t zakapp:latest .

# Run production container
docker run -p 80:80 zakapp:latest
```

### Production Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.production
    ports:
      - "80:80"
    restart: unless-stopped
    
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data
      - ./backups:/app/backups
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

2. **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

3. **Container Build Failures**
```bash
# Clean Docker cache
docker system prune -f
docker compose build --no-cache
```

4. **Volume Mount Issues**
```bash
# Reset volumes
docker compose down -v
docker compose up -d
```

### Development Tips

1. **Live Reloading**: Changes to source files automatically trigger rebuilds
2. **Database Persistence**: User data persists in `./backend/data` volume
3. **Log Monitoring**: Use `docker compose logs -f [service]` to monitor specific services
4. **Clean Restart**: `docker compose down && docker compose up -d` for fresh environment

## Security Considerations

### Development
- Default JWT secret (change for production)
- Open CORS policy (restricted in production)
- Debug logging enabled

### Production
- Environment variables for secrets
- Restricted CORS origins
- Security headers enabled
- SSL/TLS termination
- Regular security updates

## Monitoring

### Health Checks
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api/health

### Container Status
```bash
docker compose ps
docker compose top
```

### Resource Usage
```bash
docker stats
```