# Test Results – 2025-11-10

## npm run lint
- **Status:** ❌ Failed (2025-11-10)
- **Summary:** Restored admin/blog/forecast modules inherit existing ESLint violations:
  - `react/no-unescaped-entities` in `app/blog/[slug]/page.js`, `app__disabled/page.js`, `_transits_disabled/page.js`, `_forecasts_disabled/page.js` due to apostrophes.
  - `react-hooks/exhaustive-deps` warnings across admin/blog pages (`fetchPost`, `fetchStats`, etc.).
  - Numerous `@next/next/no-img-element` warnings for legacy `<img>` usage.
- **Notes:** These issues pre-date the migration activation work; remediation requires either updating legacy components to `next/image` / `useCallback`, or relaxing lint rules for the migration window.

## npm test -- --runInBand
- **Status:** ❌ Failed (2025-11-10)
- **Summary:** 
  - API suites (`__tests__/api/auth.test.js`, `__tests__/api/credits.test.js`) crash due to missing Postgres test database (`password authentication failed for user "test"`).
  - All Playwright specs that live under `__tests__/e2e`/`__tests__/a11y` are being executed by Jest and throw `Playwright Test needs to be invoked via 'npx playwright test'`.
- **Notes:** Need dedicated test database credentials (or mocked DB layer) and Jest configuration excluding Playwright suites (move to separate directory or adjust `testMatch`).

## npm run test:e2e -- --project=dashboard-smoke
- **Status:** ❌ Failed (2025-11-10)
- **Summary:** Playwright reports `Project(s) "dashboard-smoke" not found. Available projects: "chromium"`.
- **Notes:** Define a `dashboard-smoke` project in `playwright.config.js` or invoke the smoke suite using the existing `chromium` configuration.


