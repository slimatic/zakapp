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

/**
 * Zero-Knowledge Encryption API Contracts
 * 
 * This file defines the TypeScript interfaces and types for client-side
 * encryption (zero-knowledge architecture) in ZakApp.
 * 
 * @see docs/ZK_API_SPECIFICATION.md for full specification
 */

// ============================================================================
// ENCRYPTION FORMAT ENUMS
// ============================================================================

/**
 * Encryption format detection enum
 * Used to identify whether data uses ZK1 (client-encrypted) or legacy (server-encrypted) format
 */
export enum EncryptionFormat {
  /**
   * ZK1 format: Client-side encrypted with user-derived key
   * Format: `ZK1:<iv_base64>:<ciphertext_base64>`
   * - Server CANNOT decrypt
   * - Uses AES-256-GCM
   * - IV: 96-bit (12 bytes)
   */
  ZK1 = 'ZK1',

  /**
   * Legacy format: Server-side encrypted with server key
   * Format: `<iv_base64>:<encrypted_base64>:<tag_base64>`
   * - Server CAN decrypt
   * - Uses AES-256-GCM
   * - IV: 96-bit (12 bytes)
   */
  LEGACY = 'LEGACY',

  /**
   * Plaintext: No encryption detected
   */
  PLAINTEXT = 'PLAINTEXT'
}

/**
 * User's encryption migration status
 * Tracks which encryption system the user is currently using
 */
export enum MigrationStatus {
  /**
   * User has not migrated - still using server-side encryption
   * All data is encrypted with server key
   */
  PENDING = 'pending',

  /**
   * User is in the process of migrating
   * Some data may be in ZK1 format, some in legacy format
   */
  IN_PROGRESS = 'in_progress',

  /**
   * User has completed migration to zero-knowledge encryption
   * All data is encrypted with client-side key (ZK1 format)
   */
  COMPLETED = 'completed'
}

// ============================================================================
// ZK1 FORMAT SPECIFICATION
// ============================================================================

/**
 * ZK1 Encrypted Data Format
 * 
 * Format: `ZK1:<iv_base64>:<ciphertext_base64>`
 * 
 * Example: `ZK1:kZ8jH2k4mN6p:Ax7Bq3Dm9Fp2Ks5Lt8Wv1Zx4Cy7Ez0`
 * 
 * Components:
 * - Prefix: 'ZK1:' (fixed, indicates format version)
 * - IV: base64-encoded initialization vector (12 bytes = 16 chars base64)
 * - Ciphertext: base64-encoded encrypted data with auth tag (variable length)
 * 
 * Note: AES-GCM authentication tag is embedded in the ciphertext (last 16 bytes)
 */
export interface ZK1EncryptedData {
  /**
   * Full ZK1 formatted string
   * Format: `ZK1:<iv_base64>:<ciphertext_base64>`
   */
  formatted: string;

  /**
   * Parsed components (for debugging/validation only)
   */
  components?: {
    prefix: 'ZK1';
    iv: string;        // base64
    ciphertext: string; // base64 (includes embedded auth tag)
  };
}

// ============================================================================
// PAYMENT DATA STRUCTURES
// ============================================================================

/**
 * Encrypted payment data (client → server)
 * All sensitive fields are encrypted in ZK1 format
 */
export interface EncryptedPaymentData {
  /**
   * Payment ID (plaintext, server-generated)
   */
  id?: string;

  /**
   * User ID (plaintext, server-managed)
   */
  userId?: string;

  /**
   * Associated calculation ID (plaintext, optional)
   */
  calculationId?: string | null;

  /**
   * Payment amount (plaintext - used for calculations and reporting)
   * Note: Amount is NOT encrypted to allow server-side aggregations
   */
  amount: number;

  /**
   * Currency code (plaintext)
   */
  currency?: string;

  /**
   * Payment date (plaintext - used for filtering and sorting)
   * Format: ISO 8601 date string
   */
  paymentDate: string;

  /**
   * Encrypted recipient information (ZK1 format)
   * Format: `ZK1:<iv>:<ciphertext>`
   * Plaintext contains: recipient name/organization
   */
  recipient?: string;

  /**
   * Encrypted notes (ZK1 format)
   * Format: `ZK1:<iv>:<ciphertext>`
   * Plaintext contains: user's private notes
   */
  notes?: string;

  /**
   * Payment method (plaintext, optional)
   */
  paymentMethod?: string;

  /**
   * Payment status (plaintext)
   */
  status?: string;

  /**
   * Islamic year (plaintext, server-calculated)
   */
  islamicYear?: string;

  /**
   * Verification details (JSON string, may contain encrypted fields)
   */
  verificationDetails?: string;

  /**
   * Creation timestamp (server-managed)
   */
  createdAt?: string;

  /**
   * Last update timestamp (server-managed)
   */
  updatedAt?: string;
}

/**
 * Decrypted payment data (for client use after decryption)
 */
export interface DecryptedPaymentData extends Omit<EncryptedPaymentData, 'recipient' | 'notes'> {
  /**
   * Decrypted recipient (plaintext string)
   */
  recipient?: string;

  /**
   * Decrypted notes (plaintext string)
   */
  notes?: string;
}

// ============================================================================
// MIGRATION API TYPES
// ============================================================================

/**
 * Response from GET /api/user/encryption-status
 * Tells the client whether migration is needed
 */
export interface EncryptionStatusResponse {
  /**
   * User's current migration status
   */
  status: MigrationStatus;

  /**
   * Total number of payment records
   */
  totalPayments: number;

  /**
   * Number of payments still in legacy format
   */
  legacyPayments: number;

  /**
   * Number of payments migrated to ZK1 format
   */
  zk1Payments: number;

  /**
   * Whether user needs to start migration
   */
  requiresMigration: boolean;

  /**
   * User's encryption salt (public, used for key derivation)
   */
  salt: string;
}

/**
 * Response from POST /api/user/prepare-migration
 * Contains decrypted legacy data for client re-encryption
 */
export interface MigrationPrepareResponse {
  /**
   * Success indicator
   */
  success: boolean;

  /**
   * Array of payment records with decrypted sensitive fields
   * Client must re-encrypt these with ZK1 format
   */
  payments: Array<{
    id: string;
    recipient?: string | null;  // Decrypted by server
    notes?: string | null;      // Decrypted by server
  }>;

  /**
   * Total number of payments to migrate
   */
  totalCount: number;
}

/**
 * Request body for PATCH /api/payments/:id
 * Used during migration to update payment with ZK1-encrypted data
 */
export interface UpdatePaymentEncryptionRequest {
  /**
   * Re-encrypted recipient in ZK1 format
   * Format: `ZK1:<iv>:<ciphertext>`
   */
  recipient?: string | null;

  /**
   * Re-encrypted notes in ZK1 format
   * Format: `ZK1:<iv>:<ciphertext>`
   */
  notes?: string | null;
}

/**
 * Request body for POST /api/user/mark-migrated
 * Marks user as fully migrated to ZK1
 */
export interface MarkMigratedRequest {
  /**
   * Confirmation that client has completed migration
   */
  confirmed: boolean;
}

/**
 * Response from POST /api/user/mark-migrated
 */
export interface MarkMigratedResponse {
  /**
   * Success indicator
   */
  success: boolean;

  /**
   * New migration status (should be 'completed')
   */
  status: MigrationStatus;

  /**
   * Informational message
   */
  message: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Standard error response from API
 */
export interface ApiErrorResponse {
  /**
   * Error indicator
   */
  error: true;

  /**
   * Error message
   */
  message: string;

  /**
   * HTTP status code
   */
  statusCode: number;

  /**
   * Error code for client handling
   */
  code?: string;

  /**
   * Additional error details
   */
  details?: Record<string, any>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Helper type to mark fields as encrypted in ZK1 format
 */
export type ZK1Encrypted<T extends string> = `ZK1:${string}:${string}` & { __brand: T };

/**
 * Helper type for legacy encrypted format
 */
export type LegacyEncrypted<T extends string> = `${string}:${string}:${string}` & { __brand: T };

/**
 * Format detection result
 */
export interface FormatDetectionResult {
  /**
   * Detected format
   */
  format: EncryptionFormat;

  /**
   * Whether data is encrypted
   */
  isEncrypted: boolean;

  /**
   * Whether server can decrypt (true for LEGACY, false for ZK1)
   */
  serverCanDecrypt: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * ZK1 format prefix constant
 */
export const ZK1_PREFIX = 'ZK1:' as const;

/**
 * Encryption algorithm constant
 */
export const ENCRYPTION_ALGORITHM = 'AES-256-GCM' as const;

/**
 * Key derivation parameters
 */
export const KEY_DERIVATION = {
  algorithm: 'PBKDF2',
  iterations: 600000,
  hash: 'SHA-256',
  keyLength: 256
} as const;

/**
 * IV length for AES-GCM (in bytes)
 */
export const IV_LENGTH_BYTES = 12 as const;

/**
 * Auth tag length for AES-GCM (in bytes)
 */
export const AUTH_TAG_LENGTH_BYTES = 16 as const;
