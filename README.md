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

### 🆕 NEW: Super Easy Deploy (Recommended)

The new **Easy Deployment** requires zero configuration:

```bash
# Clone and deploy in one step
git clone https://github.com/slimatic/zakapp.git && cd zakapp
./deploy-easy.sh
```

✅ **No build time** - Uses prebuilt images from Docker Hub  
✅ **Automatic HTTPS** - Works with IP addresses  
✅ **Auto-detects ports** - Fixes conflicts automatically  
✅ **Interactive setup** - Just answer a few questions  

👉 See [EASY-DEPLOY.md](EASY-DEPLOY.md) for full details

---

### Option 1: Traditional Deploy (Build from Source)

For development or customization:

```bash
# Clone the repository
git clone https://github.com/slimatic/zakapp.git && cd zakapp

# Run the deployment script
./deploy.sh

# Visit http://localhost:3000
```

That's it! The script will:
- ✅ Check prerequisites
- ✅ Generate secure secrets automatically
- ✅ Create the configuration file
- ✅ Build and start everything

### Option 2: Docker Compose (Build from Source)

If you prefer manual deployment or want to customize:

```bash
# Clone and configure
git clone https://github.com/slimatic/zakapp.git && cd zakapp
cp .env.docker.example .env

# Generate secrets (or edit .env manually with openssl rand -base64 32)
./scripts/generate-secrets.sh

# Deploy
docker compose -f docker-compose.local.yml up -d
```

Visit `http://localhost:3000` — you're running! 🎉

### Option 3: Development Mode

For development with hot reload:

```bash
# Clone and install dependencies
git clone https://github.com/slimatic/zakapp.git && cd zakapp
npm run install-all

# Start development servers
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
| [Quick Start](QUICKSTART.md) | **Start here!** Simplest deployment guide |
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

