# SNS User ID Persistence - Testing Checklist

## Pre-Test Setup
- [ ] Backend is running (npm run dev)
- [ ] Frontend is running (npm run dev)
- [ ] You are logged in as a company user
- [ ] Navigate to Company Profile page

## Test 1: Save a Single SNS User ID
**Objective:** Verify that entering and saving a single SNS user ID persists correctly

**Steps:**
1. [ ] Click "編集" (Edit) button
2. [ ] Enter Instagram ID: `test_instagram_001`
3. [ ] Leave other SNS fields empty
4. [ ] Click "保存" (Save)
5. [ ] Check backend console for log showing instagramUserId: "test_instagram_001"
6. [ ] Reload page (Cmd+R or browser refresh)
7. [ ] Verify Instagram ID still shows `test_instagram_001`

**Expected Result:** ✅ Instagram ID persists after reload

**Backend Console Check:**
```
Company upserted successfully. SNS data saved: {
  instagramUserId: "test_instagram_001",
  tiktokUserId: null,
  youtubeUserId: null,
  twitterUserId: null
}
```

---

## Test 2: Save Multiple SNS User IDs
**Objective:** Verify that multiple SNS user IDs can be saved together

**Steps:**
1. [ ] Click "編集" (Edit)
2. [ ] Enter values:
   - Instagram: `ig_handle`
   - TikTok: `tiktok_handle`
   - YouTube: `yt_channel`
3. [ ] Leave Twitter empty
4. [ ] Click "保存" (Save)
5. [ ] Reload page
6. [ ] Verify all three values are displayed

**Expected Result:** ✅ All entered SNS IDs persist

---

## Test 3: Update Non-SNS Fields Without Changing SNS
**Objective:** Verify that updating other fields doesn't overwrite SNS user IDs

**Precondition:** Have Instagram ID saved as `ig_handle`

**Steps:**
1. [ ] Click "編集" (Edit)
2. [ ] Change **only** company name to something else
3. [ ] Keep SNS fields unchanged
4. [ ] Click "保存" (Save)
5. [ ] Reload page
6. [ ] Verify Instagram ID is still `ig_handle`

**Expected Result:** ✅ Instagram ID is preserved even though we didn't touch it

---

## Test 4: Clear a Previously Saved SNS Field
**Objective:** Verify that empty SNS fields are saved as null

**Precondition:** Have Instagram ID saved as `ig_handle`

**Steps:**
1. [ ] Click "編集" (Edit)
2. [ ] Clear Instagram field (select all and delete)
3. [ ] Click "保存" (Save)
4. [ ] Check backend console - should show instagramUserId: null
5. [ ] Reload page
6. [ ] Verify Instagram field is now empty

**Expected Result:** ✅ Field is cleared and empty on reload

**Backend Console Check:**
```
Company upserted successfully. SNS data saved: {
  instagramUserId: null,
  ...
}
```

---

## Test 5: Database Verification
**Objective:** Verify the actual database contains the correct values

**Steps:**
1. [ ] Use Supabase dashboard or SQL client
2. [ ] Query Company table:
```sql
SELECT instagramUserId, tiktokUserId, youtubeUserId, twitterUserId
FROM "Company"
WHERE "userId" = 'YOUR_USER_ID';
```
3. [ ] Verify the values match what's displayed in the frontend

**Expected Result:** ✅ Database contains the correct values (not NULL when user entered data)

---

## Test 6: All Four Platforms Together
**Objective:** Comprehensive test with all SNS platforms

**Steps:**
1. [ ] Click "編集" (Edit)
2. [ ] Enter all four:
   - Instagram: `@insta_handle`
   - TikTok: `@tiktok_handle`
   - YouTube: `@yt_handle`
   - X (Twitter): `@x_handle`
3. [ ] Click "保存" (Save)
4. [ ] Reload page multiple times
5. [ ] Verify all four persist each time

**Expected Result:** ✅ All four platforms save and persist correctly

---

## Debugging Tips

### If SNS Fields Show as Empty After Save:
1. Check backend console logs for:
   - `Upserting company profile with SNS data: { ... }`
   - `Company upserted successfully. SNS data saved: { ... }`
2. If all SNS fields show as null in these logs, the issue is still in the save operation
3. If they show the correct values, check if Supabase is actually updating

### If Values Show Correctly but Disappear on Reload:
1. Check Supabase database directly to confirm the values are saved
2. If not saved in DB, issue is in the write operation
3. If saved in DB, issue is in the fetch operation

### Check Backend Console Output:
Look for these log messages after clicking "保存":
```
=== updateCompanyProfile Debug Log ===
Request body: { ... instagramUserId: "value" ... }
Parsed data: { ... instagramUserId: "value" ... }
Upserting company profile with SNS data: { ... }
Company upserted successfully. SNS data saved: { ... }
```

All of these should show the actual values, not undefined or null.

---

## Common Issues & Solutions

| Issue | Check |
|-------|-------|
| Saves but disappears on reload | Database actually has the value? |
| Saves as null in database | updateData is including undefined fields? |
| Other fields get overwritten | Check update logic uses selective field inclusion |
| Validation errors | Check Zod schema doesn't have conflicting rules |

---

## Success Criteria

✅ **ALL tests pass when:**
1. Entered SNS user IDs are saved to Supabase
2. Values persist after page reload
3. Other field updates don't overwrite SNS fields
4. Empty/cleared fields are properly set to null
5. Backend logs show correct values throughout
6. Database confirms correct values are stored

**Commit Reference:** `c3914ec` - "fix: properly persist SNS user IDs by fixing update logic"
