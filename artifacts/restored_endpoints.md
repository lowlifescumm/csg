| Endpoint | Status |
| --- | --- |
| `/api/credits` | restored with monthly allocation + admin views |
| `/api/credits/purchase` | restored Stripe credit pack handler |
| `/api/create-payment-intent` | restored one-time moon reading intent |
| `/api/create-subscription` | restored Stripe Checkout for subscriptions |
| `/api/stripe` | restored Stripe admin stub endpoint |
| `/api/stripe-webhook` | restored webhook with subscription/credit sync |
| `/api/verify-payment` | restored moon reading payment verification |
| `/api/create-compatibility-payment` | restored (returns 410 “gone”) |
| `/api/verify-compatibility-payment` | restored (returns 410 “gone”) |
| `/api/compatibility` | restored compatibility report generator |
| `/api/admin/login` | restored admin login with cookie session |
| `/api/admin/users` | restored admin user listing |
| `/api/admin/credits` | restored credit adjustment endpoint |
| `/api/admin/settings` | restored admin settings endpoint |
| `/api/admin/stats` | restored dashboard analytics |
| `/api/admin/make-admin` | restored role promotion endpoint |
| `/api/blog` (CRUD suite) | restored blog CMS APIs |
| `/api/cron/cleanup-tokens` | restored cron cleanup handler |
| `/api/cron/generate-forecasts` | restored forecast generation handler |
| `/api/cron/horoscopes` | restored horoscope cron handler |
| `/api/cron/transit-monitor` | restored transit monitor handler |
| `/api/auth/forgot-password` | restored password reset request endpoint |
| `/api/auth/reset-password` | restored password reset completion endpoint |
| `/api/auth/logout` | restored auth token logout handler |

