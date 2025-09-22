import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

// Data directory configuration
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

// Encryption configuration (currently unused but kept for future enhancement)
// const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
// const KEY_LENGTH = 32; // 256 bits
// const IV_LENGTH = 16; // 128 bits

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
 * Simplified encryption for basic implementation
 * In production, use proper encryption with AES-256-GCM
 */
export function encryptData(data: string): { encrypted: string; iv: string; authTag: string } {
  // For now, just base64 encode for development
  const encoded = Buffer.from(data).toString('base64');
  return {
    encrypted: encoded,
    iv: crypto.randomBytes(16).toString('hex'),
    authTag: crypto.randomBytes(16).toString('hex'),
  };
}

/**
 * Decrypt data
 */
export function decryptData(encryptedData: string): string {
  // For now, just base64 decode for development
  return Buffer.from(encryptedData, 'base64').toString('utf8');
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
 * Read encrypted user file
 */
export async function readUserFile(userId: string, filename: string): Promise<Record<string, unknown>> {
  const filePath = getUserFilePath(userId, `${filename}.enc`);
  
  if (!(await fs.pathExists(filePath))) {
    throw new Error(`File ${filename} not found for user ${userId}`);
  }
  
  const encryptedContent = await fs.readJson(filePath);
  const decryptedData = decryptData(encryptedContent.data);
  
  return JSON.parse(decryptedData);
}

/**
 * Write encrypted user file
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
 * Delete user file
 */
export async function deleteUserFile(userId: string, filename: string): Promise<void> {
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
  return files.filter(file => file.endsWith('.enc')).map(file => file.replace('.enc', ''));
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