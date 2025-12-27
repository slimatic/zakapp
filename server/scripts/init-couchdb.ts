
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env (or server .env if preferred)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const COUCH_HOST = process.env.COUCHDB_HOST || 'localhost';
const COUCH_PORT = process.env.COUCHDB_PORT || '5984';
const COUCH_USER = process.env.COUCHDB_USER || 'admin';
const COUCH_PASSWORD = process.env.COUCHDB_PASSWORD || 'password';

// Do not include credentials in URL to avoid "TypeError: Request cannot be constructed from a URL that includes credentials"
const BASE_URL = `http://${COUCH_HOST}:${COUCH_PORT}`;

// Create Basic Auth Header
const authHeader = 'Basic ' + Buffer.from(`${COUCH_USER}:${COUCH_PASSWORD}`).toString('base64');

const DBS_TO_CREATE = [
    '_users',
    '_replicator',
    '_global_changes',
    'zakapp_users',
    'zakapp_assets',
    'zakapp_nisab_year_records',
    'zakapp_payment_records',
    'zakapp_liabilities',
    'zakapp_zakat_calculations',
    'zakapp_user_settings'
];

async function initCouchDB() {
    console.log(`🔌 Connecting to CouchDB at ${BASE_URL}...`);

    const headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
    };

    try {
        // 1. Verify Connection
        const welcome = await fetch(`${BASE_URL}/`, { headers }).then(res => res.json());
        if (!welcome || welcome.couchdb !== 'Welcome') {
            throw new Error('Invalid response from CouchDB');
        }
        console.log('✅ Connected to CouchDB:', welcome.version);

        // 2. Create Databases
        for (const dbName of DBS_TO_CREATE) {
            const dbUrl = `${BASE_URL}/${dbName}`;
            const check = await fetch(dbUrl, { method: 'HEAD', headers });

            if (check.status === 404) {
                console.log(`Creating database: ${dbName}...`);
                const create = await fetch(dbUrl, { method: 'PUT', headers });
                if (!create.ok) {
                    console.error(`❌ Failed to create ${dbName}:`, await create.text());
                } else {
                    console.log(`✅ Created ${dbName}`);
                }
            } else {
                console.log(`✓ Database ${dbName} exists`);
            }
        }

        // 3. Configure CORS (Critical for Browser Access)
        console.log('🔧 Configuring CORS...');
        await configureConfig('httpd', 'enable_cors', 'true', headers);
        await configureConfig('cors', 'origins', '*', headers); // For Dev. In Prod, specify domains.
        await configureConfig('cors', 'credentials', 'true', headers);
        await configureConfig('cors', 'methods', 'GET, PUT, POST, HEAD, DELETE', headers);
        await configureConfig('cors', 'headers', 'accept, authorization, content-type, origin, referer, x-csrf-token', headers);

        console.log('✅ CouchDB Initialization Complete');

    } catch (error) {
        console.error('❌ CouchDB Init Failed:', error);
        process.exit(1);
    }
}

async function configureConfig(section: string, key: string, value: string, headers: any) {
    // Config path: /_node/{node_name}/_config/{section}/{key}
    const url = `${BASE_URL}/_node/nonode@nohost/_config/${section}/${key}`;

    const response = await fetch(url, {
        method: 'PUT',
        body: JSON.stringify(value),
        headers
    });

    if (!response.ok) {
        // Try _local if nonode@nohost fails
        const urlLocal = `${BASE_URL}/_node/_local/_config/${section}/${key}`;
        const responseLocal = await fetch(urlLocal, {
            method: 'PUT',
            body: JSON.stringify(value),
            headers
        });

        if (!responseLocal.ok) {
            console.error(`⚠️ Failed to set config ${section}/${key}:`, await responseLocal.text());
            return;
        }
    }
    console.log(`  Set ${section}/${key} = ${value}`);
}

initCouchDB();
