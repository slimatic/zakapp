export const NisabYearRecordSchema = {
    version: 3,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        userId: {
            type: 'string',
            maxLength: 100
        },
        // Hawl Tracking
        hawlStartDate: {
            type: 'string',
            format: 'date-time',
            maxLength: 30
        },
        hawlStartDateHijri: {
            type: 'string'
        },
        hawlCompletionDate: {
            type: 'string',
            format: 'date-time'
        },
        hawlCompletionDateHijri: {
            type: 'string'
        },
        nisabThresholdAtStart: {
            type: 'string' // Encrypted or plain? Using plain for local default, assume encryption handled by service
        },
        nisabBasis: {
            type: 'string' // 'gold' or 'silver'
        },

        // Calculation Results
        calculationDate: {
            type: 'string',
            format: 'date-time'
        },
        gregorianYear: {
            type: 'number'
        },
        hijriYear: {
            type: 'number'
        },
        totalWealth: {
            type: 'number'
        },
        totalLiabilities: {
            type: 'number'
        },
        zakatableWealth: {
            type: 'number'
        },
        zakatAmount: {
            type: 'number'
        },
        currency: {
            type: 'string',
            default: 'USD'
        },
        methodologyUsed: {
            type: 'string'
        },

        status: {
            type: 'string', // 'DRAFT', 'FINALIZED', 'UNLOCKED'
            default: 'DRAFT',
            maxLength: 20
        },

        assetBreakdown: {
            type: 'string' // JSON
        },
        calculationDetails: {
            type: 'string' // JSON
        },
        userNotes: {
            type: 'string'
        },
        isPrimary: {
            type: 'boolean',
            default: false
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
    required: ['id', 'userId', 'status', 'hawlStartDate'],
    indexes: ['userId', 'hawlStartDate', 'status']
};
