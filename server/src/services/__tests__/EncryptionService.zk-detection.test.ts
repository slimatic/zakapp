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

import { describe, it, expect } from 'vitest';
import { EncryptionService } from '../EncryptionService';

describe('EncryptionService - ZK1 Format Detection', () => {
  describe('isZeroKnowledgeFormat', () => {
    it('should detect ZK1 format with standard format', () => {
      const zk1Data = 'ZK1:kZ8jH2k4mN6p:Ax7Bq3Dm9Fp2Ks5Lt8Wv1Zx4Cy7Ez0';
      expect(EncryptionService.isZeroKnowledgeFormat(zk1Data)).toBe(true);
    });

    it('should detect ZK1 format with minimal data', () => {
      const zk1Data = 'ZK1:abc123:def456';
      expect(EncryptionService.isZeroKnowledgeFormat(zk1Data)).toBe(true);
    });

    it('should detect ZK1 format with long ciphertext', () => {
      const zk1Data = 'ZK1:shortIV12345:veryLongCiphertextBase64EncodedDataHereWithLotsOfCharacters==';
      expect(EncryptionService.isZeroKnowledgeFormat(zk1Data)).toBe(true);
    });

    it('should reject legacy server-encrypted format (no ZK1 prefix)', () => {
      const legacyData = 'abc123:def456:ghi789';
      expect(EncryptionService.isZeroKnowledgeFormat(legacyData)).toBe(false);
    });

    it('should reject legacy format with base64 encoding', () => {
      const legacyData = 'kZ8jH2k4mN6p:Ax7Bq3Dm9Fp2Ks5Lt8Wv1Zx4Cy7Ez0:tagBase64==';
      expect(EncryptionService.isZeroKnowledgeFormat(legacyData)).toBe(false);
    });

    it('should handle null values', () => {
      expect(EncryptionService.isZeroKnowledgeFormat(null)).toBe(false);
    });

    it('should handle undefined values', () => {
      expect(EncryptionService.isZeroKnowledgeFormat(undefined)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(EncryptionService.isZeroKnowledgeFormat('')).toBe(false);
    });

    it('should handle non-string values', () => {
      expect(EncryptionService.isZeroKnowledgeFormat(123 as any)).toBe(false);
      expect(EncryptionService.isZeroKnowledgeFormat({} as any)).toBe(false);
      expect(EncryptionService.isZeroKnowledgeFormat([] as any)).toBe(false);
    });

    it('should reject strings starting with "ZK" but not "ZK1:"', () => {
      expect(EncryptionService.isZeroKnowledgeFormat('ZK2:test:data')).toBe(false);
      expect(EncryptionService.isZeroKnowledgeFormat('ZKtest')).toBe(false);
      expect(EncryptionService.isZeroKnowledgeFormat('ZK1test:data')).toBe(false);
    });

    it('should reject plaintext that contains "ZK1:" not at the start', () => {
      expect(EncryptionService.isZeroKnowledgeFormat('some prefix ZK1:data')).toBe(false);
    });

    it('should be case-sensitive (lowercase zk1 should fail)', () => {
      expect(EncryptionService.isZeroKnowledgeFormat('zk1:test:data')).toBe(false);
    });
  });
});
