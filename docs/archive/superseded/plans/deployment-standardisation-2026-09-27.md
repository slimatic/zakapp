# Deployment — how it works, what to standardise, and what to fix

**Prepared for Salim · 2026-09-27 · branch `develop` @ `db42540a`**

Everything below was tested by standing the stack up in a sandbox
(`/tmp/zak-sandbox/repo`), not read off the repo. Where a claim comes from a live
run it says so.

---

## 1. The answer to your question: how is this deployed today?

There are **two working paths and one trap.**

**Path A — `./deploy-easy.sh` (the good one).** Verified end to end. It generates
`.env` with real secrets, detects your IP, offers localhost/IP/domain access, and
**pre-flights the ports**: if 3000 is taken it finds the next free port, rewrites
`FRONTEND_PORT` and the CORS settings, then pulls prebuilt images and starts the
stack. On this machine (where 3000 is occupied by open-webui) it correctly moved to
**3002** and the site came up — frontend `200 text/html`, `config.js` `200
application/javascript`, CouchDB `200`.

**Path B — `docker compose up -d` by hand.** Works, but this is **the trap**, and I
reproduced it:

```
Container repo-couchdb-1   Started → Healthy
Container repo-migrations-1 Exited (0)
Container repo-backend-1    Started → Healthy
Container repo-frontend-1   Created      ← never started
Container repo-caddy-1      Created      ← never started
```

The command **exits `0` and reports success.** Two of five services are silently
left unstarted because Caddy cannot bind `0.0.0.0:3000`
(`Bind for 0.0.0.0:3000 failed: port is already allocated`). The user then opens
`localhost:3000` and gets *a different application*, with nothing telling them
anything went wrong. That is issue **#267** — a real user, Feb 2026: *"so many
different compose files … I kept getting errors."*

**The fix for all of it is already in the repo** — the port pre-flight in
`deploy-easy.sh`. The problem is that the docs present both paths as equally valid.

---

## 2. The issues that led here

`#267` is the origin of the Docker decision, and its request is exactly your
instinct: *"a docker image with a unified one simple docker compose file."*

The PRD written from it (`tasks/prd-docker-image.md`, now removed as spent work)
promised four stories. Status against the repo:

- **Prebuilt images, no build on `up`** — ✅ done. `docker-compose.yml` has no
  `build:` directive and pulls `slimatic/zakapp-{backend,frontend}`.
- **Published and versioned** — ✅ done, beyond what the PRD asked: 32 tags each,
  semver plus `latest` (`0.17.2`, `0.17.1`, `0.17.0`, `0.16…`).
- **Supply chain — cosign signing, SBOM, provenance** — ❌ **not implemented.** The
  words appear only in the PRD; no workflow, script, or config does it.
- **Dev override to build from source** — ✅ done (`docker-compose.dev.yml` +
  `deploy-dev-build.sh`).

So the PRD itself is 3/4 delivered with one gap that was never closed.

---

## 3. What I'd standardise, and what I'd stop claiming

**Standardise on the images + `deploy-easy.sh`.** `docker-compose.yml` is already
the single unified compose file #267 asked for — one file, no build, pulls
prebuilt. That part of the goal is met. The gap is that nothing tells the user
*this* is the path and `docker compose up` is the fallback.

Recommendation: make **`./deploy-easy.sh` the documented, supported installation**,
and present `docker compose up -d` as the advanced/manual path **with the
port-collision warning attached**. That is a docs and defaults change, not a
rewrite — the mechanism already exists and is proven.

**On the four remaining deploy docs.** I measured actual overlap and it is lower
than I claimed earlier in this session — under 2% pairwise, only 4 shared headings
out of 347. So the five documents are not really redundant; they are **unrouted**.
They serve different intents (fastest start / operator reference / self-hosting /
production depth) and nothing said which to read. I added that routing map to
`docs/README.md`. I do **not** recommend merging them: that is a content rewrite
with a real chance of dropping a troubleshooting case for no gain in clarity.

**Stop implying `cosign`/SBOM exist.** Either drop the claim or implement it. If you
want it, signing published images with cosign keyless via GitHub OIDC is a small
workflow addition; I'd treat it as its own task rather than smuggling it into a
cleanup.

---

## 4. Bugs found by running it (fixed, two PRs)

**`APP_URL` was left on the old port.** `deploy-easy.sh` rewrote `CLIENT_URL` and
`ALLOWED_ORIGINS` after moving ports but **not `APP_URL`** — which is what
`server/src/services/EmailService.ts` (lines 157, 248) uses to build verification
and password-reset links. On any machine where 3000 is taken, those emails pointed
at a dead port. Observed live: `APP_URL=http://localhost:3000` while
`FRONTEND_PORT=3002`. Fixed and re-verified — clean run now yields matching values.

**`docs/deployment-guide.md` was 1256 lines, 495 of them a historical record.** The
Feature 008 Nisab migration procedure for a schema that shipped long ago. Moved to
`docs/archive/superseded/FEATURE_008_MIGRATION.md`; a current install doesn't need it
because the `migrations` service runs on `docker compose up`. The guide drops to
772 lines with a pointer left behind. Archived, not deleted — the rollback steps are
still correct for older deployments.

**Docs corrected to match the trap.** `QUICKSTART.md` promised `localhost:3000` after
telling users to run a script that may legitimately pick another port, and the manual
path carried no warning about the silent failure. Both now say what actually happens.

---

## 5. A correction I owe you

In an earlier commit this session I "fixed" `DEPLOY.md`'s description of how
`config.js` is produced, asserting it was only a checked-in source file. **I was
wrong; the original text was right.** Standing the stack up shows the frontend
container runs `docker/nginx-entrypoint.sh`, which writes
`/usr/share/nginx/html/config.js` at startup from `REACT_APP_*` env vars — which is
precisely why `docker-compose.yml` can set `REACT_APP_API_BASE_URL=/api` and change
it without a rebuild. Corrected again, properly this time. That is three times this
session that reading the repo alone produced a confident wrong answer that the
running system contradicted — worth stating plainly, because it changes how much
weight to give the docs versus a live run.

---

## 6. Recommendation, in order

1. **Document `deploy-easy.sh` as *the* install path** and demote raw
   `docker compose up` to "advanced", carrying the port-collision warning. Small
   docs change, removes #267's failure mode for good.
2. **Decide on cosign/SBOM** — implement or drop the claim. Recommend: implement
   later as its own task; drop the implication now.
3. **Leave the five deploy docs separate** but keep the routing map. Merging them
   loses troubleshooting content for no real gain.
4. **Optional, if you want `up` to fail loudly:** a port-conflict pre-check in the
   compose flow itself, so a raw `docker compose up` errors instead of half-starting.
   This is a behaviour change to the primary artifact — I'd want your call first.

Nothing here is a rewrite. The unified compose file that #267 asked for already
exists; the work left is making the docs point at the path that handles the edge
case, and closing or dropping one unfulfilled supply-chain promise.
