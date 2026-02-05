<div align="center">
  <a href="https://github.com/slimatic/zakapp">
    <img src="client/public/logo.svg" alt="ZakApp Logo" width="120" height="auto" />
  </a>
  <h1>ZakApp</h1>
  <p>
    <b>Your Secure, Private Wealth & Zakat Vault.</b>
  </p>
</div>

![License](https://img.shields.io/badge/license-AGPLv3-blue.svg)
![Status](https://img.shields.io/badge/status-stable-green.svg)
![Compliance](https://img.shields.io/badge/compliance-shariah--compliant-green.svg)

ZakApp Re-imagines the wealth purification experience by prioritizing user privacy, Fiqh precision, and modern design. Unlike other tools that send your Net Worth to a cloud server, ZakApp performs all calculations locally.

[![Sustain ZakApp](https://img.shields.io/badge/Sustain-ZakApp-teal?style=for-the-badge&logo=kofi)](website/donate.html)

## 🔒 Privacy First

-   **Zero-Knowledge Architecture**: Your financial data never leaves your device.
-   **Local Database**: Uses RxDB (IndexedDB/SQLite) for offline-first resilience.
-   **Client-Side Logic**: Usage of `window.crypto` for any sensitivity.

## ✨ Features

-   **Precision Hawl Tracking**: Tracks Nisab thresholds based on Lunar Hijri calendar.
-   **Multi-Madhab Compliance**: Toggle between Hanafi, Shafi'i, Maliki, and Hanbali rulings.
-   **Asset Portfolio Management**: Detailed tracking for Gold, Crypto, 401k, and Real Estate.
-   **Offline-First & PWA**: Installable as a native app with full offline capabilities (pwa-install).
-   **Responsive Design**: optimized for all device sizes with mobile-first UX.

## 🚀 Quick Start

### Option 1: Quick Start with Prebuilt Images (Easiest)

```bash
git clone https://github.com/slimatic/zakapp.git && cd zakapp
cp .env.example .env   # Edit this file with your secrets!
docker-compose -f docker-compose.simple.yml up -d
```

Visit `http://localhost:3000` — you're running! 🎉

This uses prebuilt, secure Docker images from GitHub Container Registry. No building required!

For development with local builds (hot reload), use:
```bash
docker-compose --profile dev up -d
```

#### Verifying Prebuilt Images

For security-conscious users, you can verify the integrity of prebuilt images:

```bash
# Install cosign (if not already installed)
# Verify frontend image signature
cosign verify ghcr.io/slimatic/zakapp-frontend:latest \
  --certificate-identity-regexp ".*" \
  --certificate-oidc-issuer-regexp ".*"

# Verify backend image signature  
cosign verify ghcr.io/slimatic/zakapp-backend:latest \
  --certificate-identity-regexp ".*" \
  --certificate-oidc-issuer-regexp ".*"

# Check SBOM (Software Bill of Materials)
docker sbom ghcr.io/slimatic/zakapp-frontend:latest
docker sbom ghcr.io/slimatic/zakapp-backend:latest
```

Images are built from verified Git commits and signed with cosign.

### Option 1b: Self-Host with Local Build

```bash
git clone https://github.com/slimatic/zakapp.git && cd zakapp
cp .env.example .env   # Edit this file with your secrets!
docker compose up -d
```

This builds images from source. See [Self-Hosting Guide](SELF-HOSTING.md) for production setup.

### Option 2: Development Mode

```bash
# Clone and install
git clone https://github.com/slimatic/zakapp.git && cd zakapp
npm run install-all

# Start both client and server
npm start
```

## 🛠 Tech Stack

-   **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui.
-   **Backend**: Node.js, Express, Prisma (SQLite).
-   **Sync**: CouchDB for multi-device sync.
-   **Security**: Client-side AES-GCM (256-bit) powered by Web Crypto API.

Detailed technical details can be found in our [Architecture Guide](docs/ARCHITECTURE.md).

## 🔄 Sync & Multi-Device Setup

ZakApp supports private, end-to-end encrypted synchronization between devices using CouchDB.

-   **Local Development**: Sync is included in `docker compose up -d`
-   **Production**: See [Self-Hosting Guide](SELF-HOSTING.md) for secure setup

### Troubleshooting Sync

-   **Infinite "Syncing..."**: Check that `CouchDB` is reachable at `http://localhost:5984/_utils`
-   **Mobile Access**: Mobile browsers require HTTPS. Use Cloudflare Tunnel or a reverse proxy.

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [Self-Hosting Guide](SELF-HOSTING.md) | Deploy ZakApp on your own server |
| [Zakat FAQ](FAQs.md) | Islamic finance questions answered |
| [Deployment Guide](docs/deployment-guide.md) | Advanced deployment options |
| [Troubleshooting](docs/troubleshooting-faq.md) | Common issues and solutions |
| [API Reference](docs/api-specification.md) | REST API documentation |

## 🤝 Contributing

We welcome contributions from the community! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

-   Open Source Islamic Finance Initiative
-   RxDB for the incredible Local-First database engine.

