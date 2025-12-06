# API Documentation

## Base URL

```
Development: http://localhost:3001
Production: https://api.your-domain.com
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained through login or registration endpoints.

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "message": "Success"
}
```

For errors:

```json
{
  "success": false,
  "data": null,
  "error": "Error message",
  "message": "Operation failed"
}
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Endpoints

### Authentication

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "userType": "INFLUENCER",
      "displayName": "John Doe",
      "avatarUrl": "https://...",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "userType": "INFLUENCER",
  "displayName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "userType": "INFLUENCER",
      "displayName": "John Doe"
    }
  }
}
```

#### OAuth Login

```http
GET /auth/google?code=authorization_code
```

Supported providers: `google`, `instagram`, `tiktok`

#### Logout

```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "userType": "INFLUENCER",
    "displayName": "John Doe",
    "avatarUrl": "https://...",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Projects

#### List Projects

```http
GET /projects?page=1&pageSize=20&status=PENDING&category=FASHION
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `pageSize` (number): Items per page (default: 20)
- `status` (string): Filter by status (PENDING, MATCHED, IN_PROGRESS, COMPLETED)
- `category` (string): Filter by category
- `minBudget` (number): Filter by minimum budget
- `maxBudget` (number): Filter by maximum budget

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "project-id",
        "companyId": "company-id",
        "title": "Summer Campaign",
        "description": "Looking for influencers...",
        "category": "FASHION",
        "budget": 5000,
        "status": "PENDING",
        "startDate": "2024-06-01T00:00:00Z",
        "endDate": "2024-06-30T00:00:00Z",
        "targetPlatforms": ["instagram", "tiktok"],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

#### Get Project

```http
GET /projects/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "project-id",
    "companyId": "company-id",
    "title": "Summer Campaign",
    "description": "Looking for influencers...",
    "category": "FASHION",
    "budget": 5000,
    "status": "PENDING",
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-06-30T00:00:00Z",
    "targetPlatforms": ["instagram", "tiktok"],
    "requirements": {
      "minFollowers": 10000,
      "platforms": ["instagram", "tiktok"],
      "categories": ["fashion", "lifestyle"]
    },
    "company": {
      "id": "company-id",
      "name": "Brand Inc",
      "logo": "https://...",
      "industry": "Fashion"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Create Project

```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Summer Campaign",
  "description": "Looking for fashion influencers...",
  "category": "FASHION",
  "budget": 5000,
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-30T00:00:00Z",
  "targetPlatforms": ["instagram", "tiktok"],
  "requirements": {
    "minFollowers": 10000,
    "platforms": ["instagram", "tiktok"],
    "categories": ["fashion", "lifestyle"]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "project-id",
    "companyId": "company-id",
    "title": "Summer Campaign",
    ...
  }
}
```

#### Update Project

```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Campaign Title",
  "budget": 7500
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "project-id",
    ...
  }
}
```

#### Delete Project

```http
DELETE /projects/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Influencers

#### Search Influencers

```http
GET /influencers/search?query=fashion&category=FASHION&minFollowers=10000&page=1
Authorization: Bearer <token>
```

**Query Parameters:**
- `query` (string): Search term
- `category` (string): Filter by category
- `minFollowers` (number): Minimum followers
- `maxFollowers` (number): Maximum followers
- `platforms` (string[]): Filter by platforms
- `location` (string): Filter by location
- `page` (number): Page number
- `pageSize` (number): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "influencer-id",
        "userId": "user-id",
        "displayName": "Fashion Blogger",
        "bio": "Fashion and lifestyle content creator",
        "categories": ["fashion", "lifestyle"],
        "prefecture": "Tokyo",
        "city": "Shibuya",
        "priceMin": 100000,
        "priceMax": 500000,
        "socialAccounts": [
          {
            "platform": "instagram",
            "handle": "@fashionblogger",
            "followers": 50000,
            "engagementRate": 3.5,
            "url": "https://instagram.com/fashionblogger"
          }
        ],
        "averageRating": 4.8,
        "reviewCount": 25,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 250,
    "page": 1,
    "pageSize": 20,
    "totalPages": 13
  }
}
```

#### Get Influencer Profile

```http
GET /influencers/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "influencer-id",
    "userId": "user-id",
    "displayName": "Fashion Blogger",
    "bio": "Fashion and lifestyle content creator",
    "categories": ["fashion", "lifestyle"],
    "prefecture": "Tokyo",
    "city": "Shibuya",
    "priceMin": 100000,
    "priceMax": 500000,
    "socialAccounts": [
      {
        "platform": "instagram",
        "handle": "@fashionblogger",
        "followers": 50000,
        "engagementRate": 3.5,
        "url": "https://instagram.com/fashionblogger"
      },
      {
        "platform": "tiktok",
        "handle": "@fashionblogger",
        "followers": 100000,
        "engagementRate": 5.2,
        "url": "https://tiktok.com/@fashionblogger"
      }
    ],
    "portfolio": [
      {
        "id": "portfolio-id",
        "title": "Summer Collection Feature",
        "description": "Featured summer fashion collection",
        "images": ["https://..."],
        "link": "https://...",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "averageRating": 4.8,
    "reviewCount": 25,
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Influencer Profile

```http
PUT /influencers/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Updated Name",
  "bio": "Updated bio",
  "categories": ["fashion", "lifestyle"],
  "priceMin": 100000,
  "priceMax": 500000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

### Contracts

#### Get Contracts

```http
GET /contracts?status=PENDING&page=1
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "contract-id",
        "projectId": "project-id",
        "influencerId": "influencer-id",
        "status": "PENDING",
        "deliverables": "5 Instagram posts, 3 Reels",
        "budget": 5000,
        "dueDate": "2024-06-30T00:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

#### Get Contract

```http
GET /contracts/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "contract-id",
    "projectId": "project-id",
    "influencerId": "influencer-id",
    "project": { ... },
    "influencer": { ... },
    "status": "PENDING",
    "deliverables": "5 Instagram posts, 3 Reels",
    "budget": 5000,
    "dueDate": "2024-06-30T00:00:00Z",
    "notes": "High priority",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Create Contract

```http
POST /contracts
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project-id",
  "influencerId": "influencer-id",
  "deliverables": "5 Instagram posts, 3 Reels",
  "budget": 5000,
  "dueDate": "2024-06-30T00:00:00Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { ... }
}
```

#### Update Contract Status

```http
PATCH /contracts/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ACCEPTED"
}
```

**Status values:** `PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, `CANCELLED`

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

### Payments

#### Create Payment

```http
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "contractId": "contract-id",
  "amount": 5000,
  "paymentMethod": "stripe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "payment-id",
    "contractId": "contract-id",
    "amount": 5000,
    "status": "PENDING",
    "paymentMethod": "stripe",
    "stripePaymentIntentId": "pi_...",
    "clientSecret": "pi_..._secret_...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Confirm Payment

```http
POST /payments/:id/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethodId": "pm_..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "payment-id",
    "status": "COMPLETED",
    ...
  }
}
```

#### Get Payment History

```http
GET /payments/history?page=1&status=COMPLETED
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "payment-id",
        "contractId": "contract-id",
        "amount": 5000,
        "status": "COMPLETED",
        "paymentMethod": "stripe",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```

### Dashboard

#### Get Dashboard Data

```http
GET /dashboard
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalProjects": 15,
      "activeProjects": 5,
      "completedProjects": 10,
      "totalEarnings": 250000
    },
    "recentProjects": [
      { ... }
    ],
    "upcomingDeadlines": [
      { ... }
    ]
  }
}
```

### Health Check

```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

## Rate Limiting

API endpoints are rate limited:
- Public endpoints: 30 requests per minute
- Authenticated endpoints: 60 requests per minute
- Payment endpoints: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1234567890
```

## Pagination

List endpoints support pagination:
```
GET /projects?page=1&pageSize=20
```

Response includes:
- `items`: Array of items
- `total`: Total number of items
- `page`: Current page
- `pageSize`: Items per page
- `totalPages`: Total number of pages

## Filtering & Sorting

Filters are query parameters:
```
GET /projects?status=PENDING&minBudget=5000&maxBudget=50000
```

Sorting:
```
GET /projects?sort=createdAt&order=desc
```

## Webhooks

Webhook events are sent to configured endpoint:

**Event Types:**
- `project.created`
- `contract.accepted`
- `payment.completed`
- `review.created`

**Request:**
```json
{
  "event": "contract.accepted",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": { ... }
}
```

Verify webhook signature using `X-Signature` header with HMAC-SHA256.
