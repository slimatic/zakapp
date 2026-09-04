/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Multi-Madhab Ruling Transparency Engine
 *
 * Curated dataset explaining WHY each asset type is zakatable or exempt
 * under each calculation methodology, with scholarly citations.
 *
 * SYNC CONTRACT: this registry must cover every MethodologyName × AssetType
 * pair that exists in core/calculations/methodology.ts and must agree with
 * isAssetZakatable for type-default scenarios. Enforced by
 * __tests__/unit/rulings.test.ts — CI fails if the registry drifts.
 *
 * ⚠️ Educational summaries only — users should consult qualified scholars.
 */

import { AssetType } from '../types/index';
import {
  METHODOLOGIES,
  getMethodology,
  type MethodologyName,
} from '../core/calculations/methodology';

export interface Citation {
  /** Human-readable source reference, e.g. "Fiqh al-Zakat — Yusuf al-Qaradawi" */
  text: string;
  /** Optional link to a readable public source */
  url?: string;
}

export interface RulingExplanation {
  /** Short statement of the rule */
  ruling: string;
  /** Why this rule applies to this asset decision */
  reasoning: string;
  citations: Citation[];
}

export type RulingStatus = 'zakatable' | 'exempt' | 'override-zakatable' | 'override-exempt';

export interface AssetRuling {
  status: RulingStatus;
  /** What the madhab says by default for this asset type */
  madhabDefault: RulingExplanation;
  /** Present only when the user overrode the madhab default (zakatEligible true/false) */
  override?: RulingExplanation;
  citations: Citation[];
}

// Re-export for consumer convenience
export type { MethodologyName };

type Registry = Record<MethodologyName, Partial<Record<AssetType, RulingExplanation>>>;

const quran = (ref: string, url: string): Citation => ({ text: `Quran ${ref}`, url });
const hadith = (ref: string, url: string): Citation => ({ text: `Hadith — ${ref}`, url });

// Frequently reused citations
const CIT = {
  aaoifiZakat: {
    text: 'AAOIFI Shari\'ah Standard No. 35 — Zakat',
    url: 'https://aaoifi.com/shariah-standards/',
  },
  fiqhAlZakat: {
    text: 'Fiqh al-Zakat — Yusuf al-Qaradawi',
    url: 'https://www.onislam.net/english/shariah/hadeeth-and-sunnah/459447-fiqh-az-zakah-yusuf-al-qaradawi.html',
  },
  quran960: quran('9:60 (categories of zakat recipients)', 'https://quran.com/9/60'),
  quran271: quran('2:271 (charity and purification)', 'https://quran.com/2/271'),
  bukhariZakat: hadith(
    'Sahih al-Bukhari 534 — "There is no Zakat on gold less than 20 mithqal"',
    'https://sunnah.com/bukhari:534'
  ),
  bukhariSilver: hadith(
    'Sahih al-Bukhari 1447 — silver at 200 dirhams, 2.5% due',
    'https://sunnah.com/bukhari:1447'
  ),
  amjaZakat: {
    text: 'AMJA Fatwas on Zakat of modern financial instruments',
    url: 'https://www.amjafatwa.org/',
  },
  seekersGuidanceZakat: {
    text: 'SeekersGuidance — Zakat answers (Hanafi/Shafi\'i/Maliki/Hanbali)',
    url: 'https://seekersguidance.org/answers/?s=zakat',
  },
  fcnaZakat: {
    text: 'Fiqh Council of North America — Zakat guidelines',
    url: 'https://www.fiqhcouncil.org/',
  },
} as const;

/**
 * Per-madhab general framing used in reasoning strings
 */
const SCHOOL: Record<
  MethodologyName,
  { label: string; nisab: string; debts: string; notes: string }
> = {
  STANDARD: {
    label: 'Standard (AAOIFI)',
    nisab: 'gold-based nisab (85g of gold)',
    debts: 'basic debt deduction (loans and business debt)',
    notes: 'Modern AAOIFI-aligned standard for contemporary financial instruments.',
  },
  HANAFI: {
    label: 'Hanafi',
    nisab: 'silver-based nisab (the lower, precautionary threshold)',
    debts: 'broader debt deductions (loans, mortgages, credit cards, business debt)',
    notes: 'The Hanafi school treats personal jewelry as zakatable and prefers the silver nisab.',
  },
  SHAFII: {
    label: 'Shafi\'i',
    nisab: 'gold-based nisab (85g)',
    debts: 'stricter, narrower debt deductions',
    notes: "The Shafi'i school exempts personal-use jewelry from Zakat.",
  },
  MALIKI: {
    label: 'Maliki',
    nisab: 'gold-based nisab (85g)',
    debts: 'narrow debt deductions',
    notes: 'The Maliki school exempts personal-use jewelry and applies gold nisab.',
  },
  HANBALI: {
    label: 'Hanbali',
    nisab: 'gold-based nisab (85g)',
    debts: 'narrow debt deductions',
    notes: 'The Hanbali school exempts personal-use jewelry and applies gold nisab.',
  },
};

const z = (school: string, extra = ''): RulingExplanation['reasoning'] =>
  `Under the ${school} methodology this asset type is zakatable at the standard 2.5% rate once your wealth exceeds the nisab threshold. ${extra}`;

const e = (school: string, why: string): RulingExplanation['reasoning'] =>
  `Under the ${school} methodology this asset type is exempt from Zakat. ${why}`;

/**
 * THE REGISTRY — 5 methodologies × 11 asset types.
 * Keys must stay in sync with METHODOLOGIES in core/calculations/methodology.ts.
 */
export const RULINGS: Registry = {
  STANDARD: {
    [AssetType.CASH]: {
      ruling: 'Zakatable at 2.5%.',
      reasoning: z(SCHOOL.STANDARD.label, 'Cash is the most liquid form of wealth and the clearest case for Zakat.'),
      citations: [CIT.aaoifiZakat, CIT.bukhariSilver, CIT.quran960],
    },
    [AssetType.BANK_ACCOUNT]: {
      ruling: 'Zakatable at 2.5%.',
      reasoning: z(SCHOOL.STANDARD.label, 'Bank balances are treated as cash equivalents for Zakat purposes.'),
      citations: [CIT.aaoifiZakat, CIT.quran960],
    },
    [AssetType.GOLD]: {
      ruling: 'Zakatable at 2.5% once the nisab (85g gold) is met.',
      reasoning: z(SCHOOL.STANDARD.label, 'Gold held as savings or investment is zakatable; the AAOIFI standard uses the gold nisab.'),
      citations: [CIT.bukhariZakat, CIT.aaoifiZakat],
    },
    [AssetType.SILVER]: {
      ruling: 'Zakatable at 2.5% once the nisab is met.',
      reasoning: z(SCHOOL.STANDARD.label, 'Silver is zakatable like gold; classical texts fix the silver nisab at 200 dirhams (≈612g).'),
      citations: [CIT.bukhariSilver, CIT.aaoifiZakat],
    },
    [AssetType.CRYPTOCURRENCY]: {
      ruling: 'Treated as a currency-like asset; zakatable at 2.5% of market value.',
      reasoning: z(SCHOOL.STANDARD.label, 'Contemporary fatwa bodies generally treat crypto as a zakatable monetary asset at market value on the zakat date. Individual scholars differ.'),
      citations: [CIT.amjaZakat, CIT.fcnaZakat],
    },
    [AssetType.BUSINESS_ASSETS]: {
      ruling: 'Zakatable at 2.5% of current market value (inventory/trade goods).',
      reasoning: z(SCHOOL.STANDARD.label, 'Assets held for trade are zakatable on their current market value.'),
      citations: [CIT.aaoifiZakat, CIT.fiqhAlZakat],
    },
    [AssetType.RETIREMENT]: {
      ruling: 'Zakatable at 2.5%; contemporary standard treats retirement balances as zakatable wealth.',
      reasoning: z(SCHOOL.STANDARD.label, 'AAOIFI-aligned practice and FCNA guidance treat 401(k)/IRA balances as annually zakatable; ZakApp also lets you apply a net-withdrawable method per your scholar\'s opinion.'),
      citations: [CIT.fcnaZakat, CIT.amjaZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.INVESTMENT_ACCOUNT]: {
      ruling: 'Zakatable at 2.5% of account value.',
      reasoning: z(SCHOOL.STANDARD.label, 'Investment accounts are treated as zakatable capital in the AAOIFI standard.'),
      citations: [CIT.aaoifiZakat, CIT.fiqhAlZakat],
    },
    [AssetType.REAL_ESTATE]: {
      ruling: 'Exempt unless held for trade; rental income is zakatable.',
      reasoning: e(SCHOOL.STANDARD.label, 'Property held for personal use is not zakatable; only property held as trade stock (or its rental income once held for a lunar year) is. Mark it zakatEligible if your scholar treats it differently.'),
      citations: [CIT.fiqhAlZakat, CIT.aaoifiZakat],
    },
    [AssetType.DEBTS_OWED_TO_YOU]: {
      ruling: 'Zakatable if realistically collectible.',
      reasoning: z(SCHOOL.STANDARD.label, 'Strong debts (collectible) are included in zakatable wealth; doubtful or bad debts are not. Use the override if your situation differs.'),
      citations: [CIT.fiqhAlZakat, CIT.aaoifiZakat],
    },
    [AssetType.OTHER]: {
      ruling: 'Default: not zakatable unless you mark it zakatable.',
      reasoning: z(SCHOOL.STANDARD.label, 'Unclassified assets follow your explicit judgment — set zakatEligible on the asset and the app will follow it.'),
      citations: [CIT.aaoifiZakat, CIT.seekersGuidanceZakat],
    },
  },

  HANAFI: {
    [AssetType.CASH]: {
      ruling: 'Zakatable at 2.5% against the silver nisab.',
      reasoning: z(SCHOOL.HANAFI.label, 'The Hanafi school prefers the silver nisab (595g), the lower precautionary threshold, so more wealth becomes zakatable earlier.'),
      citations: [CIT.bukhariSilver, CIT.seekersGuidanceZakat],
    },
    [AssetType.BANK_ACCOUNT]: {
      ruling: 'Zakatable at 2.5% against the silver nisab.',
      reasoning: z(SCHOOL.HANAFI.label, 'Bank balances follow the cash ruling; the silver nisab lowers the threshold.'),
      citations: [CIT.bukhariSilver, CIT.seekersGuidanceZakat],
    },
    [AssetType.GOLD]: {
      ruling: 'Zakatable at 2.5% — including personal jewelry.',
      reasoning: `${SCHOOL.HANAFI.notes} This is the distinguishing Hanafi position: gold jewelry is not exempt merely for personal use.`,
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.SILVER]: {
      ruling: 'Zakatable at 2.5% — including personal jewelry and utensils above nisab.',
      reasoning: `${SCHOOL.HANAFI.notes} Silver items follow the same inclusive treatment as gold.`,
      citations: [CIT.bukhariSilver, CIT.seekersGuidanceZakat],
    },
    [AssetType.CRYPTOCURRENCY]: {
      ruling: 'Treated as currency; zakatable at 2.5% of market value.',
      reasoning: z(SCHOOL.HANAFI.label, 'Contemporary Hanafi fatwa bodies apply currency rules to crypto, measured against the silver nisab.'),
      citations: [CIT.amjaZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.BUSINESS_ASSETS]: {
      ruling: 'Zakatable at 2.5% on inventory value.',
      reasoning: z(SCHOOL.HANAFI.label, 'Trade goods are zakatable on current value after the broader Hanafi liability deductions.'),
      citations: [CIT.fiqhAlZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.RETIREMENT]: {
      ruling: 'Hanafi contemporary guidance commonly treats accessible retirement funds as zakatable.',
      reasoning: z(SCHOOL.HANAFI.label, 'Many contemporary Hanafi scholars treat 401(k)/IRA as annually zakatable (full-balance view); others defer until withdrawal. ZakApp lets you choose per asset.'),
      citations: [CIT.fcnaZakat, CIT.seekersGuidanceZakat, CIT.amjaZakat],
    },
    [AssetType.INVESTMENT_ACCOUNT]: {
      ruling: 'Zakatable at 2.5% of account value.',
      reasoning: z(SCHOOL.HANAFI.label, 'Investment portfolios are zakatable; the Hanafi school applies its broader deductions first.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.REAL_ESTATE]: {
      ruling: 'Exempt unless held for trade; rental income zakatable.',
      reasoning: e(SCHOOL.HANAFI.label, 'Hanafi fiqh exempts personally-used property; homes held for resale are trade goods and zakatable.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.DEBTS_OWED_TO_YOU]: {
      ruling: 'Zakatable if a strong claim (collectible).',
      reasoning: z(SCHOOL.HANAFI.label, 'The Hanafi school includes strong debts and treats weak claims differently — apply the override per your scholar.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.OTHER]: {
      ruling: 'Default: not zakatable unless you mark it zakatable.',
      reasoning: z(SCHOOL.HANAFI.label, 'Unclassified assets follow your explicit judgment after consulting your scholar.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
  },

  SHAFII: {
    [AssetType.CASH]: {
      ruling: 'Zakatable at 2.5% against the gold nisab.',
      reasoning: z(SCHOOL.SHAFII.label, 'Cash is zakatable in all schools; the Shafi\'i school measures the nisab in gold (85g).'),
      citations: [CIT.bukhariZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.BANK_ACCOUNT]: {
      ruling: 'Zakatable at 2.5% against the gold nisab.',
      reasoning: z(SCHOOL.SHAFII.label, 'Bank balances are cash equivalents.'),
      citations: [CIT.bukhariZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.GOLD]: {
      ruling: 'Personal jewelry exempt; investment/hoarded gold zakatable.',
      reasoning: `${SCHOOL.SHAFII.notes} Gold bought as savings or trade is zakatable; ordinary personal-use jewelry is not.`,
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.SILVER]: {
      ruling: 'Personal jewelry exempt; hoarded/investment silver zakatable.',
      reasoning: `${SCHOOL.SHAFII.notes} The same personal-use exemption applies to silver.`,
      citations: [CIT.bukhariSilver, CIT.seekersGuidanceZakat],
    },
    [AssetType.CRYPTOCURRENCY]: {
      ruling: 'Zakatable at 2.5% of market value as a monetary asset.',
      reasoning: z(SCHOOL.SHAFII.label, 'Contemporary Shafi\'i-oriented fatwa bodies treat crypto under currency rules.'),
      citations: [CIT.amjaZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.BUSINESS_ASSETS]: {
      ruling: 'Zakatable at 2.5% on inventory/trade goods.',
      reasoning: z(SCHOOL.SHAFII.label, 'The Shafi\'i school applies detailed categorization; trade stock is zakatable at market value.'),
      citations: [CIT.fiqhAlZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.RETIREMENT]: {
      ruling: 'Contemporary guidance commonly applies the accessible/collectible-value approach.',
      reasoning: z(SCHOOL.SHAFII.label, 'Many Shafi\'i contemporary scholars zakatize the net accessible portion of retirement accounts; ZakApp supports the net-withdrawable method per asset.'),
      citations: [CIT.seekersGuidanceZakat, CIT.amjaZakat],
    },
    [AssetType.INVESTMENT_ACCOUNT]: {
      ruling: 'Zakatable at 2.5% of account value.',
      reasoning: z(SCHOOL.SHAFII.label, 'Investment accounts are zakatable once the lunar year completes above nisab.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.REAL_ESTATE]: {
      ruling: 'Exempt unless held for trade.',
      reasoning: e(SCHOOL.SHAFII.label, 'Personally-used property is exempt; trade-property follows trade-goods rules.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.DEBTS_OWED_TO_YOU]: {
      ruling: 'Zakatable when the debtor is able and the claim is strong.',
      reasoning: z(SCHOOL.SHAFII.label, 'Strong debts enter the zakat base; hopeless debts are excused until recovered.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.OTHER]: {
      ruling: 'Default: not zakatable unless you mark it zakatable.',
      reasoning: z(SCHOOL.SHAFII.label, 'Unclassified assets follow your explicit judgment.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
  },

  MALIKI: {
    [AssetType.CASH]: {
      ruling: 'Zakatable at 2.5% against the gold nisab.',
      reasoning: z(SCHOOL.MALIKI.label, 'Cash is zakatable in all schools; the Maliki school measures the nisab in gold.'),
      citations: [CIT.bukhariZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.BANK_ACCOUNT]: {
      ruling: 'Zakatable at 2.5% against the gold nisab.',
      reasoning: z(SCHOOL.MALIKI.label, 'Bank balances are treated as cash equivalents.'),
      citations: [CIT.bukhariZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.GOLD]: {
      ruling: 'Personal jewelry exempt; hoarded or investment gold zakatable.',
      reasoning: `${SCHOOL.MALIKI.notes} The Maliki school exempts modest personal-use jewelry; large hoards meant as savings are zakatable.`,
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.SILVER]: {
      ruling: 'Personal jewelry exempt; hoarded silver zakatable.',
      reasoning: `${SCHOOL.MALIKI.notes} The same personal-use exemption applies to silver items.`,
      citations: [CIT.bukhariSilver, CIT.seekersGuidanceZakat],
    },
    [AssetType.CRYPTOCURRENCY]: {
      ruling: 'Zakatable at 2.5% of market value as a monetary asset.',
      reasoning: z(SCHOOL.MALIKI.label, 'Contemporary Maliki-oriented scholarship applies currency rules to crypto at market value.'),
      citations: [CIT.amjaZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.BUSINESS_ASSETS]: {
      ruling: 'Zakatable at 2.5% on trade inventory.',
      reasoning: z(SCHOOL.MALIKI.label, 'Goods intended for trade are zakatable at market value after a lunar year.'),
      citations: [CIT.fiqhAlZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.RETIREMENT]: {
      ruling: 'Treated per contemporary Maliki guidance on inaccessible vs accessible funds.',
      reasoning: z(SCHOOL.MALIKI.label, 'Maliki contemporary positions often focus on what is effectively accessible; ZakApp supports per-asset methods — confirm with your scholar.'),
      citations: [CIT.seekersGuidanceZakat, CIT.amjaZakat],
    },
    [AssetType.INVESTMENT_ACCOUNT]: {
      ruling: 'Zakatable at 2.5% of account value.',
      reasoning: z(SCHOOL.MALIKI.label, 'Investment accounts are zakatable once hawl completes above nisab.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.REAL_ESTATE]: {
      ruling: 'Exempt unless held for trade; the Maliki school is notably strict on property held for appreciation.',
      reasoning: e(SCHOOL.MALIKI.label, 'Maliki fiqh treats land/property bought for resale as trade goods and zakatable even without rental — mark zakatEligible if that applies.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.DEBTS_OWED_TO_YOU]: {
      ruling: 'Zakatable when collectible.',
      reasoning: z(SCHOOL.MALIKI.label, 'Strong claims join the zakat base; doubtful debts wait until recovered.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.OTHER]: {
      ruling: 'Default: not zakatable unless you mark it zakatable.',
      reasoning: z(SCHOOL.MALIKI.label, 'Unclassified assets follow your explicit judgment.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
  },

  HANBALI: {
    [AssetType.CASH]: {
      ruling: 'Zakatable at 2.5% against the gold nisab.',
      reasoning: z(SCHOOL.HANBALI.label, 'Cash is zakatable in all schools; the Hanbali school measures the nisab in gold.'),
      citations: [CIT.bukhariZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.BANK_ACCOUNT]: {
      ruling: 'Zakatable at 2.5% against the gold nisab.',
      reasoning: z(SCHOOL.HANBALI.label, 'Bank balances are treated as cash equivalents.'),
      citations: [CIT.bukhariZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.GOLD]: {
      ruling: 'Personal jewelry exempt; savings/hoarded gold zakatable.',
      reasoning: `${SCHOOL.HANBALI.notes} Gold held as a store of value is zakatable; modest personal-use jewelry is not.`,
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.SILVER]: {
      ruling: 'Personal jewelry exempt; hoarded silver zakatable.',
      reasoning: `${SCHOOL.HANBALI.notes} The personal-use exemption applies to silver as well.`,
      citations: [CIT.bukhariSilver, CIT.seekersGuidanceZakat],
    },
    [AssetType.CRYPTOCURRENCY]: {
      ruling: 'Zakatable at 2.5% of market value as a monetary asset.',
      reasoning: z(SCHOOL.HANBALI.label, 'Contemporary Hanbali-oriented scholarship treats crypto under currency rules.'),
      citations: [CIT.amjaZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.BUSINESS_ASSETS]: {
      ruling: 'Zakatable at 2.5% on trade inventory.',
      reasoning: z(SCHOOL.HANBALI.label, 'Trade goods are zakatable at market value after the lunar year completes.'),
      citations: [CIT.fiqhAlZakat, CIT.seekersGuidanceZakat],
    },
    [AssetType.RETIREMENT]: {
      ruling: 'Treated per contemporary Hanbali guidance; accessible funds commonly zakatable.',
      reasoning: z(SCHOOL.HANBALI.label, 'Confirm the treatment of locked retirement funds with your scholar; ZakApp supports per-asset methods.'),
      citations: [CIT.seekersGuidanceZakat, CIT.amjaZakat],
    },
    [AssetType.INVESTMENT_ACCOUNT]: {
      ruling: 'Zakatable at 2.5% of account value.',
      reasoning: z(SCHOOL.HANBALI.label, 'Investment accounts are zakatable once hawl completes above nisab.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.REAL_ESTATE]: {
      ruling: 'Exempt unless held for trade.',
      reasoning: e(SCHOOL.HANBALI.label, 'Personally-used property is exempt; property held for resale follows trade-goods rules.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.DEBTS_OWED_TO_YOU]: {
      ruling: 'Zakatable when collectible.',
      reasoning: z(SCHOOL.HANBALI.label, 'Strong claims join the zakat base; hopeless debts are deferred.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
    [AssetType.OTHER]: {
      ruling: 'Default: not zakatable unless you mark it zakatable.',
      reasoning: z(SCHOOL.HANBALI.label, 'Unclassified assets follow your explicit judgment.'),
      citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
    },
  },
};

/**
 * Get the default madhab ruling for a methodology × asset type.
 * Returns null only if the pair is unregistered (CI test prevents this).
 */
export function getRulingForType(
  methodologyName: MethodologyName,
  assetType: AssetType
): RulingExplanation | null {
  const registry = RULINGS[methodologyName];
  return registry?.[assetType] ?? null;
}

/**
 * Fallback when a ruling entry is somehow missing — never return null to the UI path.
 */
function fallbackRuling(methodologyName: MethodologyName): RulingExplanation {
  const school = SCHOOL[methodologyName] ?? SCHOOL.STANDARD;
  return {
    ruling: `Ruling follows the ${school.label} methodology's general principles.`,
    reasoning: `A specific entry for this asset type is unavailable. ${school.notes} Zakat is generally due at 2.5% on zakatable wealth above the ${school.nisab}. Please confirm with a qualified scholar.`,
    citations: [CIT.seekersGuidanceZakat, CIT.fiqhAlZakat],
  };
}

const ASSET_LABELS: Record<AssetType, string> = {
  [AssetType.CASH]: 'Cash',
  [AssetType.BANK_ACCOUNT]: 'Bank account',
  [AssetType.GOLD]: 'Gold',
  [AssetType.SILVER]: 'Silver',
  [AssetType.CRYPTOCURRENCY]: 'Cryptocurrency',
  [AssetType.BUSINESS_ASSETS]: 'Business assets',
  [AssetType.INVESTMENT_ACCOUNT]: 'Investment account',
  [AssetType.RETIREMENT]: 'Retirement account',
  [AssetType.REAL_ESTATE]: 'Real estate',
  [AssetType.DEBTS_OWED_TO_YOU]: 'Debts owed to you',
  [AssetType.OTHER]: 'Other asset',
};

/**
 * Resolve the full ruling explanation for an asset under a methodology,
 * mirroring the decision chain of isAssetZakatable in core/calculations:
 *
 * 1. zakatEligible === true  → override-zakatable (madhabDefault explains the default)
 * 2. zakatEligible === false → override-exempt
 * 3. type default zakatable  → zakatable
 * 4. jewelryExempt && GOLD|SILVER (no override) → exempt with jewelry ruling
 * 5. not in zakatable list   → exempt
 */
export function getAssetRuling(
  asset: {
    type: AssetType;
    zakatEligible?: boolean | null;
    name?: string;
  },
  methodologyName: MethodologyName | string
): AssetRuling {
  const key = (String(methodologyName).toUpperCase()) as MethodologyName;
  const config = getMethodology(key);
  const school = SCHOOL[key] ?? SCHOOL.STANDARD;
  const assetType = asset.type;
  const assetLabel = asset.name || ASSET_LABELS[assetType] || 'This asset';

  const defaultRuling =
    getRulingForType(key, assetType) ?? fallbackRuling(key);

  const citations = defaultRuling.citations;

  // 1. Explicit override: user forced zakatable
  if (asset.zakatEligible === true) {
    return {
      status: 'override-zakatable',
      madhabDefault: defaultRuling,
      override: {
        ruling: `You marked ${assetLabel} as zakatable.`,
        reasoning: `The ${school.label} default for this asset type is "${defaultRuling.ruling}" — your explicit setting takes precedence. This is appropriate when your scholar's guidance differs from the app's default assumption.`,
        citations,
      },
      citations,
    };
  }

  // 2. Explicit override: user forced exempt
  if (asset.zakatEligible === false) {
    return {
      status: 'override-exempt',
      madhabDefault: defaultRuling,
      override: {
        ruling: `You marked ${assetLabel} as exempt.`,
        reasoning: `The ${school.label} default for this asset type is "${defaultRuling.ruling}" — your explicit setting takes precedence.`,
        citations,
      },
      citations,
    };
  }

  // 4. Jewelry exemption rule (mirrors isAssetZakatable)
  if (
    config.jewelryExempt &&
    (assetType === AssetType.GOLD || assetType === AssetType.SILVER)
  ) {
    return {
      status: 'exempt',
      madhabDefault: {
        ruling: defaultRuling.ruling,
        reasoning: `${defaultRuling.reasoning} Because the ${school.label} school exempts personal-use jewelry, this asset is treated as exempt unless you explicitly mark it zakatable.`,
        citations,
      },
      citations,
    };
  }

  // 3/5. Type default
  const inList = config.zakatableAssets.includes(assetType);
  return {
    status: inList ? 'zakatable' : 'exempt',
    madhabDefault: defaultRuling,
    citations,
  };
}

/**
 * Guard for consumers: every methodology in METHODOLOGIES must exist in the registry.
 * Exported so tests and dev tooling can assert completeness at runtime too.
 */
export function getSupportedMethodologies(): MethodologyName[] {
  return Object.keys(METHODOLOGIES) as MethodologyName[];
}