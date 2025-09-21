#!/bin/bash
# Run all tests

echo "Running zakapp tests..."

# Run shared tests
cd shared && npm test && cd ..

# Run backend tests
cd backend && npm test && cd ..

# Run frontend tests
cd frontend && npm test && cd ..

echo "All tests completed!"
