# Branch Process — v1.0 development line and release isolation

**Status:** EXECUTED 2026-09-24 (Salim approved the push in chat).
**Current:** `develop` on origin, 54 commits ahead of `main`; `main` untouched at `d99df7a4`.
The push was preceded by a secret scan of the full 54-commit diff (no credentials; the only
literal is the smoke-test user ID, an identifier rather than a key). The blanket pre-push
block was replaced with a `main`-only block, verified by a dry-run push to `main`.

## The naming, settled

Two things were being conflated. Keep them separate:

| Term | What it is | In git |
|---|---|---|
| **Release branch** | The frozen line a release is cut from. Exists only when a release is actually happening. | `release/v0.17.0-anchor` (a real precedent in this repo) |
| **Holden branch** | The long-lived line that holds a big in-progress feature away from `main`. | does not exist yet — proposed name `develop` |

The existing local branch is doing the holden job already; only its *visibility* is missing.

## Why a holden branch does not help until it is pushed

A branch that has never left the machine protects nothing: there is no shared line to
keep work off, nobody else can review it, and "what is going into the release" cannot be
answered by anyone but this machine. **The push is the step that creates the holden
branch.** It is not the last step, it is the first.

Standing directive still applies: the push needs Salim's explicit in-chat approval.

## The finding that shapes the plan

The bug fixes on this branch are **not separable** from the redesign. Measured by
cherry-picking all 15 fix commits onto `origin/main` in a scratch worktree:

- **12 of 15 conflict.** Only three apply clean: the alert→toast change, the PDF theme,
  and the tabular-numerals change.
- Cause: the fixes use redesign-era tokens that **do not exist on `main`** —
  `--warn-strong`, `--border-strong`, `--surface-2`, `--success`, `--danger`, `--text-3`
  are all absent there.
- The a11y/contrast work **adjusts the Nur/Qamar token values themselves**, so it is
  inside the redesign, not beside it.

So the fixes are not "patches for the shipped version". They are work on the unshipped
v1.0 line. Porting them to `main` would be hand-rework, not a cherry-pick — worth doing
only if a specific bug is hurting production users badly enough to justify it.

## Proposed model

```
main     ──●──●──●──────────────●  (only via PR; production releases cut from here)
              \                /
develop        ●──●──●──●──●──●    v1.0 line; pushed, PR-reviewed, push-guard REMOVED
                                  (replaced by main-is-protected + PR-only discipline)
```

**Rules**

1. `develop` is the integration line for v1.0. `main` does not receive redesign work.
2. Every v1.0 change lands on `develop` first — commit locally, push freely, review on GitHub.
3. If `main` needs a production patch, branch `hotfix/<name>` **from `main`**, not from
   `develop`, and merge back to `main` by PR. Keep it small and independent of the
   tokens above, or it will not cherry-pick.
4. `develop` merges into `main` only at release, via PR, when Salim approves.
5. A release being cut gets `release/vX.Y.Z` from the appropriate tip, as v0.17.0 did.

**Cadence with the existing lunar process:** the lunar anchor still decides *when* a
release happens; `develop` decides *what* goes into it. A v1.0 release is a major bump,
so it rides the lunar cycle like any other — it just draws from `develop` instead of
`main`.

## The push-guard has to change

`.git/hooks/pre-push` currently blocks **all** pushes. Once pushed, a blunt block becomes
the wrong tool: it prevents the branch from being backed up or reviewed. Replace it with a
guard that blocks **pushing the design line to `main`** while allowing `develop`:

```bash
#!/bin/bash
# Block accidental pushes of the v1.0 line straight to main.
while read -r _local _local_sha remote remote_sha; do
  if [ "$remote" = "refs/heads/main" ]; then
    echo "BLOCKED: $remote is protected. Open a PR from develop instead."
    exit 1
  fi
done
exit 0
```

The real protection is the GitHub branch protection rule already on `main` (PR + green
CI required) — the hook is a local convenience, not the guarantee.

## Open decisions for Salim

1. Push `feature/v1-design-overhaul` to a new `develop` now? (main untouched)
2. Rename it to `develop` first, or push as-is?
3. Port the three cleanly-portable fixes to `main` as a v0.17.x patch for production
   users now, or ship everything together as v1.0?
