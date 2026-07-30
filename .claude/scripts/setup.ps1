$ErrorActionPreference = 'Stop'
if (-not (Test-Path package.json)) {
  Write-Warning 'No package.json found; configure commands manually in .claude/project.config.json.'
  exit 0
}
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
if (-not $pkg.devDependencies.'@playwright/test') {
  npm install --save-dev @playwright/test
}
npx playwright install chromium
if (-not (Test-Path playwright.config.ts)) {
@'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
'@ | Set-Content playwright.config.ts
}
New-Item -ItemType Directory -Force tests/e2e, docs/retrospectives | Out-Null
Write-Output 'Setup complete. Review dev URL and commands in .claude/project.config.json and playwright.config.ts.'
