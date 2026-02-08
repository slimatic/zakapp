# Zero-Knowledge Architecture

## What is Zero-Knowledge Encryption?

**Zero-knowledge encryption** means that your sensitive data is encrypted on YOUR device, with YOUR password, BEFORE it ever reaches the server. Even if someone gains full access to our database, they cannot decrypt your data without your password.

## How ZakApp Implements Zero-Knowledge

### v0.9.x (Old Architecture)
- ❌ Data encrypted on the server
- ❌ Server holds the encryption key
- ❌ Server admins could decrypt your data
- ❌ Database breach = all data exposed

### v0.10.0+ (Zero-Knowledge Architecture)
- ✅ Data encrypted in your browser
- ✅ Encryption key derived from YOUR password
- ✅ Server cannot decrypt your data
- ✅ Database breach = encrypted blobs (useless without your password)

## What Gets Zero-Knowledge Protection?

### Protected with Zero-Knowledge Encryption:
- **Payment Recipients** - Who you paid (e.g., "Masjid Al-Noor", "Local Food Bank")
- **Payment Notes** - Private details about payments
- **Receipt References** - Receipt numbers and identifiers

### Not Encrypted (Required for Functionality):
- **Payment Amounts** - Needed for Zakat calculations
- **Payment Dates** - Needed for timeline filtering
- **User Email** - Needed for authentication

## How It Works (Simple Explanation)

1. **You Create a Payment**
   - You enter: "Paid $100 to Masjid Al-Noor"
   
2. **Your Browser Encrypts It**
   - Your password → Encryption key (PBKDF2, 600k iterations)
   - "Masjid Al-Noor" → `ZK1:abc123:xyz789` (encrypted blob)
   - Encryption happens in your browser using Web Crypto API

3. **Server Stores the Encrypted Blob**
   - Server receives: `ZK1:abc123:xyz789`
   - Server has NO IDEA what it says
   - Server stores it as-is in the database

4. **You View Your Payments**
   - Server sends back: `ZK1:abc123:xyz789`
   - Your browser decrypts it → "Masjid Al-Noor"
   - You see your data

## Technical Details

### Encryption Algorithm
- **Algorithm:** AES-256-GCM (industry standard)
- **Key Derivation:** PBKDF2-SHA256 (600,000 iterations)
- **IV Generation:** 96-bit random (crypto.getRandomValues)
- **Format:** `ZK1:<iv_base64>:<ciphertext_base64>`

### Security Properties
- **Authentication:** GCM provides authenticated encryption (tamper-proof)
- **Forward Secrecy:** Past data remains encrypted even if future keys are compromised
- **No Key Escrow:** We don't have a "master key" to unlock your data
- **Standards Compliant:** Uses Web Crypto API (W3C standard)

## The Trade-Off: Lost Password = Lost Data

This is the price of true zero-knowledge encryption:

| Feature | Traditional Encryption | Zero-Knowledge |
|---------|----------------------|----------------|
| Server can help recover password | ✅ Yes | ❌ No |
| Server can decrypt your data | ✅ Yes | ❌ No |
| Data safe from server breach | ❌ No | ✅ Yes |
| Data safe from malicious admin | ❌ No | ✅ Yes |

**Important:** If you lose your password, we CANNOT recover your encrypted data. This is by design. It's the same trade-off as:
- End-to-end encrypted messaging (Signal, WhatsApp)
- Password managers (1Password, Bitwarden)
- Hardware wallets (Ledger, Trezor)

## Migration from v0.9.x

If you're upgrading from v0.9.x, you can **optionally** migrate your historical data to zero-knowledge format.

**Migration Process:**
1. Server decrypts your old data (one last time)
2. Client re-encrypts it with your password
3. Server stores the new encrypted blobs
4. Server forgets the old encryption key

See [Migration Guide](MIGRATION_GUIDE.md) for step-by-step instructions.

## Threat Model: What We Protect Against

| Threat | Protection Level | Explanation |
|--------|------------------|-------------|
| **Database Breach** | ✅ PROTECTED | Attackers get encrypted blobs (useless without password) |
| **Malicious Server Admin** | ✅ PROTECTED | Admin cannot decrypt payment recipients/notes |
| **Government Data Request** | ✅ PROTECTED | We can only provide encrypted blobs (unusable) |
| **Network Eavesdropping** | ✅ PROTECTED | HTTPS + client-side encryption = double protection |
| **Lost Password** | ⚠️ NO RECOVERY | Data is unrecoverable by design |
| **Compromised Device** | ⚠️ NOT PROTECTED | If malware is on your device, encryption won't help |

## Comparison with Other Services

| Service | Architecture | Server Can Read Data? |
|---------|--------------|----------------------|
| Gmail | Server-side encryption | ✅ Yes |
| Dropbox | Server-side encryption | ✅ Yes |
| ProtonMail | Zero-knowledge | ❌ No |
| Signal | End-to-end encryption | ❌ No |
| **ZakApp v0.10.0+** | **Zero-knowledge** | **❌ No** |

## Frequently Asked Questions

**Q: Why don't you encrypt payment amounts?**  
A: We need to calculate Zakat totals on the server for dashboard summaries. Encrypting amounts would require client-side calculations only, breaking multi-device sync.

**Q: Can you add a "master key" for password recovery?**  
A: That would defeat the purpose of zero-knowledge encryption. A master key means we CAN decrypt your data, which violates the security model.

**Q: What if I forget my password?**  
A: Your ZK1-encrypted data cannot be recovered. This is the same trade-off as Signal, ProtonMail, and other zero-knowledge services.

**Q: Is this overkill for a Zakat app?**  
A: Financial privacy is a right. Payment recipients reveal your religious practices, charitable giving patterns, and community affiliations. This data is sensitive.

**Q: How do I know this is actually zero-knowledge?**  
A: ZakApp is open-source (AGPLv3). You can audit the code yourself:
- Client encryption: `client/src/services/CryptoService.ts`
- Server storage: `server/src/services/EncryptionService.ts`
- Format specification: `docs/ZK_API_SPECIFICATION.md`

## Learn More

- [Migration Guide](MIGRATION_GUIDE.md) - How to upgrade from v0.9.x
- [ZK API Specification](ZK_API_SPECIFICATION.md) - Technical implementation details
- [Security Policy](../SECURITY.md) - Complete security documentation

## Support

If you have questions about zero-knowledge encryption:
- GitHub Discussions: https://github.com/slimatic/zakapp/discussions
- Email: security@zakapp.org
