---
name: verify-change
description: Selects and runs the smallest sufficient verification suite for the current diff; automatically includes Playwright for UI or browser behavior changes.
---
1. Inspect changed files and infer affected behavior.
2. Run focused tests first through `test-runner`.
3. Run configured lint/typecheck/build when affected.
4. For UI routes, components, styles, forms, browser storage, or API-backed user flows, invoke the `playwright-verify` skill and delegate final validation to `ui-verifier`.
5. Do not claim success without command evidence.
6. Report a compact matrix: check, command, result, evidence.
