# TikTok Authentication End-to-End Testing Guide

## Overview
This guide provides comprehensive instructions for testing the TikTok authentication feature (Chapter 1-6: SNS認証（TikTok）) implemented in the influencer marketing platform.

## Prerequisites
1. Backend server running on `http://localhost:5002`
2. Frontend running on `http://localhost:3000`
3. Valid user account (INFLUENCER role)
4. RapidAPI credentials configured in `.env.local`

## Setup

### 1. Start Backend Server
```bash
cd backend
npm install
npm run build
npm run dev
# Server should be running on http://localhost:5002
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
# Application should be accessible at http://localhost:3000
```

### 3. Verify Environment Variables
Ensure the following are set in `backend/.env.local`:
```
RAPIDAPI_KEY="fffeeba8fbmsh3f25e93bda6a2b3p164cb2jsn76d173bc25df"
RAPIDAPI_HOST="tiktok-api.p.rapidapi.com"
```

## End-to-End Testing Scenarios

### Scenario 1: User Registration and Login
**Objective:** Create an influencer account and log in

**Steps:**
1. Navigate to `http://localhost:3000/login`
2. Click "Create a new account" / signup link
3. Fill in registration form:
   - Email: `test_influencer@example.com`
   - Password: `Test@123456`
   - Confirm password: `Test@123456`
   - Accept terms & conditions
4. Click "Sign Up"
5. Complete email verification (if required)
6. Log in with credentials

**Expected Result:**
- User successfully registered and logged in
- Redirected to influencer dashboard
- User role is "INFLUENCER"

### Scenario 2: Access TikTok Authentication Section
**Objective:** Navigate to TikTok authentication in profile

**Steps:**
1. Log in as an influencer
2. Navigate to `/influencer/profile?tab=social`
3. Scroll down to "SNS認証（TikTok）" section

**Expected Result:**
- TikTok authentication section is visible
- "TikTok を接続" button is displayed
- No TikTok account is marked as verified (if first time)

### Scenario 3: Authenticate Valid TikTok Account
**Objective:** Successfully authenticate with a valid TikTok username

**Steps:**
1. In the TikTok section, click "TikTok を接続" button
2. Modal dialog opens with:
   - Input field for TikTok username
   - "キャンセル" and "接続" buttons
   - Info text about data encryption
3. Enter a valid TikTok username (e.g., `cristiano`)
4. Click "接続" button
5. Wait for API response

**Expected Result:**
- Loading state shows "検証中..."
- API successfully fetches user data from RapidAPI
- Success message appears
- Button changes to verified state showing:
  - Green checkmark
  - "TikTok アカウントが接続されています"
- User data is saved to database

**Verify in Database:**
```sql
SELECT * FROM "SocialAccount" WHERE platform = 'TIKTOK' AND "influencerId" = '<user-id>';
SELECT * FROM "VerificationRecord" WHERE type = 'SNS' AND "userId" = '<user-id>';
```

### Scenario 4: Handle Invalid TikTok Username
**Objective:** Test validation of invalid TikTok usernames

**Test Cases:**
1. **Too short (< 2 characters)**
   - Input: `a`
   - Expected: Error message "Invalid TikTok username format..."
   - Confirm button should remain disabled

2. **Too long (> 24 characters)**
   - Input: `abcdefghijklmnopqrstuvwxyz`
   - Expected: Error message with format requirements
   - Confirm button disabled

3. **Special characters**
   - Input: `user@name` or `user!`
   - Expected: Validation error before API call
   - No API request should be made

4. **Spaces**
   - Input: `user name`
   - Expected: Validation error
   - Input field value should clear error on edit

### Scenario 5: Handle Non-existent TikTok User
**Objective:** Test handling of accounts that don't exist

**Steps:**
1. Click "TikTok を接続" button
2. Enter a non-existent/fake username (e.g., `thisuserdoesnotexist123`)
3. Click "接続" button

**Expected Result:**
- Loading state appears
- API returns 404 error from RapidAPI
- Error message displays: "TikTok account not found. Please check the username."
- Modal remains open for retry
- Button text returns to "接続"

### Scenario 6: Handle RapidAPI Rate Limiting
**Objective:** Test rate limit error handling

**Setup:**
Make multiple rapid requests to exceed RapidAPI rate limits

**Expected Result:**
- Error message: "API rate limit exceeded. Please try again later."
- User is informed to retry after some time
- Modal remains open for retry

### Scenario 7: View Verified TikTok Account
**Objective:** Display verified TikTok account information

**Steps:**
1. After successful authentication (Scenario 3), remain on profile page
2. TikTok section should show:
   - Green checkmark box
   - Text "TikTok アカウントが接続されています"
   - No input modal should appear on button click

**Expected Result:**
- Verified state is persistent across page reloads
- Account information is correctly stored and retrieved

### Scenario 8: Account Information Display
**Objective:** Verify fetched TikTok data is correctly displayed

**Steps:**
1. Complete TikTok authentication with username `cristiano`
2. Check the "登録済みアカウント" (Registered Accounts) section

**Expected Result:**
- Account card shows:
  - TikTok icon (🎵)
  - Username: `@cristiano`
  - Follower count (formatted with comma separator)
  - Engagement rate percentage
  - "✓ 認証済み" badge
  - Sync and edit buttons
  - Last synced timestamp

### Scenario 9: Sync TikTok Account Data
**Objective:** Update follower counts and engagement metrics

**Steps:**
1. From authenticated account card, click sync button (🔄)
2. Button shows loading state: "Syncing..."
3. Wait for sync to complete

**Expected Result:**
- Button returns to normal state
- Follower count updates if changed
- Last synced timestamp updates
- Success message appears (if implemented)

### Scenario 10: Remove TikTok Authentication
**Objective:** Remove TikTok account from profile

**Steps:**
1. In the TikTok verified section, look for delete/remove option
2. (Or navigate to account card and click delete button)
3. Confirm removal when prompted

**Expected Result:**
- Account is deleted from database
- TikTok section returns to "TikTok を接続" button
- Success message displays
- No verification badge shown

### Scenario 11: API Endpoint Testing with cURL
**Objective:** Test backend endpoints directly

```bash
# Set variables
TOKEN="your-jwt-token-here"
API_URL="http://localhost:5002"

# 1. Authenticate TikTok Account
curl -X POST "$API_URL/api/sns/tiktok/authenticate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tikTokUsername":"cristiano"}'

# Expected Response:
# {
#   "message": "TikTok account authenticated successfully",
#   "account": {
#     "username": "cristiano",
#     "displayName": "Cristiano Ronaldo",
#     "followerCount": 614000000,
#     "followingCount": 500,
#     "videoCount": 2500,
#     "verified": true,
#     "profileUrl": "https://www.tiktok.com/@cristiano"
#   }
# }

# 2. Get TikTok Status
curl -X GET "$API_URL/api/sns/tiktok/status" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response:
# {
#   "isVerified": true,
#   "account": {
#     "username": "cristiano",
#     "followerCount": 614000000,
#     "verifiedAt": "2025-01-15T10:30:00Z"
#   }
# }

# 3. Get Public TikTok User Data (no auth required)
curl -X GET "$API_URL/api/sns/tiktok/user?username=cristiano"

# Expected Response:
# {
#   "user": {
#     "id": "123456789",
#     "username": "cristiano",
#     "displayName": "Cristiano Ronaldo",
#     "followerCount": 614000000,
#     "followingCount": 500,
#     "videoCount": 2500,
#     "verified": true,
#     "profileImageUrl": "https://example.com/avatar.jpg"
#   }
# }

# 4. Remove TikTok Account
curl -X DELETE "$API_URL/api/sns/tiktok" \
  -H "Authorization: Bearer $TOKEN"

# Expected Response:
# {
#   "message": "TikTok account removed successfully"
# }
```

## Debugging Tips

### Check Backend Logs
```bash
# Terminal running backend server should show:
# ✓ TikTok user info retrieved: cristiano
# ✓ TikTok account created for influencer: <influencer-id>
# ✓ Verification record updated for user: <user-id>
```

### Check Browser Console
- Open DevTools (F12)
- Network tab: Verify API requests to `/api/sns/tiktok/*`
- Console tab: Check for any JavaScript errors

### Database Verification
```sql
-- Check SocialAccount table
SELECT id, "influencerId", platform, username, "followerCount", "isVerified", "isConnected", "lastSynced"
FROM "SocialAccount"
WHERE platform = 'TIKTOK'
ORDER BY "lastSynced" DESC;

-- Check VerificationRecord table
SELECT id, "userId", type, status, "verifiedAt", metadata
FROM "VerificationRecord"
WHERE type = 'SNS'
ORDER BY "verifiedAt" DESC;

-- Check Influencer profile
SELECT id, "userId", "tikTokUsername"
FROM "Influencer"
WHERE "userId" = '<current-user-id>';
```

## Performance Testing

### Load Testing
Test multiple users authenticating simultaneously:
```bash
# Using Apache Bench
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
   -H "Content-Type: application/json" \
   -p request.json \
   "http://localhost:5002/api/sns/tiktok/authenticate"
```

### Response Time
- Initial API call to RapidAPI: ~500-1500ms
- Frontend UI response: <100ms
- Database save: ~50-100ms
- Total user experience: 1-2 seconds

## Security Testing

### 1. Authentication Required
```bash
# Without token, should return 401
curl -X GET "http://localhost:5002/api/sns/tiktok/status"
# Expected: 401 Unauthorized
```

### 2. Input Validation
```bash
# Test SQL injection
curl -X POST "http://localhost:5002/api/sns/tiktok/authenticate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tikTokUsername":"user\"; DROP TABLE users; --"}'
# Expected: 400 Bad Request (validation error)

# Test XSS
curl -X POST "http://localhost:5002/api/sns/tiktok/authenticate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tikTokUsername":"<script>alert(\"xss\")</script>"}'
# Expected: 400 Bad Request
```

### 3. Rate Limiting
- Test excessive requests to same endpoint
- Verify rate limit headers in response

## Checklist for Complete Testing

- [ ] User can authenticate valid TikTok account
- [ ] Invalid usernames are rejected with proper error messages
- [ ] Non-existent TikTok users return appropriate error
- [ ] RapidAPI errors are handled gracefully
- [ ] TikTok data persists in database
- [ ] Verification record is created/updated
- [ ] User can view authenticated TikTok account
- [ ] Follower counts can be synced
- [ ] User can remove TikTok authentication
- [ ] API endpoints respond within acceptable time
- [ ] Security validation prevents injection attacks
- [ ] Loading states display correctly in UI
- [ ] Error messages are clear and actionable
- [ ] Verified state persists across page reloads
- [ ] Mobile responsive design works correctly

## Troubleshooting

### Issue: "Invalid RapidAPI Key"
**Solution:** Verify RAPIDAPI_KEY in `.env.local` matches your RapidAPI account

### Issue: "TikTok user not found" for valid user
**Solution:** RapidAPI may have rate limited. Wait a few minutes or check API status

### Issue: Modal not closing after successful auth
**Solution:** Check browser console for errors. Ensure fetchProfile() is being called

### Issue: Database not updating
**Solution:**
1. Verify DATABASE_URL is correct
2. Check Prisma migration: `npx prisma migrate status`
3. Verify Influencer profile exists before saving

## Next Steps

1. **Test other SNS platforms** (Instagram, YouTube, X)
2. **Implement batch follower updates** for multiple accounts
3. **Add engagement metrics** calculation
4. **Create admin dashboard** for managing SNS accounts
5. **Implement webhook** for real-time follower count updates

## Additional Resources

- [RapidAPI TikTok API Documentation](https://rapidapi.com/api-sports/api/tiktok-api)
- [Backend Service Implementation](./backend/src/services/tiktok-auth.service.ts)
- [Controller Implementation](./backend/src/controllers/tiktok-auth.controller.ts)
- [Frontend Component](./frontend/src/components/sns/TikTokAuthButton.tsx)
- [Test Suite](./backend/src/__tests__/tiktok-auth.test.ts)

---

**Last Updated:** 2025-01-15
**Status:** Chapter 1-6 Implementation Complete
