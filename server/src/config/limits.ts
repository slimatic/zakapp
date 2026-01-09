
export const DEFAULT_LIMITS = {
    MAX_ASSETS: Number(process.env.DEFAULT_MAX_ASSETS) || 20,
    MAX_NISAB_RECORDS: Number(process.env.DEFAULT_MAX_NISAB_RECORDS) || 3,
    MAX_PAYMENTS: Number(process.env.DEFAULT_MAX_PAYMENTS) || 25,
    MAX_LIABILITIES: Number(process.env.DEFAULT_MAX_LIABILITIES) || 2,
};
