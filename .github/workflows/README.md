# GitHub Actions Workflows - Temporarily Disabled

**Status**: All workflows disabled as of November 17, 2025

## Disabled Workflows

The following CI/CD workflows have been temporarily disabled by renaming them with `.disabled` extension:

1. `build.yml.disabled` - Build checks for Node 18.x and 20.x
2. `test.yml.disabled` - Test suite execution (18.x)
3. `lighthouse-ci.yml.disabled` - Lighthouse CI performance audits
4. `security-scan.yml.disabled` - Dependency vulnerability scanning and static code analysis
5. `staging-deployment.yml.disabled` - Quality gates for staging deployment

## Reason for Disabling

These workflows were disabled temporarily during Feature 009 UI/UX Redesign development to allow for rapid iteration and testing without CI/CD blocking pull requests.

## Re-enabling Workflows

To re-enable these workflows:

```bash
cd .github/workflows
for file in *.disabled; do mv "$file" "${file%.disabled}"; done
```

Or manually rename each file by removing the `.disabled` extension.

## Future Work

Before production deployment, these workflows should be:
- Re-enabled
- Updated to match current codebase
- Fixed to pass all checks
- Documented with clear failure resolution steps

---

**Modified in PR**: #209 - Feature 009: UI/UX Redesign
**Date**: November 17, 2025
