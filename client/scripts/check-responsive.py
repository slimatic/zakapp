"""Responsive integrity check across real device widths.

The existing check-mobile-integrity.py already measures horizontal overflow and
skip-link duplication at 390px. This is the wider pass the release audit called for:
the same measurements at five real device classes, plus touch-target and text-legibility
checks that only mean anything at touch widths.

What each check is anchored to, so a failure is actionable rather than a taste call:

  overflow      A single overflowing element shifts every page on the device. Hard fail
                above 1px (sub-pixel layout rounding is real). The offending elements
                are NAMED, because "390px overflow" without a culprit is a bug report
                nobody can act on.
  touch targets WCAG 2.5.8 (AA, 2.2) requires 24x24 CSS px minimum. Below that is a
                hard fail. 44x44 is the Apple/Android recommendation, so it is reported
                as an advisory count rather than a failure - flagging every 30px icon
                button as broken trains people to ignore the check.
  text size     Computed font-size under 12px on visible text. Advisory: the audit brief
                calls out readability on phones, and this is the measurable part of it.

Runs at 360 and 390 (common phones), 414 (large phone), 768 (tablet), 1024 and 1440
(desktop). Desktop widths are included precisely so the phone-only failures stand out
against a clean baseline.

Authenticated routes need a session. open_session() restores the cached one when
present and falls back to a real login; without credentials it reports the routes as
SKIPPED rather than silently passing them, because a check that asserts nothing is
worse than no check.

Usage:
    cd client && npm run build && npx vite preview --port 4173
    cd client/scripts && python3 check-responsive.py [base_url]
"""
from __future__ import annotations

import os
import sys

from playwright.sync_api import sync_playwright

try:
    from _login import open_session
    # Importing always succeeds; _secret() raises only when a login is attempted. A
    # session is therefore available only if credentials are actually present.
    HAVE_LOGIN = bool(os.environ.get("ZAK_SMOKE_PASS"))
except Exception:  # pragma: no cover - credentials absent: measure public routes only
    HAVE_LOGIN = False

BASE = os.environ.get("ZAK_BASE", "http://localhost:4173")

# Device classes, as (label, width, height, is_mobile).
VIEWPORTS = [
    ("phone-360", 360, 800, True),
    ("phone-390", 390, 844, True),
    ("phone-414", 414, 896, True),
    ("tablet-768", 768, 1024, True),
    ("desktop-1024", 1024, 768, False),
    ("desktop-1440", 1440, 900, False),
]

# Routes that render without a session.
PUBLIC_ROUTES = [
    "/learn",
    "/help",
    "/about",
    "/privacy",
    "/terms",
    "/forgot-password",
    "/offline",
    "/no-such-route",  # the 404: it renders outside the app shell
]

# Routes behind auth. Measured only when a session is available.
AUTH_ROUTES = [
    "/dashboard",
    "/assets",
    "/liabilities",
    "/nisab-records",
    "/payments",
    "/analytics",
    "/calculator",
    "/settings",
]

# Sub-pixel layout rounding means a literal 0 is not a safe threshold.
OVERFLOW_TOLERANCE_PX = 1

# WCAG 2.5.8 (AA, 2.2) minimum target size.
MIN_TARGET_PX = 24
# Apple/Android recommendation. Advisory only - see the module docstring.
RECOMMENDED_TARGET_PX = 44
# Below this, body text is hard to read on a phone.
MIN_FONT_PX = 12

PROBE = """
() => {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const out = {
    overflow: document.documentElement.scrollWidth - vw,
    viewport: vw,
    overflowers: [],
    smallTargets: [],
    subRecommended: 0,
    tinyText: [],
    interactiveCount: 0,
  };

  const label = (el) => {
    const t = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40);
    const id = el.id ? '#' + el.id : '';
    return `${el.tagName.toLowerCase()}${id}${t ? ' "' + t + '"' : ''}`;
  };

  // Anything wider than the viewport, named. Capped at 5 so a badly broken page does
  // not produce a wall of output.
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'fixed') continue;
    if (r.right > vw + 1 || r.left < -1) {
      if (out.overflowers.length < 5) {
        out.overflowers.push(`${label(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
    }
  }

  // WCAG 2.5.8 Target Size (Minimum), AA.
  //
  // Implemented with both of the spec's escape hatches, because dropping either one
  // produces false failures that train a reviewer to ignore the check:
  //
  //   Inline  - a link inside a sentence is exempt; its size is set by the surrounding
  //             line-height. Those are `display: inline` anchors.
  //   Spacing - an undersized target passes if a 24px-diameter circle centred on it
  //             intersects no other target's circle. This is how a stacked footer nav
  //             of 44x16 links legitimately satisfies 2.5.8 without being resized.
  //
  // Anything that clears neither is a genuine violation.
  const targets = [];
  for (const el of document.querySelectorAll(
    'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, summary'
  )) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (el.tagName === 'A' && cs.display === 'inline') continue;
    targets.push({
      el, w: Math.round(r.width), h: Math.round(r.height),
      cx: r.left + r.width / 2, cy: r.top + r.height / 2,
    });
  }

  out.interactiveCount = targets.length;
  const R = MIN_TARGET / 2;
  for (const t of targets) {
    const undersized = t.w < MIN_TARGET || t.h < MIN_TARGET;
    if (undersized) {
      // Spacing exception: no other target's circle may intersect this one's.
      let blocked = false;
      for (const o of targets) {
        if (o === t) continue;
        const d = Math.hypot(o.cx - t.cx, o.cy - t.cy);
        if (d < MIN_TARGET) { blocked = true; break; }
      }
      if (blocked) {
        if (out.smallTargets.length < 5) out.smallTargets.push(`${label(t.el)} ${t.w}x${t.h}`);
      }
    }
    if (t.w < RECOMMENDED || t.h < RECOMMENDED) out.subRecommended++;
  }

  // Visible text below the legibility floor.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let n;
  while ((n = walker.nextNode())) {
    const txt = n.textContent.trim();
    if (txt.length < 3) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') continue;
    const fs = parseFloat(cs.fontSize);
    if (fs && fs < MIN_FONT_PX && out.tinyText.length < 5) {
      out.tinyText.push(`${label(el)} ${fs}px`);
    }
  }

  return out;
}
""".replace("MIN_TARGET", str(MIN_TARGET_PX)).replace("RECOMMENDED", str(RECOMMENDED_TARGET_PX)).replace("MIN_FONT_PX", str(MIN_FONT_PX))


def main() -> int:
    base = sys.argv[1] if len(sys.argv) > 1 else BASE
    failures: list[str] = []
    advisories: list[str] = []
    skipped: list[str] = []
    measured = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for name, w, h, mobile in VIEWPORTS:
            print(f"\n=== {name}  ({w}x{h}) ===")
            if HAVE_LOGIN:
                from _login import open_session as _open
                ctx, pg = _open(browser, {"width": w, "height": h}, is_mobile=mobile)
            else:
                ctx = browser.new_context(viewport={"width": w, "height": h}, is_mobile=mobile)
                pg = ctx.new_page()
            authenticated = HAVE_LOGIN

            # A session is what makes the auth routes measurable. If none is available,
            # say so rather than reporting them green.
            try:
                pg.goto(f"{base}/dashboard", wait_until="domcontentloaded")
                pg.wait_for_timeout(1500)
                authenticated = pg.evaluate(
                    "() => !!localStorage.getItem('accessToken') || location.pathname !== '/login'"
                ) and "/login" not in pg.url
            except Exception:
                authenticated = False

            routes = list(PUBLIC_ROUTES) + (AUTH_ROUTES if authenticated else [])
            if not authenticated:
                skipped.extend(f"{name} {r}" for r in AUTH_ROUTES)

            for route in routes:
                try:
                    pg.goto(f"{base}{route}", wait_until="domcontentloaded")
                    pg.wait_for_timeout(1800)
                    r = pg.evaluate(PROBE)
                except Exception as exc:  # a navigation failure is a result, not a skip
                    failures.append(f"{name} {route}: could not load ({str(exc)[:60]})")
                    print(f"  ERROR {route:18} {str(exc)[:50]}")
                    continue

                measured += 1
                problems = []

                if r["overflow"] > OVERFLOW_TOLERANCE_PX:
                    problems.append(f'{r["overflow"]}px overflow')
                    for o in r["overflowers"]:
                        advisories.append(f'{name} {route}: overflowing -> {o}')

                if r["smallTargets"]:
                    problems.append(f'{len(r["smallTargets"])} target(s) under {MIN_TARGET_PX}px')
                    for t in r["smallTargets"]:
                        advisories.append(
                            f'{name} {route}: target under {MIN_TARGET_PX}px -> {t}'
                        )

                if r["tinyText"]:
                    for t in r["tinyText"]:
                        advisories.append(f'{name} {route}: text under {MIN_FONT_PX}px -> {t}')

                if r["subRecommended"]:
                    advisories.append(
                        f'{name} {route}: {r["subRecommended"]} target(s) under '
                        f'{RECOMMENDED_TARGET_PX}px (advisory)'
                    )

                status = "FAIL" if problems else "ok"
                print(
                    f'  {status:4} {route:18} ov={r["overflow"]:3}px '
                    f'targets={r["interactiveCount"]:3} '
                    f'small={len(r["smallTargets"])} sub44={r["subRecommended"]:3} '
                    f'tiny={len(r["tinyText"])}'
                )
                if problems:
                    failures.append(f'{name} {route}: {", ".join(problems)}')

            ctx.close()

        browser.close()

    print("\n" + "=" * 72)
    print(f"measured {measured} route/viewport combinations")
    if skipped:
        print(f"SKIPPED (no session, not measured): {len(skipped)} route/viewport combos")
        print("  -> set ZAK_SMOKE_USER / ZAK_SMOKE_PASS to include the authenticated routes")

    if advisories:
        print(f"\n{len(advisories)} advisor{'y' if len(advisories) == 1 else 'ies'}:")
        for a in advisories[:40]:
            print(f"  - {a}")
        if len(advisories) > 40:
            print(f"  ... and {len(advisories) - 40} more")

    if failures:
        print(f"\n{len(failures)} FAILURE(S):")
        for f in failures:
            print(f"  FAIL {f}")
        return 1

    print("\nPASS: no horizontal overflow, all interactive targets meet WCAG 2.5.8.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
