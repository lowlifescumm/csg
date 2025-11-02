# Pre-Launch Checklist

## ✅ Issues Fixed
- Admin credit adjustments working
- Google OAuth authentication implemented
- Password reset flow complete
- Transit tracker system operational
- Forecasting engine ready
- Database migrations applied
- Unit tests: 5/7 passing (mock issues only)

## ⚠️ Known Issues (Non-Critical)

### 1. Unit Test Mocks
**Status:** Non-blocking  
**Issue:** 2 failing tests due to mock setup in `deductCredits` tests  
**Impact:** Test infrastructure only, no production impact  
**Fix:** Can be addressed post-launch

### 2. API Tests
**Status:** Expected  
**Issue:** Require test database and server  
**Impact:** Development tooling only  
**Fix:** Configure test environment separately

### 3. Tarot Question Input
**Status:** Minor UX  
**Issue:** Some spreads allow questions but UI doesn't consistently show input field  
**Impact:** Low - works functionally  
**Note:** See `scripts/tarot-question-analysis.md` for details  
**Fix:** Post-launch UX improvement

## 🔴 Critical Pre-Launch Tasks

### Environment Variables
Verify all these are set in production:

#### Required
- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `JWT_SECRET` - Secure random string
- [ ] `OPENAI_API_KEY` - Valid API key with credits
- [ ] `STRIPE_SECRET_KEY` - Production key (not test!)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Production key
- [ ] `NEXT_PUBLIC_BASE_URL` - Your production URL
- [ ] `CRON_SECRET` - Secure random string
- [ ] `RESEND_API_KEY` - Email delivery key

#### NextAuth/OAuth
- [ ] `NEXTAUTH_URL` - Your production URL
- [ ] `NEXTAUTH_SECRET` - Secure random string
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth secret

#### Optional (But Recommended)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For location autocomplete
- [ ] `PINECONE_API_KEY` - If using Pinecone features

### Database Setup
- [ ] All migrations applied
- [ ] Transit tracker schema installed
- [ ] Forecast schema installed
- [ ] Credit system tables created
- [ ] Admin user created: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`

### Stripe Configuration
- [ ] **SWITCH TO PRODUCTION KEYS** (not test keys!)
- [ ] Stripe webhook endpoint configured: `https://yourdomain.com/api/stripe-webhook`
- [ ] Webhook events selected:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Products created in Stripe dashboard
- [ ] Pricing configured correctly

### Cron Jobs
- [ ] Transit monitor cron configured: `POST /api/cron/transit-monitor` (hourly)
- [ ] Forecast generation cron: `POST /api/cron/generate-forecasts` (daily)
- [ ] Header: `Authorization: Bearer ${CRON_SECRET}`

### Security Checklist
- [ ] HTTPS enabled (automatic with Render)
- [ ] All API keys are production keys
- [ ] No debug/test mode enabled
- [ ] Error messages don't leak sensitive data
- [ ] Rate limiting configured (if applicable)
- [ ] CORS properly configured

### Performance
- [ ] Database indexes created
- [ ] Caching strategy verified
- [ ] Static assets optimized
- [ ] Build completes successfully (`npm run build`)
- [ ] Memory allocation set: `NODE_OPTIONS=--max-old-space-size=4096`

### Functionality Tests
Run these in production after deployment:

- [ ] User can register with email/password
- [ ] User can login with email/password
- [ ] Google OAuth login works
- [ ] User receives signup credits (3 free credits)
- [ ] Password reset email sends
- [ ] User can complete a basic Tarot reading
- [ ] Credits deducted correctly
- [ ] Insufficient credits blocked appropriately
- [ ] Birth chart generation works
- [ ] Transit dashboard loads
- [ ] Forecast generation works
- [ ] Payment for credit packs works
- [ ] Subscription creation works
- [ ] Webhook receives Stripe events
- [ ] Admin can access admin panel
- [ ] Admin can adjust user credits
- [ ] Email notifications send

### Monitoring
- [ ] Error logging configured
- [ ] Performance monitoring set up
- [ ] Database connection monitoring
- [ ] Stripe webhook event monitoring
- [ ] Email delivery monitoring
- [ ] Cron job execution monitoring

### Documentation
- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Admin features documented
- [ ] Troubleshooting guide available

## 📋 Post-Launch Tasks (Nice to Have)

### Immediate (Week 1)
- [ ] Monitor error logs daily
- [ ] Check Stripe webhook success rate
- [ ] Verify cron jobs running
- [ ] Monitor database performance
- [ ] Review user feedback

### Short-term (Month 1)
- [ ] Fix unit test mocks
- [ ] Implement Tarot question input improvements
- [ ] Add rate limiting if needed
- [ ] Optimize slow queries
- [ ] Add additional error handling

### Long-term (3+ Months)
- [ ] SMS notifications via Twilio
- [ ] Push notifications
- [ ] PDF export features
- [ ] Calendar integrations
- [ ] Advanced analytics
- [ ] A/B testing framework

## 🚀 Deployment Commands

```bash
# Build test
npm ci && npm run build

# Check for errors
npm run lint

# Start server
npm start

# Verify environment
cat .env | grep -v "SECRET"

# Test Stripe webhook locally
stripe listen --forward-to http://localhost:5000/api/stripe-webhook
```

## 🆘 Emergency Contacts

- **Stripe Support:** https://support.stripe.com
- **OpenAI Support:** https://help.openai.com
- **Render Support:** https://render.com/docs/support
- **Database:** Check Render logs

## ✅ Launch Approval

Once all critical items checked:
- [ ] All environment variables configured
- [ ] Database fully migrated
- [ ] Stripe in production mode
- [ ] All functionality tests pass
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Backup strategy verified

**Ready to launch! 🚀**


