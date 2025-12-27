#!/usr/bin/env npx ts-node
/**
 * Post-Migration Verification Script
 * 
 * Run AFTER deploying the project-ikhlas-renovation branch to verify
 * that all users have valid profiles with encryption salts.
 * 
 * Users without a valid salt cannot login to the new system.
 * 
 * Usage:
 *   cd server
 *   ENCRYPTION_KEY="your-key" npx ts-node scripts/verify-migration.ts
 * 
 * @author ZakApp Migration Tool
 * @date 2024-12-27
 */

import { PrismaClient } from '@prisma/client';

// Import EncryptionService - adjust path if needed
const EncryptionServicePath = '../src/services/EncryptionService';

interface ProfileData {
    salt?: string;
    email?: string;
    [key: string]: any;
}

interface VerificationResult {
    id: string;
    email: string;
    status: 'valid' | 'no_profile' | 'no_salt' | 'decrypt_failed';
    error?: string;
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
    console.log('║       ZakApp Post-Migration Verification                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                profile: true,
                userType: true,
            }
        });

        console.log(`📋 Verifying ${users.length} users...\n`);

        const results: VerificationResult[] = [];
        let valid = 0;
        let invalid = 0;

        for (const user of users) {
            const result: VerificationResult = {
                id: user.id,
                email: user.email,
                status: 'valid'
            };

            try {
                // Check 1: Profile exists
                if (!user.profile) {
                    result.status = 'no_profile';
                    result.error = 'No profile data';
                    console.log(`❌ ${user.email}: No profile - CANNOT LOGIN`);
                    invalid++;
                    results.push(result);
                    continue;
                }

                // Check 2: Profile can be decrypted
                let profileData: ProfileData;
                try {
                    profileData = await EncryptionService.decryptObject(user.profile, ENCRYPTION_KEY);
                } catch (decryptError) {
                    result.status = 'decrypt_failed';
                    result.error = String(decryptError);
                    console.log(`❌ ${user.email}: Decryption failed - CANNOT LOGIN`);
                    invalid++;
                    results.push(result);
                    continue;
                }

                // Check 3: Salt exists in profile
                if (!profileData.salt) {
                    result.status = 'no_salt';
                    result.error = 'Salt missing from profile';
                    console.log(`❌ ${user.email}: No salt in profile - CANNOT LOGIN`);
                    invalid++;
                    results.push(result);
                    continue;
                }

                // All checks passed
                console.log(`✅ ${user.email}: Valid (salt: ${profileData.salt.substring(0, 8)}...)`);
                valid++;
                results.push(result);

            } catch (userError) {
                result.status = 'decrypt_failed';
                result.error = String(userError);
                console.log(`❌ ${user.email}: Error - ${userError}`);
                invalid++;
                results.push(result);
            }
        }

        // Summary
        console.log('');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                  Verification Results                      ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║   ✅ Valid:    ${String(valid).padEnd(44)}║`);
        console.log(`║   ❌ Invalid:  ${String(invalid).padEnd(44)}║`);
        console.log(`║   📊 Total:    ${String(users.length).padEnd(44)}║`);
        console.log('╚════════════════════════════════════════════════════════════╝');

        if (invalid > 0) {
            console.log('\n⚠️  MIGRATION INCOMPLETE!');
            console.log('   Some users cannot login. Run pre-migration script:');
            console.log('   npx ts-node scripts/pre-migration-salts.ts');

            // List invalid users
            console.log('\n   Invalid users:');
            results
                .filter(r => r.status !== 'valid')
                .forEach(r => {
                    console.log(`   - ${r.email}: ${r.status} (${r.error})`);
                });

            process.exit(1);
        } else {
            console.log('\n✅ All users are ready for the new system!');
            console.log('   The migration is complete.');
        }

    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
