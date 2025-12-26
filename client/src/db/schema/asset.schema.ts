export const AssetSchema = {
    version: 3,
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
            type: 'string',
            encrypted: true
        },
        type: {
            type: 'string',
            maxLength: 50
        },
        value: {
            type: 'number',
            encrypted: true
        },
        currency: {
            type: 'string',
            default: 'USD',
            maxLength: 3
        },
        description: {
            type: 'string',
            encrypted: true
        },
        metadata: {
            type: 'string', // Encrypted JSON
            encrypted: true
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
            type: 'string',
            encrypted: true
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
