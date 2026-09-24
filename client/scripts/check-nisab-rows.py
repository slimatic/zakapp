"""Measure the real "Wealth vs Nisab" card for clipped or overlapping money.

Runs against the live preview and the REAL component - no HTML fixture, so no
guessed CSS to get wrong.

The defect: the card sits in a ~310px detail rail but sized itself with
`lg:grid-cols-3`, a VIEWPORT breakpoint. At desktop widths the three columns are
~95px and the money values (~100px+ at 18px bold tabular) do not fit. They had
`truncate`, so they clipped, and the clipped strings sat flush - measured
overlap of ~6px, which reads as one jammed number.

Exit 0 = every value renders whole and no two values on a row overlap.
Exit 1 = the defect is present (this is the expected result on the old build).
"""
import sys
from playwright.sync_api import sync_playwright

UID = "cmuerqpub000rpb3fulpxby7g"
BASE = "http://localhost:4173"
VIEWPORT = {"width": 1280, "height": 900}

MEASURE = """() => {
  const hosts = [...document.querySelectorAll('*')]
    .filter(e => e.textContent && e.textContent.includes('Wealth vs Nisab'));
  if (!hosts.length) return { found: false };
  const widget = hosts[hosts.length - 1].closest('.nisab-comparison-widget')
    || hosts[hosts.length - 1];
  const r = widget.getBoundingClientRect();
  const money = [...widget.querySelectorAll('div,span')]
    .filter(e => /^\\$[\\d,]+\\.\\d{2}$/.test(e.textContent.trim()) && e.children.length === 0);
  return {
    found: true,
    contentWidth: Math.round(r.width),
    right: r.right,
    values: money.map(e => {
      const b = e.getBoundingClientRect();
      return { text: e.textContent.trim(), l: b.left, r: b.right,
               top: b.top, clip: e.scrollWidth - e.clientWidth };
    })
  };
}"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport=VIEWPORT)
    pg = ctx.new_page()

    pg.goto(f"{BASE}/login", wait_until="networkidle")
    pg.wait_for_timeout(1200)
    pg.fill('#username', 'v1smoke')
    pg.fill('#password', 'V1Smoke2026!')
    pg.press('#password', 'Enter')
    pg.wait_for_url("**/onboarding", timeout=25000)
    pg.evaluate(
        f"localStorage.setItem('zakapp_local_prefs_{UID}', JSON.stringify({{skipped:true}}))"
    )

    # The detail rail needs an active hawl record to render at all.
    pg.goto(f"{BASE}/seeder", wait_until="networkidle")
    pg.wait_for_timeout(1500)
    try:
        pg.click("text=Seed a Full Demo Dataset", timeout=8000)
        pg.wait_for_timeout(18000)
    except Exception as e:
        print(f"seed skipped: {str(e)[:70]}")

    pg.goto(f"{BASE}/nisab-records", wait_until="networkidle")
    pg.wait_for_timeout(4000)
    result = pg.evaluate(MEASURE)
    b.close()

if not result.get("found"):
    print("FAIL: the Wealth vs Nisab card did not render (no active record?)")
    sys.exit(2)

vals = result["values"]
print(f"card content width: {result['contentWidth']}px @ viewport {VIEWPORT['width']}px")
print(f"money values found: {len(vals)}")
for v in vals:
    flag = f"   CLIPPED by {v['clip']}px" if v["clip"] > 1 else ""
    print(f"  {v['text']:>14}  left={v['l']:7.1f} right={v['r']:7.1f} top={v['t'] if 't' in v else v['top']:6.1f}{flag}")

clipped = [v["text"] for v in vals if v["clip"] > 1]
overlaps = []
for i, a in enumerate(vals):
    for c in vals[i + 1:]:
        same_row = abs(a["top"] - c["top"]) < 2
        if not same_row:
            continue
        gap = c["l"] - a["r"]
        # Overlap is a hard failure. A gap under 4px is a squeeze: the columns
        # are too narrow for the text, so the values read as one token even when
        # the boxes technically do not intersect.
        if gap < 0:
            overlaps.append(f"{a['text']} / {c['text']} overlap by {abs(gap):.1f}px")
        elif gap < 4:
            overlaps.append(f"{a['text']} / {c['text']} only {gap:.1f}px apart (squeezed)")
overflow = [v["text"] for v in vals if v["r"] > result["right"] + 2]

print()
if clipped:
    print(f"CLIPPED:  {clipped}")
if overlaps:
    print(f"OVERLAP:  {overlaps}")
if overflow:
    print(f"OVERFLOW: {overflow}")

if clipped or overlaps:
    print("\nFAIL: money values do not render cleanly in the detail rail.")
    sys.exit(1)

print("PASS: all money values render whole, no clipping, no overlap.")
