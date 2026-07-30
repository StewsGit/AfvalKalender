---
name: playwright-verify
description: Launches or reuses the development server and iteratively validates changed browser behavior with Playwright. Use automatically for UI, navigation, forms, responsive layout, browser storage, or visual regressions.
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---
Read `.claude/project.config.json`.

- Confirm Playwright is installed; use `npx playwright install chromium` only if needed.
- Prefer existing E2E fixtures and page objects.
- Add or update the smallest stable test under the project's E2E directory.
- Use role/label/test-id locators; avoid brittle CSS and sleeps.
- Start the configured dev server or rely on Playwright `webServer`.
- Iterate: run focused spec → inspect trace/screenshot/console → fix cause → rerun.
- Check console errors, failed requests, primary happy path, one failure path, and responsive behavior when relevant.
- Never approve snapshots blindly. Keep traces/screenshots only for failures unless the project requires baselines.
- End by running the changed spec at least once from a clean browser context.
