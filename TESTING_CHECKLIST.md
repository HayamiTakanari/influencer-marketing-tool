# Production Testing Checklist

## Frontend Testing (Browser)

### Page Navigation
- [ ] Home page loads correctly
- [ ] Login page works and submits credentials
- [ ] Registration page works for both roles
- [ ] Dashboard loads after login
- [ ] Navigation menu works on all pages
- [ ] Links redirect to correct pages

### Profile Page (Company)
- [ ] `/profile` page loads
- [ ] Basic info tab displays form
- [ ] SNS tab shows platforms
- [ ] Portfolio tab displays items
- [ ] Invoice tab shows billing info
- [ ] Working status tab loads (if visible)
- [ ] Tab switching updates URL (query parameter)
- [ ] URL refresh maintains tab selection

### Profile Page (Influencer)
- [ ] `/influencer/profile` page loads
- [ ] All tabs work correctly
- [ ] Tab URL routing works
- [ ] SNS verification form functional
- [ ] Account manager displays correctly

### SNS Verification
- [ ] TikTok verify button works
- [ ] Instagram shows "【開発中】" status
- [ ] YouTube shows "【開発中】" status
- [ ] Twitter shows "【開発中】" status
- [ ] Error messages display properly
- [ ] Loading states show during processing

### Form Submission
- [ ] Profile form submits without errors
- [ ] Validation messages display on errors
- [ ] Success messages show after saving
- [ ] Form data persists on refresh

### Responsive Design
- [ ] Desktop layout correct (1920px+)
- [ ] Tablet layout correct (768px-1024px)
- [ ] Mobile layout correct (<768px)
- [ ] Touch interactions work on mobile
- [ ] No horizontal scrolling

### Performance
- [ ] Page load time < 3 seconds
- [ ] Images load properly
- [ ] Smooth animations/transitions
- [ ] No console errors
- [ ] No memory leaks

## Backend API Testing

### Health Check
```bash
curl http://localhost:5002/health
# Expected: {"status": "ok"}
```

### Authentication
```bash
# Register new user
curl -X POST http://localhost:5002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","role":"INFLUENCER"}'

# Login
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### SNS Endpoints
```bash
# TikTok Verify (requires valid auth token)
curl -X POST http://localhost:5002/api/tiktok/verify-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"username":"test_username","displayName":"Test User"}'

# Check Instagram status
curl http://localhost:5002/api/instagram/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check YouTube status
curl http://localhost:5002/api/youtube/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check Twitter status
curl http://localhost:5002/api/twitter/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Rate Limiting
- [ ] API rejects requests after rate limit
- [ ] Rate limit header present in response
- [ ] Reset time shown correctly

### Error Handling
- [ ] 400: Bad request returns proper error
- [ ] 401: Unauthorized redirects to login
- [ ] 403: Forbidden shows error message
- [ ] 404: Not found shows 404 page
- [ ] 500: Server error shows error message

## Database Testing

### Connection
```bash
# Check database connectivity
npx prisma db execute --stdin < /dev/null
```

### Data Integrity
- [ ] Users table has records
- [ ] Influencers table has records
- [ ] SocialAccounts table has records
- [ ] No orphaned records
- [ ] Indexes are properly created

### Migrations
- [ ] All migrations run successfully
- [ ] Schema matches Prisma model
- [ ] No migration conflicts

## Security Testing

### CORS
- [ ] Requests from allowed origins accepted
- [ ] Requests from disallowed origins rejected
- [ ] Preflight requests handled correctly

### JWT/Tokens
- [ ] Valid token allows access
- [ ] Invalid token denied
- [ ] Expired token rejected
- [ ] Token refresh works

### Content Security Policy
- [ ] No inline script injection possible
- [ ] Only allowed scripts execute
- [ ] Unsafe CSP directives removed for production

### SQL Injection
- [ ] Special characters handled properly
- [ ] Query parameterization working
- [ ] No raw SQL in user inputs

### XSS Prevention
- [ ] HTML escaping working
- [ ] Script tags are stripped
- [ ] Event handlers sanitized

## End-to-End Flows

### Company Flow
1. [ ] Register as company
2. [ ] Create profile
3. [ ] Create project
4. [ ] Search influencers
5. [ ] Send application
6. [ ] Chat with influencer
7. [ ] Make payment
8. [ ] Leave review

### Influencer Flow
1. [ ] Register as influencer
2. [ ] Create profile
3. [ ] Add SNS accounts
4. [ ] View opportunities
5. [ ] Apply for projects
6. [ ] Chat with company
7. [ ] Receive payment
8. [ ] View analytics

## Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Accessibility

- [ ] All images have alt text
- [ ] Form labels associated with inputs
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

## Documentation

- [ ] README.md is complete
- [ ] API documentation current
- [ ] Deployment guide tested
- [ ] Troubleshooting guide helpful

## Final Checklist

- [ ] No console errors in production build
- [ ] No console warnings in production build
- [ ] All tests pass
- [ ] Code reviewed and approved
- [ ] Environment variables properly set
- [ ] Secrets securely stored
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Logs are being collected
- [ ] Performance metrics baseline set

## Sign-off

- [ ] QA Tester: _________________ Date: _______
- [ ] Deployment Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______
