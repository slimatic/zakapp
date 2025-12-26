# Contributing to ZakApp (Project Ikhlas)

Thank you for your interest in contributing to ZakApp! We are building the world's first **Privacy-First, Local-First Zakat Calculator**.

Our mission is to help Muslims fulfill their religious obligation with accuracy, privacy, and peace of mind.

## ⚠️ The "Zero-Knowledge" Mandate

**CRITICAL**: Every line of code you write must adhere to our Privacy-First architecture.
- **No Private Data on Server**: We NEVER transmit unencrypted financial values (account balances, gold weights, crypto holdings) to the server.
- **Local-First Logic**: All Zakat calculations must run **entirely in the browser** (Client-Side). The server is only for syncing end-to-end encrypted blobs.
- **Web Crypto API**: Use `window.crypto.subtle` for all encryption operations. Never roll your own crypto.

If a PR violates these rules, it will be rejected immediately.

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Next.js (App Router), Vite
- **Database**: [RxDB](https://rxdb.info/) (Client-side NoSQL with SQLite WASM)
- **State**: Zustand + TanStack Query
- **Styling**: Tailwind CSS + "Ikhlas" Design System

## 🚀 Getting Started

1.  **Fork & Clone**:
    ```bash
    git clone https://github.com/your-username/project-ikhlas.git
    cd project-ikhlas
    ```
2.  **Install**:
    ```bash
    npm install
    cd client && npm install
    ```
3.  **Run Dev Server**:
    ```bash
    npm start
    ```

## 📝 Development Guidelines

### 1. Code Style
We strictly enforce the **Google TypeScript Style Guide**.
- **Indent**: 2 spaces.
- **Types**: Strict mode enabled. No `any`.
- **Naming**: `camelCase` for variables/functions, `PascalCase` for components/classes.

### 2. Implementation Flow (The "Architect" Workflow)
When building a new feature (e.g., "Silver Calculator"):
1.  **Define Schema**: Create the RxDB schema in `client/src/db/schema`.
2.  **Define Types**: TypeScript interfaces.
3.  **Core Logic**: Write pure, testable functions in `src/core/calculations`. Use `decimal.js` for math.
4.  **UI**: Build accessible components in `src/components`.

### 3. Fiqh Compliance (The "Faqih" Rules)
Zakat is a religious duty with specific rules.
- **References**: All calculation logic must cite a simplified Fiqh source (e.g., Simple Zakat Guide).
- **Madhab Support**: Where opinions differ (e.g., Jewelry Zakat), implementing toggles for Hanafi/Shafi'i views is preferred.
- **Precaution**: When in doubt, strictly apply the safer/precautionary view.

### 4. Accessibility & Design
- **WCAG 2.2 AA**: All forms must be keyboard accessible and screen-reader friendly.
- **Trust Indicators**: Display "Encrypted on Device" badges near sensitive inputs.
- **Mobile First**: Design for small screens first.

## 🧪 Testing

We require high test coverage, especially for calculation logic.
```bash
npm test
```

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.
