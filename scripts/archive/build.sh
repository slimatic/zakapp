#!/bin/bash
# Build the application for production

echo "Building zakapp for production..."

# Build shared components
cd shared && npm run build && cd ..

# Build backend
cd backend && npm run build && cd ..

# Build frontend
cd frontend && npm run build && cd ..

echo "Build completed successfully!"
