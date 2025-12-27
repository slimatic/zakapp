/**
 * Verify CouchDB JWT Setup
 * 
 * Usage: npx ts-node scripts/verify-jwt-setup.ts
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const COUCH_URL = process.env.REACT_APP_COUCHDB_URL || 'http://localhost:5984';
const SECRET_B64 = "c2VjcmV0"; // "secret"

async function testJwtAuth() {
    console.log('🔍 Verifying CouchDB JWT Configuration...\n');

    const userId = 'test_user_Verification';
    const safeUserId = userId.toLowerCase();
    const dbName = `zakapp_${safeUserId}_test_db`;

    // Try 1: zakapp_v1
    const secretBuffer = Buffer.from(SECRET_B64, 'base64');
    const tokenV1 = jwt.sign(
        { sub: userId, '_couchdb.roles': [`user_${safeUserId}`] },
        secretBuffer,
        { algorithm: 'HS256', expiresIn: '1h', keyid: 'zakapp_v1' }
    );

    // Try 2: Global hmac_secret (no kid)
    const tokenGlobal = jwt.sign(
        { sub: userId, '_couchdb.roles': [`user_${safeUserId}`] },
        secretBuffer,
        { algorithm: 'HS256', expiresIn: '1h' } // No kid
    );

    if (await tryToken(tokenV1, "zakapp_v1")) {
        console.log("--> SUCCESS: zakapp_v1 worked.");
        await cleanup(dbName, tokenV1);
    } else if (await tryToken(tokenGlobal, "Global hmac_secret")) {
        console.log("--> SUCCESS: Global hmac_secret worked.");
        await cleanup(dbName, tokenGlobal);
    } else {
        console.error("❌ ALL Failed.");
        process.exit(1);
    }
}

async function tryToken(token: string, name: string) {
    console.log(`\n🚀 Attempting [${name}]...`);
    // Debug header
    console.log(`header:`, jwt.decode(token, { complete: true })?.header);

    try {
        const sessionRes = await fetch(`${COUCH_URL}/_session`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (sessionRes.status === 200) {
            const sessionData: any = await sessionRes.json();
            console.log(`   Session User: ${sessionData.userCtx.name}`);
            return true;
        } else {
            console.log(`❌ AUTH FAILED: ${sessionRes.status} -> ${await sessionRes.text()}`);
            return false;
        }
    } catch (e: any) {
        console.log(`❌ EXCEPTION: ${e.message}`);
        return false;
    }
}

async function cleanup(dbName: string, token: string) {
    console.log(`\n🧹 Cleaning up '${dbName}'...`);
    try {
        await fetch(`${COUCH_URL}/${dbName}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (e) { }
}

testJwtAuth();
