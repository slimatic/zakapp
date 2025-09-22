import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@zakapp/shared';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = 12;

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.userId,
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authorization?: string): string | null {
  if (!authorization) return null;
  
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}

/**
 * Get token expiration info
 */
export function getTokenExpirationInfo(token: string): { expiresIn: number } {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = decoded?.exp ? decoded.exp - now : 0;
  
  return { expiresIn };
}