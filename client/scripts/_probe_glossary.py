"""Does the existing (pointer: coarse) min-44px rule wreck inline glossary terms?

accessibility.css applies, under @media (pointer: coarse):
    a, button, [role=button], [role=link] { min-width:44px; min-height:44px;
                                             display:inline-flex }

GlossaryTerm renders a <span role="button"> inline inside a sentence. Forcing an
inline sentence word to display:inline-flex with a 44px min size can break the
line box. This measures the paragraph with and without a coarse pointer.
"""
import sys
sys.path.insert(0, "/home/chuwi_agent/zakapp/client/scripts")
from _login import open_session
from playwright.sync_api import sync_playwright

PROBE = """() => {
  const p = [...document.querySelectorAll('p')].find(e => /Five Pillars/.test(e.textContent));
  if (!p) return null;
  const g = p.querySelector('span[role=button]');
  const r = g ? g.getBoundingClientRect() : null;
  const pr = p.getBoundingClientRect();
  const rng = document.createRange();
  rng.selectNodeContents(p);
  const rects = [...rng.getClientRects()];
  return {
    termW: r ? Math.round(r.width) : null,
    termH: r ? Math.round(r.height) : null,
    termDisplay: g ? getComputedStyle(g).display : null,
    termMinH: g ? getComputedStyle(g).minHeight : null,
    pHeight: Math.round(pr.height),
    lineBoxes: rects.length
  };
}"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    for tag, kw in [("touch (coarse)", dict(is_mobile=True, has_touch=True)),
                    ("no touch      ", dict(is_mobile=True))]:
        ctx, pg = open_session(b, {"width": 390, "height": 844}, **kw)
        pg.evaluate("localStorage.setItem('zakapp_educational_expanded','true')")
        pg.goto("http://localhost:4173/dashboard", wait_until="networkidle")
        pg.wait_for_timeout(3000)
        print(f"{tag}  {pg.evaluate(PROBE)}")
        ctx.close()
    b.close()
