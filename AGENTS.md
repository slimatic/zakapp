# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Workflow Rules

**1. STARTING WORK:**
   - **Always** create a new branch for your task.
   - **Naming Convention:** `feature/<issue-id>-<slug>` (e.g., `feature/zakapp-123-update-login`).
   - **Never** commit directly to `main`.

   ```bash
   bd update <id> --status in_progress
   git checkout -b feature/<id>-short-description
   ```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work (only if PR is merged) or keep in_progress
4. **PUSH & PR** - This is MANDATORY:
   ```bash
   bd sync
   git add .
   git commit -m "feat: description (zakapp-xxx)"
   git push -u origin HEAD
   gh pr create --fill  # Create PR
   ```
5. **Clean up** - Clear stashes
6. **Verify** - PR is created and checks are running

**CRITICAL RULES:**
- **NO DIRECT PUSHES TO MAIN.** Always use a PR.
- Work is NOT complete until the PR is created (or updated).
- If you have permissions and the task is complete, merge the PR: `gh pr merge --squash --delete-branch`.


## Quality Assurance and Branch Protection

**MANDATORY QUALITY GATES:**
- All PRs to `main` **MUST** pass CI checks before merging
- Required status checks: `Test` and `Build and Push Docker Images to Docker Hub`
- At least 1 approving review required for PR merge
- Direct pushes to `main` are **BLOCKED** - all changes must go through PRs

**ENFORCEMENT:**
- GitHub branch protection rules are configured to prevent merging failing PRs
- Automated checks will block merges if tests fail or builds break
- This prevents issues like the v0.9.2 release where LSP failures were merged

**IF TESTS FAIL:**
1. Fix the failing tests/code
2. Commit and push to your branch
3. Wait for CI to pass
4. Request re-review if needed
5. Merge only after all checks pass

