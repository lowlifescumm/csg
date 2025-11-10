{"total_features":25,"complete":3,"partial":6,"missing":16,"blockers":9}

## Executive Summary
The new `dashboard-v2-scaffold` branch modernizes the dashboard visuals but drops or stubs the majority of production functionality. Core monetization (Stripe credit packs, subscriptions, compatibility upsells), admin tooling, scheduled cron endpoints, and recovery flows were removed. Until those gaps are closed, the branch cannot replace the legacy dashboard. This plan catalogs all regressions, prescribes concrete migration tasks, and provides the scripts, tests, and rollout safeguards required to restore parity without introducing new feature scope.

## Key Artifacts
- Inventory (JSON): `artifacts/inventory.json`
- Feature parity matrix (CSV): `artifacts/feature_parity.csv`
- Schema migration helper (SQL): `artifacts/sql/dashboard_migration.sql`
- Ticket backlog (CSV): `artifacts/tickets.csv`

### Artifact Health Check – 2025-11-10
| Artifact | Status | Notes |
| --- | --- | --- |
| `artifacts/inventory.json` | ✅ OK | Parsed successfully (JSON) |
| `artifacts/feature_parity.csv` | ✅ OK | CSV header intact |
| `artifacts/sql/dashboard_migration.sql` | ✅ OK | Non-empty SQL script present |
| `artifacts/tickets.csv` | ✅ OK | CSV header intact |

No artifacts are missing or corrupted as of the latest verification (2025-11-10 15:05 UTC). Any newly generated files (e.g., `artifacts/test_results.md`, `artifacts/staging_issues.csv`) will be tracked separately during activation.

## Answered Questions
- **UI → API dependencies / missing endpoints:** Full list in `artifacts/inventory.json` (`endpoints` array). Missing high-risk APIs include `/api/credits/purchase`, `/api/stripe`, `/api/cron/*`, `/api/auth/forgot-password`, `/api/readings/create`, `/api/compatibility`, `/api/upload/image`, `/api/blog/*`, `/api/admin/*`.
- **Environment variables / secrets to migrate:** `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_DIM`, `PINECONE_METRIC`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `CRON_SECRET`, `CLOUDINARY_URL` (or component vars), `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- **Assets to copy to new pipeline/CDN:** Legacy marketing/blog assets and tarot card imagery stored under `app__disabled` and `public/`. Immediate parity requires restoring `public/google-icon.svg`, blog hero images, and any Cloudinary media referenced by blog posts plus the original onboarding graphics (`app__disabled/_tour_demo_disabled`).
- **Hard-coded URLs / config that will break:** Cron definitions in `render.yaml` still target `/api/cron/transit-monitor` and `/api/cron/generate-forecasts` (removed). Payment flows hard-code `NEXT_PUBLIC_BASE_URL` for success URLs. QA docs reference `/credits` and `/subscription` pages that no longer exist. Update all before cutover.
- **Deprecated/security concerns needing remediation:** No critical CVEs surfaced, but reliance on deprecated REST endpoints (Stripe v10 style) should be migrated to Stripe Checkout Sessions. Any remediation beyond migration scope (e.g., refreshing OpenAI client) is deferred to the post-migration backlog.

## Inventory Snapshot
- **APIs:** 61 legacy endpoints vs 23 implemented; 18 blockers are missing. See `artifacts/endpoints_inventory.json`.
- **UI routes:** 21 legacy pages; only `login`, `dashboard`, `debug` ported. All admin, commerce, and marketing pages absent.
- **Database:** `artifacts/database_tables.json` lists 26 required tables. The new branch exercises columns (`credit_type`, `expires_at`, `referral_code`) that may not be present in older Render databases—covered by the migration SQL.
- **Cron jobs:** Both Render cron targets 404. Recreate endpoints or disable jobs until migration complete.
- **Integrations:** Stripe, Cloudinary, Resend, Pinecone, OpenAI and Google OAuth all require secrets restored and unused code re-enabled.

## Feature Parity Overview
- 3 features at parity (`/api/readings/generate`, reading history, favorites).
- 6 partial features (email login, Google OAuth, dashboard shell, credits balance, rewards, streak).
- 16 missing features (password reset, tarot selector, payments, subscriptions, forecasts, transits, compatibility, birth-chart UI, blog, admin, contact, uploads, cron, journal persistence, profile management, etc.).
- 9 high-risk blockers (Stripe monetization, cron jobs, compatibility, admin, password reset, tarot selector, forecasts, transits).
See `artifacts/feature_parity.csv` for full matrix and acceptance criteria.

## Gap Analysis & Remediation Plan
### Business-Critical (High Risk)
1. **Password reset & recovery**
   - Reintroduce `/api/auth/forgot-password` and `/api/auth/reset-password` (copy from `app__disabled/api/auth/*`).
   - Restore reset UI `app/reset-password/page.js` with Resend integration.
   - Add integration tests around token lifecycle.
2. **Tarot manual selector & readings create**
   - Re-enable `InteractiveTarotSelector` component from legacy (under `components/InteractiveTarotSelector.jsx`).
   - Restore `/api/readings/create` endpoint; wire Dashboard CTA back to modal.
   - Update `DashboardV3/TarotCard` to open the selector.
3. **Stripe monetization (credits & subscriptions)**
   - Ports `/api/credits/purchase`, `/api/create-payment-intent`, `/api/stripe`, `/api/stripe-webhook`.
   - Rebuild `/credits` and `/subscription` pages with CTA hooks.
   - Validate billing redirect tests (`__tests__/unit/billing-redirect.test.js`, Playwright flows).
4. **Compatibility purchase flow**
   - Restore `/compatibility` UI and `/api/compatibility` + payment endpoints.
   - Ensure compatibility reports saved & downloadable.
5. **Forecast & transit services**
   - Reinstate `/api/forecasts*`, `/api/transits*`, `/api/cron/*`.
   - Rebuild `/forecasts`, `/transits`, `/coach` dashboards.
   - Add scheduler smoke tests (curl endpoints) and monitoring.
6. **Admin console & blog CMS**
   - Bring back `/admin/**` pages with RBAC.
   - Restore `/api/admin/*` and `/api/blog/*`; re-enable blog public routes.
7. **Cron infrastructure**
   - Update `render.yaml` to point cron jobs at restored endpoints.
   - Add health checks & alerting around cron success.
8. **Journal persistence**
   - Replace stubbed `/api/journal` with legacy implementation writing to `journal_entries`.
   - Ensure Dashboard actions surface save-to-journal.
9. **Profile management**
   - Reintroduce `/profile` UI leveraging existing `PUT /api/auth/user`.

### Medium Priority
- Credits daily refresh UI/notifications.
- Birth chart UI + Google Maps autocomplete.
- Rewards claim UX & gating.
- Streak badge visuals.
- Contact form + marketing landing page.

### Low Priority
- Cosmetic toggles, blog view counts, onboarding tour animations (defer until after parity unless required by marketing).

For each entry, concrete code references are listed in `artifacts/inventory.json` (`ui_pages`, `branch_changes`) and `artifacts/feature_parity.csv`.

## Migration Milestones & Tasks
### Milestone 1 – Baseline & Build Stability
- **Owner:** `frontend-build`
- **Tasks:** remove `.next` artifacts (done), ensure `npm ci` deterministic, re-run `npm run lint`, `npm test`, `npm run test:e2e -- --grep "@smoke"` after restoring APIs.
- **Tests:** lint, unit, targeted Playwright smoke.
- **Artifacts:** Updated `CHANGELOG.md`, lint/test reports.
- **Guardrails:** do not bump Next.js or introduce new design changes.

### Milestone 2 – Backend API Parity
- **Owner:** `backend-core`
- **Tasks:** restore monetization, compatibility, cron, upload, password reset endpoints; add feature flags for phased rollout.
- **Tests:** `npm test -- __tests__/api`, Postman smoke on restored endpoints.
- **Artifacts:** API changelog, Postman collection, updated env docs.
- **Guardrails:** no new API surface area beyond legacy behavior.

### Milestone 3 – UI & Experience Parity
- **Owner:** `frontend-experience`
- **Tasks:** port legacy pages under `/app__disabled` into modern layout (`/birth-chart`, `/credits`, `/compatibility`, `/subscription`, `/blog`, `/admin`); rewire navigation.
- **Tests:** Playwright flows (login→purchase, compatibility, admin).
- **Artifacts:** Storybook snapshots/screenshots, UX sign-off.
- **Guardrails:** any visual polish beyond parity gets deferred.

### Milestone 4 – Data & Admin Enablement
- **Owner:** `platform-data`
- **Tasks:** run `artifacts/sql/dashboard_migration.sql`, verify schema, backfill referral codes, seed admin roles.
- **Tests:** Verification queries in staging, DB diff report.
- **Artifacts:** Migration runbook, rollback plan, DB snapshots.
- **Guardrails:** no destructive migrations without backups.

### Staging Rehearsal – 2025-11-10
- **Deploy:** Pending – requires Render staging credentials to provision the `dashboard-v2-scaffold` build as green environment.
- **DB Snapshot:** Pending – staging database snapshot + `artifacts/sql/dashboard_migration.sql` application blocked until access granted.
- **Schema Helper:** Pending – schema parity tool ready but not executed.
- **Smoke:** Playwright suite not run against staging (local config only exposes `chromium` project; `dashboard-smoke` profile missing). See `artifacts/test_results.md`.
- **Next Steps:** Coordinate with DevOps to schedule staging deploy window, add Playwright smoke profile for staging, and capture output in `artifacts/staging_issues.csv`.

### Milestone 5 – QA, Monitoring, Release Prep
- **Owner:** `qa-release`
- **Tasks:** Rebuild regression suite, add cron/Stripe monitoring, finalize CHANGELOG, rehearse blue/green cutover and rollback.
- **Tests:** Full Playwright regression, load tests for key APIs.
- **Artifacts:** Updated QA checklist, monitoring dashboards, incident playbook.
- **Guardrails:** no feature work; only bug fixes tied to parity.

### Milestone 6 – Cutover & Rollback Readiness
- **Owner:** `release-manager`
- **Tasks:** Enable feature flags, execute staged rollout, monitor KPIs, communicate status, keep old dashboard hot for rollback.
- **Tests:** Staging smoke, canary user validation, log/alert review.
- **Artifacts:** Go-live checklist, comms log, rollback confirmation.
- **Guardrails:** freeze on new deployments unrelated to migration.

## Smoke Test Commands
- Lint: `npm run lint`
- Unit/API: `npm test -- --runInBand`
- Playwright smoke: `npx playwright test __tests__/e2e --grep \"@smoke\"`
- API health: `pnpm ts-node scripts/test-nextauth-route.js` (or equivalent) plus curl of `/api/credits`, `/api/forecasts`.

## Cutover Strategy
- **Recommended:** Blue/green deploy with feature flag guard.
  - *Pros:* Allows production validation with real traffic, instant rollback by DNS/route swap, compatible with Render via separate service (`dashboard-v2`).
  - *Cons:* Doubles infrastructure cost during migration; requires syncing database schema ahead of time.
- Alternative: Feature-flagged single deploy (less infra, but harder rollback) or branch-based switch (fast but risky). Blue/green is safest given breadth of changes.

## Data Migration Plan
1. Apply `artifacts/sql/dashboard_migration.sql` in staging, then production (with transaction).
2. Verification queries:
   - `SELECT credit_type, expires_at FROM credits LIMIT 5;`
   - `SELECT count(*) FROM referral_redemptions;`
   - `SELECT table_name FROM information_schema.tables WHERE table_name IN ('blog_posts','transits');`
3. Idempotence: all statements guarded with `IF NOT EXISTS`.
4. Back-out: take pre-migration snapshot (Render Postgres point-in-time restore) and rollback by restoring snapshot or dropping newly added tables if needed.

## CI/CD, Build, and Infra Updates
- Update pipeline to run lint + unit + Playwright on PRs; enforce `npm ci`.
- Reconfigure Render `render.yaml`:
  - Add environment variables above.
  - Update cron commands to restored endpoints.
  - Create blue/green preview service for cutover.
- Docker image/tag updates not required (still Next 15) but ensure base image pinned.
- Monitoring: add alerts on Stripe webhook failures, cron 500s, auth error rates.

## Automated Tests & Verification
- **Unit tests:** Restore coverage for Stripe handlers, compatibility service, password reset (`__tests__/unit/*`).
- **API tests:** Expand Jest suites for `/api/cron/*`, `/api/blog/*`, `/api/admin/*`.
- **E2E:** Update Playwright specs for credits purchase, subscription upgrade, compatibility flow, admin RBAC.
- **Test data:** Seed admin user, premium subscriber, free user with credits via SQL helpers.
- **Local smoke:** `npm run dev`, hit critical routes; run `scripts/test-nextauth-route.js`, `scripts/run-credit-model-migration.js --dry-run`.
- **Staging smoke:** Execute Playwright smoke against staging base URL using `PWTEST_BASE_URL`.

## Risk Register
| # | Risk | Impact | Mitigation & Tests |
|---|------|--------|--------------------|
| 1 | Stripe callbacks fail | Revenue loss | Restore webhook endpoint, add replay + Playwright billing test |
| 2 | Cron jobs 404 | Forecast/transit stale | Reinstate endpoints, monitor cron logs, run manual curl pre-cutover |
| 3 | Auth regression | Users locked out | Regression tests for login/reset, monitor 401/500 rates |
| 4 | Missing data columns | API errors | Run migration SQL, verification queries, add DB smoke script |
| 5 | OAuth misconfig | Google sign-in fails | Validate env vars, run `scripts/test-google-oauth-config.js` |
| 6 | Blog/admin access control | Data exposure | Reinstate RBAC middleware, add admin Playwright tests |
| 7 | Tarot selector bugs | Broken core experience | Unit test `InteractiveTarotSelector`, manual QA script |
| 8 | Forecast generation latency | User churn | Add job metrics, cache warmers, load test forecast endpoints |
| 9 | Journal data loss | User trust | Implement journal persistence, add integration tests |
|10 | Rollback delays | Prolonged outage | Prepare snapshot + rollback script, rehearse ahead of cutover |

## Rollback Plan
1. Keep legacy dashboard service running behind feature flag/alternate URL.
2. If parity issues detected, redirect traffic back to legacy (DNS swap or toggle feature flag).
3. Revert Render deploy to previous image/build.
4. Restore Postgres snapshot taken pre-cutover if schema/data compromised.
5. Disable new cron jobs and Stripe webhook endpoints until fixed.
6. Communicate rollback status to stakeholders and schedule post-mortem.

## Communication Plan
- **Stakeholders:** Product owner, engineering leads, support, marketing, infra/DevOps.
- **Milestone updates:** Send weekly email/Slack summary (owner, status, blockers).
- **Go/no-go meeting:** 48h before cutover, include QA sign-off and migration checklist.
- **Incident template:** 
  - Subject: `[Incident][Dashboard Migration] <summary>`
  - Body: impact, start time, mitigation steps, ETA, next update.
- **Support enablement:** Provide FAQ and rollback notice template for customer support.

## Ticket Backlog
- Import `artifacts/tickets.csv` into Jira/GitHub; tickets align with gap analysis and milestone owners.

## Next Steps
1. Groom tickets with estimates/owners.
2. Schedule schema migration dry run in staging.
3. Begin Milestone 2 workstream (restore APIs) while UX ports pages (Milestone 3).
4. Update `CHANGELOG.md` alongside each merge.


