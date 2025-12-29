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

// Local fallback for a small set of shared runtime constants to avoid hard dependency on @zakapp/shared in dev
export const PASSIVE_INVESTMENT_TYPES = [
  'stocks',
  'etf',
  'mutual_fund',
  'roth_ira',
  'stock',
  'etf',
  'mutual fund'
];

export const RESTRICTED_ACCOUNT_TYPES = [
  'trust',
  'escrow',
  'restricted_account'
];
