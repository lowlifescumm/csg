# Dashboard V2 Integration Guide

## Overview

The Dashboard V2 scaffold provides a feature-flag controlled overlay system for the `/dashboard` route. This allows seamless switching between the existing dashboard and the new DashboardV3 design without data migration.

## Feature Flag

The dashboard version is controlled by the `NEXT_PUBLIC_DASHBOARD_V2` environment variable.

### Enabling Dashboard V2

Add to your `.env.local` file:
```bash
NEXT_PUBLIC_DASHBOARD_V2=true
```

Alternatively, you can enable it via URL parameter for testing:
```
/dashboard?dashboard_v2=true
```

### Disabling Dashboard V2

Remove the environment variable or set it to `false`:
```bash
NEXT_PUBLIC_DASHBOARD_V2=false
```

## Architecture

### Components

1. **DashboardShell** (`/components/DashboardShell.jsx`)
   - Top-level data fetching component
   - Fetches user profile, credits, readings, and streak
   - Handles loading and error states
   - Uses render prop pattern to pass data to children

2. **DashboardV3** (`/components/DashboardV3/index.jsx`)
   - New dashboard UI component
   - Implements cosmic brand styling (deep violet gradients, soft shadows)
   - Displays user stats, quick actions, and reading history

3. **DashboardPage** (`/app/dashboard/page.js`)
   - Feature flag wrapper
   - Conditionally renders DashboardV3 or existing DashboardPageContent

## API Endpoints

The DashboardShell component expects the following API endpoints:

### 1. User Profile
**Endpoint:** `GET /api/auth/user`

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "stripe_subscription_id": "sub_xxx" // or null
  }
}
```

**Authentication:** Required (JWT cookie or NextAuth session)

### 2. Credits
**Endpoint:** `GET /api/credits`

**Response:**
```json
{
  "isPremium": true,
  "stats": {
    "totalAvailable": 100,
    "totalUsed": 50,
    "totalEarned": 150
  },
  "credits": 100 // Fallback for non-premium users
}
```

**Authentication:** Required

**Notes:**
- Premium users: Returns `stats` object with detailed credit information
- Free users: Returns simple `credits` number

### 3. Reading History
**Endpoint:** `GET /api/readings`

**Response:**
```json
{
  "success": true,
  "stats": {
    "credits": 100,
    "readingCount": 15,
    "chartCount": 3,
    "status": "Premium"
  },
  "readings": {
    "tarot": [
      {
        "id": 1,
        "type": "tarot",
        "question": "What should I focus on today?",
        "result": {
          "cards": [...],
          "interpretation": "..."
        },
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "birthCharts": [
      {
        "id": 2,
        "type": "birth_chart",
        "question": "Birth chart for John Doe",
        "result": {...},
        "created_at": "2024-01-10T14:20:00Z"
      }
    ]
  }
}
```

**Authentication:** Required

### 4. Streak (Optional)
**Endpoint:** `GET /api/streak`

**Response:**
```json
{
  "currentStreak": 7,
  "longestStreak": 15,
  "lastActivityDate": "2024-01-15"
}
```

**Authentication:** Required

**Notes:**
- This endpoint is optional
- DashboardShell gracefully handles missing streak endpoint
- If the endpoint doesn't exist, the streak feature is simply not displayed

## Data Flow

```
DashboardPage
  ├─> Feature Flag Check
  │   ├─> Enabled: DashboardShell → DashboardV3
  │   └─> Disabled: DashboardPageContent (existing)
  │
  └─> DashboardShell
      ├─> Fetches /api/auth/user
      ├─> Fetches /api/credits
      ├─> Fetches /api/readings
      └─> Fetches /api/streak (optional)
          │
          └─> Passes data to DashboardV3 via render props
```

## Styling

DashboardV3 uses the cosmic brand design system:

- **Background:** Deep violet gradient (`from-violet-900 via-purple-900 to-indigo-900`)
- **Cards:** Glassmorphic with soft shadows (`glassmorphic`, `apple-shadow-lg`)
- **Gradients:** Purple, pink, blue color scheme
- **Typography:** White text on dark backgrounds with gradient accents

All styles are defined in `/app/globals.css` and use Tailwind CSS utility classes.

## Error Handling

DashboardShell includes comprehensive error handling:

1. **Authentication Errors:** Redirects to `/login` if user is not authenticated
2. **API Errors:** Displays error message with retry button
3. **Missing Endpoints:** Gracefully handles optional endpoints (like streak)
4. **Loading States:** Shows animated loading spinner during data fetch

## Testing

### Test with Feature Flag Enabled

1. Set `NEXT_PUBLIC_DASHBOARD_V2=true` in `.env.local`
2. Restart development server
3. Navigate to `/dashboard`
4. Should see DashboardV3 with new design

### Test with Feature Flag Disabled

1. Remove or set `NEXT_PUBLIC_DASHBOARD_V2=false`
2. Restart development server
3. Navigate to `/dashboard`
4. Should see existing DashboardPageContent

### Test URL Parameter Override

1. Navigate to `/dashboard?dashboard_v2=true`
2. Should see DashboardV3 regardless of env var setting

## Migration Notes

- No data migration required
- Existing API endpoints work as-is
- Feature flag allows instant rollback
- Both dashboards can coexist during transition

## Future Enhancements

The DashboardV3 component is designed to be modular:

- Individual features can be toggled on/off
- New components can be added incrementally
- Styling can be customized per component
- Data fetching can be extended to include additional endpoints

## Support

For issues or questions:
1. Check that all required API endpoints are implemented
2. Verify environment variable is set correctly
3. Check browser console for API errors
4. Review component logs for data flow issues

