---
name: verify-change
description: Selects and runs the smallest sufficient verification suite for the current diff; automatically includes Playwright for UI or browser behavior changes.
---
1. Inspect changed files and infer affected behavior.
2. Run focused tests first through `test-runner`.
3. Run configured lint, typecheck, and build when affected. Run lint *early*, not
   at the end: several rules here are errors rather than warnings and can force a
   rewrite (see the gotchas in `CLAUDE.md`).
4. A check that prints nothing is not a check that passed. If a configured
   command exits 0 without running anything — a missing script, a skipped glob —
   treat it as a failed check and fix the command before continuing.
5. For UI routes, components, styles, forms, browser storage, or API-backed user
   flows, invoke the `playwright-verify` skill and delegate final validation to
   `ui-verifier`. For colour or contrast changes, add the token-level assertion
   (e.g. a contrast unit test) *before* the browser test.
6. Do not claim success without command evidence.
7. Report a compact matrix: check, command, result, evidence.
