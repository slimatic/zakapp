# Data Model: Milestone 6 - UI/UX Enhancements

## Web App Manifest (`manifest.json`)

The manifest file defines how the application appears when installed on a device.

```json
{
  "name": "ZakApp - Islamic Zakat Calculator",
  "short_name": "ZakApp",
  "description": "Privacy-first Zakat calculator and asset manager.",
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    {
      "src": "pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Client-Side Storage

### LocalStorage Keys

| Key | Type | Description |
| :--- | :--- | :--- |
| `zakapp_theme` | `string` | User's preferred theme ('light' \| 'dark' \| 'system'). |
| `pwa_install_dismissed` | `boolean` | Whether the user has dismissed the PWA install prompt. |

### Service Worker Cache

| Cache Name | Content | Strategy |
| :--- | :--- | :--- |
| `pages` | HTML files | NetworkFirst |
| `assets` | JS, CSS, Images | StaleWhileRevalidate |
| `api` | API responses | NetworkOnly (No caching of sensitive data) |

## Database Schema Changes

None required for this milestone.
