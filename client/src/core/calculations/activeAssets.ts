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

import { Asset } from '../../types';

/**
 * The one lifecycle rule for wealth totals: an asset the user closed
 * (`isActive: false`) holds no money the calculator may count today, on any
 * surface. Every calculator reads its asset list through this predicate.
 *
 * A MISSING `isActive` is not closed: the schema defaults it to true
 * (db/schema/asset.schema.ts) and both the repository and the migration
 * service normalize an absent value to active, so only an explicit false
 * excludes. When account closure later records an explicit closing balance,
 * that figure is surfaced deliberately by the closure feature; it is never
 * inferred here.
 */
export const activeAssets = (assets: Asset[]): Asset[] =>
    assets.filter(asset => asset.isActive !== false);
