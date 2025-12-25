
// Script to verify security fixes
// Run with: npx ts-node scripts/verify_security_fix.ts

console.log("--- Verifying JWT_SECRET check ---");
delete process.env.JWT_SECRET;
try {
    jest.resetModules(); // If using jest, but here we use ts-node
    // We need to require the file freshly.
    // Since we are running this script separate from the server, 
    // we can just import the jwt util.
    require('../server/src/utils/jwt');
    console.error("FAIL: JWT_SECRET check passed (it should have failed)");
    process.exit(1);
} catch (e: any) {
    if (e.message.includes('CRITICAL SECURITY ERROR')) {
        console.log("PASS: JWT_SECRET check caught invalid state.");
    } else {
        console.error("FAIL: Caught unexpected error:", e.message);
        process.exit(1);
    }
}

console.log("\n--- Verifying ENCRYPTION_KEY check ---");
delete process.env.ENCRYPTION_KEY;
try {
    // We need to require the file freshly.
    const service = require('../server/src/services/ZakatCalculationService');
    // Note: The check is at top level, so it runs on require.
    console.error("FAIL: ENCRYPTION_KEY check passed (it should have failed)");
    process.exit(1);
} catch (e: any) {
    if (e.message.includes('CRITICAL SECURITY ERROR')) {
        console.log("PASS: ENCRYPTION_KEY check caught invalid state.");
    } else {
        // ZakatCalculationService imports Prisma, which might fail or other things.
        // We look for our specific error.
        if (e.message.includes('CRITICAL SECURITY ERROR')) {
            console.log("PASS: ENCRYPTION_KEY check caught invalid state.");
        } else {
            console.warn("WARN: Caught unexpected error (might be Prisma or other dep):", e.message);
            // If it failed for another reason, we can't be sure, but our check is at the top.
            // Let's assume if it blew up, it's good, but we really want OUR error.
            if (e.message.includes('ENCRYPTION_KEY environment variable is not set')) {
                console.log("PASS: Correct error message found.");
            } else {
                console.log("FAIL: Did not find specific security error.");
            }
        }
    }
}
