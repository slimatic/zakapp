"""Three audits that nothing else covers: dark mode, touch targets, RTL.

1. DARK MODE. Every existing check and every screenshot so far ran light-only,
   so Qamar (dark) has never been verified. Worst case here is invisible text:
   a token defined for light and not for dark renders text at the same colour as
   its background. Checked by sampling rendered pixels and computing contrast
   against the effective background.

2. TOUCH TARGETS. redesign-premium calls for 44px minimum on interactive
   elements. Measured at 390px, excluding inline links that sit in a sentence.

3. RTL. The app ships Arabic (dir=rtl) and the RTL logical-property sweep
   touched 50 files. Checks for horizontal overflow and for physical-direction
   utilities (ml-/mr-/pl-/pr-/left-/right-) that would not flip.

Ponytail: contrast is computed from getComputedStyle colours plus the nearest
opaque ancestor background - not from a screenshot - because that reports the
actual token values and the failing element, instead of a pixel coordinate.
"""
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, "/home/chuwi_agent/zakapp/client/scripts")
from _login import open_session  # noqa: E402

ROUTES = [
    "/dashboard", "/assets", "/liabilities", "/nisab-records",
    "/payments", "/calculator", "/analytics", "/settings", "/learn",
]

# Text under this ratio against its own background is unreadable.
MIN_CONTRAST_NORMAL = 4.5
MIN_CONTRAST_LARGE = 3.0
MIN_TARGET = 44


def _js(src):
    """Fill the probe's thresholds from the constants above.

    The two page probes are JS strings with their own copies of these numbers, so
    editing a constant here did nothing at all. Interpolating keeps ONE source of
    truth: change MIN_CONTRAST_NORMAL and the browser sees it.
    """
    return (src.replace("__MIN_NORMAL__", str(MIN_CONTRAST_NORMAL))
               .replace("__MIN_LARGE__", str(MIN_CONTRAST_LARGE))
               .replace("__MIN_TARGET__", str(MIN_TARGET)))

CONTRAST = r"""() => {
  const lum = (r,g,b) => {
    const f = c => { c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
    return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
  };
  const parse = s => {
    const m = (s||'').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x.trim()));
    return { r:p[0], g:p[1], b:p[2], a: p.length > 3 ? p[3] : 1 };
  };
  // nearest opaque background walking up the tree
  const bgOf = el => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.95) return c;
      n = n.parentElement;
    }
    return { r:255, g:255, b:255, a:1 };
  };
  const textNodes = [];
  document.querySelectorAll('#main-content *, nav a, header *').forEach(el => {
    if (!el.childNodes.length) return;
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    if (!own.length) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.3) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    textNodes.push({el, own: own.map(n => n.textContent.trim()).join(' ').slice(0,40), cs});
  });
  const bad = [];
  for (const t of textNodes) {
    const fg = parse(t.cs.color);
    if (!fg) continue;
    const bg = bgOf(t.el);
    // composite fg over bg if it has alpha
    const f = a => ({ r: fg.r*a + bg.r*(1-a), g: fg.g*a + bg.g*(1-a), b: fg.b*a + bg.b*(1-a) });
    const cf = f(fg.a);
    const L1 = lum(cf.r,cf.g,cf.b), L2 = lum(bg.r,bg.g,bg.b);
    const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const size = parseFloat(t.cs.fontSize);
    const weight = parseInt(t.cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const min = large ? __MIN_LARGE__ : __MIN_NORMAL__;
    if (ratio < min) bad.push({text:t.own, ratio:Math.round(ratio*100)/100, min,
                               color:t.cs.color, bg:`rgb(${bg.r},${bg.g},${bg.b})`, size});
  }
  // dedupe by text+color
  const seen = new Set();
  return bad.filter(b => { const k = b.text+b.color; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
}"""

TARGETS = r"""() => {
  const out = [];
  document.querySelectorAll('button, a, [role=button], input[type=checkbox], select').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    // Skip in-sentence targets: WCAG 2.5.8 Target Size (Minimum) exempts them,
    // and the app marks them .inline-affordance so the (pointer: coarse) min-44px
    // rule does not blow up an inline word into a 44px box.
    if (el.closest('.inline-affordance')) return;
    const inSentence = el.closest('p, li, dd, dt, h1, h2, h3') &&
                       (el.tagName === 'A' || el.getAttribute('role') === 'button');
    if (inSentence) return;
    if (r.width < __MIN_TARGET__ || r.height < __MIN_TARGET__) {
      out.push({tag:el.tagName, w:Math.round(r.width), h:Math.round(r.height),
                label:(el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g,' ').trim().slice(0,34),
                cls:(typeof el.className === 'string' ? el.className : '').slice(0,46)});
    }
  });
  const seen = new Set();
  return out.filter(o => { const k = o.tag+o.w+o.h+o.cls; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
}"""

RTL_PROBE = r"""() => {
  const vw = document.documentElement.clientWidth;
  const dir = document.documentElement.dir;
  const phys = [];
  document.querySelectorAll('*').forEach(el => {
    const c = typeof el.className === 'string' ? el.className : '';
    // physical-direction utilities that do not flip under rtl
    const m = c.match(/\b(?:ml-|mr-|pl-|pr-|left-|right-|text-left|text-right|border-l-|border-r-)\d/);
    if (m) phys.push({cls: c.slice(0, 60), token: m[0], tag: el.tagName});
  });
  const seen = new Set();
  return { dir, overflow: document.documentElement.scrollWidth - vw,
           physical: phys.filter(p => { const k = p.token+p.cls; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8),
           physicalCount: phys.length };
}"""


def run(theme, mobile):
    problems = []
    vp = {"width": 390, "height": 844} if mobile else {"width": 1280, "height": 900}
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        # has_touch is what makes (pointer: coarse) match - is_mobile alone does not.
        ctx, pg = open_session(b, vp, is_mobile=mobile, has_touch=mobile)
        pg.evaluate(f"localStorage.setItem('zakapp-theme', '{theme}')")
        label = f"{theme}/{'mobile' if mobile else 'desktop'}"
        print(f"\n=== {label} ===")
        bad_contrast = bad_targets = 0
        for route in ROUTES:
            pg.goto(f"http://localhost:4173{route}", wait_until="networkidle")
            pg.wait_for_timeout(2200)
            c = pg.evaluate(_js(CONTRAST))
            if c:
                bad_contrast += len(c)
                for x in c[:2]:
                    print(f"  CONTRAST {route}: {x['ratio']}:1 (min {x['min']}) "
                          f"{x['color']} on {x['bg']}  \"{x['text']}\"")
                problems.append(f"{label} {route}: {len(c)} low-contrast text node(s)")
            if mobile:
                t = pg.evaluate(_js(TARGETS))
                if t:
                    bad_targets += len(t)
                    for x in t[:2]:
                        print(f"  TARGET   {route}: {x['w']}x{x['h']} <{x['tag']}> \"{x['label']}\"")
                    problems.append(f"{label} {route}: {len(t)} undersized target(s)")
        print(f"  totals: {bad_contrast} contrast, {bad_targets} targets")
        ctx.close()
        b.close()
    return problems


def main():
    problems = []
    problems += run("light", mobile=True)
    problems += run("dark", mobile=True)

    # RTL at both widths
    for mobile in (True, False):
        vp = {"width": 390, "height": 844} if mobile else {"width": 1280, "height": 900}
        with sync_playwright() as p:
            b = p.chromium.launch(headless=True)
            ctx, pg = open_session(b, vp, is_mobile=mobile)
            pg.evaluate("localStorage.setItem('zakapp_lang', 'ar')")
            label = f"rtl/{'mobile' if mobile else 'desktop'}"
            print(f"\n=== {label} ===")
            for route in ROUTES:
                pg.goto(f"http://localhost:4173{route}", wait_until="networkidle")
                pg.wait_for_timeout(2200)
                r = pg.evaluate(RTL_PROBE)
                if r["dir"] != "rtl":
                    problems.append(f"{label} {route}: dir={r['dir']}, Arabic did not switch direction")
                if r["overflow"] > 1:
                    problems.append(f"{label} {route}: {r['overflow']}px horizontal overflow")
                    print(f"  OVERFLOW {route}: {r['overflow']}px")
                if r["physicalCount"]:
                    print(f"  PHYSICAL {route}: {r['physicalCount']} non-flipping util(s) "
                          f"e.g. {[x['token'] for x in r['physical'][:4]]}")
            ctx.close()
            b.close()

    print()
    if problems:
        for x in problems:
            print(f"FAIL {x}")
        print(f"\n{len(problems)} issue group(s)")
        return 1
    print("PASS: dark mode legible, targets >=44px, RTL mirrors without overflow.")
    return 0


if __name__ == "__main__":
    # This script printed FAIL and the issue count but exited 0 for its whole life, so
    # nothing that ran it could tell a pass from a failure. Every probe here must exit
    # non-zero on a finding, or its verdict is cosmetic.
    sys.exit(main())
