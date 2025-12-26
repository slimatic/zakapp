/**
 * Security Configuration
 * Centralized secret management to prevent hardcoded fallbacks.
 */

export const getEncryptionKey = (): string => {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_KEY environment variable is not set. Application cannot start securely.');
    }
    return process.env.ENCRYPTION_KEY;
};

export const getJwtSecret = (): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set. Application cannot start securely.');
    }
    return process.env.JWT_SECRET;
};
