# Accessing a Local Dev Server from Another Device

**The problem:** you run ZakApp on one machine, open it from another device on the same
network using the server's IP address (`http://192.168.1.50:3000`), and login dies with:

```
TypeError: Cannot read properties of undefined (reading 'importKey')
```

Nothing is wrong with your server, your credentials, or your build. The browser is
refusing to give the page the cryptography API.

---

## Why this happens

ZakApp encrypts your data **in the browser** before it ever leaves the device. That is the
core privacy promise — the server stores only ciphertext and cannot read your records.

The browser-side half of that uses the **Web Crypto API** (`window.crypto.subtle`). Browsers
only expose `crypto.subtle` in a **secure context**. If the page is not in one,
`window.crypto.subtle` is `undefined`, and the first call crashes with the message above —
which mentions `importKey` and nothing about the actual cause.

### What counts as a secure context

| Origin | Secure? | Notes |
|---|---|---|
| `https://anything` | ✅ | Any HTTPS origin |
| `http://localhost:3000` | ✅ | `localhost` is special-cased |
| `http://127.0.0.1:3000` | ✅ | Loopback addresses are trusted |
| `http://[::1]:3000` | ✅ | IPv6 loopback |
| `file://` | ✅ | — |
| **`http://192.168.1.50:3000`** | ❌ | **Any other IP, even on your own LAN** |
| `http://myhost.local:3000` | ❌ | A LAN hostname is not a secure context either |

This is a **browser rule**, not a ZakApp setting, and there is no server-side flag that
changes it. Plain HTTP to a non-loopback address is unauthenticated and unencrypted, so
browsers withhold powerful APIs — Web Crypto, clipboard, geolocation, service workers,
camera/mic — to prevent a network attacker from tampering with pages that use them.

> **The trap:** this works perfectly in your tests and on your dev machine, because those run
> on `localhost`. It only breaks when a *second* device reaches the server by IP. Local
> development therefore looks healthy right up until the moment someone opens it from a phone.

---

## Option 1 — Chrome / Edge flag (fastest, desktop only)

Treats one specific HTTP origin as if it were secure. No certificates, no tunnel, no config.

1. On the device you're browsing **from** (not the server), open:
   ```
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
   (Edge: `edge://flags/#unsafely-treat-insecure-origin-as-secure`)
2. Under **"Insecure origins treated as secure"**, enable it and paste your exact origin,
   including scheme and port, comma-separated if you have more than one:
   ```
   http://192.168.1.50:3000,http://192.168.1.50:5984
   ```
3. Set the dropdown to **Enabled**.
4. Click **Relaunch**. The setting does not apply to already-open tabs.
5. Reload and log in again.

**Verify it took effect** — in DevTools select `top` in the console context and run:

```js
window.isSecureContext            // → true
typeof window.crypto.subtle       // → "object"
```

### Caveats — please read these, they cause most repeat failures

- **Desktop only.** `chrome://flags` does not exist on Chrome for Android or iOS. On a phone,
  use [Option 2](#option-2--https-tunnel-recommended-for-mobile).
- **Exact origin match.** Scheme, host and port must all match. `http://192.168.1.50:3000`
  does not cover `https://192.168.1.50:3000` or `:4173`. Getting this wrong looks identical to
  the flag not working.
- **Per browser and per profile.** Chrome and Edge are separate; so is each Chrome profile,
  and so is Incognito if it uses its own. Set it once per profile you use.
- **Not Firefox or Safari.** Firefox has no per-origin UI for this (only `about:config`, which
  is discouraged and changes between releases). Safari has none. Use Option 2 there.
- **This is a developer switch and it weakens a security boundary.** It disables the browser's
  protection for that origin only, which is acceptable on a trusted dev machine on a trusted
  network. Never configure it on a machine used for real data, and never document it as an
  end-user fix for a production deployment.

---

## Option 2 — HTTPS tunnel (recommended for mobile)

Gives the app a real `https://` URL. Because it is genuinely secure, it works on **every**
device with no flags or certificate installs — which is exactly what phones require.

```bash
# Cloudflare quick tunnel — no account, no config. Note the URL it prints.
cloudflared tunnel --url http://localhost:3000
```

```
# or ngrok
ngrok http 3000
```

Open the printed `https://…` URL on the phone and log in. Point any `ALLOWED_ORIGINS` /
`FRONTEND_URL` settings at that hostname if your setup validates origins.

Caveats: a quick tunnel URL changes every run, and it puts your dev server on the public
internet — anyone with the URL can reach it. Fine for a short test; stop it when you're
done. For a stable hostname, use a named tunnel instead — see
[CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md).

---

## Option 3 — Local HTTPS certificate (no public exposure)

Keeps traffic on your own network while still being a real secure context. More setup, but
nothing leaves the LAN.

```bash
# mkcert: local CA trusted by your machine
mkcert -install
mkcert 192.168.1.50 localhost 127.0.0.1
```

Point your dev server at the generated cert (for Vite, `server.https` in `vite.config.ts`).
Browsers still need to trust the mkcert root CA — install it on each **client** device too,
which on a phone means transferring and trusting the CA. Often more work than Option 2, so
choose it only when you specifically need to stay off the public internet.

---

## Which should I use?

| Situation | Use |
|---|---|
| Quick look from a laptop in the same room | **Option 1** (flag) |
| Testing from a phone or tablet | **Option 2** (tunnel) |
| Firefox or Safari client | **Option 2** (tunnel) |
| Must not touch the public internet | **Option 3** (local cert) |
| Real deployment for real users | None of these — terminate HTTPS properly. See [Deployment Guide](../deployment-guide.md) |

---

## Don't "fix" this by weakening the encryption

Disabling encryption, or stubbing out `crypto.subtle`, will make the error disappear and
silently destroy the product's central guarantee: that the server cannot read your data.
The error is the browser protecting users. Change how the page is *reached* (above), not
what it *does*.

---

## Symptom → cause

| Symptom | Likely cause |
|---|---|
| `Cannot read properties of undefined (reading 'importKey')` | Not a secure context — you're on HTTP via an IP or LAN hostname |
| `isSecureContext` is `false` after setting the flag | Origin string doesn't match exactly (scheme/port), or the browser wasn't relaunched |
| Flag works on desktop, phone still crashes | `chrome://flags` doesn't exist on mobile — use Option 2 |
| Works on `localhost`, fails by IP from the same machine | Same rule applies to a LAN IP as to another device |
| Login fine, then clipboard/geolocation/camera or the service worker fails too | Same root cause — those APIs are secure-context-gated as well |
| `Sync Error` in the header from a non-localhost origin | CouchDB is not reachable from that origin; separate issue, see [FAQ](../FAQ.md) |

---

*See also: [Troubleshooting Guide & FAQ](../troubleshooting-faq.md) · [FAQ](../FAQ.md) ·
[Port Configuration](PORT_CONFIGURATION.md) · [Cloudflare Tunnel Setup](CLOUDFLARE_TUNNEL_SETUP.md)*
