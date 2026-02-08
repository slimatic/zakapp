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

ZakApp re-imagines the wealth purification experience by prioritizing user privacy, Fiqh precision, and modern design. Unlike other tools that send your Net Worth to a cloud server, ZakApp performs all calculations locally.

[![Sustain ZakApp](https://img.shields.io/badge/Sustain-ZakApp-teal?style=for-the-badge&logo=kofi)](website/donate.html)

## 🔒 Privacy First

- **Zero-Knowledge Encryption**: Your payment data is encrypted with YOUR password before sync. Server literally cannot read it.
- **Local-First Storage**: Uses RxDB (IndexedDB/SQLite) for offline-first with optional encrypted sync.
- **Client-Side Encryption**: AES-256-GCM encryption powered by Web Crypto API (PBKDF2, 600k iterations).
- **Migration Available**: Existing users can upgrade historical data via in-app wizard.

> **Note:** As of v0.10.0, payment recipients and notes are encrypted client-side. Even with full database access, the server cannot decrypt your data. [Learn more](docs/ZERO_KNOWLEDGE_ARCHITECTURE.md)

## ✨ Features

- **Precision Hawl Tracking**: Tracks Nisab thresholds based on Lunar Hijri calendar.
- **Multi-Madhab Compliance**: Toggle between Hanafi, Shafi'i, Maliki, and Hanbali rulings.
- **Asset Portfolio Management**: Detailed tracking for Gold, Crypto, 401k, and Real Estate.
- **Offline-First & PWA**: Installable as a native app with full offline capabilities.
- **Responsive Design**: Optimized for all device sizes with mobile-first UX.

## 🚀 Quick Start (2 Minutes)

### Option 1: Easy Deployment (Recommended)

The fastest way to get started with zero configuration:

```bash
# Clone and run the deployment script
git clone https://github.com/slimatic/zakapp.git && cd zakapp
./deploy-easy.sh
```

**That's it!** The script will:
- ✅ Detect your environment (localhost/IP/domain)
- ✅ Auto-configure ports and avoid conflicts
- ✅ Generate secure secrets automatically
- ✅ Set up automatic HTTPS
- ✅ Start all services

**Access your app:**
- **Localhost**: http://localhost:3000
- **Network**: https://your-ip:3443 (accept the self-signed cert)

👉 See [EASY-DEPLOY.md](EASY-DEPLOY.md) for detailed instructions and troubleshooting.

### Option 2: Manual Docker Deployment

If you prefer manual control:

```bash
# Clone and deploy
git clone https://github.com/slimatic/zakapp.git && cd zakapp

# Copy and configure environment
cp .env.easy.example .env
# Edit .env with your settings

# Start services
docker compose up -d
```

### Option 3: Development Mode

For development with hot reload:

```bash
# Clone and install
git clone https://github.com/slimatic/zakapp.git && cd zakapp
npm run install-all

# Start development servers
npm start
```

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [EASY-DEPLOY.md](EASY-DEPLOY.md) | **Quick start guide** - Complete easy deployment instructions |
| [SELF-HOSTING.md](SELF-HOSTING.md) | Production deployment with custom domains |
| [QUICKSTART.md](QUICKSTART.md) | Alternative deployment methods |
| [FAQs.md](FAQs.md) | Islamic finance questions answered |
| [Deployment Guide](docs/deployment-guide.md) | Advanced deployment options |
| [Troubleshooting](docs/troubleshooting-faq.md) | Common issues and solutions |
| [API Reference](docs/api-specification.md) | REST API documentation |

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Prisma (SQLite)
- **Sync**: CouchDB for multi-device sync
- **Security**: Client-side AES-GCM (256-bit) powered by Web Crypto API

Detailed technical details can be found in our [Architecture Guide](docs/ARCHITECTURE.md).

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 - see [LICENSE](LICENSE).

## 🙏 Acknowledgements

- Open Source Islamic Finance Initiative
- RxDB for the incredible Local-First database engine
