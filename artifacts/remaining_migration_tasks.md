# Remaining Migration Tasks
**Generated:** 2025-11-12  
**Status:** Post-Production Deployment Analysis

## ✅ Completed Tasks

### Core Systems Restored
- ✅ **Monetization** - Credits purchase, subscriptions, Stripe webhooks
- ✅ **Admin Tooling** - User management, blog CMS, settings
- ✅ **Cron Jobs** - Forecasts, transits, horoscopes, cleanup
- ✅ **Account Recovery** - Password reset flow
- ✅ **Database Migration** - SQL applied to production
- ✅ **Production Validation** - All critical endpoints responding

### Infrastructure
- ✅ Jest isolated from Playwright
- ✅ Playwright config supports external testing
- ✅ Migration ESLint override configured
- ✅ Test database setup helper created

### UI Features Restored (2025-11-12)
- ✅ **Interactive Tarot Selector** - Integrated into DashboardV3, wired to "Tarot Reading" button
- ✅ **Help System** - Enabled with floating help button in DashboardV3
- ✅ **Journal Persistence** - Already fully implemented with DB storage, components wired

### Database Schema Fixes (2025-11-12)
- ✅ **is_primary columns** - Added to `birth_charts` and `natal_charts` tables
- ✅ **Compatibility API** - Fixed missing column errors in `/api/compatibility/top`
- ✅ **Horoscope API** - Fixed missing column errors in `/api/horoscope`
- ✅ **Element API** - Fixed missing column errors in `/api/element/today`

---

## 🔴 High Priority - Missing Features

### 1. **Interactive Tarot Card Selector** ✅ COMPLETE
- **Status:** ✅ Integrated into DashboardV3
- **Component:** `components/InteractiveTarotSelector.jsx`
- **API:** `/api/readings/create` functional
- **Implementation:** Wired to "Tarot Reading" button in Quick Actions
- **Completed:** 2025-11-12

### 2. **Help System** ✅ COMPLETE
- **Status:** ✅ Enabled in DashboardV3
- **Component:** `components/HelpSystem.jsx`
- **Implementation:** Floating help button with modal
- **Completed:** 2025-11-12

### 3. **Journal Persistence** ✅ COMPLETE
- **Status:** ✅ Already fully implemented
- **API:** `/api/journal` has DB storage with auto-table creation
- **Components:** ReadingHistory and CosmicBriefing already wired
- **Note:** Was incorrectly marked as stub - actually fully functional

### 4. **Birth Chart UI** ⚠️ RESTORE
- **Status:** Missing form (API exists)
- **API Ready:** `/api/birth-chart` functional
- **Old Location:** `app__disabled/_birth_chart_disabled/page.js`
- **Action Required:**
  - Copy form from disabled version or create new
  - Add Google Maps autocomplete for location
  - Wire to `/api/birth-chart` endpoint
- **Estimated Effort:** 4-6 hours
- **Risk Level:** Medium

---

## 🟡 Medium Priority - Partial Features

### 5. **AI Coach Page** ⚠️ RESTORE
- **Status:** Missing UI (API exists)
- **API Ready:** `/api/coach/daily` functional
- **Old Location:** `app__disabled/_coach_disabled/page.js`
- **Action Required:**
  - Restore `/coach` page from disabled version
  - Wire to `/api/coach/daily` endpoint
- **Estimated Effort:** 2-3 hours
- **Risk Level:** Medium

### 6. **Profile Management UI** ⚠️ VERIFY/COMPLETE
- **Status:** Route exists (`/app/profile/page.js`) but may be incomplete
- **API Ready:** `PUT /api/auth/user` supports updates
- **Action Required:**
  - Verify `/app/profile/page.js` is fully functional
  - Test profile edit and password change flows
  - Restore if missing functionality
- **Estimated Effort:** 2-4 hours
- **Risk Level:** Medium

### 7. **Forecasts UI** ⚠️ VERIFY
- **Status:** Backend restored, UI may need verification
- **Routes:** `/app/forecasts/page.js` and `/app/forecasts/settings/page.js` exist
- **Action Required:**
  - Verify forecast pages load correctly
  - Test forecast generation and preferences
  - Ensure dashboard integration works
- **Estimated Effort:** 1-2 hours
- **Risk Level:** Medium

### 8. **Transits UI** ⚠️ VERIFY
- **Status:** Backend restored, UI may need verification
- **Route:** `/app/transits/page.js` exists
- **Action Required:**
  - Verify transits page loads correctly
  - Test subscription and notification flows
  - Ensure dashboard integration works
- **Estimated Effort:** 1-2 hours
- **Risk Level:** Medium

### 9. **Rewards Claim Flow** ⚠️ WIRE UP
- **Status:** API exists, UI wiring incomplete
- **API Ready:** `/api/rewards/claim` functional
- **Action Required:**
  - Verify DashboardV3 reward widgets connect to API
  - Test claim action and idempotency
- **Estimated Effort:** 1-2 hours
- **Risk Level:** Medium

### 10. **Streak Display** ⚠️ VERIFY
- **Status:** API exists, display may be limited
- **API Ready:** `/api/streak` functional
- **Action Required:**
  - Verify DashboardHeader shows streak badges
  - Test zero-state and active streak displays
- **Estimated Effort:** 1 hour
- **Risk Level:** Low

---

## 🟢 Low Priority - Optional Features

### 11. **Contact Form**
- **Status:** Missing
- **Old Location:** `app__disabled/_contact_disabled/page.js`
- **Action Required:** Restore if user support channel needed
- **Estimated Effort:** 1-2 hours
- **Risk Level:** Low

### 12. **Image Upload**
- **Status:** Missing
- **Impact:** Cannot upload images for blog/profile
- **Action Required:** Restore `/api/upload/image` if blog CMS requires it
- **Estimated Effort:** 2-3 hours
- **Risk Level:** Low

### 13. **Tour/Onboarding Demo**
- **Status:** Disabled
- **Old Location:** `app__disabled/_tour_demo_disabled/page.js`
- **Action Required:** Restore if user feedback indicates need
- **Estimated Effort:** 2-3 hours
- **Risk Level:** Low

---

## 📋 Post-Migration Tasks

### Environment Configuration
- ⚠️ **Set DASHBOARD_V3=true** in Render environment variables (via UI)
- ⚠️ **Set DASHBOARD_V3_INVITE** (optional, for invite-based testing)
- ⚠️ **Redeploy** to apply environment variable changes

### Testing & Validation
- ⚠️ **Provision TEST_DATABASE_URL** for Jest API suites
- ⚠️ **Fix Tailwind/PostCSS config** for local Playwright runs (or use production URL)
- ⚠️ **Run full Playwright regression** against production once DASHBOARD_V3 is enabled

### Monitoring & Stabilization
- ⚠️ **Monitor production logs** for 72 hours
- ⚠️ **Freeze new feature commits** during stabilization
- ⚠️ **Plan lint/test cleanup** (remove migration ESLint overrides)

### Documentation
- ⚠️ **Update CHANGELOG.md** with migration completion
- ⚠️ **Create user-facing release notes** if needed
- ⚠️ **Document feature flag usage** for team

---

## 🎯 Recommended Priority Order

### Phase 1: Critical UI Features (Week 1)
1. Interactive Tarot Selector (High)
2. Help System (Medium - quick win)
3. Journal Persistence (Medium)

### Phase 2: User Experience (Week 2)
4. Birth Chart UI (Medium)
5. AI Coach Page (Medium)
6. Profile Management verification (Medium)

### Phase 3: Polish & Verification (Week 3)
7. Forecasts UI verification (Medium)
8. Transits UI verification (Medium)
9. Rewards/Streak wiring (Low)

### Phase 4: Optional Features (Backlog)
10. Contact Form (Low)
11. Image Upload (Low)
12. Tour/Onboarding (Low)

---

## 📊 Completion Status

| Category | Complete | Partial | Missing | Total |
|----------|----------|---------|---------|-------|
| **Backend APIs** | 18 | 2 | 0 | 20 |
| **UI Pages** | 12 | 3 | 5 | 20 |
| **Dashboard Components** | 8 | 2 | 2 | 12 |
| **Infrastructure** | 4 | 0 | 0 | 4 |
| **TOTAL** | **42** | **7** | **7** | **56** |

**Overall Progress:** ~75% complete (42/56 items)

---

## 🔍 Verification Checklist

Before marking migration complete:

- [ ] Interactive Tarot Selector functional
- [ ] Help System visible and accessible
- [ ] Journal entries persist to database
- [ ] Birth Chart form captures and displays data
- [ ] AI Coach page accessible
- [ ] Profile management fully functional
- [ ] Forecasts UI verified
- [ ] Transits UI verified
- [ ] DASHBOARD_V3 flag enabled in production
- [ ] All critical user flows tested end-to-end
- [ ] Production monitoring active
- [ ] Rollback plan documented and tested

---

**Next Immediate Action:** Enable DASHBOARD_V3 flag in Render and restore Interactive Tarot Selector to DashboardV3.

