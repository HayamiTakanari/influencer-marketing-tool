# Documentation

This directory contains comprehensive documentation for the Influencer Marketing Tool project.

## Quick Navigation

### 📐 [ARCHITECTURE.md](./ARCHITECTURE.md)
Complete overview of the project architecture including:
- Technology stack
- Project structure
- Core components (backend, frontend, shared packages)
- Data flow diagrams
- Authentication flow
- Deployment architecture
- Database schema
- Security measures
- Performance optimization
- Scalability considerations

**Best for:** Understanding how the project is organized and how components interact.

### 🚀 [DEVELOPMENT.md](./DEVELOPMENT.md)
Complete development setup and workflow guide including:
- Prerequisites and installation
- Environment setup
- Running the project locally (Docker or bare metal)
- Available commands
- Project structure explanation
- Creating new features
- Testing and debugging
- Code quality tools
- Git workflow
- Troubleshooting common issues
- IDE setup recommendations

**Best for:** Getting started with local development and contributing to the project.

### 🌍 [DEPLOYMENT.md](./DEPLOYMENT.md)
Production deployment guide covering:
- Self-hosted deployment with Docker Compose
- Cloud deployment options (AWS, DigitalOcean, Vercel)
- Kubernetes deployment
- SSL/TLS certificate setup
- Database backup and recovery
- Performance tuning
- Monitoring and maintenance
- Disaster recovery plans
- Rollback strategies

**Best for:** Deploying to production or setting up staging environments.

### 📡 [API.md](./API.md)
Complete API reference including:
- Base URLs and authentication
- Response format and error codes
- All endpoints with examples
- Request/response examples
- Query parameters
- Pagination
- Rate limiting
- Webhook integration
- OAuth flows

**Best for:** Understanding available API endpoints and integrating with the backend.

## Getting Started

### I want to...

#### Set up development environment
→ Follow [DEVELOPMENT.md](./DEVELOPMENT.md)

```bash
pnpm install
cp .env.example .env
pnpm dev:docker
```

#### Understand the project architecture
→ Read [ARCHITECTURE.md](./ARCHITECTURE.md)

#### Deploy to production
→ Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

#### Use the API
→ Check [API.md](./API.md)

#### Create a new feature
→ See "Creating New Features" in [DEVELOPMENT.md](./DEVELOPMENT.md)

## Key Concepts

### Monorepo Structure

```
apps/                  # Applications
├── api/              # Express.js backend
└── web/              # Next.js frontend

packages/            # Shared code
├── shared-types/    # TypeScript types
├── shared-utils/    # Utility functions
└── api-client/      # HTTP client
```

### Technology Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Express.js, TypeScript, Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Deployment:** Docker, Docker Compose
- **CI/CD:** GitHub Actions
- **Reverse Proxy:** Nginx

### Development Commands

```bash
# Development
pnpm dev              # Run all services
pnpm api              # Run backend only
pnpm web              # Run frontend only

# Docker development
pnpm dev:docker       # Run with Docker Compose
pnpm dev:docker:down  # Stop Docker services

# Building
pnpm build            # Build all packages
pnpm build:api        # Build backend only
pnpm build:web        # Build frontend only

# Production
pnpm start:prod       # Run production Docker setup
pnpm start:prod:down  # Stop production services

# Database
pnpm prisma:migrate   # Run database migrations
pnpm prisma:studio    # Open Prisma Studio

# Quality
pnpm lint             # Run linters
pnpm test             # Run tests
pnpm typecheck        # Check TypeScript types
```

## Common Workflows

### Starting Local Development

```bash
cd influencer-marketing-tool
pnpm install
cp .env.example .env
# Edit .env with your values
pnpm dev:docker
# Accessible at http://localhost:3000 (frontend) and http://localhost:3001 (API)
```

### Creating a New API Endpoint

1. Create controller in `apps/api/src/controllers/`
2. Create route in `apps/api/src/routes/`
3. Add types to `packages/shared-types/`
4. Create frontend service to call endpoint
5. Test with REST client or curl

### Deploying Changes

1. Commit and push to feature branch
2. Create pull request on GitHub
3. GitHub Actions runs tests and lint
4. After approval, merge to main
5. GitHub Actions automatically deploys to production

### Database Migrations

```bash
# Create migration
pnpm prisma:migrate --name add_new_feature

# Generate Prisma client
pnpm prisma:generate

# View database
pnpm prisma:studio
```

## Environment Variables

See `.env.example` for all available configuration options:

- **Database:** DATABASE_URL
- **Authentication:** JWT_SECRET
- **External Services:** Stripe, Cloudinary, OAuth providers
- **API:** API_PORT, FRONTEND_URL
- **Supabase:** SUPABASE_URL, SUPABASE_KEY

## Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Docker Docs](https://docs.docker.com/)

### Tools & Services
- [Supabase](https://supabase.com/) - PostgreSQL hosting
- [Stripe](https://stripe.com/) - Payment processing
- [Cloudinary](https://cloudinary.com/) - Image hosting
- [GitHub Actions](https://github.com/features/actions) - CI/CD

## Contributing

Before contributing, please:
1. Read [DEVELOPMENT.md](./DEVELOPMENT.md)
2. Set up development environment
3. Follow the code style and conventions
4. Write tests for new features
5. Update documentation as needed

## License

See LICENSE file in root directory.

## Questions?

Refer to the relevant documentation file above, or check existing GitHub issues/discussions.

---

**Last Updated:** December 2024
**Status:** Production-Ready
