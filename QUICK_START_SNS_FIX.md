# SNS User ID Persistence - Quick Summary

## Problem
SNS user IDs (Instagram, TikTok, YouTube, Twitter/X) were being saved as `null` in Supabase instead of the user-entered values.

**User Report:** "やはりsupabaseにはnullが保存されている" (Still, null is being saved to Supabase)

## Root Cause
The backend update operation was using `data.field || null`, which unconditionally converted `undefined` fields to `null`, overwriting existing values in the database.

## Solution
Rewrote the update logic to:
1. Only include fields that were explicitly provided in the request
2. Use a helper function to convert empty strings to null
3. Leave fields untouched if they weren't sent in the update

## Changes Made
**File:** `/backend/src/controllers/company-profile.controller.ts`

**Key Change (Lines 94-114):**
```typescript
// Build update object - only include fields that are explicitly provided
const updateData: any = {
  updatedAt: new Date(),
};

// Add fields if they are explicitly provided (not undefined)
if (data.instagramUserId !== undefined) {
  updateData.instagramUserId = normalizeValue(data.instagramUserId);
}
// ... same pattern for all SNS fields

// Use the selective update object
const company = await prisma.company.upsert({
  where: { userId },
  update: updateData,  // ✅ Only updates fields that were sent
  ...
});
```

## Commit
**c3914ec** - "fix: properly persist SNS user IDs by fixing update logic"

## How to Test
1. Go to Company Profile page
2. Click "編集" (Edit)
3. Enter an Instagram ID (e.g., "test_user")
4. Click "保存" (Save)
5. Check backend console - should show:
   ```
   Company upserted successfully. SNS data saved: {
     instagramUserId: "test_user",
     ...
   }
   ```
6. Reload page
7. Instagram ID should still be "test_user" ✅

## Expected Behavior
- ✅ Enter SNS user ID → Saved to Supabase
- ✅ Reload page → Value displays correctly
- ✅ Update other fields → SNS IDs not affected
- ✅ Clear SNS field → Saved as null
- ✅ Database contains actual values, not null

## Documentation
- `SNS_FIX_FINAL_EXPLANATION.md` - Detailed explanation of the issue and fix
- `SNS_TESTING_CHECKLIST.md` - Complete testing steps with all scenarios
- `TECHNICAL_DETAILS_SNS_FIX.md` - Deep technical dive into Zod and validation

## Status
✅ **FIXED** - SNS user IDs now persist correctly in Supabase

**Latest commit:** `c3914ec`
**Date:** 2025-11-30
