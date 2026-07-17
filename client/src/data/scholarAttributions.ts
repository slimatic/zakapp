/**
 * Copyright (c) 2024 ZakApp Contributors
 * GNU Affero General Public License v3.0+
 */

/**
 * Scholar attribution map for Zakat calculation rules.
 * Used in PDF exports to cite sources for each line item.
 */

export interface ScholarAttribution {
  rule: string;
  scholarName: string;
  source: string;
  detail: string;
}

export type ScholarAttributionMap = Record<string, ScholarAttribution>;

/** Attribution for asset-level Zakat eligibility decisions */
export const ASSET_TYPE_ATTRIBUTIONS: ScholarAttributionMap = {
  CASH: {
    rule: 'Cash & Bank Balances',
    scholarName: 'Classical consensus (Ijma\')',
    source: 'Qur’an 9:103; Sahih al-Bukhari 1461',
    detail: 'Currency held in hand or deposit is fully zakatable at face value — unanimous classical ruling.',
  },
  BANK_ACCOUNT: {
    rule: 'Bank Account Balances',
    scholarName: 'Classical consensus (Ijma\')',
    source: 'Contemporary Ijma\'; AAOIFI Shariah Standard No. 35',
    detail: 'Modern bank balances treated analogously to cash (qiyas al-awlawi).',
  },
  GOLD: {
    rule: 'Gold Bullion & Jewelry',
    scholarName: 'Imam Abu Hanifa',
    source: 'Al-Hidayah, Kitab al-Zakat',
    detail: 'All gold, including personal jewelry, is zakatable (Hanafi). Shafi\'i/Maliki exempt personal-use jewelry.',
  },
  SILVER: {
    rule: 'Silver Bullion & Jewelry',
    scholarName: 'Imam Abu Hanifa',
    source: 'Al-Hidayah, Kitab al-Zakat',
    detail: 'Same ruling as gold — zakatable per Hanafi; personal-use exempt per Shafi\'i/Maliki.',
  },
  CRYPTOCURRENCY: {
    rule: 'Cryptocurrency',
    scholarName: 'Dr. Salah Al-Sawy',
    source: 'AMJA Resolution on Bitcoin (2018); AAOIFI',
    detail: 'Treated as a new monetary medium (thaman istilahi). Zakatable at full market value if held as wealth.',
  },
  BUSINESS_ASSETS: {
    rule: 'Business Inventory & Trade Goods',
    scholarName: 'Classical consensus (Ijma\')',
    source: 'Sahih Muslim 1584; Al-Muwatta\'',
    detail: 'Trade inventory (\'urud al-tijara) zakatable at current market value at Hawl end.',
  },
  INVESTMENT_ACCOUNT: {
    rule: 'Investment / Brokerage Accounts',
    scholarName: 'AAOIFI Shariah Board',
    source: 'AAOIFI Shariah Standard No. 35, §4.2',
    detail: 'Marketable securities are zakatable. Zakatable value = current market value × eligible portion.',
  },
  RETIREMENT: {
    rule: 'Retirement Accounts (401k, IRA)',
    scholarName: 'Dr. Salah Al-Sawy / ISNA Fiqh Council',
    source: 'AMJA Resolution on Retirement Accounts (2012)',
    detail: 'Two scholarly opinions: (A) Collectible value minus penalties & taxes; (B) Preserved-growth rule (0.5%).',
  },
  REAL_ESTATE: {
    rule: 'Real Estate (Investment)',
    scholarName: 'Contemporary Fiqh Councils',
    source: 'AAOIFI Shariah Standard No. 35',
    detail: 'Property held for investment/resale zakatable at market value. Personal residence exempt.',
  },
  DEBTS_OWED_TO_YOU: {
    rule: 'Debts Owed to You',
    scholarName: 'Classical consensus (with conditions)',
    source: 'Al-Majmu\' (al-Nawawi); Fath al-Bari',
    detail: 'Zakatable only if the debtor is solvent and payment is expected.',
  },
  OTHER: {
    rule: 'Other Assets',
    scholarName: 'User discretion / local scholar',
    source: 'Consult qualified scholar',
    detail: 'Assets not fitting standard categories require individual scholarly assessment.',
  },
};

/** Attribution for liability deduction rules */
export const LIABILITY_ATTRIBUTIONS: ScholarAttributionMap = {
  SHORT_TERM: {
    rule: 'Immediate Debts (due ≤ 12 months)',
    scholarName: 'Classical consensus (Ijma\')',
    source: 'Sahih Muslim 987; Al-Hidayah',
    detail: 'Debts due within the Hawl period are fully deductible from Zakatable wealth.',
  },
  LONG_TERM: {
    rule: 'Long-Term Debts (mortgages, loans)',
    scholarName: 'Contemporary majority opinion',
    source: 'AAOIFI Shariah Standard No. 35; AMJA Fatwa (2012)',
    detail: 'Only payments due within the coming lunar year are deductible. Full principal deduction negates Zakat obligation.',
  },
  BUSINESS_DEBT: {
    rule: 'Business Payables',
    scholarName: 'Classical consensus',
    source: 'Al-Majmu\' (al-Nawawi)',
    detail: 'Trade debts (dayn tijari) are deductible if due within the Hawl.',
  },
  CREDIT_CARD: {
    rule: 'Credit Card Balances',
    scholarName: 'Contemporary Fiqh Councils',
    source: 'European Council for Fatwa and Research (ECFR); AMJA',
    detail: 'Only the current statement balance (amount due now) is deductible, not future spending.',
  },
};

/** Attribution for methodology choice */
export const METHODOLOGY_ATTRIBUTIONS: Record<string, ScholarAttribution> = {
  STANDARD: {
    rule: 'Standard (AAOIFI)',
    scholarName: 'AAOIFI Shariah Board',
    source: 'AAOIFI Shariah Standard No. 35 — Zakat',
    detail: 'Contemporary scholarly consensus (Ijma\') for modern financial instruments. Gold-based Nisab (85g).',
  },
  HANAFI: {
    rule: 'Hanafi School',
    scholarName: 'Imam Abu Hanifa & successors',
    source: 'Al-Hidayah (al-Marghinani); Fatawa Alamgiri',
    detail: 'Silver-based Nisab (595g) — lower threshold, more inclusive. Jewelry zakatable.',
  },
  SHAFII: {
    rule: 'Shafi\'i School',
    scholarName: 'Imam al-Shafi\'i & successors',
    source: 'Al-Umm; Minhaj al-Talibin (al-Nawawi)',
    detail: 'Gold-based Nisab (85g). Personal jewelry exempt. Detailed asset categorization.',
  },
  MALIKI: {
    rule: 'Maliki School',
    scholarName: 'Imam Malik & successors',
    source: 'Al-Mudawwana al-Kubra; Risala (Ibn Abi Zayd)',
    detail: 'Gold-based Nisab. Personal jewelry exempt. Similar to standard in many aspects.',
  },
  HANBALI: {
    rule: 'Hanbali School',
    scholarName: 'Imam Ahmad ibn Hanbal & successors',
    source: 'Al-Mughni (Ibn Qudama); Kashshaf al-Qina\'',
    detail: 'Gold-based Nisab. Personal jewelry exempt. Conservative in liability deductions.',
  },
};

/** Attribution for Nisab threshold */
export const NISAB_ATTRIBUTIONS: Record<string, ScholarAttribution> = {
  GOLD: {
    rule: 'Gold Nisab Standard',
    scholarName: 'Majority of scholars',
    source: 'Sahih al-Bukhari 1455; Sahih Muslim 1579',
    detail: '85 grams of pure gold (~20 Mithqal). Gold price reflects contemporary purchasing power.',
  },
  SILVER: {
    rule: 'Silver Nisab Standard',
    scholarName: 'Imam Abu Hanifa',
    source: 'Al-Hidayah; Fatawa Alamgiri',
    detail: '595 grams of pure silver (~200 Dirham). Lower threshold makes more people liable — precautionary (ahwat) for recipients.',
  },
};

/** Global PDF disclaimer text */
export const ZAKAT_STATEMENT_DISCLAIMER = `
IMPORTANT DISCLAIMER:
This Zakat Statement is generated by ZakApp based on user-provided asset and liability data.
It is a computational aid, not a religious ruling (fatwa). The scholarly attributions reflect
commonly-held positions but do not replace consultation with a qualified local scholar.
Zakat obligations vary by individual circumstance, regional practice, and scholarly opinion.

ZakApp encourages every user to verify calculations with a trusted religious authority.
`;
