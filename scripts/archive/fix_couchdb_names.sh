#!/bin/bash

# Configuration
COUCH_HOST=${HOST_IP:-localhost}
COUCH_URL="http://admin:password@${COUCH_HOST}:5984"

echo "Using CouchDB at $COUCH_URL"

# List of Required Databases (matching client/src/services/SyncService.ts)
DBS=(
    "zakapp_assets"
    "zakapp_liabilities"
    "zakapp_nisab_year_records"
    "zakapp_payment_records"
    "zakapp_user_settings"
    "zakapp_zakat_calculations"
)

for db in "${DBS[@]}"; do
    echo "Checking $db..."
    # Try to create database (Safe to run if exists, returns 412)
    curl -X PUT "$COUCH_URL/$db"
    
    # Enable CORS (Wildcard for development flexibility)
    # Note: CouchDB global CORS config usually handles this, but ensuring security object if needed
    # Actually, global CORS is better. We assume global is set.
    
    # Make Publicly Readable/Writable for MVP (or restrict to authenticated users)
    # For now, we rely on the implementation using admin creds or standard user
done

echo "✅ CouchDB Databases Provisioned."
