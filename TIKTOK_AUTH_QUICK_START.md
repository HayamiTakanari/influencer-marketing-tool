# TikTok Authentication Quick Start Guide

## 🚀 5-Minute Setup

### 1. Verify Backend is Running
```bash
cd backend
npm run dev
# Should see: "Server is running on port 5002"
```

### 2. Verify Frontend is Running
```bash
cd frontend
npm run dev
# Should see: "Local: http://localhost:3000"
```

### 3. Check Environment Variables
```bash
# backend/.env.local should have:
RAPIDAPI_KEY="fffeeba8fbmsh3f25e93bda6a2b3p164cb2jsn76d173bc25df"
RAPIDAPI_HOST="tiktok-api.p.rapidapi.com"
```

### 4. Access Application
```
http://localhost:3000
```

---

## 🔐 Login & Navigate to TikTok Auth

1. **Login as Influencer**
   ```
   Navigate to: http://localhost:3000/login
   Or: http://localhost:3000/signup
   ```

2. **Go to Profile > SNS Tab**
   ```
   Navigate to: http://localhost:3000/influencer/profile?tab=social
   Scroll down to: "SNS認証（TikTok）" section
   ```

3. **Click "TikTok を接続"**
   - Modal dialog appears
   - Enter TikTok username (e.g., `cristiano`)
   - Click "接続"

4. **Success!**
   - Account authenticated
   - Data saved to database
   - UI updates to verified state

---

## 📝 Quick Test Cases

### ✅ Valid Test
```
Username: cristiano
Expected: Success with account data displayed
```

### ❌ Invalid Username Format
```
Username: a (too short)
Expected: Error message before API call
```

### ❌ Non-existent User
```
Username: thisuserdoesnotexist123
Expected: "TikTok account not found" error
```

---

## 🔧 API Testing with cURL

### Get Auth Token
```bash
# After login, token is in localStorage
TOKEN=$(curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"password"}' \
  | jq -r '.token')
```

### Test Authentication Endpoint
```bash
curl -X POST http://localhost:5002/api/sns/tiktok/authenticate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tikTokUsername":"cristiano"}'
```

### Check Status
```bash
curl -X GET http://localhost:5002/api/sns/tiktok/status \
  -H "Authorization: Bearer $TOKEN"
```

### Get Public User Data
```bash
curl -X GET "http://localhost:5002/api/sns/tiktok/user?username=cristiano"
```

---

## 🗄️ Database Verification

### Check SocialAccount
```sql
SELECT * FROM "SocialAccount"
WHERE platform = 'TIKTOK'
LIMIT 5;
```

### Check Verification Record
```sql
SELECT * FROM "VerificationRecord"
WHERE type = 'SNS'
LIMIT 5;
```

---

## 📊 File Structure

```
influencer-marketing-tool/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── tiktok-auth.service.ts (370 lines)
│   │   ├── controllers/
│   │   │   └── tiktok-auth.controller.ts (240 lines)
│   │   ├── routes/
│   │   │   └── tiktok-auth.routes.ts (50 lines)
│   │   └── __tests__/
│   │       ├── tiktok-auth.test.ts (150 lines)
│   │       └── tiktok-auth.integration.test.ts (350 lines)
│   ├── .env (updated)
│   ├── .env.local (updated)
│   └── .env.example (updated)
│
├── frontend/
│   └── src/
│       ├── components/
│       │   └── sns/
│       │       ├── TikTokAuthButton.tsx (150 lines)
│       │       └── TikTokAuth.module.css (350 lines)
│       └── pages/
│           └── influencer/
│               └── profile.tsx (updated)
│
├── TIKTOK_AUTH_TESTING.md (comprehensive testing guide)
├── TIKTOK_AUTH_IMPLEMENTATION_SUMMARY.md (full documentation)
└── TIKTOK_AUTH_QUICK_START.md (this file)
```

---

## 🚦 Status Indicators

### Frontend Component States
```
1. Initial: "TikTok を接続" button
2. Loading: Modal with input, button shows "検証中..."
3. Error: Red error message box, can retry
4. Success: Green checkmark, "TikTok アカウントが接続されています"
```

### Backend Response Status
```
200: Success
400: Invalid input
401: Unauthorized
404: User not found
429: Rate limit exceeded
500: Server error
```

---

## 🔍 Debugging

### Check Backend Logs
```bash
# Should see success logs like:
# ✓ TikTok user info retrieved: cristiano
# ✓ TikTok account created for influencer: <id>
# ✓ Verification record updated for user: <id>
```

### Check Frontend Console (F12)
```javascript
// Network tab: Look for successful request to /api/sns/tiktok/authenticate
// Console tab: No errors should appear
```

### Common Errors
```
"Invalid TikTok username format" → Username doesn't match regex
"TikTok account not found" → User doesn't exist or RapidAPI rate limited
"Failed to authenticate" → Server error, check logs
```

---

## 📚 Full Documentation

For complete details, see:
- **Testing Guide:** `TIKTOK_AUTH_TESTING.md`
- **Implementation Details:** `TIKTOK_AUTH_IMPLEMENTATION_SUMMARY.md`

---

## ✨ Key Features

✅ **Valid TikTok Username Authentication**
- Format validation (2-24 chars, alphanumeric + . and _)
- Automatic data fetching from RapidAPI
- Database persistence with Prisma

✅ **Error Handling**
- User not found → Helpful error message
- Rate limit exceeded → Inform user to retry
- Invalid format → Prevent API call

✅ **UI/UX**
- Modal-based input (no page navigation)
- Loading states for async operations
- Clear success/error messages
- Verified state display

✅ **Security**
- JWT authentication required
- Input sanitization
- SQL injection prevention
- XSS protection

✅ **Testing**
- Unit tests for service layer
- Integration tests for endpoints
- Manual testing guide with 11 scenarios
- cURL examples for API testing

---

## 🎯 Next Steps

1. **Immediate:** Test with a real TikTok username
2. **Short-term:** Test error scenarios
3. **Medium-term:** Implement other SNS platforms (Instagram, YouTube, X)
4. **Long-term:** Add analytics and reporting features

---

## 📞 Support

**Common Questions:**

Q: Which TikTok usernames can I test with?
A: Any valid TikTok username (e.g., `cristiano`, `therock`, `charlidamelio`)

Q: What if I get rate limited?
A: RapidAPI has rate limits. Wait a few minutes before retrying.

Q: Can I delete and re-add TikTok authentication?
A: Yes! Remove and then re-authenticate. Database will be updated.

Q: Is the TikTok data encrypted?
A: Database passwords are encrypted. OAuth tokens would be encrypted in production.

---

## ✅ Verification Checklist

- [ ] Backend running on port 5002
- [ ] Frontend running on port 3000
- [ ] Can login as influencer
- [ ] Can navigate to Social tab in profile
- [ ] TikTok section visible
- [ ] Can open modal dialog
- [ ] Can authenticate valid TikTok username
- [ ] Success message appears
- [ ] Verified state displays
- [ ] Can view authenticated account details
- [ ] Database shows new SocialAccount record
- [ ] VerificationRecord shows SNS status
- [ ] All tests passing: `npm test -- tiktok-auth`

---

**Status:** ✅ Ready to Use
**Last Updated:** January 15, 2025
**Version:** 1.0
