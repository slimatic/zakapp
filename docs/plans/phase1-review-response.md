# Phase 1 Peer Review Response

**Reviewer:** deepseek-v4.1-flash | **Verdict:** REQUEST_CHANGES | **Commit reviewed:** ba34002c
**Resolution commit:** see git log "review fixes"

| # | Severity | Finding | Disposition |
|---|----------|---------|-------------|
| 1 | blocker | Numeric primary-N/secondary-N scales deleted while ~101 usages remain; Tailwind 3 JIT silently drops unknown classes | Already self-caught + fixed in ef03caba (restored as fixed-hex legacy ramps) before review landed. Reviewer confirmed fix. |
| 2 | major | --input = --border (nearly invisible input borders); contract says border-strong | FIXED: Nur --input 41 21% 80%, Qamar 219 23% 29% |
| 3 | major | public/index.html still ships Google Fonts links; 'zero external requests' claim false | PARTIALLY REJECTED: dist/index.html verified 0 googleapis refs (vite uses root index.html; public/index.html is a dead CRA artifact, %PUBLIC_URL% proves it - never rendered). REAL issue accepted: donate.html shipped 2 refs -> fixed (3 link tags removed). Note added: public/index.html kept (has history, unused, harmless) |
| 4 | major | Un-layered .dark .btn-secondary keeps old turquoise; .dark .glass-* keeps glassmorphism | FIXED: retired the .dark overrides; @layer components rules own both themes |
| 5 | minor | @font-face unicode-range narrower than actual subset (euro, minus, arrows fall back) | FIXED: standard Google latin range applied x4 |
| 6 | minor | --secondary-foreground Nur = invented #EAF0EC, contract says white | FIXED: 0 0% 100% |
| 7 | minor | .btn-secondary hover:border-primary paints amber outside rationed slots | FIXED: dropped |
| 8 | minor | --text-3 below 4.5:1 in both themes | ACCEPTED as usage rule: text-3 restricted to disabled/decorative/duplicated help text; noted in DESIGN.md sweep gate (contrast table from review: amber CTA 5.02, forest/bone 11.78, gold/card 7.44, all pass) |
| 9 | nit | dark glass overrides conflict with glass retirement | Same as #4 - fixed |
| 10 | nit | donate.html external fonts | Same as #3 - fixed |

**Process note:** reviewer independently reproduced the grep counts (101 usages / 19 files) and validated the ef03caba fix. Blocker was caught by RIQ during visual smoke test before review returned - pair dynamic working as intended.
