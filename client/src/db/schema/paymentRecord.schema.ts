export const PaymentRecordSchema = {
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
        snapshotId: {
            type: 'string',
            maxLength: 100
        },
        calculationId: {
            type: 'string'
        },
        amount: {
            type: 'number'
        },
        paymentDate: {
            type: 'string',
            format: 'date-time',
            maxLength: 30
        },
        recipientName: {
            type: 'string' // Encrypted? Local storage might allow plain if whole DB is encrypted
        },
        recipientType: {
            type: 'string'
        },
        recipientCategory: {
            type: 'string'
        },
        notes: {
            type: 'string'
        },
        receiptReference: {
            type: 'string'
        },
        paymentMethod: {
            type: 'string'
        },
        status: {
            type: 'string' // 'recorded', 'verified'
        },
        currency: {
            type: 'string',
            default: 'USD'
        },
        exchangeRate: {
            type: 'number',
            default: 1.0
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
    required: ['id', 'userId', 'amount', 'paymentDate'],
    indexes: ['userId', 'paymentDate']
};
