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

// Central Prisma client factory used across the server in test and production
// Uses runtime require to avoid TS compile-time issues in environments where
// `npx prisma generate` cannot be executed (e.g., restricted CI containers).
// The client will respect TEST_DATABASE_URL when present for deterministic tests.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (opts?: any) => any };

const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db';

export const prisma = new PrismaClient({ datasources: { db: { url } } });

export function getPrismaClient(options?: any) {
  return new PrismaClient({ ...options, datasources: { db: { url } } });
}
