import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './EncryptionService';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '[REDACTED]';

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  timezone?: string;
  currency?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
  private readonly REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback-refresh-secret';
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * Register a new user with encrypted sensitive data
   */
  async register(userData: CreateUserDto): Promise<{ user: any; tokens: AuthTokens }> {

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user with encrypted profile and settings
    const profileData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      timezone: userData.timezone || 'UTC'
    };
    const settingsData = {
      currency: userData.currency || 'USD',
      notifications: true,
      darkMode: false,
      language: 'en',
      privacyLevel: 'STANDARD',
      autoCalculate: true,
      reminderFrequency: 'MONTHLY',
      preferredMethodology: 'STANDARD'
    };

    const encryptedProfile = await EncryptionService.encrypt(JSON.stringify(profileData), ENCRYPTION_KEY);
    const encryptedSettings = await EncryptionService.encrypt(JSON.stringify(settingsData), ENCRYPTION_KEY);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        profile: encryptedProfile,
        settings: encryptedSettings,
        isActive: true
      }
    });

    // Create security record for the user
    await prisma.userSecurity.create({
      data: {
        userId: user.id
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Create session
    await this.createSession(user.id, tokens.refreshToken);

    // Return user without password and with decrypted data
    const { passwordHash: _, ...userWithoutPassword } = user;
    const decryptedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      updatedAt: user.updatedAt,
      preferredCalendar: user.preferredCalendar,
      preferredMethodology: user.preferredMethodology,
      lastZakatDate: user.lastZakatDate,
      ...(user.profile ? JSON.parse(await EncryptionService.decrypt(user.profile, ENCRYPTION_KEY)) : {}),
      ...(user.settings ? JSON.parse(await EncryptionService.decrypt(user.settings, ENCRYPTION_KEY)) : {})
    };

    return { user: decryptedUser, tokens };
  }

  /**
   * Authenticate user and return tokens
   */
  async login(credentials: LoginCredentials): Promise<{ user: any; tokens: AuthTokens }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    const security = await prisma.userSecurity.findUnique({
      where: { userId: user.id }
    });
    if (security?.lockedUntil && security.lockedUntil > new Date()) {
      throw new Error('Account is temporarily locked due to too many failed attempts');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

    if (!isValidPassword) {
      // Increment failed attempts
      await this.handleFailedLogin(user.id);
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await prisma.userSecurity.update({
      where: { userId: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Create session
    await this.createSession(user.id, tokens.refreshToken);

    // Return user without password and with decrypted data
    const { passwordHash: _, ...userWithoutPassword } = user;
    const decryptedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      updatedAt: user.updatedAt,
      preferredCalendar: user.preferredCalendar,
      preferredMethodology: user.preferredMethodology,
      lastZakatDate: user.lastZakatDate,
      ...(user.profile ? JSON.parse(await EncryptionService.decrypt(user.profile, ENCRYPTION_KEY)) : {}),
      ...(user.settings ? JSON.parse(await EncryptionService.decrypt(user.settings, ENCRYPTION_KEY)) : {})
    };

    return { user: decryptedUser, tokens };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.REFRESH_SECRET) as any;

      // Check if session exists and is valid
      const session = await prisma.userSession.findFirst({
        where: {
          userId: decoded.userId,
          refreshToken,
          expiresAt: { gt: new Date() },
          isActive: true
        }
      });

      if (!session) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new tokens
      const newTokens = await this.generateTokens(decoded.userId);

      // Update session with new refresh token
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: newTokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      return newTokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Invalidate specific session
      await prisma.userSession.updateMany({
        where: {
          userId,
          refreshToken,
          isActive: true
        },
        data: { isActive: false }
      });
    } else {
      // Invalidate all sessions for user
      await prisma.userSession.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      });
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Generate password reset token
   */
  async generateResetToken(email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists
      return 'reset-token-generated';
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false
      }
    });

    return resetToken;
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find valid reset token
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
        used: false
      },
      include: { user: true }
    });

    if (!resetRecord) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: hashedPassword }
    });

    // Mark reset token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    });

    // Invalidate all user sessions
    await prisma.userSession.updateMany({
      where: { userId: resetRecord.userId },
      data: { isActive: false }
    });

    // Update last login to indicate password change
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { lastLoginAt: new Date() }
    });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    });

    return true;
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    // Calculate expiry in seconds
    const expiresIn = 15 * 60; // 15 minutes in seconds

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * Create a new user session
   */
  private async createSession(userId: string, refreshToken: string): Promise<void> {
    const now = new Date();
    await prisma.userSession.create({
      data: {
        userId,
        accessToken: '', // Will be set when tokens are generated
        refreshToken,
        ipAddress: '0.0.0.0',
        userAgent: 'Unknown',
        issuedAt: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true
      }
    });
  }

  /**
   * Handle failed login attempts
   */
  private async handleFailedLogin(userId: string): Promise<void> {
    const security = await prisma.userSecurity.findUnique({
      where: { userId }
    });

    if (!security) return;

    const attempts = security.failedAttempts + 1;
    const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes after 5 attempts

    await prisma.userSecurity.update({
      where: { userId },
      data: {
        failedAttempts: attempts,
        lockedUntil: lockUntil
      }
    });
  }

  /**
   * Get user by ID with decrypted data
   */
  async getUserById(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      updatedAt: user.updatedAt,
      preferredCalendar: user.preferredCalendar,
      preferredMethodology: user.preferredMethodology,
      lastZakatDate: user.lastZakatDate,
      ...(user.profile ? JSON.parse(await EncryptionService.decrypt(user.profile, ENCRYPTION_KEY)) : {}),
      ...(user.settings ? JSON.parse(await EncryptionService.decrypt(user.settings, ENCRYPTION_KEY)) : {})
    };
  }

  /**
   * Get user ID by email
   */
  async getUserIdByEmail(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    return user?.id || null;
  }
}