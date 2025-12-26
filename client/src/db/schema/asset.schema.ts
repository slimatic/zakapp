export const AssetSchema = {
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
        name: {
            type: 'string'
        },
        type: {
            type: 'string',
            maxLength: 50
            // enum: ['CASH', 'BANK_ACCOUNT', 'GOLD', 'SILVER', 'CRYPTOCURRENCY', 'BUSINESS_ASSETS', 'INVESTMENT_ACCOUNT', 'RETIREMENT', 'REAL_ESTATE', 'DEBTS_OWED_TO_YOU', 'OTHER']
        },
        value: {
            type: 'number'
        },
        currency: {
            type: 'string',
            default: 'USD',
            maxLength: 3
        },
        description: {
            type: 'string'
        },
        metadata: {
            type: 'string' // Encrypted JSON
        },
        isActive: {
            type: 'boolean',
            default: true
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        },
        acquisitionDate: {
            type: 'string',
            format: 'date-time',
            maxLength: 30
        },
        notes: {
            type: 'string'
        },
        calculationModifier: {
            type: 'number',
            default: 1.0
        },
        isPassiveInvestment: {
            type: 'boolean',
            default: false
        },
        isRestrictedAccount: {
            type: 'boolean',
            default: false
        }
    },
    required: ['id', 'name', 'type', 'value', 'acquisitionDate', 'isActive'],
    indexes: ['type', 'isActive', 'acquisitionDate']
};
