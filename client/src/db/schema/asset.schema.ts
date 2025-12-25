import { RxJsonSchema } from 'rxdb';

export const AssetSchema: RxJsonSchema<any> = {
    version: 0,
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
            // enum: ['CASH', 'BANK_ACCOUNT', 'GOLD', 'SILVER', 'CRYPTOCURRENCY', 'BUSINESS_ASSETS', 'INVESTMENT_ACCOUNT', 'RETIREMENT', 'REAL_ESTATE', 'DEBTS_OWED_TO_YOU', 'OTHER']
        },
        value: {
            type: 'number'
        },
        currency: {
            type: 'string',
            default: 'USD'
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
        }
    },
    required: ['id', 'name', 'type', 'value']
};
