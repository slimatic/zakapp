# ZakApp Documentation

One index. Every live document is listed here, and `check-docs-index.py` fails the build if
one is not reachable from this page or from the repository README.

## Which guide do I want?

Five documents describe deployment. Pick by what you are trying to do:

| I want to… | Read |
|---|---|
| Get it running on my own machine, fastest path | [EASY-DEPLOY.md](../EASY-DEPLOY.md) — one script, auto-HTTPS |
| The short version, 3 commands | [QUICKSTART.md](../QUICKSTART.md) |
| Run it on a real server with a domain | [SELF-HOSTING.md](../SELF-HOSTING.md) |
| Understand the production architecture | [DEPLOY.md](../DEPLOY.md) |
| Full reference: env vars, backups, rollback | [deployment-guide.md](deployment-guide.md) |

For developers rather than operators: [CONTRIBUTING.md](../CONTRIBUTING.md),
[AGENTS.md](../AGENTS.md), and [testing.md](testing.md).

## Architecture and security

- [ARCHITECTURE.md](ARCHITECTURE.md) — local-first model, encryption flow, stack, accessibility.
- [ZERO_KNOWLEDGE_ARCHITECTURE.md](ZERO_KNOWLEDGE_ARCHITECTURE.md) — the threat model behind it.
- [PUBLIC-PRIVATE-BOUNDARY.md](PUBLIC-PRIVATE-BOUNDARY.md) — what may never appear in this public repo.
- [principles.md](principles.md) — the product principles the code is measured against.
- [../SECURITY.md](../SECURITY.md) — the implemented security model and how to report a problem.
- [../PRIVACY.md](../PRIVACY.md) — what is stored, where, and for how long.

## Using the app

- [user-guide/choosing-methodology.md](user-guide/choosing-methodology.md) — picking a school and what changes.
- [user-guide/nisab-year-records.md](user-guide/nisab-year-records.md) — hawl, nisab, payments.
- [user-guide/tracking.md](user-guide/tracking.md) — history, analytics, export.
- [pwa-guide.md](pwa-guide.md) — install, offline behaviour, push and VAPID.
- [CURRENCY-DISPLAY-RULE.md](CURRENCY-DISPLAY-RULE.md) — the one rule for formatting money.
- [troubleshooting-faq.md](troubleshooting-faq.md) — runtime and operator breakage.
- [../FAQs.md](../FAQs.md) — zakat and fiqh questions.

## API

- [api/openapi.yaml](api/openapi.yaml) — the REST contract.
- [api/api-specification.md](api/api-specification.md) — narrative walkthrough: auth, assets, zakat, data.
- [api/zakat.md](api/zakat.md) — worked `curl` example for `POST /api/zakat/calculate`.
- [api/tracking.md](api/tracking.md) — `/api/tracking`, not yet in the OpenAPI file.
- [api/nisab-year-records.md](api/nisab-year-records.md) — `/api/nisab-year-records`, not yet in the OpenAPI file.

## Operations

- [deployment-guide.md](deployment-guide.md) — env, backups, rollback, reverse proxy.
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) — every variable, both projects. The only env prose doc.
- [UPGRADING.md](UPGRADING.md) — migrations, `P3005`, rollback.
- [RELEASE-CADENCE.md](RELEASE-CADENCE.md) — lunar cadence and the release-day procedure.
- [NGINX-PROXY-MANAGER.md](NGINX-PROXY-MANAGER.md) — running the stack behind a reverse proxy.
- [guides/CLOUDFLARE_TUNNEL_SETUP.md](guides/CLOUDFLARE_TUNNEL_SETUP.md) — Cloudflare Tunnel, quick path first.
- [guides/CI-CD-SETUP.md](guides/CI-CD-SETUP.md) — what the three workflows do.
- [guides/PORT_CONFIGURATION.md](guides/PORT_CONFIGURATION.md) — ports, conflicts, LAN access.
- [guides/DEVELOPMENT-NETWORK-ACCESS.md](guides/DEVELOPMENT-NETWORK-ACCESS.md) — reaching a dev server from a phone.
- [guides/DATABASE_PORTABILITY_GUIDE.md](guides/DATABASE_PORTABILITY_GUIDE.md) — SQLite ↔ Postgres.

## Development

- [testing.md](testing.md) — suite layout, test database, how to run it.
- [dev/calendar-system.md](dev/calendar-system.md) — Hijri conversion internals.
- [user-stories.md](user-stories.md) — feature requirements and acceptance criteria.
- [../AGENTS.md](../AGENTS.md) — repository map and the commands CI runs.
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — setup, workflow, PR rules.

## Fiqh research

- [methodology-guide.md](methodology-guide.md) — how each madhhab is calculated.
- [zakat-calculation-methodologies-research.md](zakat-calculation-methodologies-research.md) — the research behind the rule-sets.
- [zakat-research-bibliography.md](zakat-research-bibliography.md) — the sources cited.
- [plans/methodology-audit-2026-09-25.md](plans/methodology-audit-2026-09-25.md) — open fiqh decisions.
- [plans/2026-09-04-madhab-ruling-transparency.md](plans/2026-09-04-madhab-ruling-transparency.md) — transparency plan.
- [superpowers/specs/2026-09-04-madhab-ruling-transparency-design.md](superpowers/specs/2026-09-04-madhab-ruling-transparency-design.md) — its design.

## Project records

- [../ROADMAP.md](../ROADMAP.md) — the single roadmap: shipped and open decisions.
- [../CHANGELOG.md](../CHANGELOG.md) — what changed in each release.
- [release-notes/v1.0.md](release-notes/v1.0.md), [release-notes/v1.0-audit.md](release-notes/v1.0-audit.md) — frozen release records.
- [audit/migration-safety-v0.11.0.md](audit/migration-safety-v0.11.0.md) — the `P3005` evidence `UPGRADING.md` cites.
- [agent-scaffolding-retired.md](agent-scaffolding-retired.md) — what the retired planning trees held.
- [archive/README.md](archive/README.md) — superseded documents, kept for provenance only.

## Contributing to documentation

1. **One home per topic.** If a document already covers it, extend that document.
2. **List it here.** A live document that is not reachable from this index fails CI.
3. **Archive, don't accumulate.** Superseded work moves to `docs/archive/superseded/` with a row in
   [archive/README.md](archive/README.md); git history is the record.
4. **Keep it short and specific.** A paragraph and an example beat a page of prose.
5. **Quote no secrets.** Examples use placeholders; `.env.example` is the only template that
   carries values, and they are fake.

## Need help?

- Issues: <https://github.com/slimatic/zakapp/issues>
- Security: [../SECURITY.md](../SECURITY.md)
