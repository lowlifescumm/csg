# Dashboard V3 Overlay Verification Guide

## Overview

The dashboard uses a feature flag system to toggle between the legacy dashboard and the new DashboardV3. This document explains how to verify the overlay toggle works correctly.

## Feature Flag Logic

The dashboard page (`app/dashboard/page.js`) checks two conditions:

1. **Environment Flag:** `NEXT_PUBLIC_DASHBOARD_V3` must equal `"true"`
2. **Invite Token:** `?v3_invite=<token>` query parameter must match `NEXT_PUBLIC_DASHBOARD_V3_INVITE`

If **either** condition is true, DashboardV3 is shown. Otherwise, the legacy dashboard is shown.

## Configuration

### Environment Variables (Render Dashboard)

Set these in Render environment variables:

- `DASHBOARD_V3=true` → Enables DashboardV3 for all users
- `DASHBOARD_V3_INVITE=<secret-token>` → Optional invite token for testing

These are exposed to the client as:
- `NEXT_PUBLIC_DASHBOARD_V3` (from `DASHBOARD_V3`)
- `NEXT_PUBLIC_DASHBOARD_V3_INVITE` (from `DASHBOARD_V3_INVITE`)

### Next.js Configuration

The `next.config.js` maps environment variables:

```javascript
env: {
  NEXT_PUBLIC_DASHBOARD_V3: process.env.DASHBOARD_V3 ?? "false",
  NEXT_PUBLIC_DASHBOARD_V3_INVITE: process.env.DASHBOARD_V3_INVITE ?? "",
}
```

## Verification Steps

### Test 1: Legacy Dashboard (Default)
1. Ensure `DASHBOARD_V3` is not set or set to `false`
2. Visit `https://cosmicspiritguide.com/dashboard`
3. **Expected:** Legacy dashboard loads (from `app__disabled/_dashboard_disabled/page.js`)
4. **Verify:** Check for legacy UI elements (old tarot selector, help system, etc.)

### Test 2: DashboardV3 (Flag Enabled)
1. Set `DASHBOARD_V3=true` in Render environment variables
2. Redeploy the service
3. Visit `https://cosmicspiritguide.com/dashboard`
4. **Expected:** DashboardV3 loads (from `components/DashboardV3/index.jsx`)
5. **Verify:** Check for new UI elements (modern cards, DashboardV3 components)

### Test 3: DashboardV3 (Invite Token)
1. Set `DASHBOARD_V3_INVITE=test-token-123` in Render environment variables
2. Redeploy the service
3. Visit `https://cosmicspiritguide.com/dashboard?v3_invite=test-token-123`
4. **Expected:** DashboardV3 loads even if `DASHBOARD_V3=false`
5. **Verify:** DashboardV3 components render correctly

### Test 4: Invalid Invite Token
1. Set `DASHBOARD_V3_INVITE=test-token-123`
2. Visit `https://cosmicspiritguide.com/dashboard?v3_invite=wrong-token`
3. **Expected:** Legacy dashboard loads (invite doesn't match)
4. **Verify:** Legacy UI appears

### Test 5: Both Flag and Invite
1. Set `DASHBOARD_V3=true` and `DASHBOARD_V3_INVITE=test-token-123`
2. Visit `https://cosmicspiritguide.com/dashboard?v3_invite=test-token-123`
3. **Expected:** DashboardV3 loads (both conditions true)
4. **Verify:** DashboardV3 components render

## Code Reference

The toggle logic is in `app/dashboard/page.js`:

```javascript
const canUseV3 = useMemo(() => {
  const flagEnabled = (process.env.NEXT_PUBLIC_DASHBOARD_V3 || "").toLowerCase() === "true";
  const inviteToken = process.env.NEXT_PUBLIC_DASHBOARD_V3_INVITE || "";
  const inviteParam = searchParams?.get("v3_invite") || "";
  const hasInvite = inviteToken.length > 0 && inviteParam === inviteToken;

  if (flagEnabled || hasInvite) {
    return true;
  }
  return false;
}, [searchParams]);
```

## Current Production Status

- **Production URL:** https://cosmicspiritguide.com
- **Current Branch:** `restore-core-systems` (commit `6e98223`)
- **Flag Status:** Not yet enabled (requires manual Render UI configuration)
- **Fallback:** Legacy dashboard is active by default

## Manual Testing Checklist

- [ ] Legacy dashboard loads when flag is disabled
- [ ] DashboardV3 loads when `DASHBOARD_V3=true`
- [ ] DashboardV3 loads with valid invite token
- [ ] Legacy dashboard loads with invalid invite token
- [ ] Both dashboards render without errors
- [ ] Loading states display correctly
- [ ] Suspense boundaries work properly
- [ ] No console errors in browser DevTools

## Troubleshooting

### DashboardV3 Not Loading
- Check `NEXT_PUBLIC_DASHBOARD_V3` is exactly `"true"` (case-sensitive)
- Verify environment variable is set in Render dashboard
- Ensure service was redeployed after setting env vars
- Check browser console for errors

### Legacy Dashboard Not Loading
- Verify `DASHBOARD_V3` is not set or is `false`
- Check that `app__disabled/_dashboard_disabled/page.js` exists
- Verify no invite token in URL matches `DASHBOARD_V3_INVITE`

### Both Dashboards Show Errors
- Check database connection (both use same backend)
- Verify API endpoints are responding
- Check Render logs for build/runtime errors

