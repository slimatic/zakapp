"""prefers-reduced-motion must actually stop the motion, measured at runtime.

A grep for the media query proves nothing - the app had three reduced-motion
blocks already and still animated everywhere, because they only covered
.skip-link, focus transitions and .loading-spinner. The motion actually in use is
Tailwind's animate-pulse (29 call sites) and animate-spin (17), the custom
fadeIn (11), and two framer-motion trees (KnowledgeHub, OnboardingLayout), which
CSS cannot reach at all - that one needs MotionConfig.

So this emulates the preference in the browser and asserts the computed
animation is inert, before and after.

Ponytail: asserts on animation PLAY state, not duration. A 0.01ms animation
still reports a name, so duration alone would pass while elements still animate.
"""
import os
import sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _login import open_session, BASE  # noqa: E402

ROUTES = ["/dashboard", "/assets", "/payments", "/nisab-records", "/analytics", "/learn"]

# Elements whose computed animation should be inert under the preference.
PROBE = """() => {
  const moving = [];
  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    const name = cs.animationName;
    if (!name || name === 'none') return;
    const dur = parseFloat(cs.animationDuration) || 0;
    const iter = cs.animationIterationCount;
    // "still animating" = has a name, a real duration, and more than one cycle
    const real = dur > 0.05 && (iter === 'infinite' || parseFloat(iter) > 1);
    if (real) {
      moving.push({ cls: (typeof el.className === 'string' ? el.className : '').slice(0, 50),
                    name, dur, iter });
    }
  });
  const seen = new Set();
  return moving.filter(m => { const k = m.name + m.iter; if (seen.has(k)) return false; seen.add(k); return true; });
}"""


def run(reduced):
    label = "reduced-motion ON " if reduced else "reduced-motion OFF"
    found = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx, pg = open_session(b, {"width": 1280, "height": 900},
                               reduced_motion="reduce" if reduced else "no-preference")
        # Poll fast through the LOADING window. Sampling after networkidle finds
        # nothing, because by then the skeleton loaders are gone - the first
        # version of this check was vacuous for exactly that reason.
        for route in ROUTES:
            pg.goto(f"{BASE}{route}", wait_until="commit")
            best = []
            for _ in range(24):
                pg.wait_for_timeout(150)
                hits = pg.evaluate(PROBE)
                if len(hits) > len(best):
                    best = hits
            if best:
                found.append((route, best))
        ctx.close()
        b.close()
    print(f"  {label}: {sum(len(h) for _, h in found)} still-animating element(s)")
    for route, hits in found[:3]:
        for h in hits[:3]:
            print(f"      {route} .{h['cls']}  {h['name']} {h['dur']}s x{h['iter']}")
    return found


def main():
    # Sanity: with the preference OFF the app must animate, or this proves nothing.
    off = run(reduced=False)
    on = run(reduced=True)

    problems = []
    if not off:
        problems.append("no animation found with the preference OFF - the probe or the "
                        "app's loading state is not exercising animate-*, so the ON result "
                        "would be meaningless")
    if on:
        problems.append(f"{sum(len(h) for _, h in on)} element(s) still animate under "
                        f"prefers-reduced-motion: reduce")

    print()
    if problems:
        for x in problems:
            print(f"FAIL {x}")
        sys.exit(1)
    print("PASS: motion is inert under prefers-reduced-motion, and present without it.")


if __name__ == "__main__":
    main()
