# Playwright Smoke Test Script
# Tests against production with external server mode

$env:PLAYWRIGHT_BASE_URL = "https://cosmicspiritguide.com"
$env:PW_NO_SERVER = "1"

Write-Host "Running Playwright smoke tests against production..." -ForegroundColor Cyan
Write-Host "Base URL: $env:PLAYWRIGHT_BASE_URL" -ForegroundColor Gray

npm run test:e2e:smoke


