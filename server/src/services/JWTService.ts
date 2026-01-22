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

import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

/**
 * JWT token management service with refresh token rotation
 * Follows ZakApp constitutional principle: Privacy & Security First
 */
export class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || this.generateSecret();
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET || this.generateSecret();
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    const hasAccessSecret = !!(process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);
    const hasRefreshSecret = !!(process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET);

    if (!hasAccessSecret || !hasRefreshSecret) {
      console.warn('JWT secrets not found in environment variables. Using generated secrets (not recommended for production).');
    }
    console.error('JWTService initialized. Access Secret:', this.accessTokenSecret);
    console.error('JWTService Env:', {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      JWT_SECRET: process.env.JWT_SECRET
    });
  }

  /**
   * Generates a secure random secret for JWT signing
   * @returns Hex-encoded random secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Creates an access token with user information
   * @param payload - User data to include in token
   * @returns Signed JWT access token
   * @throws {Error} When token creation fails
   */
  createAccessToken(payload: {
    userId: string;
    email: string;
    role?: string;
    permissions?: string[];
  }): string {
    try {
      const tokenPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role || 'user',
        permissions: payload.permissions || [],
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        // Add random data to ensure token uniqueness
        jti: crypto.randomBytes(8).toString('hex')
      };

      return jwt.sign(tokenPayload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'zakapp',
        audience: 'zakapp-users',
        subject: payload.userId
      } as any);
    } catch (error) {
      throw new Error(`Access token creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a refresh token for token rotation
   * @param userId - User identifier
   * @returns Signed JWT refresh token
   * @throws {Error} When token creation fails
   */
  createRefreshToken(userId: string): string {
    try {
      const tokenPayload = {
        userId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        // Add random data to prevent token collision
        nonce: crypto.randomBytes(16).toString('hex')
      };

      return jwt.sign(tokenPayload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'zakapp',
        audience: 'zakapp-refresh',
        subject: userId
      } as any);
    } catch (error) {
      throw new Error(`Refresh token creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifies and decodes an access token
   * @param token - JWT access token to verify
   * @returns Decoded token payload
   * @throws {Error} When token is invalid or expired
   */
  verifyAccessToken(token: string): {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    type: string;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
    sub: string;
  } {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'zakapp',
        audience: 'zakapp-users'
      }) as any;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid token type') {
        throw error;
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        throw new Error(`Access token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Verifies and decodes a refresh token
   * @param token - JWT refresh token to verify
   * @returns Decoded token payload
   * @throws {Error} When token is invalid or expired
   */
  verifyRefreshToken(token: string): {
    userId: string;
    type: string;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
    sub: string;
    nonce: string;
  } {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'zakapp',
        audience: 'zakapp-refresh'
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error(`Refresh token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Creates both access and refresh tokens for a user
   * @param userInfo - User information for token creation
   * @returns Object containing both tokens
   */
  createTokenPair(userInfo: {
    userId: string;
    email: string;
    role?: string;
    permissions?: string[];
  }): {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  } {
    const accessToken = this.createAccessToken(userInfo);
    const refreshToken = this.createRefreshToken(userInfo.userId);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry
    };
  }

  /**
   * Refreshes an access token using a valid refresh token
   * @param refreshToken - Valid refresh token
   * @param userInfo - User information for new access token
   * @returns New access token
   * @throws {Error} When refresh token is invalid
   */
  refreshAccessToken(refreshToken: string, userInfo: {
    email: string;
    role?: string;
    permissions?: string[];
  }): {
    accessToken: string;
    expiresIn: string;
  } {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);

      const newAccessToken = this.createAccessToken({
        userId: decoded.userId,
        email: userInfo.email,
        role: userInfo.role,
        permissions: userInfo.permissions
      });

      return {
        accessToken: newAccessToken,
        expiresIn: this.accessTokenExpiry
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts token from Authorization header
   * @param authHeader - Authorization header value
   * @returns Token string without Bearer prefix
   * @throws {Error} When header format is invalid
   */
  extractTokenFromHeader(authHeader: string): string {
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format. Expected: Bearer <token>');
    }

    return parts[1];
  }

  /**
   * Decodes token without verification (for debugging/inspection)
   * @param token - JWT token to decode
   * @returns Decoded token payload
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error(`Token decode failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if a token is expired without verification
   * @param token - JWT token to check
   * @returns True if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Gets token expiration time
   * @param token - JWT token
   * @returns Expiration timestamp or null if invalid
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Validates JWT configuration
   * @returns True if configuration is valid
   */
  validateConfiguration(): boolean {
    try {
      const testPayload = {
        userId: 'test-user',
        email: 'test@example.com'
      };

      const accessToken = this.createAccessToken(testPayload);
      const refreshToken = this.createRefreshToken(testPayload.userId);

      this.verifyAccessToken(accessToken);
      this.verifyRefreshToken(refreshToken);

      return true;
    } catch (error) {
      console.error('JWT configuration validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance for application use
export const jwtService = new JWTService();