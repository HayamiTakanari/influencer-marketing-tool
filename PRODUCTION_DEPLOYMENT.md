# Production Deployment Guide

## Overview
This document outlines the complete process for deploying the Influencer Marketing Tool to production.

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Update `.env.production` with actual production values:
  - Database connection string (PostgreSQL)
  - JWT secret key (use strong, random value)
  - API keys (TikTok, Cloudinary, Stripe, etc.)
  - Email configuration (SMTP)
  - Frontend URL for CORS
  - SSL certificates (HTTPS)

### 2. Database Setup
- [ ] Create production PostgreSQL database
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Verify database schema is correct
- [ ] Set up automated backups

### 3. Security Validation
- [ ] SSL/TLS certificates configured (HTTP → HTTPS redirect)
- [ ] CORS origins restricted to production domain only
- [ ] JWT secrets and API keys are strong and unique
- [ ] Environment variables properly secured
- [ ] Database credentials secured in vault/secrets management
- [ ] Disable development-only features (unsafe-eval, unsafe-inline for CSP)

### 4. Frontend Build
```bash
cd frontend
npm install --production
npm run build
# Output will be in .next/ directory
```

### 5. Backend Setup
```bash
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy
# Ready to run with NODE_ENV=production
```

## Deployment Steps

### Frontend (Next.js)
1. Build static files: `npm run build`
2. Deploy `.next/` directory to CDN or web server
3. Configure reverse proxy to backend API
4. Enable gzip compression
5. Set up HTTP/2 support

### Backend (Node.js + Express)
1. Ensure all environment variables are set
2. Start server: `NODE_ENV=production npm start`
3. Verify health endpoint: `GET /health`
4. Monitor logs and errors

### Socket.io Configuration
- Verify Socket.io URL matches production domain
- Configure CORS for Socket.io connections
- Enable Redis adapter for multi-instance scaling

## Production Architecture

```
User Browser (HTTPS)
       ↓
Reverse Proxy / Load Balancer (HTTPS)
       ↓
Frontend (Next.js - Static + SSR)
       ↓
Backend API (Express.js - HTTP)
       ↓
PostgreSQL Database
```

## Security Headers (Verified)

These are automatically set by the backend:
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-XSS-Protection

## Rate Limiting

- General API rate limit: 100 requests per 15 minutes
- Adjust in `.env` via RATE_LIMIT_MAX and RATE_LIMIT_WINDOW

## Monitoring

- Health endpoint: `GET /health`
- Database connection monitoring
- API response time monitoring
- Error tracking via Sentry (optional)
- Log aggregation recommended

## SNS Integration Status

### Fully Implemented
- ✅ TikTok: Username-based verification (test mode ready)
- ✅ Instagram: Test mode with graceful fallback
- ✅ YouTube: Test mode with graceful fallback
- ✅ Twitter: Test mode with graceful fallback

### Frontend Features
- ✅ Profile page with tab-based navigation (URL routing)
- ✅ SNS account verification and management
- ✅ Social account sync functionality
- ✅ OAuth connection status tracking

## Performance Optimization

- Frontend assets are minified and bundled
- Image optimization via Cloudinary
- Database query optimization with Prisma
- Redis caching recommended for sessions
- CDN recommended for static assets

## Backup and Recovery

- Daily database backups recommended
- Version control for all code
- Environment variable backups (encrypted)
- Recovery testing monthly

## Rolling Back

If issues occur:
1. Revert to previous deployment version
2. Check error logs for root cause
3. Fix issue locally and test thoroughly
4. Re-deploy with verified fix

## Support and Troubleshooting

Common issues:
- Database connection: Check DATABASE_URL
- API not responding: Check backend logs
- CORS errors: Verify FRONTEND_URL is correct
- SNS sync issues: Check API key configuration
