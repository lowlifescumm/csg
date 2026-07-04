# CLAUDE.md — Cosmic Spirit Guide (cosmicspiritguide.com)

**Repository:** `/home/ethan/csg`  
**Production URL:** https://cosmicspiritguide.com  
**Render Service:** https://csg-sj6e.onrender.com (origin)  
**Last Updated:** July 2026  

---

## What This Project Is

AI-powered spiritual guidance platform: tarot readings, birth charts, compatibility reports, daily horoscopes, and personalized transit forecasts. Think of it as "Calm meets astrology" — premium wellness aesthetic, not hobby/toy vibes.

**Key Differentiator:** Content pipeline reads from **Sanity CMS first**, falls back to PostgreSQL. This enables the 9-step AI content generation workflow via `hermes-blog-pipeline`.

---

## Architecture (Current)

```
Next.js 15 (App Router) + React 19
├── App Router (/app/*)
│   ├── Static pages (tarot, horoscope, etc.)
│   ├── Dynamic routes (/readings/[id], /zodiac/[sign])
│   └── API routes (58 endpoints)
│
├── Auth System (HYBRID — see below)
│   ├── NextAuth.js v5 (Google OAuth)
│   └── Custom JWT + bcrypt (email/password)
│
├── Database (PostgreSQL via Prisma)
│   ├── User auth tables
│   ├── Credit system (double-entry ledger)
│   └── Reading results, forecasts, transits
│
├── External Services
│   ├── Groq API (primary AI — tarot/horoscopes)
│   ├── OpenAI (embeddings, fallbacks)
│   ├── Stripe (subscriptions + credits)
│   ├── Pinecone (tarot card vectors)
│   ├── Resend (transactional email)
│   ├── Cloudinary (image upload/hosting)
│   └── Sanity CMS (blog content — primary source)
│
└── Deployment
    └── Render (standalone output, Oregon region)
```

---

## ⚠️ CRITICAL: Auth System (Read This First)

**We have TWO auth systems running in parallel.** This is intentional but creates complexity.

### 1. NextAuth.js v5 (Google OAuth)
- **File:** `app/api/auth/[...nextauth]/route.js`
- **Session cookie:** `next-auth.session-token`
- **Usage:** Header component uses `useSession()` hook
- **Callback URL:** Must match `NEXTAUTH_URL` exactly (including https://)

### 2. Custom JWT (Email/Password)
- **Files:** 
  - `app/api/auth/login/route.js`
  - `app/api/auth/register/route.js`
  - `app/api/auth/user/route.js`
- **Cookie:** `auth_token` (JWT)
- **Usage:** Legacy dashboard auth (being migrated)
- **Verification:** `lib/auth-config.js`

### Auth Hydration Pattern (USE THIS)

When building client components that need auth state:

```jsx
"use client";
import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();
  
  // ALWAYS check status first
  if (status === "loading") {
    return <LoadingScreen />; // or null, or skeleton
  }
  
  if (!session) {
    // Redirect to login
    window.location.href = "/login?redirect=dashboard";
    return null;
  }
  
  // Now safe to use session
  return <Dashboard user={session.user} />;
}
```

**NEVER** render different JSX on server vs client based on auth — causes React hydration mismatch (error #418).

### Current Dashboard Pattern

The dashboard (`/app/dashboard/page.js`) currently uses:
- `useSession()` hook from next-auth/react
- Client-side redirect if not authenticated
- This prevents the hydration mismatch

**Files involved:**
- `/app/dashboard/page.js` — Main dashboard page
- `/app/login/page.js` — Login page (handles both auth methods)
- `/components/Header.js` — Uses `useSession()` for auth state
- `/app/api/auth/user/route.js` — Returns user for either auth method

---

## Directory Structure

```
/home/ethan/csg/
├── app/                          # Next.js App Router (App Router)
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth endpoints (login, register, NextAuth)
│   │   ├── tarot/                # Tarot reading API
│   │   ├── birth-chart/          # Birth chart calculations
│   │   ├── compatibility/        # Synastry calculations
│   │   ├── horoscope/            # Daily horoscope
│   │   ├── forecasts/            # Transit forecasts
│   │   ├── create-payment-intent # Stripe payments
│   │   ├── stripe-webhook/       # Stripe webhooks
│   │   ├── cron/                 # Cron job endpoints
│   │   └── content-calendar/     # Blog pipeline API
│   ├── tarot/                    # Tarot reading UI
│   ├── birth-chart/              # Birth chart form + results
│   ├── horoscope/                # Horoscope browsing
│   ├── compatibility/            # Compatibility calculator
│   ├── dashboard/                # User dashboard (AUTH REQUIRED)
│   ├── readings/                 # Saved readings list
│   ├── readings/[id]/            # Individual reading detail
│   ├── profile/                  # User profile
│   ├── forecasts/                # Forecasts list + detail
│   ├── transits/                 # Transit tracker
│   ├── admin/                    # Admin panels
│   │   ├── blog/                 # Blog post management
│   │   ├── content-calendar/     # Editorial calendar
│   │   ├── users/                # User management
│   │   └── settings/             # Admin settings
│   ├── blog/                     # Blog frontend
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   └── page.js                   # Homepage (redirects logged-in users to /dashboard)
├── components/                   # React components
│   ├── DashboardV3/              # Dashboard V3 components
│   ├── DailyHoroscope.jsx        # Horoscope display
│   ├── Header.js                 # Main navigation (uses NextAuth)
│   ├── Footer.js                 # Site footer
│   └── ...                       # Many more
├── lib/                          # Utilities
│   ├── prisma.ts                 # Prisma client
│   ├── api-client.ts             # HTTP client for API calls
│   ├── auth-config.js            # JWT auth utilities
│   ├── astrology.js              # Astrology calculations
│   ├── tarot-data.js             # Tarot card data
│   └── logger.js                 # Winston logger
├── prisma/
│   └── schema.prisma            # Database schema
├── sanity-studio/                # Sanity CMS (separate app)
├── scripts/                      # Build/deployment scripts
├── public/                       # Static assets
├── styles/                       # Global CSS
└── render.yaml                   # Render deployment config
```

---

## Key Database Tables

| Table | Purpose | Notes |
|-------|---------|-------|
| `users` | User accounts | `auth_type`: 'google' or 'email' |
| `credits` | Credit balance | Current balance per user |
| `credit_ledger` | All credit transactions | Double-entry accounting |
| `readings` | Tarot/astrology readings | JSON results + metadata |
| `natal_charts` | Birth chart data | Encrypted planet positions |
| `forecasts` | Personalized forecasts | AI-generated per user |
| `transits` | Transit calculations | With interpretations |
| `horoscopes` | Daily horoscope cache | Per zodiac sign |
| `blog_posts` | Blog content | **Legacy** — Sanity is primary |
| `reading_jobs` | Async job queue | For background processing |
| `subscriptions` | Stripe subscriptions | Synced via webhooks |

---

## Environment Variables (Required)

See `env.template` for full list. Key ones:

```bash
# Core
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://cosmicspiritguide.com  # MUST match deployed URL
NEXTAUTH_SECRET=random-secret-here
JWT_SECRET=different-random-secret  # For custom auth

# AI
GROQ_API_KEY=your-groq-key  # Primary AI provider
OPENAI_API_KEY=sk-...        # Fallbacks & embeddings

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Email
RESEND_API_KEY=re_...

# Search
PINECONE_API_KEY=...
PINECONE_INDEX=csg-tarot

# Images
CLOUDINARY_URL=cloudinary://...

# CMS
SANITY_API_TOKEN=...

# Admin
CRON_SECRET=random-secret-for-cron
ADMIN_SECRET=admin-access-secret
```

---

## Color Palette (Warm Nebula)

We rejected the cliché dark purple spiritual aesthetic. Use these:

```javascript
// tailwind.config.js
colors: {
  cosmic: {
    void: '#050214',       // Deep background
    950: '#03000a',        // Darker background
    900: '#080214',        // Card backgrounds
    gold: '#DFB76C',       // Primary accent (buttons, highlights)
    'gold-light': '#F0D78C',
    rose: '#c45b7a',       // CTAs, alerts
    teal: '#5b8a8a',       // Trust, tech elements
  },
  accent: {
    1: '#e8a87c',  // warm copper (secondary accents)
    2: '#b8a9a1',  // muted warm
    3: '#c45b7a',  // warm rose (CTAs)
    4: '#5b8a8a',  // soft teal (trust elements)
  }
}
```

---

## Development

### Setup

```bash
cd /home/ethan/csg

# Install dependencies
npm install

# Copy and fill env
cp env.template .env.local
# Edit .env.local with your keys

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
# Runs on http://localhost:5000
```

### Building

```bash
# Production build (creates standalone output)
npm run build

# Output: .next/standalone/
# This is what Render deploys
```

### Testing

```bash
# Unit tests
npm test

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:smoke

# Health check
curl http://localhost:5000/api/health
```

---

## Content Pipeline (Important)

Blog content flows through a **dual-source system**:

1. **Sanity CMS** (primary)
   - Content edited in Sanity Studio (`sanity-studio/`)
   - Studio URL: https://csg.sanity.studio
   - Project ID: `kicslgfz`

2. **PostgreSQL** `blog_posts` (fallback)
   - Legacy content
   - Still used for some features

**Content Calendar Integration:**
- Blog posts planned in Sanity or `/admin/content-calendar`
- `hermes-blog-pipeline` repo polls `/api/content-calendar`
- AI generates content through 9-step pipeline
- Completed content pushed back via `/api/content-workflow`

---

## Deployment

**Platform:** Render (Oregon region)  
**Service:** `srv-d3lab5qdbo4c73auihe0`  
**Branch:** Currently deploying from `feat/GSTA-536-stripe-webhook-tests`  
**Auto-deploy:** Enabled

Build settings from `render.yaml`:
- Build: `PUPPETEER_SKIP_DOWNLOAD=true PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install && ESLINT=0 npm run build`
- Start: `npm start` (runs `.next/standalone/server.js`)

---

## Common Issues & Fixes

### Hydration Mismatch (React #418)
**Symptom:** Console error about server/client mismatch, or auth state flashing wrong  
**Cause:** Server renders "logged out", client hydrates as "logged in"  

**Fix:** Use the pattern in `/app/dashboard/page.js`:
- Import `useSession` from `next-auth/react`
- Check `status === "loading"` and return loading state
- Only render authenticated content when session confirmed
- Never use different JSX on server vs client

### Stripe Webhook Failures
**Symptom:** Payments work but webhooks fail  
**Fix:** Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard exactly

### Prisma Client Not Found
```bash
npx prisma generate
```

### Groq API Errors
**Symptom:** AI readings fail  
**Fix:** Check `GROQ_API_KEY` has quota. Current model: `openai/gpt-oss-120b` (was `llama-3.3-70b-versatile`)

### NextAuth Redirect Loop
**Symptom:** Login redirects endlessly  
**Fix:** `NEXTAUTH_URL` must exactly match the URL in browser (including https://)

---

## Current Branch Status

**Active Branch:** `feat/GSTA-536-stripe-webhook-tests`  
**Purpose:** Stripe webhook testing and dashboard auth fixes  
**Recent Commits:**
- Fixed hydration mismatch on dashboard
- Simplified dashboard architecture
- Restored useSession hook for auth sync

---

## Owner Context

- **Ethan** — IT consultant, SMB focus (US/Mexico/Spain), bilingual EN/ES
- **Income streams:** High-ticket automation ($5-15k), system architecture ($40-100/hr), bilingual AI training ($50-150/hr)
- **Paperclip Company ID:** `df8b638f-3877-4cea-8f96-66523dfad314`
- **Sanity Project:** `kicslgfz`
- **Aesthetic:** Warm Nebula (charcoal midnight + warm copper + soft teal + warm rose)

---

## Related Repos

| Repo | Purpose |
|------|---------|
| `hermes-blog-pipeline` | 9-step AI content generation |
| `sanity-studio` (in repo) | Blog CMS configuration |

---

## Files to Read First

1. `FEATURES.md` — Complete feature checklist
2. `PHASE-1-ROADMAP.md` — Development roadmap
3. `FREE_READING_IMPLEMENTATION.md` — Free tier logic
4. This file — Architecture and patterns

---

## CLI Commands Quick Reference

```bash
# Development
npm run dev                    # Start dev server
npm test                       # Run tests
npx prisma generate            # Regenerate Prisma client
npx prisma migrate dev         # Run migrations (dev only)
npx prisma studio             # Open Prisma Studio

# Production
npm run build                  # Build for production
npm start                      # Start production server

# Sanity (in sanity-studio/ dir)
cd sanity-studio && npm run dev
```

---

**Maintainer:** Ethan  
**Status:** Production (active development branch)  
**Next Priority:** Complete dashboard auth stabilization
