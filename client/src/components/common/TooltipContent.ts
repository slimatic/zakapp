/**
 * TooltipContent.ts
 * 
 * Centralized definitions for educational tooltips used throughout the application.
 * Source: specs/009-ui-ux-redesign/spec.md (Tooltip Definitions)
 */

export const TOOLTIP_CONTENT = {
  NISAB: "The minimum amount of wealth a Muslim must possess for a whole lunar year before Zakat becomes obligatory.",
  HAWL: "The lunar year period (354 days) that wealth must be held above the Nisab threshold.",
  ZAKATABLE_ASSETS: "Assets that are subject to Zakat, such as cash, gold, silver, and business inventory.",
  CASH: "Money on hand or in bank accounts.",
  GOLD: "Gold jewelry, coins, or bars. Zakatable if above 85g.",
  SILVER: "Silver jewelry, coins, or bars. Zakatable if above 595g.",
} as const;

export type TooltipKey = keyof typeof TOOLTIP_CONTENT;
