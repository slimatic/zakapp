# Phase 2 Batch 1 - Shell + UI Primitives

**Commit scope:** 19 files swept to semantic tokens (components/ui/* + components/layout/*).

Mapping applied (DESIGN.md §7):
- bg-white -> bg-card; bg-gray-50 (page) -> bg-background; bg-gray-100 -> bg-muted
- text-gray-900/700 -> text-foreground; text-gray-600/500 -> text-muted-foreground; text-gray-400 -> text-tertiary
- border-gray-100/200 -> border-border; border-gray-300 -> border-border-strong
- Button variants per DESIGN 7.4: default=amber CTA, outline=neutral, secondary=brand, ghost=muted, link=brand
- Badge: default=brand tonal (accent), secondary=rationed amber chip (warn), destructive=danger-soft
- BottomNav per migration doc diff: bg-card + elev-2, active=amber-soft tonal
- Layout nav: bg-card + border (was shadow-lg glass), logo/brand=secondary forest
- CalendarSelector: dual-theme dark: pairs removed (tokens are already dual-theme), 22 hits cleared
- EncryptedBadge: green -> success tokens
- Focus rings unified to ring (amber/gold CTA ring per contract)

Deliberately NOT touched (their own batches):
- pages/auth/Login.tsx CTA (hardcoded bg-primary-700 legacy hex - auth batch)
- All pages/* (batches 3-9)
- .dark retrofit block in index.css (all classes still used by unswept pages - verified per-file counts)

Gates: tsc clean, build green, vitest 622 passed, login screen visually verified both themes.
