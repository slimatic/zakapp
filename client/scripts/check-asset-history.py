"""Asset detail page: history panel must render locally, with no error banner.

What this guards, and why it is worth a script:

The panel used to request GET /assets/:id/history. Assets live in this browser
(RxDB/IndexedDB) and Asset.value is encrypted, so the server has neither the row
nor a readable amount -- every request returned 400 GET_HISTORY_FAILED
"Asset not found", rendered as a banner on the page. The roadmap listed the
feature as complete, so the only way to notice was to open a real asset and read
the screen. That is what this does.

Asserts:
  1. An asset row exists and opens (otherwise the check measures nothing).
  2. "Asset Not Found" is NOT present -- the specific banner.
  3. The panel reached a content state: a heading, not its error box and not a
     permanent spinner.
  4. No /history request was made -- proves it reads locally rather than
     depending on an endpoint that cannot answer for a local asset.

Two things this had to learn the hard way, both of which made earlier runs report
a failure that was really a bad selector:

  - Rows are `<button class="flex min-w-0 ...">`, NOT `a[href]`. Selecting links
    finds none and the check reports "no assets" while the page lists plenty.
  - The form inputs have `id` but no `name`. Selecting `[name="..."]` matches
    nothing.

Creating an asset is not used here: the account cap is per-user, so on a full
account the create path fails for reasons unrelated to this feature.

Run:  ZAK_BASE=... ZAK_SMOKE_USER=... ZAK_SMOKE_PASS=... python3 check-asset-history.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _login import open_session  # noqa: E402

from playwright.sync_api import sync_playwright  # noqa: E402

VIEWPORT = {"width": 1280, "height": 900}
ROW = "button.flex.min-w-0"

FAILURES = []


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx, pg = open_session(browser, VIEWPORT, path="/assets")
        try:
            history_calls = []
            pg.on("response", lambda r: history_calls.append((r.url, r.status))
                  if "/history" in r.url else None)

            rows = pg.query_selector_all(ROW)
            if not rows:
                print("FAIL: no asset rows on /assets -- cannot test the detail page")
                return 2
            label = (rows[0].inner_text() or "").replace("\n", " | ")[:60]
            print(f"  opening first of {len(rows)} assets: {label}")
            rows[0].click()
            pg.wait_for_timeout(7000)

            body = pg.inner_text("body")

            if "/login" in pg.url:
                FAILURES.append("bounced to /login instead of rendering the asset")
            if "Asset Not Found" in body or "Asset not found" in body:
                FAILURES.append('page shows "Asset Not Found"')
            if "Loading history" in body:
                FAILURES.append("history panel still loading after 7s (never settled)")
            if "Could not read this asset" in body:
                FAILURES.append("panel reported it could not read local history")
            if "Amount History" not in body:
                FAILURES.append("history panel rendered no heading "
                                "(likely showing its error state)")

            # Any request at all means the panel went back to the server, even if
            # it happened to render this time.
            if history_calls:
                FAILURES.append(f"panel calls the server for history: {history_calls}")

            idx = body.find("Amount History")
            print(f"  url: {pg.url}")
            print(f"  'Asset Not Found' present: {'Asset Not Found' in body}")
            print(f"  /history requests: {len(history_calls)}")
            if idx >= 0:
                print("  panel: " + body[idx:idx + 200].replace("\n", " | "))
        finally:
            ctx.close()
            browser.close()

    if FAILURES:
        print("\nFAIL:")
        for f in FAILURES:
            print(f"  - {f}")
        return 1
    print("\nPASS: history panel renders locally, no error banner")
    return 0


if __name__ == "__main__":
    sys.exit(main())
