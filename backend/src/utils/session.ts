import jwt from 'jsonwebtoken';
import fs from 'fs-extra';
import path from 'path';
import { JWTPayload } from './auth.js';

// JWT configuration with session timeout
const JWT_SECRET =
  process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production';
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT || '86400', 10); // 24 hours in seconds
const REFRESH_TOKEN_TIMEOUT = parseInt(
  process.env.REFRESH_TOKEN_TIMEOUT || '604800',
  10
); // 7 days in seconds
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// In-memory token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set<string>();

// Session storage interface
interface SessionData {
  userId: string;
  username: string;
  email: string;
  createdAt: string;
  lastActivity: string;
  refreshToken?: string;
}

// Session storage - file-based for simplicity (use Redis in production)
function getSessionsDir(): string {
  const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  return path.join(DATA_DIR, 'sessions');
}

/**
 * Initialize session management
 */
export async function initializeSessions(): Promise<void> {
  await fs.ensureDir(getSessionsDir());
}

/**
 * Generate access and refresh tokens
 */
export function generateTokenPair(user: {
  userId: string;
  username: string;
  email: string;
}): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
} {
  const now = Math.floor(Date.now() / 1000);

  // Access token payload
  const accessPayload: JWTPayload = {
    userId: user.userId,
    username: user.username,
    email: user.email,
    iat: now,
    exp: now + SESSION_TIMEOUT,
  };

  // Refresh token payload
  const refreshPayload = {
    userId: user.userId,
    type: 'refresh',
    iat: now,
    exp: now + REFRESH_TOKEN_TIMEOUT,
  };

  const accessToken = jwt.sign(accessPayload, JWT_SECRET);
  const refreshToken = jwt.sign(refreshPayload, JWT_SECRET);

  return {
    accessToken,
    refreshToken,
    expiresIn: SESSION_TIMEOUT,
    refreshExpiresIn: REFRESH_TOKEN_TIMEOUT,
  };
}

/**
 * Verify refresh token and generate new access token
 */
export function refreshAccessToken(refreshToken: string): {
  accessToken: string;
  expiresIn: number;
} | null {
  try {
    // Check if refresh token is blacklisted
    if (tokenBlacklist.has(refreshToken)) {
      return null;
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

    if (decoded.type !== 'refresh') {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    // Generate new access token
    const accessPayload: JWTPayload = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      iat: now,
      exp: now + SESSION_TIMEOUT,
    };

    const accessToken = jwt.sign(accessPayload, JWT_SECRET);

    return {
      accessToken,
      expiresIn: SESSION_TIMEOUT,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Create a session record
 */
export async function createSession(user: {
  userId: string;
  username: string;
  email: string;
}): Promise<void> {
  const sessionData: SessionData = {
    userId: user.userId,
    username: user.username,
    email: user.email,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  const sessionPath = path.join(getSessionsDir(), `${user.userId}.json`);
  await atomicWriteSessionJson(sessionPath, sessionData);
}

/**
 * Safe read JSON with corruption handling
 */
async function safeReadSessionJson(sessionPath: string): Promise<SessionData | null> {
  try {
    return await fs.readJson(sessionPath);
  } catch (error: any) {
    if (error instanceof SyntaxError || error?.name === 'SyntaxError') {
      // Handle malformed JSON by removing the corrupted file
      console.warn(`Corrupted session file detected: ${sessionPath}. Removing corrupted file.`);
      try {
        await fs.remove(sessionPath);
      } catch (removeError) {
        console.error('Failed to remove corrupted session file:', removeError);
      }
    }
    return null;
  }
}

/**
 * Atomic write for session data to prevent corruption
 */
async function atomicWriteSessionJson(sessionPath: string, sessionData: SessionData): Promise<void> {
  const tempPath = `${sessionPath}.tmp`;
  try {
    // Write to temporary file first
    await fs.writeJson(tempPath, sessionData, { spaces: 2 });
    // Atomically move temp file to final location, overwriting if exists
    await fs.move(tempPath, sessionPath, { overwrite: true });
  } catch (error) {
    // Clean up temp file if it exists
    if (await fs.pathExists(tempPath)) {
      await fs.remove(tempPath);
    }
    throw error;
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(userId: string): Promise<void> {
  try {
    const sessionPath = path.join(getSessionsDir(), `${userId}.json`);

    if (await fs.pathExists(sessionPath)) {
      const sessionData = await safeReadSessionJson(sessionPath);
      if (sessionData) {
        sessionData.lastActivity = new Date().toISOString();
        await atomicWriteSessionJson(sessionPath, sessionData);
      }
    }
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
}

/**
 * Get session data
 */
export async function getSession(userId: string): Promise<SessionData | null> {
  try {
    const sessionPath = path.join(getSessionsDir(), `${userId}.json`);

    if (await fs.pathExists(sessionPath)) {
      return await safeReadSessionJson(sessionPath);
    }

    return null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Delete session
 */
export async function deleteSession(userId: string): Promise<void> {
  try {
    const sessionPath = path.join(getSessionsDir(), `${userId}.json`);

    if (await fs.pathExists(sessionPath)) {
      await fs.remove(sessionPath);
    }
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
}

/**
 * Check if session is expired based on last activity
 */
export function isSessionExpired(sessionData: SessionData): boolean {
  const lastActivity = new Date(sessionData.lastActivity);
  const now = new Date();
  const diffInSeconds = (now.getTime() - lastActivity.getTime()) / 1000;

  return diffInSeconds > SESSION_TIMEOUT;
}

/**
 * Blacklist a token (for logout)
 */
export function blacklistToken(token: string): void {
  tokenBlacklist.add(token);

  // Clean up expired tokens periodically
  if (tokenBlacklist.size > 10000) {
    cleanupBlacklist();
  }
}

/**
 * Check if token is blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

/**
 * Clean up expired tokens from blacklist
 */
function cleanupBlacklist(): void {
  const tokensToRemove: string[] = [];

  for (const token of tokenBlacklist) {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          tokensToRemove.push(token);
        }
      }
    } catch (error) {
      // Invalid token, remove it
      tokensToRemove.push(token);
    }
  }

  tokensToRemove.forEach(token => tokenBlacklist.delete(token));
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const sessionFiles = await fs.readdir(getSessionsDir());

    for (const file of sessionFiles) {
      if (file.endsWith('.json')) {
        const sessionPath = path.join(getSessionsDir(), file);
        const sessionData = await safeReadSessionJson(sessionPath);

        if (sessionData && isSessionExpired(sessionData)) {
          await fs.remove(sessionPath);
        }
        // Note: corrupted files are already removed by safeReadSessionJson
      }
    }
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
}

// Start periodic cleanup
setInterval(
  () => {
    cleanupBlacklist();
    cleanupExpiredSessions().catch(console.error);
  },
  60 * 60 * 1000
); // Every hour
