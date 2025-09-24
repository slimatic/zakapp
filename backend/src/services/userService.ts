import { User, UserPreferences, DEFAULTS } from '@zakapp/shared';
import { hashPassword, verifyPassword } from '../utils/auth.js';
import {
  initializeDataDirectories,
  generateUserId,
  generateSalt,
  createUserDirectory,
  getUserFilePath,
  userDirectoryExists,
} from '../utils/fileSystem.js';
import fs from 'fs-extra';
import path from 'path';

// User storage interface
interface StoredUser {
  userId: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLogin?: string;
  preferences: UserPreferences;
}

// User index for username/email lookups
interface UserIndex {
  [key: string]: string; // username/email -> userId mapping
}

class UserService {
  private userIndex: UserIndex = {};
  private initialized = false;

  /**
   * Initialize the user service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await initializeDataDirectories();
    await this.loadUserIndex();
    this.initialized = true;
  }

  /**
   * Load user index from disk
   */
  private async loadUserIndex(): Promise<void> {
    const indexPath = path.join(process.cwd(), 'data', 'users', 'index.json');

    try {
      if (await fs.pathExists(indexPath)) {
        this.userIndex = await fs.readJson(indexPath);
      }
    } catch (error) {
      console.warn(
        'Failed to load user index, starting with empty index:',
        error
      );
      this.userIndex = {};
    }
  }

  /**
   * Save user index to disk
   */
  private async saveUserIndex(): Promise<void> {
    const indexPath = path.join(process.cwd(), 'data', 'users', 'index.json');
    await fs.writeJson(indexPath, this.userIndex, { spaces: 2 });
  }

  /**
   * Check if username or email already exists
   */
  async userExists(username: string, email: string): Promise<boolean> {
    await this.initialize();
    return !!(
      this.userIndex[username.toLowerCase()] ||
      this.userIndex[email.toLowerCase()]
    );
  }

  /**
   * Get user ID by username or email
   */
  async getUserId(usernameOrEmail: string): Promise<string | null> {
    await this.initialize();
    return this.userIndex[usernameOrEmail.toLowerCase()] || null;
  }

  /**
   * Check if a user is a demo user
   */
  isDemoUser(username: string): boolean {
    const demoUsernames = ['john_doe', 'demo', 'demo_user', 'test_user'];
    return demoUsernames.some(demoUsername => 
      username.toLowerCase() === demoUsername.toLowerCase()
    );
  }

  /**
   * Get all demo users in the system
   */
  async getDemoUsers(): Promise<string[]> {
    await this.initialize();
    const demoUsers: string[] = [];
    
    Object.keys(this.userIndex).forEach(key => {
      if (this.isDemoUser(key)) {
        demoUsers.push(key);
      }
    });
    
    return demoUsers;
  }

  /**
   * Remove demo users from the system
   */
  async removeDemoUsers(): Promise<{ removed: string[], errors: string[] }> {
    await this.initialize();
    const removed: string[] = [];
    const errors: string[] = [];
    
    const demoUsers = await this.getDemoUsers();
    
    for (const demoUsername of demoUsers) {
      try {
        const userId = this.userIndex[demoUsername];
        if (userId) {
          // Remove user directory
          if (await userDirectoryExists(userId)) {
            await fs.remove(path.join(process.cwd(), 'data', 'users', userId));
          }
          
          // Remove from user index
          delete this.userIndex[demoUsername];
          removed.push(demoUsername);
        }
      } catch (error) {
        console.error(`Error removing demo user ${demoUsername}:`, error);
        errors.push(`${demoUsername}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (removed.length > 0) {
      await this.saveUserIndex();
    }
    
    return { removed, errors };
  }

  /**
   * Create a new user
   */
  async createUser(
    username: string,
    email: string,
    password: string
  ): Promise<User> {
    await this.initialize();

    if (await this.userExists(username, email)) {
      throw new Error('User already exists');
    }

    const userId = generateUserId();
    const salt = generateSalt();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    const defaultPreferences: UserPreferences = {
      currency: DEFAULTS.CURRENCY,
      language: DEFAULTS.LANGUAGE,
      zakatMethod: DEFAULTS.ZAKAT_METHOD,
      calendarType: DEFAULTS.CALENDAR_TYPE,
    };

    const storedUser: StoredUser = {
      userId,
      username,
      email,
      passwordHash,
      salt,
      createdAt: now,
      preferences: defaultPreferences,
    };

    // Create user directory and save user data
    await createUserDirectory(userId);

    // Store user profile data as JSON for now (unencrypted for simplicity)
    const profilePath = getUserFilePath(userId, 'profile.json');
    await fs.writeJson(profilePath, storedUser, { spaces: 2 });

    // Update user index
    this.userIndex[username.toLowerCase()] = userId;
    this.userIndex[email.toLowerCase()] = userId;
    await this.saveUserIndex();

    return {
      userId,
      username,
      email,
      createdAt: now,
      preferences: defaultPreferences,
    };
  }

  /**
   * Authenticate user with username/email and password
   */
  async authenticateUser(
    usernameOrEmail: string,
    password: string
  ): Promise<User | null> {
    await this.initialize();

    // Check if this is a demo user and prevent authentication
    if (this.isDemoUser(usernameOrEmail)) {
      console.warn(`Attempted login with demo user: ${usernameOrEmail}. Demo user logins are disabled.`);
      return null;
    }

    const userId = await this.getUserId(usernameOrEmail);
    if (!userId) {
      return null;
    }

    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return null;
      }

      // Double-check the user isn't a demo user
      if (this.isDemoUser(user.username)) {
        console.warn(`Demo user found in system: ${user.username}. Authentication blocked.`);
        return null;
      }

      // Get stored user data for password verification
      const storedUser = await this.getStoredUser(userId);
      const isValidPassword = await verifyPassword(
        password,
        storedUser.passwordHash
      );

      if (!isValidPassword) {
        return null;
      }

      // Update last login
      await this.updateLastLogin(userId);

      return user;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    await this.initialize();

    try {
      if (!(await userDirectoryExists(userId))) {
        return null;
      }

      const storedUser = await this.getStoredUser(userId);

      return {
        userId: storedUser.userId,
        username: storedUser.username,
        email: storedUser.email,
        createdAt: storedUser.createdAt,
        lastLogin: storedUser.lastLogin,
        preferences: storedUser.preferences,
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Get stored user data (including sensitive information)
   */
  private async getStoredUser(userId: string): Promise<StoredUser> {
    // For now, store user profile data unencrypted for simplicity
    // In production, you might want to encrypt this data
    const profilePath = getUserFilePath(userId, 'profile.json');
    const profileData = await fs.readJson(profilePath);
    return profileData as StoredUser;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: { email?: string; preferences?: Partial<UserPreferences> }
  ): Promise<User | null> {
    await this.initialize();

    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return null;
      }

      const storedUser = await this.getStoredUser(userId);

      // Update email in index if changed
      if (updates.email && updates.email !== user.email) {
        // Check if new email already exists
        if (
          this.userIndex[updates.email.toLowerCase()] &&
          this.userIndex[updates.email.toLowerCase()] !== userId
        ) {
          throw new Error('Email already exists');
        }

        // Remove old email from index and add new one
        delete this.userIndex[user.email.toLowerCase()];
        this.userIndex[updates.email.toLowerCase()] = userId;

        storedUser.email = updates.email;
      }

      // Update preferences
      if (updates.preferences) {
        storedUser.preferences = {
          ...storedUser.preferences,
          ...updates.preferences,
        };
      }

      // Save updated user data
      const profilePath = getUserFilePath(userId, 'profile.json');
      await fs.writeJson(profilePath, storedUser, { spaces: 2 });

      if (updates.email) {
        await this.saveUserIndex();
      }

      return await this.getUserById(userId);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    await this.initialize();

    try {
      const storedUser = await this.getStoredUser(userId);

      // Verify current password
      const isValidPassword = await verifyPassword(
        currentPassword,
        storedUser.passwordHash
      );
      if (!isValidPassword) {
        return false;
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update stored user data
      storedUser.passwordHash = newPasswordHash;

      const profilePath = getUserFilePath(userId, 'profile.json');
      await fs.writeJson(profilePath, storedUser, { spaces: 2 });

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const storedUser = await this.getStoredUser(userId);
      storedUser.lastLogin = new Date().toISOString();

      const profilePath = getUserFilePath(userId, 'profile.json');
      await fs.writeJson(profilePath, storedUser, { spaces: 2 });
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for last login update failure
    }
  }
}

// Export singleton instance
export const userService = new UserService();
