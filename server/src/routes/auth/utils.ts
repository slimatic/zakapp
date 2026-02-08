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

import { PrismaClient } from '@prisma/client';
import { getEncryptionKey } from '../../config/security';
import { prisma } from '../../utils/prisma';

export const ENCRYPTION_KEY = getEncryptionKey();

// Simple in-memory token revocation tracking
export const revokedTokens = new Set<string>();
export const tokenUsageCount = new Map<string, number>();
export const userRateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Track which users we've already logged a profile decryption failure for to avoid log spam
export const loggedProfileDecryptionFailures = new Set<string>();

/**
 * Reset auth state for testing
 * WARNING: Only use in test environment
 */
export function resetAuthState(): void {
  revokedTokens.clear();
  tokenUsageCount.clear();
  userRateLimitMap.clear();
}

/**
 * Add a token to the revoked list
 */
export function revokeToken(token: string): void {
  revokedTokens.add(token);
}

/**
 * Check if a token has been revoked
 */
export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

/**
 * Track token usage for rate limiting
 */
export function trackTokenUsage(token: string): boolean {
  const currentCount = tokenUsageCount.get(token) || 0;
  tokenUsageCount.set(token, currentCount + 1);
  return currentCount > 0; // Return true if token was already used
}

/**
 * Revoke a token immediately (for production token rotation)
 */
export function revokeTokenImmediately(token: string): void {
  revokedTokens.add(token);
  tokenUsageCount.set(token, (tokenUsageCount.get(token) || 0) + 1);
}

/**
 * Check user rate limiting for refresh attempts
 */
export function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = userRateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    userRateLimitMap.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return false; // Not rate limited
  }

  if (userLimit.count >= 5) {
    return true; // Rate limited (max 5 attempts per minute)
  }

  userLimit.count += 1;
  return false;
}

/**
 * Lazy initialization of Prisma client
 */
export function getPrismaClient() {
  // Use the shared singleton instance
  return prisma;
}