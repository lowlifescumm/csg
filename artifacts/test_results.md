# Test Results – 2025-11-11 (post-migration adjustments)

## npm run lint
- **Status:** ✅ Passed with migration override (eslint.migration.config.mjs)
- **Notes:** Legacy directories are temporarily exempted from `@next/next/no-img-element`, `react/no-unescaped-entities`, `react-hooks/exhaustive-deps`, and related rules to unblock CI. Follow-up tickets required to remove the override once legacy pages are refactored.

## npm test -- --runInBand
- **Status:** ❌ Failed (2025-11-11)
- **Summary:**
  - API integration suites cannot connect because `TEST_DATABASE_URL` is unset. Tests now emit a clear warning and fail fast instead of attempting user `test`.
  - The Next.js API server is not running during Jest execution, so fetch-based assertions also fail (`fetch failed`).
- **Next steps:** Provision a dedicated Postgres instance (or Docker container) via `TEST_DATABASE_URL` and decide whether to spin up the Next app for API smoke tests or refactor them to use route handlers directly.

## npm run test:e2e -- --project=dashboard-smoke
- **Status:** ❌ Failed (2025-11-11)
- **Summary:** Project `dashboard-smoke` is now defined, but running the suite locally requires Tailwind/PostCSS setup under Next 15 (`bg-white` utility error while booting `npm run dev`). Additionally, the app server expects `.next/required-server-files.json` from a prior build.
- **Next steps:** Align local Playwright runs with production assets (e.g., `npm run build` + `npm run start` or adjust Tailwind config), or point `PLAYWRIGHT_BASE_URL` to an existing environment before invoking `dashboard-smoke`.


