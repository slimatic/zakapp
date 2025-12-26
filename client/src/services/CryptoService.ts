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
            false, // Not extractable
            ["encrypt", "decrypt"]
        );

        console.log("CryptoService: Master key derived successfully.");
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
                iv: iv
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
    async decrypt(cipherText: string, ivBase64: string): Promise<any> {
        if (!this.masterKey) throw new Error("Key not derived");

        const encryptedContent = this.base64ToArrayBuffer(cipherText);
        const iv = this.base64ToArrayBuffer(ivBase64);

        try {
            const decryptedContent = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv as BufferSource
                },
                this.masterKey,
                encryptedContent as BufferSource
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

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

export const cryptoService = CryptoService.getInstance();
