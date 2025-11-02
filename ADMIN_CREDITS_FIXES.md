# Admin Credit Adjustment Fixes

Fixed all issues with the admin credit adjustment functionality to enable promotional credit issuance.

## Critical Bugs Fixed

### 1. ✅ Wrong Column Name
**Issue**: API was trying to UPDATE `amount` column which doesn't exist  
**Fix**: Changed to `credits` column (the actual column name)

### 2. ✅ Replacing Credits Instead of Adding
**Issue**: API was setting credits to exact value instead of adding/subtracting  
**Fix**: Changed logic to `credits + amount` to add/subtract from balance

### 3. ✅ Missing UPSERT Logic
**Issue**: Code tried to use `ON CONFLICT` without UNIQUE constraint on user_id  
**Fix**: Added proper check-then-insert-or-update logic

### 4. ✅ Password Column Mismatch
**Issue**: `lib/auth.js` referenced wrong `password` column vs `password_hash` in schema  
**Fix**: Updated all references to use `password_hash` with aliasing where needed

### 5. ✅ NextAuth Admin Support
**Issue**: Admin credits API only supported JWT, not Google OAuth admins  
**Fix**: Added NextAuth session support via `getAuthenticatedUser`

### 6. ✅ Credits API Admin Support
**Issue**: `/api/credits?userId=X` didn't work for admin viewing user credits  
**Fix**: Added admin verification and fallback to simple credits table

## Files Modified

1. **csg/app/api/admin/credits/route.js**
   - Fixed column name from `amount` to `credits`
   - Changed from SET to ADD credits
   - Added proper UPSERT logic
   - Added NextAuth support
   - Enhanced validation and error handling
   - Added comprehensive logging

2. **csg/app/api/credits/route.js**
   - Added admin verification for `userId` query param
   - Added fallback to simple credits table for non-premium users
   - Returns proper format for admin modal

3. **csg/app/admin/users/page.js**
   - Redesigned credit adjustment modal with modern UI
   - Added success/error feedback messages
   - Added loading states
   - Better UX with current balance display
   - Validation and user feedback

4. **csg/lib/auth.js**
   - Fixed `INSERT INTO users` to use `password_hash`
   - Fixed `getUserByEmail` to alias `password_hash as password`
   - Fixed `updatePassword` to use `password_hash`
   - Ensures compatibility with schema

5. **csg/render.yaml**
   - Added Google OAuth environment variables
   - Added NextAuth configuration

6. **csg/app/api/auth/[...nextauth]/route.js** 
   - Enhanced error handling
   - Removed non-existent column references
   - Improved logging
   - Better user creation detection

## How It Works Now

### Admin Credit Adjustment Flow

1. Admin clicks "Adjust Credits" on a user in `/admin/users`
2. Modal opens showing current credit balance
3. Admin enters adjustment amount (positive to add, negative to subtract)
4. API validates:
   - Admin authentication (NextAuth or JWT)
   - User exists
   - Amount is valid number
5. Credits are added/subtracted from existing balance
6. New balance returned and displayed
7. Success message shown, modal auto-closes after 2s
8. User list refreshes

### Key Features

✅ **Credit Addition**: Add promotional credits to user accounts  
✅ **Credit Subtraction**: Remove credits if needed  
✅ **Balance Safety**: Uses `GREATEST(0, credits + amount)` to prevent negatives  
✅ **Dual Auth**: Works with both email/password and Google OAuth admins  
✅ **Validation**: Comprehensive input validation and error handling  
✅ **Logging**: All adjustments logged for audit trail  
✅ **User Feedback**: Real-time success/error messages  
✅ **Modern UI**: Sleek Apple-inspired design matching app theme  

## Testing Checklist

- [ ] Admin can access credit adjustment modal
- [ ] Current balance displays correctly
- [ ] Adding positive credits works
- [ ] Subtracting credits works  
- [ ] Negative balances prevented
- [ ] Success message displays
- [ ] Error handling works for invalid input
- [ ] Modal auto-closes on success
- [ ] User list refreshes
- [ ] Google OAuth admins can adjust credits
- [ ] JWT admins can adjust credits
- [ ] Unauthorized users get 403
- [ ] Logs are created for each adjustment

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Credits added successfully",
  "creditsChange": 50,
  "newBalance": 150
}
```

### Error Responses
```json
{
  "error": "User not found"
}
// or
{
  "error": "Amount must be a valid number"
}
// or
{
  "error": "Forbidden"
}
```

## Security Features

✅ **Authentication**: Verifies admin status via NextAuth or JWT  
✅ **Authorization**: Checks admin role before allowing changes  
✅ **Validation**: Validates all inputs  
✅ **Audit Logging**: Logs all credit adjustments with admin ID  
✅ **Safe Operations**: Prevents negative balances  
✅ **Error Handling**: No sensitive data leaked in errors  

## Usage Example

To add 50 promotional credits to a user:

1. Go to `/admin/users`
2. Find the user
3. Click "Adjust Credits"
4. Enter `50` in the input field
5. Click "Apply Adjustment"
6. Success! User now has 50 more credits

To subtract 20 credits:
- Enter `-20` in the input field
- Same flow, credits are removed

## Technical Details

### Credits Table Schema
```sql
CREATE TABLE credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Creation with Google OAuth
- No `password_hash` required
- `google_id`, `avatar_url`, `email_verified` populated
- Credit initialization happens on first signup
- Credits stored in simple `credits` table

### Dual Credit System
- **Simple Credits**: `credits` table for general/promotional credits
- **Premium Credits**: `user_credits` table for subscription-based credits
- Admin adjustment uses simple credits table
- Works for both free and premium users

## Next Steps

1. Test in production environment
2. Monitor logs for any issues
3. Consider adding credit history table
4. Add bulk credit operations
5. Add credit expiration dates for promotional credits


