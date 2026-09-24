"""The last two open items: the six low-contrast nodes on /settings, and the
physical-direction utilities the RTL sweep missed.

/settings still reports 6 nodes at 4.4:1 with colour rgb(179,83,9). That is
--warn at 26 90% 37%, but the token was already changed to 35%. So either the
build is stale or the colour comes from somewhere else. Find out which, and name
the elements, rather than guessing at more token nudges.
"""
import sys
sys.path.insert(0, "/home/chuwi_agent/zakapp/client/scripts")
from _login import open_session
from playwright.sync_api import sync_playwright

TRACE = r"""() => {
  const parse = s => { const m = (s||'').match(/rgba?\(([^)]+)\)/);
    if (!m) return null; const p = m[1].split(',').map(x => parseFloat(x.trim()));
    return { r:p[0], g:p[1], b:p[2], a: p.length>3 ? p[3] : 1 }; };
  const target = 'rgb(179, 83, 9)';
  const hits = [];
  document.querySelectorAll('#main-content *').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.color !== target) return;
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    if (!own.length) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2) return;
    hits.push({ tag: el.tagName, cls: (typeof el.className==='string'?el.className:'').slice(0,70),
                text: own.map(n=>n.textContent.trim()).join(' ').slice(0,30),
                font: cs.fontSize, cls2: el.getAttribute('class') ? '' : '' });
  });
  return { count: hits.length, hits: hits.slice(0, 8) };
}"""

PHYS = r"""() => {
  const out = [];
  document.querySelectorAll('*').forEach(el => {
    const c = typeof el.className === 'string' ? el.className : '';
    const m = c.match(/\b(?:ml-|mr-)\d/);
    if (!m) return;
    const r = el.getBoundingClientRect();
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    out.push({ token: m[0], tag: el.tagName, cls: c.slice(0,70),
               text: own.map(n=>n.textContent.trim()).join(' ').slice(0,26),
               w: Math.round(r.width) });
  });
  const seen = new Set();
  return out.filter(o => { const k = o.cls+o.token; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
}"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)

    ctx, pg = open_session(b, {"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    pg.goto("http://localhost:4173/settings", wait_until="networkidle")
    pg.wait_for_timeout(2500)
    print("--- /settings: elements coloured rgb(179,83,9) ---")
    t = pg.evaluate(TRACE)
    print(f"  count={t['count']}")
    for h in t["hits"]:
        print(f"  <{h['tag']:5}> {h['font']:>6}  \"{h['text']}\"")
        print(f"          .{h['cls']}")
    # what does the token actually resolve to now?
    print("  --warn resolves to:", pg.evaluate(
        "getComputedStyle(document.documentElement).getPropertyValue('--warn')"))
    ctx.close()

    # RTL leftovers
    ctx, pg = open_session(b, {"width": 1280, "height": 900})
    pg.evaluate("localStorage.setItem('zakapp_lang','ar')")
    for route in ["/payments", "/calculator", "/settings"]:
        pg.goto(f"http://localhost:4173{route}", wait_until="networkidle")
        pg.wait_for_timeout(2200)
        print(f"--- {route}: physical ml-/mr- utilities ---")
        for x in pg.evaluate(PHYS):
            print(f"  {x['token']:6} <{x['tag']:6}> w={x['w']:4} \"{x['text']}\"  .{x['cls']}")
    ctx.close()
    b.close()
