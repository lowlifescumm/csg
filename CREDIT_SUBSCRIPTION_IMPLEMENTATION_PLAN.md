# Credit & Subscription Model Implementation Plan

## 🎯 Overview

This document outlines the complete implementation of the new credit and subscription pricing model, removing all legacy pricing structures.

## 📋 Requirements Summary

### Subscription Model ($9.99/month)
- **Full access** to Transit Dashboard (Daily/Weekly Forecasts, Transit Tracking)
- **No credit consumption** for Transit Dashboard features
- **Free Natal Chart** on first subscription activation (one-time only)
- **Never charge credits** for: Natal Chart, Transit Dashboard, Daily/Weekly Forecasts, Transit Tracking

### Credit System
- **3 free credits** on sign-up
- **3 free credits** refresh daily
- **Free credits** expire after 24 hours
- **Free credits ONLY** usable for basic Tarot readings (1 credit each)
- **Cannot use free credits** for premium Tarot spreads or other reading types

### Credit Packs (Paid Only)
Replace existing with:
- **Curious Seeker**: 10 credits → $9.99
- **Cosmic Explorer**: 25 credits → $19.99 (Most Popular)
- **Stellar Circle**: 60 credits → $39.99
- **Oracle Tier**: 150 credits → $79.99

### Reading Costs (Paid Credits Only)
- Tarot (basic): 1 credit
- Premium Tarot Spread: 2 credits
- Moon Phase Reading: 1 credit
- Personalized Moon Reading: 2 credits
- Natal Chart: 3 credits (**subscribers get FREE on first use**)
- Transit Tracking: 2 credits (**non-subscribers only**)
- Daily/Weekly Forecasts: 3 credits (**non-subscribers only**)
- Compatibility Report: 5 credits
- Soulmate Deep Dive: 8 credits
- Daily Horoscope: 0 credits (always free)

### Access Control
- **Subscribers** get Transit Dashboard without credit deduction
- **Non-subscribers** must pay credits (except Daily Horoscope)
- **No grace period** on subscription lapse

## 🔧 Implementation Tasks

### 1. Database Schema Changes
- [ ] Run migration to update credit system tables
- [ ] Add columns for free credit tracking
- [ ] Update credits table structure for free/paid distinction
- [ ] Ensure expiration tracking for free credits

### 2. Credit System Library (`lib/credits.js`)
- [ ] Update `initializeUserCreditsOnSignup` for 3 free credits
- [ ] Update `refreshDailyCredits` for daily 3-credit refresh
- [ ] Update `deductCredits` to check free credit restrictions
- [ ] Add free credit usage validation
- [ ] Prevent free credits from being used for non-basic Tarot

### 3. Subscription Logic
- [ ] Update subscription price to $9.99/month
- [ ] Add free Natal Chart on first subscription activation
- [ ] Ensure Transit Dashboard never charges credits
- [ ] Block non-subscribers from Transit Dashboard

### 4. API Endpoints
- [ ] Update `/api/birth-chart` to check subscription status
- [ ] Update `/api/transits` to never charge credits for subscribers
- [ ] Update `/api/forecasts/generate` to never charge credits for subscribers
- [ ] Update `/api/readings/create` to enforce free credit restrictions
- [ ] Update `/api/compatibility` to enforce credit costs
- [ ] Update `/api/moon-reading` to enforce credit costs

### 5. Credit Pack Updates
- [ ] Update credit pack pricing in `app/credits/page.js`
- [ ] Update credit pack pricing in `app/api/credits/purchase/route.js`
- [ ] Remove old credit pack configurations
- [ ] Ensure per-credit pricing is derived from metadata

### 6. Frontend UI Updates
- [ ] Add clear distinction between subscription features and credits
- [ ] Update Natal Chart page with subscription messaging
- [ ] Highlight "Cosmic Explorer" as "Most Popular"
- [ ] Update credit shop UI
- [ ] Add user-friendly error messages for access denials

### 7. Cleanup Tasks
- [ ] Remove old credit tiers and legacy access rules
- [ ] Remove deprecated flags and experimental pricing
- [ ] Clean up unused database columns
- [ ] Remove hardcoded pricing from frontend code
- [ ] Audit and migrate existing user credits

### 8. Error Handling & Messaging
- [ ] Non-subscriber accessing Transit Dashboard: "This feature is included with the Transit Dashboard subscription. [Upgrade Now]"
- [ ] Attempting to use free credits on non-Tarot: "Free credits work only for basic Tarot. [Buy credits] or [Subscribe] for full access."
- [ ] Log subscription start events
- [ ] Log credit pack purchases
- [ ] Log reading type + credit source (free/paid)
- [ ] Log access denials

### 9. Testing
- [ ] Subscriber receives Natal Chart free (once)
- [ ] Non-subscriber pays 3 credits for Natal Chart
- [ ] Free credits expire after 24h
- [ ] Premium Tarot rejects free credits
- [ ] Transit Dashboard blocks non-subscribers
- [ ] Subscription grants free Transit access
- [ ] Daily credit refresh works correctly
- [ ] Free credit restrictions enforced

## 🚀 Deployment Steps

1. Run database migrations
2. Update environment variables for new subscription price
3. Update code changes
4. Test in development
5. Deploy to production
6. Monitor logs for issues
7. Verify Stripe webhook handlers

## 📝 Notes

- All access and credit logic must be **server-side**
- No client-side trust
- Centralize all pricing logic
- Ensure audit trail for all credit transactions
- Maintain backward compatibility during migration
