#!/usr/bin/env node
/**
 * Pre-Migration Script: Generate Salts for Existing Users (JavaScript Version)
 * 
 * This script MUST be run BEFORE deploying the project-ikhlas-renovation branch.
 * It adds a cryptographic salt to each user's profile, which is required for
 * the new client-side encryption system.
 * 
 * Usage:
 *   cd server
 *   node scripts/pre-migration-salts.js
 * 
 * Or in Docker:
 *   docker compose exec backend node scripts/pre-migration-salts.js
 * 
 * @author ZakApp Migration Tool
 * @date 2024-12-27
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Match the actual EncryptionService format
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

/**
 * Normalize key to 32 bytes (matches EncryptionService.normalizeKey)
 */
function normalizeKey(key) {
    let keyBuffer;

    // Try base64 first
    try {
        keyBuffer = Buffer.from(key, 'base64');
    } catch {
        keyBuffer = Buffer.alloc(0);
    }

    // If base64 didn't produce expected length and key looks hex, try hex
    if (keyBuffer.length !== KEY_LENGTH && /^[0-9a-fA-F]+$/.test(key)) {
        try {
            const hexBuf = Buffer.from(key, 'hex');
            if (hexBuf.length === KEY_LENGTH) {
                return hexBuf;
            }
        } catch {
            // ignore
        }
    }

    // If base64 result not valid, fall back to utf8
    if (keyBuffer.length !== KEY_LENGTH) {
        keyBuffer = Buffer.from(key, 'utf8');
    }

    if (keyBuffer.length === KEY_LENGTH) {
        return keyBuffer;
    } else if (keyBuffer.length > KEY_LENGTH) {
        return keyBuffer.subarray(0, KEY_LENGTH);
    } else {
        const paddedKey = Buffer.alloc(KEY_LENGTH);
        keyBuffer.copy(paddedKey);
        return paddedKey;
    }
}

/**
 * Encrypt using the same format as EncryptionService (base64 iv:ciphertext)
 */
function encrypt(text, key) {
    const keyBuffer = normalizeKey(key);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    const encryptedBuf = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

    // Format: ivBase64:encryptedBase64
    return iv.toString('base64') + ':' + encryptedBuf.toString('base64');
}

/**
 * Decrypt using the same format as EncryptionService
 */
function decrypt(encryptedText, key) {
    const keyBuffer = normalizeKey(key);

    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted format (expected iv:ciphertext)');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const ciphertext = Buffer.from(parts[1], 'base64');

    if (iv.length !== IV_LENGTH) {
        throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return decrypted.toString('utf8');
}

function encryptObject(obj, key) {
    return encrypt(JSON.stringify(obj), key);
}

function decryptObject(encryptedText, key) {
    const decrypted = decrypt(encryptedText, key);
    return JSON.parse(decrypted);
}

function generateSalt() {
    return crypto.randomBytes(16).toString('base64');
}

async function main() {
    // Get encryption key from environment
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    if (!ENCRYPTION_KEY) {
        console.error('❌ ERROR: ENCRYPTION_KEY environment variable is required');
        console.error('   The container should have this from docker-compose.yml');
        process.exit(1);
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       ZakApp Pre-Migration: Salt Generation                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🔑 Using ENCRYPTION_KEY: ${ENCRYPTION_KEY.substring(0, 8)}... (${ENCRYPTION_KEY.length} chars)`);
    console.log(`🔧 Key normalizes to: ${normalizeKey(ENCRYPTION_KEY).length} bytes`);
    console.log('');

    const prisma = new PrismaClient();

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                profile: true,
            }
        });

        console.log(`📋 Found ${users.length} users to process\n`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const user of users) {
            try {
                // Decrypt existing profile (if any)
                let profileData = {};

                if (user.profile) {
                    try {
                        profileData = decryptObject(user.profile, ENCRYPTION_KEY);
                    } catch (decryptError) {
                        console.warn(`   ⚠️  User ${user.id}: Could not decrypt existing profile, will create new one`);
                        console.warn(`       Error: ${decryptError.message}`);
                        profileData = {};
                    }
                }

                // Check if salt already exists
                if (profileData.salt) {
                    console.log(`⏭️  ${user.email}: Already has salt, skipping`);
                    skipped++;
                    continue;
                }

                // Generate new salt
                const salt = generateSalt();

                // Build new profile preserving existing data
                const newProfileData = {
                    ...profileData,
                    salt,
                    email: profileData.email || user.email,
                };

                // Encrypt and save
                const encryptedProfile = encryptObject(newProfileData, ENCRYPTION_KEY);

                await prisma.user.update({
                    where: { id: user.id },
                    data: { profile: encryptedProfile }
                });

                console.log(`✅ ${user.email}: Salt generated and saved`);
                migrated++;

            } catch (userError) {
                console.error(`❌ ${user.email}: Failed - ${userError.message}`);
                errors++;
            }
        }

        // Summary
        console.log('');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                    Migration Summary                       ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║   ✅ Migrated: ${String(migrated).padEnd(44)}║`);
        console.log(`║   ⏭️  Skipped:  ${String(skipped).padEnd(44)}║`);
        console.log(`║   ❌ Errors:   ${String(errors).padEnd(44)}║`);
        console.log(`║   📊 Total:    ${String(users.length).padEnd(44)}║`);
        console.log('╚════════════════════════════════════════════════════════════╝');

        if (errors > 0) {
            console.log('\n⚠️  Some users failed. Please investigate and re-run.');
            process.exit(1);
        } else {
            console.log('\n✅ Pre-migration complete! You can now deploy the new code.');
        }

    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
