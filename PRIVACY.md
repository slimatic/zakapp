# Privacy Policy

**Last Updated:** January 2026

## Our Privacy Commitment

ZakApp is designed with privacy as a foundational principle. Your financial data is encrypted, stored locally on your device by default, and always under your control.

---

## How ZakApp Protects Your Data

### Local-First Architecture
Your detailed financial records (assets, liabilities, payments, calculations) are stored **locally on your device** using encrypted IndexedDB storage. This data never leaves your device unless you explicitly enable cloud sync.

### End-to-End Encryption
- **Client-side**: Your financial data is encrypted using AES-256-GCM with a key derived from your password
- **Server-side**: Any data stored on our servers is encrypted using AES-256 encryption
- **In transit**: All data transfers use TLS 1.2+ encryption

### Open Source Transparency
Our code is [open source on GitHub](https://github.com/slimatic/zakapp). You can audit our implementation, verify our privacy claims, and run your own instance.

---

## Data We Collect

### Account Information (Required for Registration)

| Data | Storage | Purpose |
|------|---------|---------|
| Email address | Plaintext | Login identifier |
| Username | Plaintext (optional) | Alternative login identifier |
| Password | Bcrypt hash (irreversible) | Authentication |
| First name, Last name | Encrypted | Personalization |
| Account preferences | Encrypted | Currency, methodology, calendar type |
| Account creation date | Plaintext | Account management |
| Last login timestamp | Plaintext | Security monitoring |

### Session & Security Data

| Data | Retention | Purpose |
|------|-----------|---------|
| IP address | Duration of session | Fraud prevention |
| Browser/device info | Duration of session | Session management |
| Login timestamps | 90 days | Security audit trail |

### Financial Data (Local by Default)

Your detailed financial information is stored **locally and synced** (encrypted) when you are logged in:
- Asset records (values, categories, notes)
- Liability records
- Zakat calculations and history
- Payment records
- Nisab Year Records (Hawl tracking)

**Sync is automatic** when logged in. Encrypted copies are stored on our CouchDB servers.

---

## Browser Storage

### The ZakApp Application

| Storage Type | Data | Purpose |
|--------------|------|---------|
| localStorage | Authentication tokens | Maintain login session |
| localStorage | UI preferences | Remember dismissed prompts |
| sessionStorage | Session encryption key | Decrypt data during session |
| IndexedDB | Encrypted financial database | Your local data vault |

---

## Data We Do NOT Collect

- ❌ Tracking cookies or analytics pixels
- ❌ Third-party advertising data
- ❌ Unencrypted financial information on our servers
- ❌ Your actual password (only an irreversible hash)
- ❌ Behavioral data for marketing purposes

---

## Third-Party Services

| Service | Purpose | Privacy Policy |
|---------|---------|----------------|
| Google Fonts | Typography | [Google Privacy](https://policies.google.com/privacy) |
| Ko-fi | Donations (optional) | [Ko-fi Privacy](https://ko-fi.com/home/privacy) |

---

## Data Retention & Deletion

### Retention
- **Account data**: Until you delete your account
- **Session logs**: 90 days
- **Synced data**: Until you disable sync or delete account
- **Local data**: Until you clear it

### Deletion
1. **Local data**: Settings → Danger Zone → "Delete Local Data"
2. **Sync data**: Settings → Sync → Disable sync
3. **Full account**: Settings → Danger Zone → "Delete Account"
4. **Manual request**: Open a GitHub issue

Account deletion requests are processed within 30 days.

---

## Your Rights

| Right | How to Exercise |
|-------|-----------------|
| **Access** your data | Settings → Export |
| **Correct** your data | Edit in application |
| **Delete** your data | Settings → Danger Zone |
| **Data portability** | Export to JSON |
| **Audit our claims** | [View source code](https://github.com/slimatic/zakapp) |

---

## Self-Hosted Instances

If you run your own ZakApp instance, you control all data storage. This policy applies only to the official hosted version.

---

## Security Practices

- HTTPS (TLS 1.2+) for all communications
- Passwords hashed with bcrypt
- JWT tokens expire after 15 minutes (access) / 7 days (refresh)
- Rate limiting against brute force attacks
- Content Security Policy headers

---

## Contact

- **GitHub Issues**: [github.com/slimatic/zakapp](https://github.com/slimatic/zakapp/issues)
- **Project Maintainers**: Listed in the repository

---

*For the complete hosted version privacy policy, visit [zakapp.org/privacy](https://zakapp.org/privacy)*
