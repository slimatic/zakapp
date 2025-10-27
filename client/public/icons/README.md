# PWA Icons

This directory contains Progressive Web App icons in various sizes for different platforms.

## Icon Specifications

### Standard Icons (purpose: "any")
- **72x72**: Android Chrome (small)
- **96x96**: Android Chrome (medium)
- **128x128**: Android Chrome (large)
- **144x144**: Android Chrome (extra large)
- **152x152**: iOS Safari (iPad)
- **192x192**: Android Chrome (standard)
- **384x384**: Android Chrome (large)
- **512x512**: Android Chrome (splash screen)

### Maskable Icons (purpose: "maskable")
- **192x192**: Adaptive icon with safe zone
- **512x512**: Adaptive icon with safe zone

Maskable icons have 40% padding (safe zone) to ensure the icon is visible when the OS applies a mask shape (circle, squircle, rounded square, etc.).

## iOS Specific
iOS uses `apple-touch-icon.png` (180x180) defined in the HTML `<head>`:
```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

## Generation

Icons should be generated from a high-resolution source (1024x1024 recommended) using:
1. **Design tool**: Figma, Adobe Illustrator, or Photoshop
2. **Online tool**: https://realfavicongenerator.net or https://maskable.app
3. **CLI tool**: `sharp-cli` or ImageMagick

### Example using sharp-cli:
```bash
# Install sharp-cli
npm install -g sharp-cli

# Generate all sizes from source
sharp -i source-1024.png -o icon-72x72.png resize 72 72
sharp -i source-1024.png -o icon-96x96.png resize 96 96
sharp -i source-1024.png -o icon-128x128.png resize 128 128
sharp -i source-1024.png -o icon-144x144.png resize 144 144
sharp -i source-1024.png -o icon-152x152.png resize 152 152
sharp -i source-1024.png -o icon-192x192.png resize 192 192
sharp -i source-1024.png -o icon-384x384.png resize 384 384
sharp -i source-1024.png -o icon-512x512.png resize 512 512

# For maskable icons, add 40% padding to source before resizing
sharp -i source-1024-padded.png -o icon-192x192-maskable.png resize 192 192
sharp -i source-1024-padded.png -o icon-512x512-maskable.png resize 512 512
```

## Current Status

✅ Icon directory structure created
⏳ TODO: Generate actual icon files from brand assets
⏳ TODO: Add apple-touch-icon.png for iOS

**Temporary Solution**: Using placeholder icons copied from existing logo files until proper brand icons are created.
