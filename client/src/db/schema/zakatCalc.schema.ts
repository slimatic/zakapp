export const ZakatCalculationSchema = {
    version: 2,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        userId: {
            type: 'string'
        },
        calculationDate: {
            type: 'string',
            format: 'date-time'
        },
        methodology: {
            type: 'string'
        },
        calendarType: {
            type: 'string'
        },
        totalAssets: {
            type: 'number'
        },
        totalLiabilities: {
            type: 'number'
        },
        netWorth: {
            type: 'number'
        },
        nisabThreshold: {
            type: 'number'
        },
        nisabSource: {
            type: 'string'
        },
        isZakatObligatory: {
            type: 'boolean'
        },
        zakatAmount: {
            type: 'number'
        },
        zakatRate: {
            type: 'number'
        },
        breakdown: {
            type: 'string' // Encrypted JSON
        },
        assetsIncluded: {
            type: 'string' // Encrypted JSON
        },
        liabilitiesIncluded: {
            type: 'string' // Encrypted JSON
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id', 'userId', 'calculationDate', 'zakatAmount']
};
