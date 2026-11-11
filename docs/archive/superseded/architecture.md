# Architecture & Security Model

> **"The Server is Untrusted."**

This document outlines the **Privacy-First**, **Local-First** architecture of ZakApp (Project Ikhlas). Unlike traditional fintech apps where the server holds the "Source of Truth," ZakApp treats the user's device as the primary database and the server merely as a blind synchronization relay.

## 1. Core Philosophy

1.  **Zero-Knowledge**: The server never sees, processes, or stores unencrypted financial data (assets, liabilities, Zakat amounts).
2.  **Local-First**: The application functions 100% offline. All calculation logic resides in the client bundle.
3.  **End-to-End Encryption**: Data synced to the cloud is encrypted *before* it leaves the browser using keys that only the user possesses.

## 2. System Overview

```mermaid
graph TD
    User[User] -->|Enters Data| UI[Client UI (React)]
    UI -->|Calculates Zakat| Logic[Core Logic (Pure TS)]
    Logic -->|Encrypts (AES-GCM)| Crypto[Web Crypto API]
    Crypto -->|Stores Encrypted| DB[(RxDB / SQLite WASM)]
    
    subgraph "User Device (Trusted)"
        UI
        Logic
        Crypto
        DB
    end

    DB -->|Syncs Encrypted Blob| API[Server API (Next.js)]
    API -->|Persists Blob| CloudDB[(PostgreSQL)]

    subgraph "Cloud (Untrusted)"
        API
        CloudDB
    end
```

## 3. Security Implementation

### 3.1 Key Management
We use a **Client-Side Key Derivation** strategy. The encryption key is never sent to the server.

*   **Derivation Algorithm**: PBKDF2 (SHA-256) with substantial iterations (min 600,000) or Argon2 (via WASM).
*   **Salt**: A unique, random salt is generated for each user and stored publicly.
*   **Key Lifecycle**: 
    1.  User enters password.
    2.  App fetches user's `salt`.
    3.  App derives `MasterKey`.
    4.  `MasterKey` is held in memory (closure) for the session.
    5.  `MasterKey` is dropped on update/logout/timeout. **It is never stored in `localStorage` or `cookies`.**

### 3.2 Data Encryption
Financial data (e.g., `asset.value`, `liability.amount`) is encrypted using **AES-GCM** (256-bit).

*   **Initialization Vector (IV)**: A unique random IV is generated for *every* encryption operation.
*   **Storage**: The database stores `{ ciphertext, iv, salt }`.
*   **Searchability**: Because data is encrypted, server-side search is impossible. Client-side search is performed on the decrypted local replicas in RxDB.

## 4. Local-First Database (RxDB)

We use **RxDB** (Reactive Database) backed by **SQLite WASM** for high-performance local storage.

*   **AssetSchema**: Defines structure for Gold, Silver, Cash, Stocks, Crypto.
*   **Offline Support**: SW (Service Worker) caches the app shell; SQLite stores the data.
*   **Sync Protocol**: We use the RxDB replication protocol to sync *changes* (deltas) to the server. The server strictly validates schema but cannot validate content (as it is ciphertext).

## 5. Fiqh Compliance Algorithm

To ensure religious accuracy without compromising privacy:

1.  **Client-Side Logic**: The "Fiqh Engine" runs entirely in the browser.
2.  **Standardized Inputs**: User assets are normalized (e.g., "18k Gold" -> "Pure Gold Weight") locally before calculation.
3.  **Nisab Fetching**: The client fetches the current Gold/Silver prices from a public, anonymous API. The server acts as a proxy to hide the user's IP from third-party price providers.

## 6. Threat Model

| Threat | Mitigation |
| :--- | :--- |
| **Server Database Leak** | Attacker obtains only encrypted blobs. Without the user's password, data is mathematically useless. |
| **Man-in-the-Middle** | TLS 1.3 for transport; AES-GCM for payload. Even if SSL is broken, payload remains encrypted. |
| **XSS Attack** | Strict CSP (Content Security Policy). `HttpOnly` cookies for auth tokens (not encryption keys). Dependencies pinned. |
| **Evil Server Admin** | Cannot view user net worth or Zakat liability. |

## 7. Future: Zero-Knowledge Proofs (ZK-SNARKs)

*Roadmap Item*: We intend to implement ZK proofs to allow a user to prove they are "Zakat Eligible" (poor) or "Zakat Liable" (rich) to a centralized distributor *without* revealing their exact net worth.
