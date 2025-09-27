import bcrypt from 'bcryptjs';

interface StoredUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

// Simple in-memory store for testing
const users = new Map<string, StoredUser>();
const emailToUserId = new Map<string, string>();

export class UserStore {
  static async createUser(email: string, username: string, password: string): Promise<StoredUser> {
    if (emailToUserId.has(email)) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`;
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user: StoredUser = {
      id: userId,
      email,
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.set(userId, user);
    emailToUserId.set(email, userId);
    
    return user;
  }

  static async authenticateUser(email: string, password: string): Promise<StoredUser | null> {
    const userId = emailToUserId.get(email);
    if (!userId) {
      return null;
    }

    const user = users.get(userId);
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  static getUserIdByEmail(email: string): string | null {
    return emailToUserId.get(email) || null;
  }

  static async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const user = users.get(userId);
    if (!user) {
      return false;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    users.set(userId, user);
    return true;
  }

  static getUserById(userId: string): StoredUser | null {
    return users.get(userId) || null;
  }

  static emailExists(email: string): boolean {
    return emailToUserId.has(email);
  }

  static clear(): void {
    users.clear();
    emailToUserId.clear();
  }
}