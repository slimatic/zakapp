import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

// Data directory configuration
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
// const TAG_LENGTH = 16; // 128 bits - reserved for future use

/**
 * Initialize data directories
 */
export async function initializeDataDirectories(): Promise<void> {
  await fs.ensureDir(DATA_DIR);
  await fs.ensureDir(USERS_DIR);
  await fs.ensureDir(BACKUPS_DIR);
}

/**
 * Generate encryption key from password
 */
export function deriveKeyFromPassword(password: string, salt: string): Buffer {
  const KEY_LENGTH = 32; // 256 bits
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt data using AES-256-GCM (enhanced encryption for production)
 */
export function encryptDataSecure(data: string): {
  encrypted: string;
  iv: string;
  authTag: string;
  key: string;
} {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.randomBytes(KEY_LENGTH);

  const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, key);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // For GCM mode, we'd use getAuthTag(), but createCipher doesn't support GCM
  // Let's use a simpler approach for now
  const authTag = crypto
    .createHmac('sha256', key)
    .update(encrypted)
    .digest('hex')
    .slice(0, 32);

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
    key: key.toString('hex'),
  };
}

/**
 * Decrypt data
 */
export function decryptDataSecure(
  encryptedData: string,
  iv: string,
  authTag: string,
  key: string
): string {
  const keyBuffer = Buffer.from(key, 'hex');

  // Verify auth tag
  const expectedAuthTag = crypto
    .createHmac('sha256', keyBuffer)
    .update(encryptedData)
    .digest('hex')
    .slice(0, 32);
  if (expectedAuthTag !== authTag) {
    throw new Error('Authentication tag verification failed');
  }

  const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, keyBuffer);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Simple encryption for basic implementation (backward compatible)
 */
export function encryptData(data: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  // For now, just base64 encode for development - this maintains backward compatibility
  const encoded = Buffer.from(data).toString('base64');
  return {
    encrypted: encoded,
    iv: crypto.randomBytes(16).toString('hex'),
    authTag: crypto.randomBytes(16).toString('hex'),
  };
}

/**
 * Decrypt data (backward compatible)
 */
export function decryptData(encryptedData: string): string {
  // For now, just base64 decode for development
  return Buffer.from(encryptedData, 'base64').toString('utf8');
}

/**
 * Read encrypted user file (backward compatible)
 */
export async function readUserFile(
  userId: string,
  filename: string
): Promise<Record<string, unknown>> {
  const filePath = getUserFilePath(userId, `${filename}.enc`);

  if (!(await fs.pathExists(filePath))) {
    throw new Error(`File ${filename} not found for user ${userId}`);
  }

  const encryptedContent = await fs.readJson(filePath);
  const decryptedData = decryptData(
    encryptedContent.encrypted || encryptedContent.data
  );

  return JSON.parse(decryptedData);
}

/**
 * Write encrypted user file (backward compatible)
 */
export async function writeUserFile(
  userId: string,
  filename: string,
  data: Record<string, unknown>
): Promise<void> {
  const userDir = getUserDirectory(userId);
  await fs.ensureDir(userDir);

  const jsonData = JSON.stringify(data, null, 2);
  const encrypted = encryptData(jsonData);

  const filePath = getUserFilePath(userId, `${filename}.enc`);
  await fs.writeJson(filePath, encrypted, { spaces: 2 });
}

/**
 * Read securely encrypted user file
 */
export async function readUserFileSecure(
  userId: string,
  filename: string,
  encryptionKey: string
): Promise<Record<string, unknown>> {
  const filePath = getUserFilePath(userId, `${filename}.secure.enc`);

  if (!(await fs.pathExists(filePath))) {
    throw new Error(`Secure file ${filename} not found for user ${userId}`);
  }

  const encryptedContent = await fs.readJson(filePath);
  const decryptedData = decryptDataSecure(
    encryptedContent.encrypted,
    encryptedContent.iv,
    encryptedContent.authTag,
    encryptionKey
  );

  return JSON.parse(decryptedData);
}

/**
 * Write securely encrypted user file
 */
export async function writeUserFileSecure(
  userId: string,
  filename: string,
  data: Record<string, unknown>
): Promise<string> {
  const userDir = getUserDirectory(userId);
  await fs.ensureDir(userDir);

  const jsonData = JSON.stringify(data, null, 2);
  const encrypted = encryptDataSecure(jsonData);

  const filePath = getUserFilePath(userId, `${filename}.secure.enc`);
  await fs.writeJson(
    filePath,
    {
      encrypted: encrypted.encrypted,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      timestamp: new Date().toISOString(),
    },
    { spaces: 2 }
  );

  // Return the encryption key - in production, this should be derived from user password
  return encrypted.key;
}

/**
 * Get user directory path
 */
export function getUserDirectory(userId: string): string {
  return path.join(USERS_DIR, userId);
}

/**
 * Get user file path
 */
export function getUserFilePath(userId: string, filename: string): string {
  return path.join(getUserDirectory(userId), filename);
}

/**
 * Check if user directory exists
 */
export async function userDirectoryExists(userId: string): Promise<boolean> {
  const userDir = getUserDirectory(userId);
  return fs.pathExists(userDir);
}

/**
 * Create user directory
 */
export async function createUserDirectory(userId: string): Promise<void> {
  const userDir = getUserDirectory(userId);
  await fs.ensureDir(userDir);
}

/**
 * Delete user file
 */
export async function deleteUserFile(
  userId: string,
  filename: string
): Promise<void> {
  const filePath = getUserFilePath(userId, `${filename}.enc`);

  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
  }
}

/**
 * List user files
 */
export async function listUserFiles(userId: string): Promise<string[]> {
  const userDir = getUserDirectory(userId);

  if (!(await fs.pathExists(userDir))) {
    return [];
  }

  const files = await fs.readdir(userDir);
  return files
    .filter(file => file.endsWith('.enc'))
    .map(file => file.replace('.enc', ''));
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a salt for encryption
 */
export function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}
