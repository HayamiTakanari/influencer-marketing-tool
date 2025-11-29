# Supabase RLS Fix - Critical Action Required

## Problem Summary

The application is experiencing **RLS (Row Level Security) permission errors** (Error Code: 42501) on all Supabase tables. This prevents all data access from the frontend, causing:

- NotificationBell component unable to fetch notifications
- Influencer search page unable to fetch influencers
- Project list page unable to fetch projects
- Project detail page unable to fetch project details
- Dashboard API unable to fetch data
- Payment history unable to load

## Root Cause

**Row Level Security (RLS) is ENABLED on Supabase tables**, blocking anonymous access. Since the application uses anonymous Supabase client to fetch data, RLS policies must be disabled for development/initial deployment.

## Solution

Execute the following SQL in **Supabase SQL Editor** (https://app.supabase.com → Your Project → SQL Editor):

### Step 1: Disable RLS on All Tables

```sql
-- Disable RLS on all tables in the public schema
ALTER TABLE "public"."Notification" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Influencer" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Project" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Application" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Message" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Review" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."InfluencerProfile" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProjectApplication" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Contract" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Invoice" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Deliverable" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Performance" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Analytics" DISABLE ROW LEVEL SECURITY;
```

### Step 2: Verify RLS is Disabled

Check the **Authentication → Policies** section in Supabase dashboard. All tables should show "RLS is OFF" for each table.

## Expected Results After Fix

Once RLS is disabled:

1. ✅ NotificationBell component will fetch unread count successfully
2. ✅ Influencer search page will display influencers
3. ✅ Project pages will load project data
4. ✅ Dashboard will display analytics data
5. ✅ Payment history will load without errors

## Technical Details

### Current Frontend Setup

The frontend uses Supabase anonymous client:

```typescript
// /frontend/src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})
```

This client has **no authentication credentials**, only the public anonymous key. Therefore:
- It can only access tables where RLS is **DISABLED**
- All permission errors (42501) are due to RLS being enabled

### Migration Progress

Tables already migrated from Backend API to Supabase:
- ✅ Notification (used by NotificationBell)
- ✅ Influencer (used by search pages)
- ✅ Project (used by project management pages)

### Remaining Backend API Issues

Pages still using Backend API (http://localhost:3001):
- Dashboard (`/api/dashboard`)
- Payments (`/api/payments/history`, `/api/payments/stats`)
- Various other pages

These will be migrated to Supabase after RLS fix is confirmed working.

## Security Note

⚠️ **For Production Deployment**:

Disabling RLS is suitable for **development only**. Before production deployment:

1. Implement proper RLS policies with authentication
2. Use authenticated Supabase client (with JWT tokens)
3. Create policies like:
   ```sql
   CREATE POLICY "Users can read their own notifications"
   ON "public"."Notification"
   FOR SELECT
   TO authenticated
   USING (auth.uid()::text = "userId");
   ```

## Testing After Fix

1. Open http://localhost:3000/company/projects/list
2. Check browser console for errors
3. Should see projects loading without RLS errors
4. NotificationBell should show unread count badge

## Support

If errors persist after RLS fix:
1. Clear browser cache and localStorage
2. Restart frontend development server
3. Verify Supabase credentials in environment variables
4. Check Supabase dashboard for table accessibility
