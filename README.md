# ZakApp (Project Ikhlas)

![Status](https://img.shields.io/badge/Status-Beta-emerald)
![License](https://img.shields.io/badge/License-MIT-blue)
![Architecture](https://img.shields.io/badge/Architecture-Local%20First-gold)

**ZakApp** is a privacy-first, open-source Zakat calculator designed to help Muslims calculate their obligation with accuracy and peace of mind.

## 🔒 Local-First Architecture

Unlike traditional web apps, ZakApp is built on a **Zero-Knowledge** architecture. 
- **Your Data**: Stored locally on your device (IndexedDB/RxDB).
- **Your Keys**: Encryption keys are derived from your password on-device and never sent to the server.
- **Offline Capable**: Works fully offline.

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Database**: [RxDB](https://rxdb.info/) (Client-side NoSQL)
- **Styling**: Tailwind CSS + "Ikhlas" Design System (Glassmorphism)
- **Security**: Web Crypto API (PBKDF2 / AES-GCM)

## 🚀 Getting Started

### Prerequisites
- Node.js > 18.0.0
- npm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/zakapp/project-ikhlas.git
   ```

2. Install Dependencies
   ```bash
   cd project-ikhlas
   npm install
   ```

3. Run Development Server
   ```bash
   npm start
   ```

## ☪️ Fiqh Methodology

ZakApp supports multiple Zakat calculation methodologies (Standard, Hanafi, Shafi'i). 
- **Gold/Silver Nisab**: Automatically fetches latest metal prices (or uses cached values).
- **401k/Retirement**: Calculates "Net Withdrawable Balance" based on tax/penalty deductions.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
