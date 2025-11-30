# SNS User ID Persistence Fix - Summary

## Problem Statement
SNS user IDs (Instagram, TikTok, YouTube, Twitter/X usernames) entered in the company profile form were not persisting to the database. Users would:
1. Enter a value like "0808sakura" in the Instagram User ID field
2. Click "Save" and see "success: true" response
3. Reload the page and find the value was gone

## Root Cause Analysis

The issue was in the Zod validation schema at `/backend/src/controllers/company-profile.controller.ts:7-41`.

**The Problem:**
```typescript
instagramUserId: z.string().min(1).max(100).optional().nullable(),
```

This schema had **conflicting validation rules**:
- `.min(1)` - Requires minimum 1 character (rejects empty strings)
- `.optional().nullable()` - Allows undefined or null
- `.transform()` - Tries to convert empty strings to null

The issue: When an empty string (`""`) was sent from the frontend for an unfilled SNS field:
1. Zod validation would **reject** it as invalid (due to `.min(1)`)
2. This caused the entire request validation to fail silently
3. Data was never saved, but the response still showed `success: true`

## Solution

**Removed `.min(1)` constraint** from all SNS user ID fields:

```typescript
// Before (BROKEN)
instagramUserId: z.string().min(1).max(100).optional().nullable(),

// After (FIXED)
instagramUserId: z.string().max(100).optional().nullable(), // Removed .min(1)
```

Now the validation flow:
1. ✅ Empty strings pass Zod validation
2. ✅ `.transform()` converts `""` → `null`
3. ✅ Data is successfully saved to database
4. ✅ On reload, values display correctly

## Files Modified

- `/backend/src/controllers/company-profile.controller.ts`
  - Removed `.min(1)` from 4 SNS user ID fields
  - Added debug logging to track data flow

## Testing Steps

### Manual Testing in Browser
1. **Enter SNS User IDs:**
   - Go to Company Profile page
   - Click "編集" (Edit)
   - Fill in SNS user IDs (e.g., "0808sakura" for Instagram)
   - Leave others empty
   - Click "保存" (Save)

2. **Verify Save Success:**
   - Check backend console for:
     ```
     === updateCompanyProfile Debug Log ===
     Request body: { ..., instagramUserId: "0808sakura", ... }
     Parsed and transformed data: { ..., instagramUserId: "0808sakura", ... }
     Upserting company profile with SNS data: { instagramUserId: "0808sakura", ... }
     Company upserted successfully. SNS data saved: { instagramUserId: "0808sakura", ... }
     ```

3. **Verify Data Persists:**
   - Reload the page (Cmd+R or browser refresh)
   - Verify all entered SNS user IDs still display
   - The values should **not disappear**

### Data Expectations

**When user enters "0808sakura" and leaves other SNS fields empty:**
- Database should save:
  ```
  instagramUserId: "0808sakura"
  tiktokUserId: null
  youtubeUserId: null
  twitterUserId: null
  ```

**On page reload, formData should show:**
  ```
  instagramUserId: "0808sakura"
  tiktokUserId: ""
  youtubeUserId: ""
  twitterUserId: ""
  ```

## Affected Fields

These SNS user ID fields were fixed:
- `instagramUserId` (Instagram username)
- `tiktokUserId` (TikTok username)
- `youtubeUserId` (YouTube username)
- `twitterUserId` (X/Twitter username)

## Debug Logging Added

Backend now logs:
1. **Request body** - Raw data from frontend
2. **Parsed and transformed data** - After Zod validation
3. **Upserting with SNS data** - Before database write
4. **SNS data saved confirmation** - After successful save

These logs will appear in the backend terminal and help diagnose any future issues.

## Related Code Flow

**Frontend (`/frontend/src/pages/company/profile.tsx`):**
- Lines 114-135: JSON payload construction
- Lines 69-90: Data loading from API response
- Lines 300-370: SNS user ID input fields

**Backend (`/backend/src/controllers/company-profile.controller.ts`):**
- Lines 7-41: Zod schema validation (FIXED)
- Lines 95-157: Update/create operation with debug logging
- Lines 109-150: Prisma upsert command

**Database (`/backend/prisma/schema.prisma`):**
- Lines 182-185: Company model SNS user ID fields (String? optional)

## Commit Reference
Commit: `8cebfb3`
- Fixed Zod schema validation for SNS user IDs
- Added comprehensive debug logging
- Root cause: Conflicting `.min(1)` validation with transform logic
