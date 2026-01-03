# Production Deployment Guide

This guide explains how to deploy ZakApp in a production environment using Docker.

## Prerequisites

- Docker & Docker Compose installed
- A production `.env` file (or set environment variables in your CI/CD system)
- Domain names configured (if using SSL/TLS, though this guide configures Nginx on port 80/443 inside Docker, you usually need a reverse proxy on the host or Cloudflare Tunnel)

## Quick Start

1.  **Configure Environment**
    Copy `.env.example` to `.env` and update values for production.
    *Crucially*, set strong secrets:
    ```bash
    NODE_ENV=production
    JWT_SECRET=<long-random-string>
    COUCHDB_PASSWORD=<secure-password>
    COUCHDB_JWT_SECRET=<another-long-random-string>
    REACT_APP_API_BASE_URL=/api
    REACT_APP_FEEDBACK_ENABLED=true
    # Set the public URL for CouchDB if accessed directly by clients (for Sync)
    REACT_APP_COUCHDB_URL=https://couchdb.yourdomain.com 
    # OR if using the same domain proxying:
    # REACT_APP_COUCHDB_URL=https://yourdomain.com/couchdb
    
    # External APIs
    GOLD_API_KEY=<your-goldapi-key> # Register at https://www.goldapi.io/
    ```

2.  **Start Production Stack**
    Use the production compose file which builds optimized images:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```

3.  **Run Database Migrations**
    The production backend does not auto-migrate on start (to prevent race conditions in scale-out scenarios). Run this once after deployment:
    ```bash
    docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
    ```

4.  **Verify Deployment**
    - Frontend: `http://localhost:3000` (or your server IP)
    - Backend Health: `http://localhost:3000/api/health`
    - Sync Status: Check the "Sync" indicator in the top navbar.

## Architecture Notes

- **Frontend**: Served by Nginx. Static files are built with `npm run build` in a separate stage.
    - **Runtime Config**: `config.js` is generated at startup by `nginx-entrypoint.sh`. This allows you to change `REACT_APP_...` environment variables in `docker-compose.prod.yml` *without* rebuilding the image.
- **Backend**: Node.js app using `better-sqlite3` (default) or configured database.
    - **Persistence**: Data is stored in the `backend_data` volume (SQLite) and `couchdb_data` volume (CouchDB).
- **CouchDB**: Used for syncing user data across devices.

## Troubleshooting

- **Logs**:
    ```bash
    docker-compose -f docker-compose.prod.yml logs -f
    ```
- **Updates**:
    ```bash
    git pull
    docker-compose -f docker-compose.prod.yml up -d --build
    docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
    ```
