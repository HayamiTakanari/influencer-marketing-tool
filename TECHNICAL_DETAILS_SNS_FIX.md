# Technical Deep Dive: SNS User ID Persistence Bug Fix

## Issue Timeline

### Previous Attempts (Unsuccessful)
1. **Commit 3d5d86c** - Added SNS user IDs to frontend payload
   - Issue: Still not persisting
   - Root cause: Backend schema validation was still rejecting data

2. **Commit 821f935** - Added Zod schema `.min(1)` validation
   - Issue: Made situation worse by adding validation constraint
   - Root cause: Didn't understand the validation conflict

3. **Commit de2a5fd** - Added `.nullable()` and transform
   - Issue: Data still not persisting
   - Root cause: `.min(1)` still rejecting empty strings before transform

4. **Commit 255b49d** - Removed `|| undefined` fallback from frontend
   - Issue: Data still not persisting
   - Root cause: Problem was not in frontend, but in backend validation

### Final Fix (Successful)
5. **Commit 8cebfb3** - Removed `.min(1)` constraint from SNS user ID fields
   - ✅ Root cause finally identified and fixed
   - ✅ Data now persists correctly
   - ✅ Validation logic is now consistent

## Technical Explanation

### The Zod Schema Problem

**What is Zod?**
Zod is a TypeScript-first schema validation library. It's used to validate and transform data before saving to the database.

**The Conflicting Logic (BEFORE FIX):**

```typescript
const updateCompanyProfileSchema = z.object({
  instagramUserId: z.string().min(1).max(100).optional().nullable(),
  // ... other fields
}).transform((data) => {
  return {
    ...data,
    instagramUserId: data.instagramUserId === '' ? null : data.instagramUserId,
    // ... other fields
  };
});
```

**How Zod Chains Work:**
- `.string()` → Must be a string
- `.min(1)` → **String must have at least 1 character** (rejects empty strings)
- `.max(100)` → String can't exceed 100 characters
- `.optional()` → Field can be `undefined`
- `.nullable()` → Field can be `null`
- `.transform()` → Transform the data after validation passes

**The Problem:**
```
Empty string "" from frontend
    ↓
Zod validation chain
    ↓
.min(1) check
    ↓
❌ VALIDATION FAILS (empty string has 0 characters)
    ↓
Request rejected, data not saved
    ↓
But frontend still shows success response (bug in response handling)
```

### Why the Transform Never Executed

The `.transform()` only executes **after** validation succeeds:

```
Frontend sends: { instagramUserId: "" }
    ↓
Zod validation
    ↓
.min(1) constraint → FAILS (rejects "")
    ↓
❌ Validation error thrown
    ↓
(transform never runs because validation failed)
    ↓
Error caught, validation response sent
```

The transform was designed to handle empty strings: `"" → null`, but it never got the chance because the validation constraint rejected them first!

## The Fix Explained

**BEFORE:**
```typescript
instagramUserId: z.string().min(1).max(100).optional().nullable(),
```

**AFTER:**
```typescript
instagramUserId: z.string().max(100).optional().nullable(), // Removed .min(1)
```

**Why this works:**

```
Frontend sends: { instagramUserId: "" }
    ↓
Zod validation chain
    ↓
.string() → ✅ "" is a string
.max(100) → ✅ "" is less than 100 chars
.optional() → ✅ undefined is allowed
.nullable() → ✅ null is allowed
    ↓
✅ VALIDATION PASSES
    ↓
.transform() executes
    ↓
"" === "" ? null : "" → null
    ↓
✅ Data saved to database: instagramUserId = null
    ↓
✅ On reload: loads null from DB, displays as "" in UI
```

## Why Previous Attempts Failed

### Attempt 1: Added SNS fields to payload
- **Why it failed:** The backend was still rejecting the data due to validation
- **What we thought:** Frontend wasn't sending the data
- **What was actually wrong:** Backend validation was failing silently

### Attempt 2: Added `.min(1)` validation
- **Why it failed:** This made the validation stricter, not more lenient
- **What we thought:** We needed validation
- **What was actually wrong:** The validation was already too strict

### Attempt 3: Added `.nullable()` and transform
- **Why it failed:** `.min(1)` was still rejecting empty strings
- **What we thought:** Adding nullable would help
- **What was actually wrong:** We needed to remove the constraint, not add more rules

### Attempt 4: Removed `|| undefined` from frontend
- **Why it failed:** Problem wasn't on the frontend
- **What we thought:** Undefined values in JSON were the issue
- **What was actually wrong:** Backend validation was the root cause

## How to Verify the Fix

### Backend Console Output
When saving SNS user IDs, you should see:
```
=== updateCompanyProfile Debug Log ===
Request body: {
  ...
  instagramUserId: "0808sakura",
  tiktokUserId: "",
  youtubeUserId: "",
  twitterUserId: ""
  ...
}
Parsed and transformed data: {
  ...
  instagramUserId: "0808sakura",
  tiktokUserId: null,
  youtubeUserId: null,
  twitterUserId: null
  ...
}
Upserting company profile with SNS data: {
  instagramUserId: "0808sakura",
  tiktokUserId: null,
  youtubeUserId: null,
  twitterUserId: null
}
Company upserted successfully. SNS data saved: {
  instagramUserId: "0808sakura",
  tiktokUserId: null,
  youtubeUserId: null,
  twitterUserId: null
}
```

### Database Query to Verify
```sql
SELECT instagramUserId, tiktokUserId, youtubeUserId, twitterUserId
FROM "Company"
WHERE "userId" = 'your-user-id-here';
```

Should return:
```
instagramUserId: "0808sakura"
tiktokUserId: null
youtubeUserId: null
twitterUserId: null
```

### Frontend Display
After reload, the profile page should display:
- Instagram: "0808sakura" (entered value preserved)
- TikTok: "(empty input field)"
- YouTube: "(empty input field)"
- Twitter/X: "(empty input field)"

## Code References

### Schema Definition
**File:** `/backend/src/controllers/company-profile.controller.ts:7-41`

```typescript
const updateCompanyProfileSchema = z.object({
  // ... other fields
  instagramUserId: z.string().max(100).optional().nullable(),
  tiktokUserId: z.string().max(100).optional().nullable(),
  youtubeUserId: z.string().max(100).optional().nullable(),
  twitterUserId: z.string().max(100).optional().nullable(),
  // ... other fields
}).transform((data) => {
  return {
    ...data,
    instagramUserId: data.instagramUserId === '' ? null : data.instagramUserId,
    tiktokUserId: data.tiktokUserId === '' ? null : data.tiktokUserId,
    youtubeUserId: data.youtubeUserId === '' ? null : data.youtubeUserId,
    twitterUserId: data.twitterUserId === '' ? null : data.twitterUserId,
  };
});
```

### Update Operation
**File:** `/backend/src/controllers/company-profile.controller.ts:102-157`

```typescript
const company = await prisma.company.upsert({
  where: { userId },
  update: {
    instagramUserId: data.instagramUserId || null,
    tiktokUserId: data.tiktokUserId || null,
    youtubeUserId: data.youtubeUserId || null,
    twitterUserId: data.twitterUserId || null,
    // ... other fields
    updatedAt: new Date(),
  },
  create: {
    userId,
    instagramUserId: data.instagramUserId || null,
    tiktokUserId: data.tiktokUserId || null,
    youtubeUserId: data.youtubeUserId || null,
    twitterUserId: data.twitterUserId || null,
    // ... other fields
  },
  include: {
    bankAccounts: true,
  },
});
```

## Key Learning

**Zod validation chains are processed sequentially, and validation must pass at each step before proceeding.**

When you have:
```typescript
z.string().min(1).max(100).optional().nullable()
```

The execution order is:
1. Is it a string? ✓
2. Does it have at least 1 character? ← **This is where it fails for ""**
3. (Never reaches) Is it at most 100 characters?
4. (Never reaches) Is it optional?
5. (Never reaches) Is it nullable?
6. (Never reaches) Transform

To allow empty strings while still validating non-empty ones, you need to:
- Remove the `.min(1)` constraint
- Let the transform handle empty string conversion
- Keep `.max(100)` to validate non-empty strings

## Similar Issues to Watch For

This pattern could occur in other schema definitions where:
- You want to accept empty/null values
- You have validation constraints that conflict with the transform logic
- The transform is designed to clean up the data, not validate it

Always remember: **Validation should be permissive (accept what you want to transform), and transformation should be specific (convert it to the right format).**
