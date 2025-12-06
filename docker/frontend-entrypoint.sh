#!/bin/sh

# Generate config.js from environment variables
# This allows changing the API URL without rebuilding the container
if [ -n "$REACT_APP_API_BASE_URL" ]; then
  echo "Generating runtime config.js with API_BASE_URL=$REACT_APP_API_BASE_URL"
  echo "window.APP_CONFIG = { API_BASE_URL: '$REACT_APP_API_BASE_URL' };" > /app/client/public/config.js
fi

# Execute the passed command (npm start)
exec "$@"
