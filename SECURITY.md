# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of ZakApp and our users' data very seriously. If you discover a security vulnerability, please report it to us immediately.

**DO NOT create a public GitHub issue for security vulnerabilities.**

Please email us at [security@zakapp.org](mailto:security@zakapp.org) (placeholder) or reach out to the maintainers directly.

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
