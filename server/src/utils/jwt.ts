import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '[REDACTED]';
const JWT_EXPIRES_IN = '15m'; // 15 minutes for access token
const REFRESH_EXPIRES_IN = '7d'; // 7 days for refresh token

// Track used refresh tokens to prevent reuse
const usedRefreshTokens = new Set<string>();

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access', jti: Math.random().toString(36) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh', jti: Math.random().toString(36) },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
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
  
  const decoded = verifyToken(token);
  
  if (decoded.type !== 'refresh') {
    throw new Error('INVALID_TOKEN');
  }
  
  return decoded;
}

export function markRefreshTokenAsUsed(token: string): void {
  usedRefreshTokens.add(token);
}

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function clearUsedTokens(): void {
  usedRefreshTokens.clear();
}