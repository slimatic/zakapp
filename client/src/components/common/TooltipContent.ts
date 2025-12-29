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
