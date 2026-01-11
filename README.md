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

## 🚀 Getting Started

### Prerequisites

-   Node.js v18+
-   npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/zakapp/zakapp.git

# Install dependencies (Root)
npm install

# Install dependencies (Client)
cd client
npm install
```

### Running Locally

```bash
# Start the Vite Development Server
npm run dev
```

Visit `http://localhost:3000` to view the app.

## 🛠 Tech Stack

-   **Framework**: React 18, Vite
-   **Language**: TypeScript
-   **Database**: RxDB (Local-First) + CouchDB (Sync)
-   **Styling**: Tailwind CSS, shadcn/ui (Islamic Fintech Aesthetic)
-   **Icons**: Lucide React, Custom SVG Brand Assets
-   **Testing**: Vitest, Playwright

See [docs/](docs/) for detailed Architecture and Security documentation.

## 🔄 Sync & Multi-Device Setup

ZakApp supports private, end-to-end encrypted synchronization between devices using a self-hosted CouchDB instance.

### Running the Sync Server

1.  Ensure Docker is installed.
2.  Run the stack:
    ```bash
    docker compose up -d
    ```
    This spins up a CouchDB instance on port `5984` and the App on `3000`.

### Troubleshooting Sync

-   **Infinite "Syncing..."**: Check that `CouchDB` is reachable at `http://localhost:5984/_utils`. If running on a different device on the LAN, ensure the firewall allows port 5984.
-   **Mobile Access**: Mobile browsers require a **Secure Context** (HTTPS) for cryptography. accessing via `http://192.168.x.x` will fail. Use a tunnel (ngrok) or `chrome://flags` to bypass.

## 🤝 Contributing

We welcome contributions from the community! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

-   Open Source Islamic Finance Initiative
-   RxDB for the incredible Local-First database engine.
