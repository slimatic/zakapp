#!/bin/bash

# Test Database Setup Script

echo "Setting up test database for ZakApp..."

# Set test environment
export NODE_ENV=test
export DATABASE_URL="file:./data/test.db"

# Create test data directory
mkdir -p server/data/test

# Generate Prisma client for test environment
cd server
npx prisma generate

# Push schema to test database (creates tables without migrations)
npx prisma db push --force-reset

echo "Test database setup completed successfully!"
echo "Test database location: server/data/test.db"