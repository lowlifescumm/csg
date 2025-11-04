# QA Testing Guide - Dashboard V2

## Quick Start

### 1. Enable Dashboard V2
Navigate to: `http://localhost:5000/dashboard?dashboard_v2=true`

Or set environment variable:
```bash
NEXT_PUBLIC_DASHBOARD_V2=true
```

### 2. Run Tests

**Unit Tests:**
```bash
npm test -- __tests__/unit/
```

**E2E Tests:**
```bash
npm run test:e2e
```

**All Tests:**
```bash
npm test
```

## Test Results Summary

### ✅ Passing Tests
- **Streak Tracking** (6/6 tests passing)
- **Reading Generation** (7/7 tests passing)
- **Credit Deduction** (4/6 tests passing - 2 need fixes)
- **Billing Redirect** (5/6 tests passing - 1 needs fix)

### Test Coverage Areas

1. **Streak Tracking** ✅
   - Daily login increment
   - Consecutive day increments
   - Streak reset on gap
   - Same-day login prevention
   - API endpoint responses

2. **Credit Deduction** ⚠️ (2 tests need fixes)
   - Basic tarot reading (1 credit)
   - Premium tarot reading (2 credits)
   - Insufficient credits handling
   - Credit balance updates (needs fix)
   - Negative balance prevention (needs fix)

3. **Reading Generation** ✅
   - Successful generation
   - OpenAI API failure fallback
   - Database save failure handling
   - Network timeout handling
   - Reading validation

4. **Billing Redirect** ⚠️ (1 test needs fix)
   - Upgrade button click
   - Stripe checkout session creation (needs fix)
   - Existing customer handling
   - Error handling

## Manual QA Checklist

### Core Flows to Test

#### 1. Streak Tracking
- [ ] Login and verify streak increments
- [ ] Check streak displays in HeroHeader
- [ ] Verify streak persists across sessions
- [ ] Test streak reset after gap

#### 2. Credit Deduction
- [ ] Generate a basic tarot reading (should deduct 1 credit)
- [ ] Generate a premium reading (should deduct 2 credits)
- [ ] Verify credits update in UI after reading
- [ ] Test insufficient credits error message
- [ ] Verify credits don't go negative

#### 3. Reading Generation
- [ ] Generate reading from FocusGrid tile
- [ ] Verify reading result modal appears
- [ ] Check reading is saved to history
- [ ] Test error handling (API failure)
- [ ] Verify loading states

#### 4. Billing/Checkout
- [ ] Click "Upgrade to Premium" button
- [ ] Verify Stripe checkout session is created
- [ ] Test with existing customer
- [ ] Test error handling
- [ ] Verify redirect to checkout URL

### Component Testing

#### HeroHeader
- [ ] Displays greeting correctly
- [ ] Shows moon phase widget
- [ ] Displays credits balance
- [ ] Shows streak counter
- [ ] Upgrade button works

#### FocusGrid
- [ ] All tiles visible
- [ ] Clicking tile generates reading
- [ ] Loading state displays
- [ ] Error handling works

#### CosmicBriefing
- [ ] Sign selector works
- [ ] Briefing message loads
- [ ] "Generate Guided Reading" works
- [ ] "Save to Journal" works

#### DailyTasks
- [ ] Tasks display correctly
- [ ] Completing task awards XP
- [ ] Progress bar updates
- [ ] Toast notification appears

#### ReadingHistory
- [ ] History displays correctly
- [ ] Filters work (type, date, favorites)
- [ ] View button opens modal
- [ ] Save to journal works
- [ ] Re-run button works

#### PremiumCard
- [ ] Only shows for non-premium users
- [ ] Perks display correctly
- [ ] Upgrade button works
- [ ] A/B variants work

## Known Issues to Fix

### Test Failures
1. **Credit Balance Update Test** - Mock setup needs adjustment
2. **Negative Balance Test** - Logic needs refinement
3. **Stripe Session Test** - Mock response missing mode field

### Potential Runtime Issues
- ToastContainer SSR issue (fixed)
- CrystalsWidget import issue (fixed)
- Missing API endpoints may cause errors

## Test Environment Setup

### Prerequisites
- Node.js installed
- Dependencies installed: `npm install`
- Database connection configured
- Environment variables set

### Running Individual Test Suites

```bash
# Streak tests
npm test -- __tests__/unit/streak.test.js

# Credit deduction
npm test -- __tests__/unit/credit-deduction.test.js

# Reading generation
npm test -- __tests__/unit/reading-generation.test.js

# Billing redirect
npm test -- __tests__/unit/billing-redirect.test.js
```

### E2E Testing

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

## Troubleshooting

### Tests Fail
- Check mocks are properly set up
- Verify database query mocks return expected structure
- Ensure async/await is used correctly

### E2E Tests Fail
- Ensure dev server is running
- Check browser console for errors
- Verify test selectors are correct
- Check if API routes are properly mocked

### Component Errors
- Check browser console for errors
- Verify all imports are correct
- Check for missing API endpoints
- Ensure environment variables are set

## Next Steps

1. Fix remaining test failures
2. Add more comprehensive E2E tests
3. Set up CI/CD pipeline
4. Add visual regression testing
5. Performance testing

