# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of ZakApp and our users' data very seriously. If you discover a security vulnerability, please report it to us immediately.

**DO NOT create a public GitHub issue for security vulnerabilities.**

Please email us at [security@zakapp.org](mailto:security@zakapp.org) or reach out to the maintainers directly.

## Encryption Architecture (v0.10.0+)

### What is Encrypted

**Client-Side (Zero-Knowledge):**
- ✅ Payment recipient names (e.g., "Masjid Al-Noor")
- ✅ Payment notes (sensitive details)
- ✅ Receipt references

**Server-Side (For Functionality):**
- ⚠️ Payment amounts (needed for calculations, encrypted at rest)
- ⚠️ Payment dates (needed for filtering)
- ⚠️ User profile metadata

### Threat Model

| Threat | Protection Level | Details |
|--------|------------------|---------|
| Database breach | ✅ PROTECTED | Encrypted blobs are useless without user password |
| Malicious server admin | ✅ PROTECTED | Cannot decrypt payment recipients/notes |
| Government data request | ✅ PROTECTED | Server cannot provide plaintext of sensitive fields |
| Network eavesdropping | ✅ PROTECTED | HTTPS (TLS 1.3) + client-side encryption |
| Lost password | ⚠️ NO RECOVERY | Data is unrecoverable by design |
| Client-side malware | ⚠️ NOT PROTECTED | If device is compromised, encryption won't help |

### Technical Details

**Encryption:**
- Algorithm: AES-256-GCM
- Key derivation: PBKDF2 (SHA-256, 600,000 iterations)
- IV: 96-bit random (crypto.getRandomValues)
- Format: `ZK1:<iv_base64>:<ciphertext_base64>`

**Key Management:**
- User password → PBKDF2 → Encryption key
- Key stored in memory only (never localStorage)
- Key cleared on logout
- Server never sees password or derived key

### Migration from v0.9.x

Existing users have data encrypted with server-side keys. ZakApp provides an **optional migration wizard** to upgrade historical data to zero-knowledge format.

**Migration Process:**
1. Server decrypts legacy data ONE LAST TIME
2. Client re-encrypts with user's password (ZK1 format)
3. Server stores new encrypted blobs
4. Server forgets ability to decrypt

**Important:** Migration is one-way. After upgrading, lost password = lost data.

See [Migration Guide](docs/MIGRATION_GUIDE.md) for details.

## Security Principles

As outlined in our [Constitution](.specify/memory/constitution.md), we adhere to a **Privacy & Security First** principle:

1.  **Zero-Trust Model**: We assume no network is safe.
2.  **Encryption**: All sensitive financial data is encrypted client-side using **AES-GCM (256-bit)** before synchronization.
3.  **Zero-Knowledge**: Encryption keys are derived from your password and never leave your device.
4.  **No Third-Party Sharing**: User data is never transmitted to third parties except for the optional self-hosted sync relay.
5.  **Self-Hostable**: Users have full control over their infrastructure and can run without any cloud dependency.

## Vulnerability Response Process

1.  **Triage**: We will acknowledge your report within 48 hours.
2.  **Investigation**: We will investigate the issue and determine its impact.
3.  **Fix**: We will develop a patch and verify it.
4.  **Disclosure**: Once the patch is released, we will disclose the vulnerability and credit the reporter (if desired).
