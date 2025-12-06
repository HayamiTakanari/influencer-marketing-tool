# Project Architecture

## Overview

This is a production-ready monorepo for the Influencer Marketing Tool, built with a modern technology stack designed for scalability and maintainability.

## Technology Stack

### Core Technologies
- **Monorepo**: pnpm workspaces
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT with OAuth2 support (Google, Instagram, TikTok)
- **Payment**: Stripe integration
- **File Storage**: Cloudinary
- **Real-time**: WebSockets
- **API Communication**: Axios with interceptors
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions

## Project Structure

```
influencer-marketing-tool/
├── apps/
│   ├── api/                    # Express.js backend
│   │   ├── src/
│   │   │   ├── controllers/   # Request handlers
│   │   │   ├── services/      # Business logic
│   │   │   ├── models/        # Data models
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── routes/        # API routes
│   │   │   ├── schemas/       # Validation schemas
│   │   │   └── index.ts       # Server entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Database schema
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── pages/         # Next.js pages
│       │   ├── hooks/         # Custom React hooks
│       │   ├── services/      # API services
│       │   ├── utils/         # Utility functions
│       │   ├── types/         # TypeScript types
│       │   └── styles/        # Global styles
│       ├── public/            # Static assets
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared-types/          # Shared TypeScript types
│   │   ├── src/
│   │   │   └── api.types.ts  # Type definitions
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-utils/          # Shared utilities
│   │   ├── src/
│   │   │   ├── validation.ts
│   │   │   └── formatters.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api-client/            # Typed API client
│       ├── src/
│       │   └── index.ts       # ApiClient class
│       ├── package.json
│       └── tsconfig.json
│
├── configs/
│   └── nginx.conf             # Nginx configuration
│
├── .github/
│   └── workflows/
│       ├── test.yml           # Test pipeline
│       ├── lint.yml           # Lint pipeline
│       └── deploy.yml         # Deployment pipeline
│
├── docker-compose.yml         # Production compose
├── docker-compose.dev.yml     # Development compose
├── Dockerfile.api             # Backend Docker image
├── Dockerfile.web             # Frontend Docker image
├── pnpm-workspace.yaml        # Workspace configuration
├── package.json               # Root package
└── .env.example               # Environment variables
```

## Core Components

### Backend (Express.js)

**Key Features:**
- RESTful API with TypeScript
- JWT authentication with OAuth2 providers
- Prisma ORM for database operations
- Comprehensive validation with schemas
- WebSocket support for real-time features
- Error handling and logging
- Rate limiting and security headers

**API Endpoints:**
- `/auth/*` - Authentication (login, register, OAuth)
- `/projects/*` - Project management
- `/influencers/*` - Influencer profiles and search
- `/payments/*` - Payment processing
- `/dashboard/*` - Analytics and dashboards
- `/contracts/*` - Contract management
- `/chat/*` - Messaging system

### Frontend (Next.js)

**Key Features:**
- Server-side rendering (SSR) with Next.js
- TypeScript for type safety
- Responsive design with Tailwind CSS
- Client-side state management
- API client with automatic authentication
- Protected routes with authentication
- Dynamic routing and navigation

**Pages:**
- `/login` - Authentication
- `/register` - User registration
- `/dashboard` - User dashboards (influencer/company)
- `/projects` - Project management
- `/influencers` - Influencer search and discovery
- `/payments` - Payment history
- `/chat` - Messaging interface

### Shared Packages

#### shared-types
Centralized TypeScript type definitions for API communication between frontend and backend:
- API request/response types
- User and profile DTOs
- Project and contract types
- Payment and invoice types

#### shared-utils
Common utility functions used across frontend and backend:
- Validation functions (email, password, URL, phone)
- Formatting functions (currency, date, follower count)
- String utilities

#### api-client
Type-safe HTTP client for the frontend:
- Axios-based client with interceptors
- Automatic token management
- Error handling and retry logic
- Full type safety for all endpoints

## Data Flow

```
User Browser
    ↓
Nginx (Reverse Proxy)
    ├→ Static Files (Next.js)
    └→ API Routes (Express.js)
       ↓
    Express Application
       ├→ Authentication Middleware
       ├→ Request Validation
       ├→ Business Logic (Services)
       └→ Database (Prisma ORM)
           ↓
        PostgreSQL (Supabase)
```

## Authentication Flow

1. User logs in with email/password or OAuth provider
2. Backend validates credentials and generates JWT token
3. Token is stored in localStorage on client
4. API client automatically includes token in Authorization header
5. Backend validates token on protected routes
6. 401 response triggers logout and redirect to login page

## Deployment Architecture

### Development Environment
- `docker-compose.dev.yml` orchestrates local services
- PostgreSQL with pgAdmin for database management
- Hot-reloading for both frontend and backend
- Volume mounts for live development

### Production Environment
- `docker-compose.yml` uses optimized Docker images
- Multi-stage builds minimize image size
- Non-root user execution for security
- Health checks for service monitoring
- Nginx reverse proxy with SSL/TLS
- Environment-based configuration

## Database Schema

Key tables:
- `User` - User accounts (influencers and companies)
- `InfluencerProfile` - Influencer details and portfolio
- `CompanyProfile` - Company information
- `Project` - Project listings
- `Contract` - Contracts between companies and influencers
- `Payment` - Payment records
- `Invoice` - Invoice tracking
- `Message` - Chat messages
- `Review` - User reviews and ratings

## Security Measures

1. **JWT Authentication** - Secure token-based authentication
2. **OAuth2 Integration** - Social login providers
3. **HTTPS/TLS** - Encrypted communication
4. **Rate Limiting** - Nginx-level rate limiting
5. **Security Headers** - CSP, X-Frame-Options, etc.
6. **CORS** - Cross-origin resource sharing
7. **Input Validation** - Schema-based validation
8. **SQL Injection Prevention** - Prisma parameterized queries
9. **XSS Prevention** - Next.js built-in protection
10. **Non-root Docker** - Containerized applications run as non-root user

## Performance Optimization

1. **Code Splitting** - Next.js automatic code splitting
2. **Image Optimization** - Next.js Image component
3. **Gzip Compression** - Nginx compression
4. **Database Indexes** - Optimized Prisma queries
5. **Caching Strategies** - HTTP caching headers
6. **CDN Ready** - Can be deployed with CDN
7. **Load Balancing** - Nginx as reverse proxy

## Scalability Considerations

1. **Monorepo Structure** - Easy to split into microservices later
2. **Containerization** - Ready for Kubernetes deployment
3. **Stateless Services** - Can run multiple instances
4. **Database Connection Pooling** - Prisma connection management
5. **Horizontal Scaling** - Load balancer ready
6. **Service Decoupling** - Independent frontend/backend deployment

## Development Workflow

1. Clone repository
2. Install pnpm: `npm install -g pnpm`
3. Install dependencies: `pnpm install`
4. Setup environment: `cp .env.example .env`
5. Start development: `pnpm dev:docker` or `pnpm dev`
6. Create feature branch: `git checkout -b feature/name`
7. Commit changes: `git commit -m "description"`
8. Push to GitHub: `git push origin feature/name`
9. Create pull request
10. GitHub Actions runs tests and lint
11. Merge after approval

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Write tests for new features
4. Ensure linting passes: `pnpm lint`
5. Update documentation as needed
6. Keep commits clean and descriptive
