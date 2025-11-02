# 🚀 Go Live Guide - Complete in 30 Minutes

Follow these steps **EXACTLY** in order. No coding needed!

## 🎯 OPTIONAL: Setup Render MCP (If You Want AI Help)

If you're using Cursor AI editor, you can add Render's MCP server for easier deployment:

1. Open Cursor Settings → Features → Model Context Protocol → Edit Config
2. Add this to your MCP servers:
```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "apiKey": "YOUR_RENDER_API_KEY"
    }
  }
}
```
3. Get your Render API key: https://dashboard.render.com/account/api-keys
4. Restart Cursor

**This is completely optional** - the manual steps below work perfectly fine!

---

## ✅ STEP 1: Get Your API Keys Ready (5 minutes)

You'll need these keys. Get them all ready before starting.

### 1a. OpenAI Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy it (starts with `sk-`)
4. **SAVE IT** - You'll need it in Step 3

### 1b. Stripe Keys (PRODUCTION - Important!)
1. Go to https://dashboard.stripe.com/apikeys
2. Make sure you're on **"Live"** mode (toggle in top right)
3. Copy "Secret key" (starts with `sk_live_`)
4. Copy "Publishable key" (starts with `pk_live_`)
5. **SAVE BOTH** - You'll need them in Step 3

### 1c. Stripe Webhook Secret
1. Stay in Stripe dashboard, click "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Set endpoint URL to: `https://your-app-name.onrender.com/api/stripe-webhook` (replace with YOUR app name)
4. Select these events:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click "Add endpoint"
6. Click "Reveal" next to "Signing secret"
7. Copy it (starts with `whsec_`)
8. **SAVE IT** - You'll need it in Step 3

### 1d. Google OAuth Keys
1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Add authorized redirect URIs:
   - `https://your-app-name.onrender.com/api/auth/callback/google`
5. Click "Create"
6. Copy "Your Client ID" (ends with `.apps.googleusercontent.com`)
7. Copy "Your Client Secret"
8. **SAVE BOTH** - You'll need them in Step 3

### 1e. Resend Email Key
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Give it a name like "Cosmic Spiritual Guide"
4. Copy the key (starts with `re_`)
5. **SAVE IT** - You'll need it in Step 3

### 1f. Google Maps Key (Optional but Recommended)
1. Go to https://console.cloud.google.com/google/maps-apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the key
4. **SAVE IT** - You'll need it in Step 3

---

## ✅ STEP 2: Deploy to Render (5 minutes)

### 2a. Create Render Account
1. Go to https://render.com
2. Sign up for free account
3. Verify your email

### 2b. Create Database
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Name: `cosmic-spiritual-guide-db`
3. Plan: Select "Free" (or "Starter" for production)
4. Region: Choose closest to you
5. Click "Create Database"
6. **WAIT** 2-3 minutes for it to finish

### 2c. Create Web Service
1. Still in Render dashboard, click "New +" → "Web Service"
2. Connect your GitHub account
3. Select your repository
4. Name: `cosmic-spiritual-guide` (or whatever you want)
5. Environment: Node
6. Region: Same as database
7. Branch: `main` (or `master`)
8. Root Directory: `csg`
9. Build Command: `npm ci && npm run build`
10. Start Command: `npm start`
11. Plan: Select "Starter" or "Free"
12. **DON'T CLICK CREATE YET!** Go to Step 3 first

---

## ✅ STEP 3: Set Environment Variables (10 minutes)

**BEFORE clicking "Create Web Service"**, scroll down to "Environment Variables" and add these one by one:

### Required Variables (Add each one):

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | Your key from Step 1a |
| `STRIPE_SECRET_KEY` | Your key from Step 1b |
| `STRIPE_WEBHOOK_SECRET` | Your key from Step 1c |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your key from Step 1b |
| `GOOGLE_CLIENT_ID` | Your key from Step 1d |
| `GOOGLE_CLIENT_SECRET` | Your key from Step 1d |
| `RESEND_API_KEY` | Your key from Step 1e |
| `NEXT_PUBLIC_BASE_URL` | Your app URL (you'll get this after deployment, come back and update) |

### Optional Variables:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Your key from Step 1f |
| `PINECONE_API_KEY` | Leave empty if not using Pinecone |

### Generate These (Click "Generate" button):

- `JWT_SECRET` - Click "Generate" button
- `NEXTAUTH_SECRET` - Click "Generate" button  
- `CRON_SECRET` - Click "Generate" button

**Now click "Create Web Service"** ⏸️

---

## ✅ STEP 4: Wait for Deployment (5-10 minutes)

1. Watch the build logs
2. Wait until you see "Build successful"
3. Copy your app URL (looks like `https://cosmic-spiritual-guide.onrender.com`)
4. Go back to Render dashboard → Your service → Environment
5. Update `NEXT_PUBLIC_BASE_URL` with your actual URL
6. Update `NEXTAUTH_URL` with your actual URL
7. Click "Save Changes"
8. App will redeploy (takes 1-2 minutes)

---

## ✅ STEP 5: Setup Database (5 minutes)

### 5a. Run Database Migrations
1. Open Render dashboard
2. Go to your database
3. Go to "Connections" tab
4. Copy the "Internal Database URL"
5. Use a PostgreSQL client OR use Render's Shell:

**Using Render Shell (Easiest):**
1. Go to your web service in Render
2. Click "Shell" tab
3. Run this command:
```bash
psql $DATABASE_URL -f database/init.sql
```

**Using psql locally (if you have it):**
1. Install PostgreSQL locally
2. Run:
```bash
psql <paste-database-url> -f database/init.sql
```

### 5b. Create Admin User
1. Go back to Shell or psql
2. Run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```
(Replace with YOUR email address)

**If no users exist yet**, wait until you register your first account, then run the UPDATE command.

### 5c. Setup Transit Tracker (Optional but Recommended)
Run this in Shell or psql:
```bash
psql $DATABASE_URL -f database/transit-tracker-schema.sql
```

---

## ✅ STEP 6: Configure Cron Jobs (5 minutes)

### 6a. Transit Monitor (Hourly)
1. In Render dashboard, go to your web service
2. Click "Scheduled Jobs" or create a new Cron Job
3. Name: `transit-monitor`
4. Schedule: `0 * * * *` (every hour)
5. Command:
```bash
curl -X POST https://your-app-url.onrender.com/api/cron/transit-monitor -H "Authorization: Bearer $CRON_SECRET"
```

### 6b. Forecast Generation (Daily)
1. Create another Cron Job
2. Name: `generate-forecasts`
3. Schedule: `0 0 * * *` (every day at midnight)
4. Command:
```bash
curl -X POST https://your-app-url.onrender.com/api/cron/generate-forecasts -H "Authorization: Bearer $CRON_SECRET"
```

---

## ✅ STEP 7: Test Everything (5 minutes)

Visit your app URL and test:

### Must-Work Tests:
1. **✅ Registration**: Go to `/login`, click "Sign up", create account
2. **✅ Login**: Log out, log back in
3. **✅ Google Login**: Try logging in with Google button
4. **✅ Free Credits**: Check you received 3 free credits
5. **✅ Tarot Reading**: Do a basic tarot reading
6. **✅ Birth Chart**: Create a birth chart
7. **✅ Payment**: Try purchasing credits (use Stripe test card: 4242 4242 4242 4242)
8. **✅ Admin Panel**: Go to `/admin`, make sure you can access it
9. **✅ Password Reset**: Click "Forgot password", check email arrives

### If Something Fails:
1. Go to Render dashboard → Your service → "Logs"
2. Look for red error messages
3. Check the error (usually tells you what's missing)

---

## ✅ STEP 8: Switch Stripe to Production (2 minutes)

**VERY IMPORTANT!** You've been using test keys. Now switch to real payments:

1. Go to Render dashboard → Your service → Environment
2. Change `STRIPE_SECRET_KEY` from test key to production key (starts with `sk_live_`)
3. Change `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to production key (starts with `pk_live_`)
4. Save changes
5. App redeploys

**Now you're accepting REAL payments!** 💰

---

## 🎉 YOU'RE LIVE!

Your app is now running with:
- ✅ User registration and login
- ✅ Google OAuth
- ✅ Credit system
- ✅ Payments
- ✅ Tarot readings
- ✅ Birth charts
- ✅ Admin panel

---

## 🆘 Troubleshooting

### "Build Failed"
- Check build logs
- Make sure you're using Node 18+ in package.json
- Check for errors in logs

### "Database Connection Error"
- Wait 5 minutes after creating database
- Verify database URL is correct
- Check database is "Available" (not "Creating")

### "Login Doesn't Work"
- Check JWT_SECRET is set
- Check NEXT_PUBLIC_BASE_URL matches your actual URL

### "Payments Don't Work"
- Verify Stripe keys are production keys (not test)
- Check webhook is configured in Stripe dashboard
- Verify webhook URL is correct

### "Emails Don't Send"
- Check RESEND_API_KEY is correct
- Verify in Resend dashboard that domain is verified

### "Cron Jobs Not Running"
- Check CRON_SECRET matches in Render
- Verify cron job command has correct URL
- Check cron job is "Active" in Render

---

## 📞 Need Help?

1. Check Render logs: Dashboard → Your service → Logs
2. Check Stripe dashboard for payment issues
3. All your keys are in Step 1 - re-check them
4. Verify environment variables are set correctly

---

## ✨ What's Next?

Once you're live:
1. Share your app with friends!
2. Monitor Render logs for any errors
3. Check Stripe dashboard for payments
4. Test the admin panel
5. Set up monitoring alerts

**Congratulations - You're live! 🚀**

