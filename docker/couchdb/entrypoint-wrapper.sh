#!/bin/sh
set -e

# Default to localhost development origins if not set
DEFAULT_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://localhost:5984"

# Use COUCHDB_ALLOWED_ORIGINS if set, otherwise try ALLOWED_ORIGINS (from backend), or fallback
ORIGINS="${COUCHDB_ALLOWED_ORIGINS:-${ALLOWED_ORIGINS:-$DEFAULT_ORIGINS}}"

echo "Setting up CouchDB CORS for origins: $ORIGINS"

# Generate cors.ini
# We use direct echo/cat because envsubst is not available in the base image
mkdir -p /opt/couchdb/etc/local.d
cat > /opt/couchdb/etc/local.d/cors.ini <<EOF
[httpd]
enable_cors = true
bind_address = 0.0.0.0

[cors]
origins = ${ORIGINS}
credentials = true
methods = GET, PUT, POST, HEAD, DELETE, OPTIONS
headers = accept, authorization, content-type, origin, referer, x-requested-with
max_age = 3600
EOF

# Execute the original entrypoint
# The official image creates the user/password via /docker-entrypoint.sh
exec /docker-entrypoint.sh "$@"
