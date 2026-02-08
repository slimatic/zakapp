# Zero-Knowledge Encryption Migration Guide

## Overview

ZakApp v0.10.0 introduces **true zero-knowledge encryption**. If you're upgrading from v0.9.x, your historical payment data can be upgraded to the new format.

## What's Changing?

| Aspect | v0.9.x (Old) | v0.10.0 (New) |
|--------|--------------|---------------|
| Encryption location | Server | Client (Your Device) |
| Who can decrypt | Server admin | Only you (with password) |
| Password recovery | ✅ Possible | ❌ Impossible |
| Privacy level | Good | Excellent |

## Should You Migrate?

**Migrate if:**
- ✅ You want maximum privacy
- ✅ You have a strong, memorable password
- ✅ You understand the trade-off (no password recovery)

**Don't migrate if:**
- ❌ You frequently forget passwords
- ❌ You're satisfied with current encryption
- ❌ You prefer password recovery over absolute privacy

## Migration Steps

### Step 1: Ensure You're Logged In
Migration requires your password to re-encrypt data.

### Step 2: Start Migration Wizard
- Navigate to Dashboard
- Click "Privacy Upgrade Available" banner
- Or: Settings → Security → Upgrade Encryption

### Step 3: Review Information
- See how many payments will be upgraded
- Read benefits and trade-offs carefully
- Acknowledge understanding

### Step 4: Wait for Completion
- Migration takes ~30 seconds for 50 payments
- DO NOT close browser window during migration
- Progress bar shows real-time status

### Step 5: Confirmation
- ✅ Success message displayed
- All payments now use ZK1 encryption
- Server can no longer decrypt your data

## Technical Details

**What Happens During Migration:**

1. **Server decrypts legacy data** (using its encryption key)
2. **Client receives plaintext** (over HTTPS)
3. **Client re-encrypts with your password** (ZK1 format)
4. **Client sends ZK1 blobs to server**
5. **Server stores opaque blobs** (cannot decrypt)

**Format Change:**
- Old: `<iv>:<encrypted>:<tag>` (server key)
- New: `ZK1:<iv>:<ciphertext>` (your password)

## Frequently Asked Questions

**Q: What if migration is interrupted?**  
A: It's safe to restart. Already-migrated payments won't be re-migrated.

**Q: Can I undo migration?**  
A: No. Migration is one-way.

**Q: What if I lose my password after migrating?**  
A: Your encrypted data cannot be recovered. Save your password securely!

**Q: Do I need to migrate immediately?**  
A: No. You can continue using legacy encryption indefinitely.

**Q: Will new payments use ZK1 automatically?**  
A: Yes! All new payments (created after v0.10.0) are automatically ZK1-encrypted.

**Q: Can I skip migration?**  
A: Yes. You'll have a mix of legacy and ZK1 payments. Both work fine.

## Troubleshooting

**"Migration failed: Network error"**
- Check internet connection
- Restart migration

**"Cannot decrypt data"**
- Ensure you're logged in with correct password
- Clear browser cache and re-login

**"Migration stuck at 99%"**
- Wait 30 seconds
- Refresh page and check status

## Support

If you encounter issues:
- GitHub Issues: https://github.com/slimatic/zakapp/issues
- Email: security@zakapp.org
