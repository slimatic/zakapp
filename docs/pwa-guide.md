# ZakApp Progressive Web App (PWA) Guide

**Last Updated**: October 27, 2025  
**Version**: Milestone 6 - UI/UX Enhancements  
**PWA Score**: 100/100 (Lighthouse)

---

## What is a Progressive Web App?

ZakApp is a **Progressive Web App (PWA)** - a modern web application that works like a native app on your device. You can install it on your home screen, use it offline, and receive notifications, all while enjoying the benefits of a web app (always up-to-date, no app store required, works across devices).

---

## Benefits of Installing ZakApp

### 📱 **Native App Experience**
- Launch from your home screen like any other app
- Full-screen mode without browser chrome
- Faster loading (cached assets)
- Works seamlessly with system features

### ⚡ **Performance**
- Instant loading after first visit
- Faster navigation between pages
- Reduced data usage (intelligent caching)
- Background sync when reconnected

### 🔒 **Offline Access**
- Calculate Zakat without internet connection
- View your assets and history offline
- Changes sync automatically when back online
- No data loss even when disconnected

### 🔔 **Stay Updated** (Coming Soon)
- Payment reminder notifications
- Zakat due date alerts
- New feature announcements
- Privacy-respecting, opt-in only

---

## How to Install ZakApp

### On Desktop (Windows, Mac, Linux)

#### Google Chrome / Microsoft Edge

1. **Open ZakApp** in Chrome or Edge
2. **Look for the install icon** in the address bar (⊕ or computer icon)
3. **Click "Install"** in the prompt
4. **Confirm installation** - ZakApp will open in its own window
5. **Find the app**:
   - Windows: Start menu and desktop
   - Mac: Applications folder and dock
   - Linux: Application launcher

**Alternative Method**:
1. Click the **menu button** (⋮ three dots) in the browser
2. Select **"Install ZakApp"** or **"Create shortcut"**
3. Check **"Open as window"** for app-like experience
4. Click **"Install"**

#### Firefox

Firefox doesn't support PWA installation on desktop, but you can:
1. Bookmark ZakApp (Ctrl+D / Cmd+D)
2. Use it as a web app in the browser
3. Consider using Chrome/Edge for full PWA features

#### Safari (Mac)

Safari doesn't support PWA installation on Mac, but you can:
1. Add to Dock: Drag the URL to your Dock
2. Use as web app in browser
3. Consider using Chrome/Edge for full PWA features

---

### On Mobile

#### iOS (iPhone/iPad)

1. **Open ZakApp in Safari** (must use Safari, not Chrome)
2. **Tap the Share button** (⬆️ square with arrow)
3. **Scroll down and tap "Add to Home Screen"**
4. **Edit the name** if desired (default: "ZakApp")
5. **Tap "Add"** in the top right
6. **Find the app** on your home screen

**Features on iOS**:
- ✅ Runs in full-screen mode
- ✅ Works offline with cached data
- ✅ Splash screen when launching
- ✅ Matches iOS app appearance
- ⚠️ Limited background sync (iOS restrictions)
- ⚠️ No push notifications (iOS limitation)

**Tips for iOS**:
- Safari is required for installation (Chrome/Firefox won't work)
- iOS 16.4+ recommended for best PWA support
- Settings → Safari → Advanced → Experimental Features → enable Service Worker features

#### Android

1. **Open ZakApp in Chrome**
2. **Tap the menu button** (⋮ three dots)
3. **Tap "Install app"** or **"Add to Home screen"**
4. **Tap "Install"** in the popup
5. **Find the app** in your app drawer

**Alternative Prompt**:
- Look for the **"Add ZakApp to Home screen"** banner at the bottom
- Tap **"Install"** directly from the banner

**Features on Android**:
- ✅ Full native app experience
- ✅ Complete offline functionality
- ✅ Background sync when reconnected
- ✅ Push notifications (when enabled)
- ✅ Appears in app drawer and home screen
- ✅ Can be set as default handler for zakapp.com links

---

## Using ZakApp Offline

### What Works Offline?

✅ **Full Functionality**:
- View all your assets
- Calculate Zakat (all methodologies)
- View calculation history
- View analytics dashboard
- Edit settings and preferences

✅ **Limited Functionality** (requires internet when reconnected):
- Add/edit/delete assets (queued, syncs when online)
- Export data (queued, downloads when online)
- Update Nisab thresholds (uses last cached values)

❌ **Requires Internet**:
- Initial login/registration
- Password reset
- Fetching latest gold/silver prices (uses cached prices offline)

### How Offline Mode Works

1. **First Visit**: ZakApp downloads and caches essential files
2. **Subsequent Visits**: App loads instantly from cache
3. **Data Updates**: Changes saved locally, synced when reconnected
4. **Automatic Sync**: Background sync happens automatically when online

### Offline Indicator

When offline, you'll see:
- 📡 **"Offline"** indicator in the header
- ⚠️ **Warning** on actions that require sync
- ℹ️ **Info badges** showing pending changes
- ✅ **Success message** when back online and synced

---

## Managing Storage & Cache

### Cache Size

ZakApp uses minimal storage:
- **App Shell**: ~2-3 MB (HTML, CSS, JavaScript)
- **Images & Assets**: ~1-2 MB
- **Data Cache**: ~100-500 KB (depends on your data)
- **Total**: ~3-5 MB typical usage

### Clearing Cache

**When to Clear**:
- App behaving unexpectedly
- Want to free up storage space
- Troubleshooting issues

**How to Clear**:

#### Desktop
1. **Chrome/Edge**: Settings → Privacy → Clear browsing data → Cached images and files
2. **Firefox**: Settings → Privacy → Cookies and Site Data → Clear Data

#### Mobile
1. **iOS Safari**: Settings → Safari → Clear History and Website Data
2. **Android Chrome**: Settings → Privacy → Clear browsing data → Cached images and files

**Or Clear Within App** (Coming Soon):
- Settings → Advanced → Clear Cache
- Clears app cache but keeps your data

---

## Updating ZakApp

### Automatic Updates

ZakApp updates automatically:
1. **New version detected** when app checks for updates
2. **Update downloads** in background while you use the app
3. **Notification appears** when update is ready
4. **Tap "Update"** to reload with new version
5. **Old cache cleared** automatically

### Manual Update Check

1. Open ZakApp
2. Pull down to refresh (mobile)
3. Or: Settings → About → Check for Updates

### Update Frequency

- **Critical Fixes**: Deployed within hours
- **Feature Updates**: Every 2-4 weeks
- **Major Releases**: Every 2-3 months

---

## Push Notifications (Coming Soon)

### What You Can Be Notified About

- **Zakat Due Reminders**: Get notified when Zakat is due
- **Payment Confirmations**: Confirm when you've paid Zakat
- **Nisab Changes**: When Nisab threshold changes significantly
- **Feature Announcements**: New features you might like

### Privacy & Control

- ✅ **Opt-in only**: Notifications off by default
- ✅ **Granular control**: Choose which notifications you want
- ✅ **No tracking**: Notifications don't track your activity
- ✅ **Local processing**: Most notifications generated locally
- ✅ **Mute anytime**: Disable in Settings → Notifications

### Enabling Notifications

1. **Go to Settings** → Notifications
2. **Enable notifications** (browser will ask for permission)
3. **Choose which types** you want to receive
4. **Set quiet hours** if desired

**Note**: Currently not available on iOS due to Apple limitations. Works fully on Android and desktop.

---

## Offline Sync Details

### What Gets Synced?

**Automatically Synced**:
- Asset additions, edits, deletions
- Calculation history
- Settings changes
- Payment records

**Not Synced** (local only):
- Temporary calculations (draft mode)
- UI preferences (theme, language)
- Cache and temporary data

### Sync Status

**Indicators**:
- 🟢 **Green dot**: All changes synced
- 🟡 **Yellow dot**: Sync in progress
- 🔴 **Red dot**: Sync failed (will retry)
- ⏸️ **Pause icon**: Waiting for connection

**View Pending Changes**:
1. Settings → Advanced → Sync Status
2. See list of pending changes
3. Manually retry if needed

### Conflict Resolution

If data conflicts (rare):
1. **Local changes take priority** (your edits preserved)
2. **Automatic merge** when possible
3. **Manual resolution** for complex conflicts
4. **Notification** if your input needed

---

## Troubleshooting

### Installation Issues

**Problem**: Install button doesn't appear

**Solutions**:
- Ensure you're using HTTPS (https://zakapp.com)
- Try a different browser (Chrome recommended)
- Clear browser cache and reload
- Check if already installed (look in apps list)

**Problem**: Install fails or app crashes

**Solutions**:
- Update your browser to latest version
- Check available storage space (need ~5MB)
- Disable browser extensions temporarily
- Try incognito/private mode

### Offline Mode Issues

**Problem**: App says "offline" but I have internet

**Solutions**:
- Refresh the page (pull down on mobile)
- Check if service worker is registered (DevTools → Application tab)
- Clear cache and reload
- Ensure service workers aren't blocked by browser settings

**Problem**: Changes not syncing when back online

**Solutions**:
- Check sync status in Settings → Advanced
- Manually trigger sync (Settings → Sync Now)
- Check network connection quality
- Restart the app

### Performance Issues

**Problem**: App is slow or laggy

**Solutions**:
- Close other browser tabs/apps
- Clear browser cache
- Restart browser/device
- Check available device memory
- Update browser to latest version

**Problem**: App takes up too much storage

**Solutions**:
- Clear cache (Settings → Clear Cache)
- Remove old calculation history
- Export and delete archived data

---

## Platform Support

### Full Support ✅

| Platform | Browser | Install | Offline | Notifications | Sync |
|----------|---------|---------|---------|---------------|------|
| **Android 5+** | Chrome | ✅ | ✅ | ✅ | ✅ |
| **Windows 10+** | Chrome/Edge | ✅ | ✅ | ✅ | ✅ |
| **macOS** | Chrome/Edge | ✅ | ✅ | ✅ | ✅ |
| **Linux** | Chrome | ✅ | ✅ | ✅ | ✅ |

### Partial Support ⚠️

| Platform | Browser | Install | Offline | Notifications | Sync |
|----------|---------|---------|---------|---------------|------|
| **iOS 16.4+** | Safari | ✅ | ✅ | ❌ | ⚠️ |
| **Android** | Firefox | ❌ | ✅ | ❌ | ✅ |
| **Desktop** | Firefox | ❌ | ✅ | ❌ | ✅ |
| **macOS** | Safari | ❌ | ✅ | ❌ | ⚠️ |

### Minimum Requirements

- **Browser**: Chrome 90+, Edge 90+, Safari 16.4+, Firefox 90+
- **Storage**: 5 MB minimum available
- **Network**: Works on slow 3G, optimized for 4G/5G/WiFi
- **JavaScript**: Must be enabled

---

## Privacy & Security

### What Data is Stored Locally?

**On Your Device**:
- App code and assets (cached for offline use)
- Your encrypted asset data
- Calculation history (encrypted)
- User preferences

**Encryption**:
- All sensitive data encrypted with AES-256
- Encryption keys never leave your device
- Even in cache, data is encrypted

### What Data is Sent to Server?

**Sent to Server**:
- Encrypted asset data (during sync)
- Authentication tokens (for login)
- Error logs (for debugging, no personal data)
- Anonymous performance metrics

**NOT Sent**:
- Unencrypted financial data
- Personal identifying information
- Usage tracking data
- Third-party analytics

### Data Control

- ✅ **Your data, your device**: Data stored locally first
- ✅ **End-to-end encryption**: Server can't read your data
- ✅ **Export anytime**: Download all your data
- ✅ **Delete anytime**: Remove all data from server
- ✅ **No third parties**: No data shared with anyone

---

## Best Practices

### For Best Performance

1. **Install the app**: Installed apps load faster
2. **Use WiFi for first visit**: Initial cache download ~3-5MB
3. **Keep app updated**: Updates improve performance
4. **Clear cache occasionally**: If app feels slow

### For Reliable Sync

1. **Don't force close**: Let background sync complete
2. **Stable connection**: Ensure good network when syncing
3. **Check sync status**: Verify changes synced before closing
4. **Avoid rapid edits**: Give app time to sync between changes

### For Privacy

1. **Use strong password**: Protects encryption keys
2. **Enable device lock**: Prevents unauthorized access
3. **Don't share device**: Each user should have own account
4. **Log out on shared devices**: Always log out when done

---

## FAQs

### Q: Is ZakApp really a native app?

**A**: ZakApp is a Progressive Web App (PWA), which means it's built with web technologies but provides a native app-like experience. It's not in the app store, but works just like a native app once installed.

### Q: Will it use a lot of data?

**A**: No. After initial installation (~3-5MB), data usage is minimal. Most actions work offline, and sync uses very little data (typically <100KB per session).

### Q: Can I use ZakApp on multiple devices?

**A**: Yes! Install on all your devices. Data syncs automatically across devices when online.

### Q: What happens if I uninstall?

**A**: Your data remains on our secure servers. Reinstall anytime and log in to restore your data.

### Q: Does it drain battery?

**A**: No. PWAs are optimized for battery life. Background sync is minimal and only happens when needed.

### Q: Can I use it without installing?

**A**: Yes! ZakApp works perfectly in your browser. Installing provides extra features (offline, faster loading, home screen icon) but isn't required.

### Q: Is my data safe offline?

**A**: Yes. All data is encrypted on your device with AES-256 encryption. Even if someone accesses your device, they can't read your ZakApp data without your password.

---

## Getting Help

### Support Channels

- **Email**: support@zakapp.example.com
- **GitHub Issues**: [github.com/your-org/zakapp/issues](https://github.com/your-org/zakapp/issues)
- **Documentation**: [docs.zakapp.com](https://docs.zakapp.com)

### Reporting PWA Issues

Please include:
1. Device and OS version
2. Browser and version
3. Steps to reproduce
4. Screenshots if applicable
5. Whether installed or browser-based

---

## Additional Resources

- **PWA General Info**: [web.dev/progressive-web-apps](https://web.dev/progressive-web-apps/)
- **Browser Support**: [caniuse.com/serviceworkers](https://caniuse.com/serviceworkers)
- **Workbox (Our PWA Library)**: [developers.google.com/web/tools/workbox](https://developers.google.com/web/tools/workbox)

---

**Last Updated**: October 27, 2025  
**Next Review**: January 27, 2026  
**Version**: 6.0.0 (Milestone 6)
