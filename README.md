# ZakApp 🕌

[![Build](https://github.com/slimatic/zakapp/actions/workflows/build.yml/badge.svg)](https://github.com/slimatic/zakapp/actions/workflows/build.yml)
[![Tests](https://github.com/slimatic/zakapp/actions/workflows/test.yml/badge.svg)](https://github.com/slimatic/zakapp/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## Project Overview

ZakApp is a **privacy-first Islamic Zakat calculator** designed to help Muslims manage their financial obligations with ease and confidence. Built with modern web technologies, it features end-to-end encryption, multiple calculation methodologies, and a beautiful, accessible interface.

## �� Quick Start

### Prerequisites
- **Docker** and **Docker Compose**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/slimatic/zakapp.git
   cd zakapp
   ```

2. **Start the application**
   ```bash
   ./scripts/docker-start.sh
   ```

3. **Access the app**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

> **💡 Tip**: If ports 3000 or 3001 are already in use, you can easily change them:
> 1. Edit `FRONTEND_PORT` and `BACKEND_PORT` in `.env.docker`
> 2. Run `docker compose down && docker compose up -d`
> 
> See [Port Configuration Guide](docs/guides/PORT_CONFIGURATION.md) for details.

### Mobile Access
To access the application from other devices on your network:
```bash
./get-ip.sh
```

## ✨ Key Features

- **Privacy First**: Self-hosted with AES-256 encryption for all sensitive data.
- **Islamic Compliance**: Supports Standard, Hanafi, and Shafi'i calculation methodologies.
- **Asset Management**: Track Cash, Gold, Silver, Crypto, Business Assets, and more.
- **Real-time Calculations**: Live portfolio totals and Zakat eligibility status.
- **PWA Support**: Installable on mobile and desktop with offline capabilities.

## 📱 Progressive Web App (PWA)

ZakApp is a fully installable Progressive Web App that provides a native app-like experience on both mobile and desktop devices.

### Installation Instructions

#### On Mobile (iOS Safari / Android Chrome)
1. Open ZakApp in your mobile browser at `http://your-server:3000`
2. Tap the **Share** button (iOS) or **Menu** button (Android)
3. Select **"Add to Home Screen"** (iOS) or **"Add to Home screen"** (Android)
4. Confirm installation

#### On Desktop (Chrome / Edge / Safari)
1. Open ZakApp in your browser at `http://your-server:3000`
2. Click the **Install** button in the address bar, or
3. Click the **Menu** button (three dots) → **"Install ZakApp"**

#### On Firefox
1. Open ZakApp in Firefox at `http://your-server:3000`
2. Click the **Install this site as an app** button in the address bar

### PWA Features
- **Offline Access**: Core functionality works without internet connection
- **Native Experience**: App launches from home screen with splash screen
- **Push Notifications**: Optional reminders for Zakat due dates
- **Background Sync**: Data synchronization when connection is restored

## ♿ Accessibility Statement

ZakApp is committed to providing an accessible experience for all users, regardless of ability or assistive technology used.

### Accessibility Features
- **WCAG 2.1 AA Compliance**: Meets Web Content Accessibility Guidelines
- **Keyboard Navigation**: Full keyboard accessibility with visible focus indicators
- **Screen Reader Support**: Comprehensive ARIA labels and semantic HTML
- **High Contrast**: Sufficient color contrast ratios for readability
- **Touch Targets**: Minimum 44px touch targets for mobile accessibility
- **Skip Links**: Quick navigation for keyboard and screen reader users

### Assistive Technology Support
- **Screen Readers**: Tested with NVDA, JAWS, VoiceOver, and TalkBack
- **Voice Control**: Compatible with voice control systems
- **Switch Control**: Switch device accessible
- **Magnification**: Works with screen magnification tools

### Feedback
If you encounter accessibility issues or have suggestions for improvement, please [open an issue](https://github.com/slimatic/zakapp/issues) with the "accessibility" label.

## �� Documentation

For detailed documentation, please visit the [Documentation Hub](docs/README.md).

- **[User Guide](docs/user-guide/README.md)**: How to use the application.
- **[Developer Guide](docs/development-guide.md)**: Setup and contribution guidelines.
- **[API Reference](docs/api/api-specification.md)**: Backend API documentation.
- **[Performance](docs/performance.md)**: Performance metrics and optimization.
- **[Accessibility](docs/accessibility.md)**: Accessibility features and compliance.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
