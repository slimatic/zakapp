/**
 * Encrypted JSON data storage utility
 * Provides secure file-based storage for user data
 */

const fs = require('fs-extra');
const crypto = require('crypto');
const path = require('path');

class DataStore {
  constructor() {
    this.dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
    this.algorithm = 'aes-256-cbc';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits for CBC
    
    // Ensure data directory exists
    this.ensureDataDir();
  }

  async ensureDataDir() {
    try {
      await fs.ensureDir(this.dataDir);
      await fs.ensureDir(path.join(this.dataDir, 'users'));
      await fs.ensureDir(path.join(this.dataDir, 'snapshots'));
      await fs.ensureDir(path.join(this.dataDir, 'backups'));
    } catch (error) {
      console.error('Error creating data directories:', error);
      throw error;
    }
  }

  /**
   * Generate a secure encryption key from password
   */
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt data using AES-256-CBC
   */
  encrypt(data, password) {
    try {
      const salt = crypto.randomBytes(16);
      const key = this.deriveKey(password, salt);
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      const jsonData = JSON.stringify(data);
      let encrypted = cipher.update(jsonData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        data: encrypted
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   */
  decrypt(encryptedData, password) {
    try {
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const key = this.deriveKey(password, salt);
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - invalid password or corrupted data');
    }
  }

  /**
   * Save user data to encrypted file
   */
  async saveUserData(userId, userData, password) {
    try {
      const filePath = path.join(this.dataDir, 'users', `${userId}.json`);
      const encryptedData = this.encrypt(userData, password);
      
      await fs.writeJSON(filePath, encryptedData, { spaces: 2 });
      
      // Create/update user index for login lookup
      await this.updateUserIndex(userId, userData.user.username, userData.user.email);
      
      // Create backup
      const backupPath = path.join(this.dataDir, 'backups', `${userId}_${Date.now()}.json`);
      await fs.writeJSON(backupPath, encryptedData, { spaces: 2 });
      
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  /**
   * Load user data from encrypted file
   */
  async loadUserData(userId, password) {
    try {
      const filePath = path.join(this.dataDir, 'users', `${userId}.json`);
      
      if (!(await fs.pathExists(filePath))) {
        return null;
      }
      
      const encryptedData = await fs.readJSON(filePath);
      const userData = this.decrypt(encryptedData, password);
      
      return userData;
    } catch (error) {
      console.error('Error loading user data:', error);
      throw error;
    }
  }

  /**
   * Save asset snapshot data
   */
  async saveSnapshot(snapshotId, snapshotData, password) {
    try {
      const filePath = path.join(this.dataDir, 'snapshots', `${snapshotId}.json`);
      const encryptedData = this.encrypt(snapshotData, password);
      
      await fs.writeJSON(filePath, encryptedData, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Error saving snapshot:', error);
      throw error;
    }
  }

  /**
   * Load asset snapshot data
   */
  async loadSnapshot(snapshotId, password) {
    try {
      const filePath = path.join(this.dataDir, 'snapshots', `${snapshotId}.json`);
      
      if (!(await fs.pathExists(filePath))) {
        return null;
      }
      
      const encryptedData = await fs.readJSON(filePath);
      const snapshotData = this.decrypt(encryptedData, password);
      
      return snapshotData;
    } catch (error) {
      console.error('Error loading snapshot:', error);
      throw error;
    }
  }

  /**
   * List all user files (for admin/backup purposes)
   */
  async listUsers() {
    try {
      const usersDir = path.join(this.dataDir, 'users');
      const files = await fs.readdir(usersDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error listing users:', error);
      return [];
    }
  }

  /**
   * Export user data for backup/migration
   */
  async exportUserData(userId, password) {
    try {
      const userData = await this.loadUserData(userId, password);
      if (!userData) {
        throw new Error('User data not found');
      }
      
      // Also include snapshots
      const snapshots = [];
      if (userData.snapshots) {
        for (const snapshotId of userData.snapshots) {
          const snapshot = await this.loadSnapshot(snapshotId, password);
          if (snapshot) {
            snapshots.push(snapshot);
          }
        }
      }
      
      return {
        user: userData,
        snapshots: snapshots,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Clean up old backup files (keep last 30 days)
   */
  async cleanupBackups() {
    try {
      const backupsDir = path.join(this.dataDir, 'backups');
      const files = await fs.readdir(backupsDir);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(backupsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          await fs.remove(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }

  /**
   * Update user index for login lookup (unencrypted)
   */
  async updateUserIndex(userId, username, email) {
    try {
      const indexPath = path.join(this.dataDir, 'user-index.json');
      let index = {};
      
      // Load existing index
      if (await fs.pathExists(indexPath)) {
        index = await fs.readJSON(indexPath);
      }
      
      // Update index
      index[username.toLowerCase()] = {
        userId,
        email,
        createdAt: new Date().toISOString()
      };
      
      // Save index
      await fs.writeJSON(indexPath, index, { spaces: 2 });
    } catch (error) {
      console.error('Error updating user index:', error);
      throw error;
    }
  }

  /**
   * Find user ID by username
   */
  async findUserByUsername(username) {
    try {
      const indexPath = path.join(this.dataDir, 'user-index.json');
      
      if (!(await fs.pathExists(indexPath))) {
        return null;
      }
      
      const index = await fs.readJSON(indexPath);
      const userInfo = index[username.toLowerCase()];
      
      return userInfo ? userInfo.userId : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }
}

module.exports = new DataStore();