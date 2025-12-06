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
