export const LiabilitySchema = {
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
        },
        amount: {
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
        dueDate: {
            type: 'string',
            format: 'date-time',
            maxLength: 30
        },
        creditor: {
            type: 'string'
        },
        notes: {
            type: 'string'
        }
    },
    required: ['id', 'name', 'type', 'amount', 'isActive', 'dueDate'],
    indexes: ['type', 'isActive', 'dueDate']
};
