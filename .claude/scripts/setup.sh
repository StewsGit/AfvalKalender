#!/usr/bin/env bash
set -euo pipefail
if [[ ! -f package.json ]]; then echo 'No package.json; configure project.config.json manually.'; exit 0; fi
npm ls @playwright/test >/dev/null 2>&1 || npm install --save-dev @playwright/test
npx playwright install chromium
mkdir -p tests/e2e docs/retrospectives
chmod +x .claude/scripts/*.sh
echo 'Setup complete. Review dev URL and commands.'
