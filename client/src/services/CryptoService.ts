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
 * CryptoService
 * Implementing Zero-Knowledge Architecture
 * 
 * Mandates:
 * 1. Key Derivation: PBKDF2 (SHA-256, 600k ops)
 * 2. Encryption: AES-GCM 256-bit
 * 3. Key Storage: Memory ONLY (never localStorage)
 */

export class CryptoService {
    private static instance: CryptoService;
    private masterKey: CryptoKey | null = null; // In-memory ONLY

    private constructor() { }

    static getInstance(): CryptoService {
        if (!CryptoService.instance) {
            CryptoService.instance = new CryptoService();
        }

        // Check for Secure Context immediately
        if (typeof window !== 'undefined' && (!window.crypto || !window.crypto.subtle)) {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const protocol = window.location.protocol;

            console.error(`CryptoService Fatal Error: Web Crypto API is unavailable.
            Context: ${window.isSecureContext ? 'Secure' : 'Insecure'}
            Protocol: ${protocol}
            Hostname: ${window.location.hostname}
            
            Solution: Access the application via 'localhost', '127.0.0.1', or 'https://'.
            Browsers block crypto.subtle on 'http://' for non-local origins.`);
        }

        return CryptoService.instance;
    }

    /**
     * Derive encryption key from user password
     * @param password User's password
     * @param salt User's unique salt (stored publicly)
     */
    async deriveKey(password: string, salt: string): Promise<void> {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );

        this.masterKey = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: enc.encode(salt),
                iterations: 600000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true, // Extractable (Required for Session Persistence)
            ["encrypt", "decrypt"]
        );

        console.log("CryptoService: Master key derived successfully.");
    }

    /**
     * Export the master key for session persistence
     * (Warning: Stored in sessionStorage only)
     */
    async exportSessionKey(): Promise<JsonWebKey> {
        if (!this.masterKey) throw new Error("No key to export");
        return await window.crypto.subtle.exportKey("jwk", this.masterKey);
    }

    /**
     * Restore the master key from session storage
     */
    async restoreSessionKey(jwk: JsonWebKey): Promise<void> {
        this.masterKey = await window.crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
        console.log("CryptoService: Session restored successfully");
    }

    /**
     * Export the raw key as a string for use as DB Password
     */
    async exportKeyString(): Promise<string> {
        if (!this.masterKey) throw new Error("No key derived");
        const jwk = await window.crypto.subtle.exportKey("jwk", this.masterKey);
        // 'k' is the key component for octet sequence keys (AES)
        return jwk.k || '';
    }

    /**
     * Clear in-memory keys (Logout)
     */
    clearSession(): void {
        this.masterKey = null;
    }

    /**
     * Encrypt data using AES-GCM
     */
    async encrypt(data: string | object): Promise<{ cipherText: string; iv: string }> {
        if (!this.masterKey) throw new Error("Key not derived. User must login first.");

        const enc = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
        const plainText = typeof data === 'string' ? data : JSON.stringify(data);

        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv as any
            },
            this.masterKey,
            enc.encode(plainText)
        );

        // Convert to Base64 for storage
        const cipherText = this.arrayBufferToBase64(encryptedContent);
        const ivBase64 = this.arrayBufferToBase64(iv.buffer);

        return { cipherText, iv: ivBase64 };
    }

    /**
     * Decrypt data using AES-GCM
     */
    /**
     * Decrypt data using AES-GCM
     */
    async decrypt(cipherText: string, ivBase64: string): Promise<any> {
        if (!this.masterKey) throw new Error("Key not derived");

        const encryptedContent = this.base64ToUint8Array(cipherText);
        const iv = this.base64ToUint8Array(ivBase64);

        try {
            const decryptedContent = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv as any
                },
                this.masterKey,
                encryptedContent as any
            );

            const dec = new TextDecoder();
            const decoded = dec.decode(decryptedContent);

            try {
                return JSON.parse(decoded);
            } catch {
                return decoded;
            }
        } catch (e) {
            throw new Error("Decryption failed. Invalid key or data corruption.");
        }
    }

    /**
     * Encrypt object for CouchDB sync (field-level E2EE)
     * Returns separate ciphertext, IV, and auth tag for storage
     */
    async encryptObject(obj: any): Promise<{ ciphertext: string; iv: string; tag: string }> {
        if (!this.masterKey) throw new Error("Key not derived. User must login first.");

        const plaintext = JSON.stringify(obj);
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.masterKey,
            new TextEncoder().encode(plaintext)
        );

        // AES-GCM produces ciphertext + auth tag (last 16 bytes)
        // Split them for explicit storage
        const encryptedArray = new Uint8Array(encrypted);
        const ciphertextBytes = encryptedArray.slice(0, -16);
        const tagBytes = encryptedArray.slice(-16);

        return {
            ciphertext: this.arrayBufferToBase64(ciphertextBytes.buffer),
            iv: this.arrayBufferToBase64(iv.buffer),
            tag: this.arrayBufferToBase64(tagBytes.buffer)
        };
    }

    /**
     * Decrypt object from CouchDB sync (field-level E2EE)
     * Reconstructs ciphertext + tag before decryption
     */
    async decryptObject(data: { ciphertext: string; iv: string; tag: string }): Promise<any> {
        if (!this.masterKey) throw new Error("Key not derived");

        const ciphertextBytes = this.base64ToUint8Array(data.ciphertext);
        const ivBytes = this.base64ToUint8Array(data.iv);
        const tagBytes = this.base64ToUint8Array(data.tag);

        // Combine ciphertext + tag for AES-GCM decryption
        const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
        combined.set(ciphertextBytes);
        combined.set(tagBytes, ciphertextBytes.length);

        try {
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: ivBytes as any },
                this.masterKey,
                combined
            );

            const plaintext = new TextDecoder().decode(decrypted);
            return JSON.parse(plaintext);
        } catch (e) {
            throw new Error('Decryption failed: Invalid key, corrupted data, or tampered ciphertext');
        }
    }

    /**
     * Get the current master key (for sync encryption)
     */
    async getKey(): Promise<CryptoKey> {
        if (!this.masterKey) throw new Error("Key not derived. User must login first.");
        return this.masterKey;
    }

    /**
     * Generate a random salt for new users
     */
    static generateSalt(): string {
        const random = window.crypto.getRandomValues(new Uint8Array(16));
        // Manual base64 since Buffer is not available in browser by default without polyfill
        let binary = '';
        const len = random.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(random[i]);
        }
        return window.btoa(binary);
    }

    // --- Utils ---

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    private base64ToUint8Array(base64: string): Uint8Array {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    }
    // --- ZK Packing Helpers ---

    static readonly ZK_PREFIX = 'ZK1:';

    packEncrypted(iv: string, ciphertext: string): string {
        return `${CryptoService.ZK_PREFIX}${iv}:${ciphertext}`;
    }

    unpackEncrypted(data: string): { iv: string; ciphertext: string } | null {
        if (!data || !data.startsWith(CryptoService.ZK_PREFIX)) return null;
        const parts = data.substring(CryptoService.ZK_PREFIX.length).split(':');
        if (parts.length < 2) return null;
        return { iv: parts[0], ciphertext: parts[1] };
    }

    /**
     * Compute SHA-256 hash of a string
     */
    async hash(data: string): Promise<string> {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
        return this.arrayBufferToBase64(hashBuffer);
    }

    isEncrypted(data: any): boolean {
        return typeof data === 'string' && data.startsWith(CryptoService.ZK_PREFIX);
    }
}

export const cryptoService = CryptoService.getInstance();
