#!/usr/bin/env npx ts-node
/**
 * Pre-Migration Script: Generate Salts for Existing Users
 * 
 * This script MUST be run BEFORE deploying the project-ikhlas-renovation branch.
 * It adds a cryptographic salt to each user's profile, which is required for
 * the new client-side encryption system.
 * 
 * The salt is used to derive the user's encryption key via PBKDF2.
 * Without a salt, users cannot login to the new system.
 * 
 * Usage:
 *   cd server
 *   ENCRYPTION_KEY="your-key" npx ts-node scripts/pre-migration-salts.ts
 * 
 * Safety:
 *   - This script is idempotent (safe to run multiple times)
 *   - Users who already have a salt are skipped
 *   - Existing profile data is preserved
 * 
 * @author ZakApp Migration Tool
 * @date 2024-12-27
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Import EncryptionService - adjust path if needed
const EncryptionServicePath = '../src/services/EncryptionService';

interface ProfileData {
    salt?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    [key: string]: any;
}

async function main() {
    // Validate environment
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    if (!ENCRYPTION_KEY) {
        console.error('❌ ERROR: ENCRYPTION_KEY environment variable is required');
        console.error('   Set it with: export ENCRYPTION_KEY="your-key"');
        process.exit(1);
    }

    // Dynamic import for EncryptionService
    let EncryptionService: any;
    try {
        const module = await import(EncryptionServicePath);
        EncryptionService = module.EncryptionService;
    } catch (e) {
        console.error('❌ ERROR: Could not load EncryptionService');
        console.error('   Make sure you are running from the server directory');
        console.error('   Error:', e);
        process.exit(1);
    }

    const prisma = new PrismaClient();

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       ZakApp Pre-Migration: Salt Generation                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                profile: true,
                firstName: true,
                lastName: true,
            }
        });

        console.log(`📋 Found ${users.length} users to process\n`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const user of users) {
            try {
                // Decrypt existing profile (if any)
                let profileData: ProfileData = {};

                if (user.profile) {
                    try {
                        profileData = await EncryptionService.decryptObject(user.profile, ENCRYPTION_KEY);
                    } catch (decryptError) {
                        console.warn(`   ⚠️  User ${user.id}: Could not decrypt existing profile, will create new one`);
                        profileData = {};
                    }
                }

                // Check if salt already exists
                if (profileData.salt) {
                    console.log(`⏭️  ${user.email}: Already has salt, skipping`);
                    skipped++;
                    continue;
                }

                // Generate new 16-byte salt (128 bits), base64 encoded
                const saltBytes = crypto.randomBytes(16);
                const salt = saltBytes.toString('base64');

                // Build new profile preserving existing data
                const newProfileData: ProfileData = {
                    ...profileData,
                    salt,
                    // Preserve/add email for the new AuthContext
                    email: profileData.email || user.email,
                };

                // Preserve names from DB if not in profile
                if (!newProfileData.firstName && user.firstName) {
                    newProfileData.firstName = user.firstName;
                }
                if (!newProfileData.lastName && user.lastName) {
                    newProfileData.lastName = user.lastName;
                }

                // Encrypt and save
                const encryptedProfile = await EncryptionService.encryptObject(newProfileData, ENCRYPTION_KEY);

                await prisma.user.update({
                    where: { id: user.id },
                    data: { profile: encryptedProfile }
                });

                console.log(`✅ ${user.email}: Salt generated and saved`);
                migrated++;

            } catch (userError) {
                console.error(`❌ ${user.email}: Failed - ${userError}`);
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
