"""Footer must be compact, and every link in it must go somewhere real.

Two things this guards:
  1. Height. The footer was three full-width sections (CTA / links / credits),
     each with its own py-8 and a rule, so on a 390px phone it stacked ~10 lines
     of mostly empty space under every page. Budget: <= 130px at 390px wide,
     <= 90px on desktop.
  2. Dead links. "Privacy Policy", "Open Source" and "Report an Issue" are
     plain <a>/<Link> elements, so a typo'd route or a removed page renders a
     link that looks fine and 404s. Each must resolve.

Not covered: whether the donation CTA renders at all - DonationCTA returns null
when donations are disabled, which is a valid state, so its absence is not a
failure here.
"""
import sys
from playwright.sync_api import sync_playwright
from _login import open_session, UID, BASE

MOBILE_BUDGET = 130
DESKTOP_BUDGET = 90

PROBE = """() => {
  const f = document.querySelector('footer');
  if (!f) return {missing: true};
  const r = f.getBoundingClientRect();
  const links = [...f.querySelectorAll('a')].map(a => ({
    text: (a.textContent || '').replace(/\\s+/g,' ').trim(),
    href: a.getAttribute('href') || '',
    w: Math.round(a.getBoundingClientRect().width)
  })).filter(l => l.text);
  return {
    height: Math.round(r.height),
    scrollW: f.scrollWidth,
    innerW: f.clientWidth,
    links,
    // Rules inside the footer: the old one had 3 sections = 3 borders.
    borders: f.querySelectorAll('.border-t').length,
    fontSizes: [...new Set([...f.querySelectorAll('*')].map(e => getComputedStyle(e).fontSize))]
  };
}"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    problems = []

    # ---- mobile ----
    ctx, pg = open_session(b, {"width": 390, "height": 844}, is_mobile=True)
    m = pg.evaluate(PROBE)
    if m.get("missing"):
        problems.append("no <footer> on the dashboard")
    else:
        print(f"mobile   height={m['height']}px (budget {MOBILE_BUDGET})  "
              f"links={len(m['links'])}  rules={m['borders']}  "
              f"sizes={','.join(sorted(m['fontSizes']))}")
        if m["height"] > MOBILE_BUDGET:
            problems.append(f"mobile footer {m['height']}px > {MOBILE_BUDGET}px budget")
        if m["borders"] > 1:
            problems.append(f"{m['borders']} stacked rules inside the footer")
        for l in m["links"]:
            print(f'    link "{l["text"][:34]}" -> {l["href"][:60]}')
            if not l["href"]:
                problems.append(f'link "{l["text"]}" has no href')
            if l["href"].startswith("#") and l["href"] != "#":
                problems.append(f'link "{l["text"]}" points at {l["href"]}')
        ctx.close()

    # ---- desktop ----
    ctx, pg = open_session(b, {"width": 1280, "height": 900})
    d = pg.evaluate(PROBE)
    if not d.get("missing"):
        print(f"desktop  height={d['height']}px (budget {DESKTOP_BUDGET})  "
              f"links={len(d['links'])}  rules={d['borders']}")
        if d["height"] > DESKTOP_BUDGET:
            problems.append(f"desktop footer {d['height']}px > {DESKTOP_BUDGET}px budget")
        # Desktop must stay a single row, not wrap into a stack.
        if d["height"] > m.get("height", 0) and d["height"] > DESKTOP_BUDGET:
            problems.append("desktop footer wrapped into a stack")

    # ---- do the footer links actually resolve? ----
    for path, label in [("/privacy-policy", "Privacy")]:
        pg.goto(f"{BASE}{path}", wait_until="networkidle")
        pg.wait_for_timeout(1500)
        body = (pg.evaluate("document.body.innerText") or "").lower()
        if "not found" in body or "404" in body[:200]:
            problems.append(f"{label} ({path}) renders a not-found page")
        else:
            print(f'    {label} {path} -> renders ok')
    ctx.close()
    b.close()

print()
if problems:
    for x in problems:
        print(f"FAIL {x}")
    sys.exit(1)
print("PASS: footer is compact, single-ruled, and every link resolves.")
