#!/usr/bin/env bash
# scripts/deploy-dev-site.sh
#
# Rebuild the develop dev site and PROVE it is serving the current commit.
#
# Why this exists: `client/dist/` is built by hand and served statically by
# `vite preview` (see zakapp-preview.service). Nothing rebuilds it when a PR
# merges, so the dev site silently keeps serving older code — twice now the
# answer to "why am I seeing an old version" was a stale dist, not a bad deploy.
# The banner in the UI (`v0.17.2 (843f7718)`) is the commit the *bundle* was
# built from, so it is the thing to check.
#
# Usage:
#   scripts/deploy-dev-site.sh [branch]     # default: develop
#
# Exit codes: 1 = dirty tree / bad branch, 2 = build failed, 3 = verification failed.

set -euo pipefail

BRANCH="${1:-develop}"
BASE="${ZAK_BASE:-https://chuwi-ubuntu.tail7ffff.ts.net}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# nvm's node, since the preview service uses it and the build scripts expect it.
NODE_BIN="/home/chuwi_agent/.nvm/versions/node/v24.13.0/bin"
[ -d "$NODE_BIN" ] && export PATH="$NODE_BIN:$PATH"

log() { printf '  %s\n' "$*"; }
die() { printf '  ERROR: %s\n' "$*" >&2; exit "${2:-1}"; }

# ── 1. Refuse to build a dirty tree ──────────────────────────────
# A build from uncommitted edits would bake a commit hash that does not describe
# the bundle, which is worse than not deploying — it would look correct.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  log "Uncommitted changes in tracked files:"
  git status --short --untracked-files=no | sed 's/^/    /'
  die "commit or stash first — the baked hash must describe what is served"
fi

# ── 2. Move to the branch, fast-forward only ─────────────────────
git rev-parse --verify --quiet "$BRANCH" >/dev/null \
  || git fetch -q origin "$BRANCH:refs/remotes/origin/$BRANCH" 2>/dev/null \
  || die "no such branch: $BRANCH"

git checkout -q "$BRANCH"
git pull -q --ff-only origin "$BRANCH" || die "could not fast-forward $BRANCH"

HEAD_SHA="$(git rev-parse --short HEAD)"
log "branch: $BRANCH at $HEAD_SHA — $(git log -1 --format=%s | cut -c1-56)"

cd client

# ── 3. Build into a temporary directory, then swap ───────────────
#
# WHY NOT `npm run build` DIRECTLY
#   `vite build` empties `outDir` first (`emptyOutDir` defaults to true when the
#   out directory is inside the project root). The preview serves `dist/`
#   directly, so the hashed assets are deleted partway through the build, before
#   the new ones exist. Any request in that window gets the SPA fallback: HTTP 200
#   with an HTML body. A module script served as text/html is the blank page —
#   the document loads and the script is refused with "Expected a JavaScript
#   module script but the server responded with MIME type text/html".
#
#   MEASURED, not assumed. Polling the asset `index.html` names every 500ms across
#   a deploy: the old build serves 16 x text/html over a 9-second window. Building
#   into `dist.next` and swapping gives 0.
#
#   Note the shell never fails — the fallback answers every URL with 200 — which is
#   why a plain `curl /` looks healthy while the app is broken.
BUILD_DIR="dist.next"
rm -rf "$BUILD_DIR"
log "building into $BUILD_DIR..."
# Use the LOCAL vite binary and run tsc first, mirroring the package's own
# `build` script (`tsc && vite build`). Two reasons:
#  - `npx vite build` can resolve a different global vite (rolldown), which failed
#    with "Cannot resolve entry module index.html".
#  - dropping tsc would publish a build that never type-checked.
if ! { npx tsc && ./node_modules/.bin/vite build --outDir "$BUILD_DIR" --emptyOutDir; } >/tmp/zakapp-devbuild.log 2>&1; then
  tail -20 /tmp/zakapp-devbuild.log | sed 's/^/    /'
  rm -rf "$BUILD_DIR"
  die "build failed (full log: /tmp/zakapp-devbuild.log)" 2
fi

# Verify BEFORE it goes live, so a bad build is discarded rather than published.
BAKED="$(grep -ohE "\"$HEAD_SHA\"" "$BUILD_DIR"/assets/index-*.js 2>/dev/null | head -1 | tr -d '"' || true)"
if [ "$BAKED" != "$HEAD_SHA" ]; then
  rm -rf "$BUILD_DIR"
  die "$BUILD_DIR does not carry $HEAD_SHA (found: ${BAKED:-nothing}) — build is stale" 3
fi

# Keep the two most recent builds as rollback targets before replacing the live one.
rm -rf dist.prev2
[ -d dist.prev ] && mv dist.prev dist.prev2
[ -d dist ] && mv dist dist.prev
mv "$BUILD_DIR" dist
log "swapped in $(ls -la --time-style=+%H:%M dist/index.html | awk '{print $6}') (previous kept in dist.prev)"
log "dist carries $HEAD_SHA"

# ── 5. Verify: what the URL actually serves matches ──────────────
# Checks the running preview, not just the files on disk. A service worker can
# still hand a client an older shell, so this is asserted from the server side.
INDEX_JS="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' dist/index.html | head -1)"
if command -v curl >/dev/null 2>&1; then
  SERVED_JS="$(curl -fsS --max-time 10 "$BASE/" 2>/dev/null | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1 || true)"
  if [ -z "$SERVED_JS" ]; then
    log "WARN: could not reach $BASE — skipped the served-bundle check"
  elif [ "$SERVED_JS" != "$INDEX_JS" ]; then
    die "serving $SERVED_JS but dist/index.html points at $INDEX_JS — is the preview pointed at this dist?" 3
  else
    SERVED_HASH="$(curl -fsS --max-time 20 "$BASE/$SERVED_JS" 2>/dev/null | grep -ohE "\"$HEAD_SHA\"" | head -1 | tr -d '"' || true)"
    [ "$SERVED_HASH" = "$HEAD_SHA" ] \
      || die "served bundle does not carry $HEAD_SHA" 3
    log "served bundle carries $HEAD_SHA"
  fi
fi

log "OK — $BASE is serving $BRANCH @ $HEAD_SHA"
log "if the browser still shows an older hash, it is its own service worker:"
log "  DevTools > Application > Service Workers > Unregister, then hard-reload"
