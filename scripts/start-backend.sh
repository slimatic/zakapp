#!/bin/bash
cd "$(dirname "$0")/server"
echo "Starting backend server on http://localhost:5001..."
npm run dev
