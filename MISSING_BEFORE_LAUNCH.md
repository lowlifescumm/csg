# Missing Items Before Launch

## 🚨 Critical: Must Be Done Before Launch

### 1. Missing Environment Variable in render.yaml
**Issue:** `RESEND_API_KEY` is not in `render.yaml`  
**Impact:** Password reset emails and transit notifications won't work  
**Fix:** Add to `render.yaml`:
```yaml
- key: RESEND_API_KEY
  sync: false
```
Then set the value in Render dashboard.

### 2. Set Environment Variables in Render Dashboard
All these variables marked `sync: false` in `render.yaml` **must be manually set** in Render:

**Required:**
- [ ] `OPENAI_API_KEY` - Your OpenAI API key
- [ ] `STRIPE_SECRET_KEY` - Production Stripe secret key (NOT test key!)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production Stripe webhook secret
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Production Stripe publishable key
- [ ] `NEXT_PUBLIC_BASE_URL` - Your production URL (e.g., `https://your-app.onrender.com`)
- [ ] `NEXTAUTH_URL` - Same as `NEXT_PUBLIC_BASE_URL`
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- [ ] `RESEND_API_KEY` - Resend email API key (ADD THIS TO YAML TOO!)

**Optional but Recommended:**
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For birth chart location autocomplete
- [ ] `PINECONE_API_KEY` - If using Pinecone features

### 3. Database Setup
- [ ] Run all database migrations on production database
- [ ] Create admin user: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`

### 4. Stripe Configuration
- [ ] **CRITICAL:** Switch from test keys to production keys in Render
- [ ] Configure webhook endpoint: `https://yourdomain.com/api/stripe-webhook`
- [ ] Select webhook events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 5. Cron Jobs Setup
- [ ] Configure transit monitor cron (hourly): `POST /api/cron/transit-monitor`
- [ ] Configure forecast generation cron (daily): `POST /api/cron/generate-forecasts`
- [ ] Set header: `Authorization: Bearer ${CRON_SECRET}`

## ⚠️ Post-Deployment Testing (Do Right After Launch)

Test these core features work:

- [ ] User registration works
- [ ] User login works
- [ ] Google OAuth login works
- [ ] Password reset email sends
- [ ] User receives 3 signup credits
- [ ] Tarot reading works and deducts credits
- [ ] Birth chart generation works
- [ ] Credit purchase works
- [ ] Subscription signup works
- [ ] Admin panel accessible
- [ ] Admin credit adjustment works

## 📝 Summary

**Most Critical Items:**
1. Add `RESEND_API_KEY` to render.yaml
2. Set ALL environment variables in Render dashboard
3. **Switch Stripe to production keys** (this is VERY important!)
4. Run database migrations
5. Configure Stripe webhook
6. Set up cron jobs

Everything else is done! You just need configuration.


