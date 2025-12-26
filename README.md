# ZakApp (Ikhlas Project)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-beta-orange.svg)
![Compliance](https://img.shields.io/badge/compliance-shariah--compliant-green.svg)

**The World's First Local-First, Privacy-Focused Islamic Finance Platform.**

ZakApp Re-imagines the Zakat calculation experience by prioritizing user privacy, Fiqh precision, and modern design. Unlike other calculators that send your Net Worth to a cloud server, ZakApp performs all math inside your browser.

## 🔒 Privacy First

-   **Zero-Knowledge Architecture**: Your financial data never leaves your device.
-   **Local Database**: Uses RxDB (IndexedDB/SQLite) for offline-first resilience.
-   **Client-Side Logic**: Usage of `window.crypto` for any sensitivity.

## ✨ Features

-   **Precision Hawl Tracking**: Tracks Nisab thresholds based on Lunar Hijri calendar.
-   **Multi-Madhab Compliance**: Toggle between Hanafi, Shafi'i, Maliki, and Hanbali rulings.
-   **Asset Portfolio Management**: Detailed tracking for Gold, Crypto, 401k, and Real Estate.
-   **Offline Capabilities**: Works perfectly without an internet connection.

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

Visit `http://localhost:5173` to view the app.

## 🛠 Tech Stack

-   **Framework**: React 18, Vite
-   **Language**: TypeScript
-   **Database**: RxDB (Local-First)
-   **Styling**: Tailwind CSS, shadcn/ui
-   **Icons**: Lucide React
-   **Testing**: Vitest, Playwright

## 🤝 Contributing

We welcome contributions from the community! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

-   Open Source Islamic Finance Initiative
-   RxDB for the incredible Local-First database engine.
