# Testing Dashboard V2 - Quick Start Guide

## Enable Dashboard V2

Dashboard V2 is controlled by a feature flag. You can enable it in two ways:

### Method 1: URL Parameter (Easiest for Testing)
Navigate to: `http://localhost:5000/dashboard?dashboard_v2=true`

### Method 2: Environment Variable
Create or update `.env.local` file:
```
NEXT_PUBLIC_DASHBOARD_V2=true
```

Then restart the dev server.

## New Components Available

When Dashboard V2 is enabled, you'll see:

1. **HeroHeader** - Welcome section with moon phase, credits, streak, and upgrade CTA
2. **FocusGrid** - Quick access tiles for different reading types
3. **CosmicBriefing** - Daily cosmic briefing with zodiac sign selector
4. **DailyTasks** - Gamified daily tasks with XP rewards
5. **EnergyChart** - Weekly energy forecast chart
6. **CrystalsWidget** - Daily element and recommended crystals
7. **GrowthBar** - XP and level progress bar
8. **BestMatches** - Top compatibility matches
9. **ReadingHistory** - Scrollable, filterable reading history
10. **PremiumCard** - Premium upsell card (only for non-premium users)

## Testing the New Features

### 1. Test Toast Notifications
The ToastContainer is now integrated. Components using `useToast()` will show notifications:
- Try completing a task in DailyTasks
- Try saving a reading to journal
- Any component that uses the toast hook

### 2. Test Modal System
- Click "View" on any reading in ReadingHistory to see the modal
- Modal supports keyboard navigation (Escape to close)
- Focus management is handled automatically

### 3. Test Reading Generation
- Click any tile in FocusGrid
- Should generate reading and show result modal
- Credits should be deducted
- Toast notification should appear on success

### 4. Test Premium Upsell
- If you're not premium, you should see PremiumCard
- Click "Upgrade to Premium" button
- Should trigger Stripe checkout flow

### 5. Test Reading History
- View your reading history
- Use filters (type, date range, favorites)
- Try "View", "Save to Journal", and "Re-run" actions
- Test infinite scroll

## Troubleshooting

### Dashboard V2 Not Showing
- Check URL has `?dashboard_v2=true` parameter
- Or check `.env.local` has `NEXT_PUBLIC_DASHBOARD_V2=true`
- Restart dev server if using environment variable

### Components Not Loading
- Check browser console for errors
- Ensure all dependencies are installed: `npm install`
- Check that API endpoints are working

### Toast Notifications Not Working
- Ensure ToastContainer is in layout.js (already added)
- Check browser console for errors
- Verify useToast hook is being used correctly

### API Errors
- Ensure database connection is configured
- Check environment variables are set
- Verify API routes are accessible

## Quick Test Checklist

- [ ] Navigate to `/dashboard?dashboard_v2=true`
- [ ] See HeroHeader with moon phase and credits
- [ ] Click a tile in FocusGrid to generate reading
- [ ] View reading result in modal
- [ ] Check streak counter displays (if applicable)
- [ ] Complete a daily task and see XP reward
- [ ] View reading history with filters
- [ ] See PremiumCard (if not premium)
- [ ] Test toast notifications appear
- [ ] Test modal keyboard navigation

## Server Info

Dev server runs on: `http://localhost:5000`
Default port: 5000

To start manually:
```bash
npm run dev
```

