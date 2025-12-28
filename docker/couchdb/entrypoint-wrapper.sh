#!/bin/sh
set -e

# Default to localhost development origins if not set
DEFAULT_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://localhost:5984"

# Use COUCHDB_ALLOWED_ORIGINS if set, otherwise try ALLOWED_ORIGINS (from backend), or fallback
ORIGINS="${COUCHDB_ALLOWED_ORIGINS:-${ALLOWED_ORIGINS:-$DEFAULT_ORIGINS}}"

echo "Setting up CouchDB CORS for origins: $ORIGINS"

# Run certificate generation
if [ -f "/usr/local/bin/generate-cert.sh" ]; then
    /usr/local/bin/generate-cert.sh
fi

# Generate config
# We use direct echo/cat because envsubst is not available in the base image
mkdir -p /opt/couchdb/etc/local.d
cat > /opt/couchdb/etc/local.d/zakapp.ini <<EOF
[httpd]
enable_cors = true
bind_address = 0.0.0.0

[cors]
origins = ${ORIGINS}
credentials = true
methods = GET, PUT, POST, HEAD, DELETE, OPTIONS
headers = accept, authorization, content-type, origin, referer, x-requested-with
max_age = 3600

[ssl]
enable = true
cert_file = /opt/couchdb/etc/certs/couchdb.pem
key_file = /opt/couchdb/etc/certs/privkey.pem
port = 6984

[daemons]
httpsd = {chttpd, start_link, [https]}
EOF

# Execute the original entrypoint
# The official image creates the user/password via /docker-entrypoint.sh
exec /docker-entrypoint.sh "$@"
