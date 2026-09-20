## What this changes

<!-- One or two sentences. What behaviour changes, and why. -->

## Why

<!-- The problem. Link the issue: Closes #123 -->

## How it was verified

<!-- Real commands and their real output. "Tests pass" is not evidence. -->

```
# e.g.
npm test --workspace=server
npx tsc --noEmit
```

## Checklist

- [ ] Tests added or updated for the behaviour changed
- [ ] `tsc --noEmit` is clean in every touched workspace
- [ ] No breaking change to stored data; migrations are additive-only
- [ ] If user-visible: noted in CHANGELOG
- [ ] No operational detail committed (hostnames, IPs, paths, personal emails)

## Migration / rollback

<!-- If this touches the schema or stored data, describe how to roll back.
     "None required" is a valid and expected answer — say so explicitly. -->
