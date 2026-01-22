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

import jwt from 'jsonwebtoken';

import { getJwtSecret } from '../config/security';

const JWT_SECRET = getJwtSecret();
console.log('JWT_SECRET (jwt.ts):', JWT_SECRET);

const JWT_EXPIRES_IN = '15m'; // 15 minutes for access token
const REFRESH_EXPIRES_IN = '7d'; // 7 days for refresh token

// Track used refresh tokens to prevent reuse
const usedRefreshTokens = new Set<string>();
const invalidatedRefreshTokens = new Set<string>();
const userRefreshTokens = new Map<string, Set<string>>(); // userId -> Set of refresh tokens

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access', jti: Math.random().toString(36) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function generateRefreshToken(userId: string): string {
  const token = jwt.sign(
    { userId, type: 'refresh', jti: Math.random().toString(36) },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  // Track token for this user
  if (!userRefreshTokens.has(userId)) {
    userRefreshTokens.set(userId, new Set());
  }
  userRefreshTokens.get(userId)!.add(token);

  return token;
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('INVALID_TOKEN');
    }
    throw new Error('INVALID_TOKEN');
  }
}

export function verifyRefreshToken(token: string): any {
  if (usedRefreshTokens.has(token)) {
    throw new Error('TOKEN_USED');
  }

  if (invalidatedRefreshTokens.has(token)) {
    throw new Error('TOKEN_INVALIDATED');
  }

  const decoded = verifyToken(token);

  if (decoded.type !== 'refresh') {
    throw new Error('INVALID_TOKEN');
  }

  return decoded;
}

export function markRefreshTokenAsUsed(token: string): void {
  usedRefreshTokens.add(token);
}

export function invalidateRefreshToken(token: string): void {
  invalidatedRefreshTokens.add(token);
}

export function invalidateAllUserRefreshTokens(userId: string): void {
  const tokens = userRefreshTokens.get(userId);
  if (tokens) {
    tokens.forEach(token => invalidatedRefreshTokens.add(token));
    userRefreshTokens.delete(userId);
  }
}

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function clearUsedTokens(): void {
  usedRefreshTokens.clear();
  invalidatedRefreshTokens.clear();
  userRefreshTokens.clear();
}