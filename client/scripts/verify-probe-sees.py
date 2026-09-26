"""Prove the a11y probe distinguishes "clean" from "saw nothing".

Runs the real CONTRAST/TARGETS probe JS against three synthetic pages served
from a data URL, so the result does not depend on the app's auth state:

  1. A clean page WITH readable text  -> examined > 0, bad == []
  2. A page with low-contrast text    -> bad non-empty
  3. An empty page                    -> examined == 0  (the silent-pass case)

If case 1 and case 3 both produced `examined: 0` the fix is useless, and if
case 3 produced a non-zero `examined` the guard would never fire.
"""
import sys
from playwright.sync_api import sync_playwright

# Pull the two probe bodies straight out of the checker so this tests the real
# thing rather than a copy.
raw = open('client/scripts/check-theme-a11y-rtl.py').read()


def probe(name):
    opener = f'{name} = r"""'
    i = raw.find(opener)
    assert i != -1, f'{name} opener not found'
    i += len(opener)
    j = raw.find('}"""', i) + 1          # probe bodies end with `}\n"""`
    js = raw[i:j]
    return (js.replace('__MIN_TARGET__', '44')
              .replace('__MIN_LARGE__', '3.0')
              .replace('__MIN_NORMAL__', '4.5'))


CONTRAST = probe('CONTRAST')
TARGETS = probe('TARGETS')

CLEAN = """<div id="main-content"><p style="color:#111;background:#fff;font-size:16px">Readable text here</p>
<button style="width:60px;height:60px">OK</button></div>"""
LOW = """<div id="main-content"><p style="color:#bbb;background:#fff;font-size:16px">Faint text here</p></div>"""
EMPTY = """<div id="main-content"></div>"""

pages = {'clean': CLEAN, 'low-contrast': LOW, 'empty': EMPTY}
results = {}

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page()
    for key, html in pages.items():
        pg.set_content(html)
        c = pg.evaluate(f'() => {{ const g = {CONTRAST}; return g(); }}')
        t = pg.evaluate(f'() => {{ const g = {TARGETS}; return g(); }}')
        results[key] = (c, t)
        print(f'{key:14s} contrast examined={c["examined"]:<3} bad={len(c["bad"])}   '
              f'targets examined={t["examined"]:<3} bad={len(t["bad"])}')
    b.close()

c1, _ = results['clean']
c2, _ = results['low-contrast']
c3, _ = results['empty']

checks = [
    ('clean page WAS examined', c1['examined'] > 0),
    ('clean page found nothing bad', len(c1['bad']) == 0),
    ('low-contrast page IS flagged', len(c2['bad']) > 0),
    ('empty page reports examined == 0', c3['examined'] == 0),
    ('clean and empty are distinguishable',
     c1['examined'] > 0 and c3['examined'] == 0),
]
print()
for label, ok in checks:
    print(f'  {"PASS" if ok else "FAIL"}  {label}')
sys.exit(0 if all(ok for _, ok in checks) else 1)
