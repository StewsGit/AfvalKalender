---
name: playwright-verify
description: Launches or reuses the development server and iteratively validates changed browser behavior with Playwright. Use automatically for UI, navigation, forms, responsive layout, browser storage, or visual regressions.
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---
Read `.claude/project.config.json`.

## Preflight (always, before the first run)

Run `commands.e2ePrepare` unconditionally. It is idempotent and near-instant when
the browser is already present; skipping it is what makes the first e2e run of a
session fail with `Executable doesn't exist`. A missing browser is never a reason
to skip e2e — the Definition of Done requires it for UI changes.

The dev server is shared. `devServer.reuseExisting` is true and Playwright's
`webServer` reuses whatever already listens on the configured port. Never start a
second dev server, and never move the suite to another port.

## Writing the test

- Prefer existing E2E fixtures and page objects; add or update the smallest
  stable test under the project's E2E directory.
- Use role/label/test-id locators; avoid brittle CSS and sleeps.
- Assert the user-visible contract, not the mechanism. A test that only proves a
  value *changed* stays green while the result is unusable — the accent-colour
  work shipped an orange hero at 4.06:1 with a passing e2e suite. For visual
  changes, assert the contract (contrast ratio, readable text, correct token) and
  write the cheap version of that assertion as a unit test over the tokens
  *before* the browser test.
- Cover: primary happy path, one failure path, console errors, failed requests,
  and responsive behaviour when the change touches layout.

## Running and diagnosing

- Run the single changed spec first (`commands.e2eSingle`), then the suite.
- Keep `workers: 1`. This project's Vite dev server drops requests when several
  workers hit it cold, which surfaces as timeouts rather than assertion failures.
  The suite takes ~13s serially. Never raise `workers` or enable `fullyParallel`
  to make it "faster".
- **Classify every failure before changing any code.** Infrastructure failure —
  timeout, `net::ERR_CONNECTION_REFUSED`, `Executable doesn't exist`, server not
  ready — means the harness is wrong, not the product. Re-run that one spec
  serially from a clean context and fix the harness. Only a genuine assertion
  failure justifies touching production code.
- Iterate: run focused spec → inspect trace/screenshot/console → fix the cause →
  rerun.
- Never approve snapshots blindly. Keep traces and screenshots only for failures
  unless the project requires baselines.
- End by running the changed spec at least once from a clean browser context.

Report the exact commands, specs, and selectors used, and state plainly whether
any failure was infrastructure or product.
