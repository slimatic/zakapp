export const UserSettingsSchema = {
    version: 2,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        profileName: {
            type: 'string' // e.g. "My Profile"
        },
        email: {
            type: 'string'
        },
        preferredCalendar: {
            type: 'string',
            default: 'gregorian' // 'hijri' or 'gregorian'
        },
        preferredMethodology: {
            type: 'string',
            default: 'standard' // 'standard', 'hanafi', 'shafi', 'custom'
        },
        baseCurrency: {
            type: 'string',
            default: 'USD'
        },
        language: {
            type: 'string',
            default: 'en'
        },
        theme: {
            type: 'string', // 'light', 'dark', 'system'
            default: 'system'
        },
        lastLoginAt: {
            type: 'string',
            format: 'date-time'
        },
        isSetupCompleted: {
            type: 'boolean',
            default: false
        },
        securityProfile: {
            type: 'object',
            properties: {
                salt: { type: 'string' },
                // A hash of a known token (e.g. "valid") encrypted with the derived key.
                // If we can decrypt and see "valid", the key is correct.
                // OR: a standard hash of the derived key itself (e.g. SHA256(derivedKey)).
                // We'll stick to a simple verifier: "Verifier stored is hash of the key? No that exposes the key."
                // Better: PBKDF2(password, salt) -> Key.
                // Stored Verifier = Hash(Key).
                // Login check: Hash(derivedKey) === Stored Verifier.
                verifier: { type: 'string' }
            }
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id'],
    indexes: []
};
