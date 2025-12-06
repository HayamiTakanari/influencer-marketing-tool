# Development Guide

## Prerequisites

- Node.js 18.0.0 or higher
- pnpm 8.0.0 or higher
- Docker & Docker Compose (for containerized development)
- PostgreSQL 15+ (if running locally without Docker)
- Git

## Installation

### 1. Install pnpm

```bash
npm install -g pnpm@8
```

### 2. Clone Repository

```bash
git clone https://github.com/yourusername/influencer-marketing-tool.git
cd influencer-marketing-tool
```

### 3. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the root, apps, and packages using pnpm workspaces.

### 4. Setup Environment Variables

```bash
cp .env.example .env
```

Update `.env` with your local development values:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/influencer_db_dev

# JWT
JWT_SECRET=your-secret-key-for-development

# API
API_PORT=3001
FRONTEND_URL=http://localhost:3000

# External APIs
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
TIKTOK_CLIENT_ID=your-tiktok-client-id
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# API Keys
RAPIDAPI_KEY=your-rapidapi-key
```

## Running the Project

### Option 1: Docker (Recommended)

```bash
# Development environment with hot-reload
pnpm dev:docker

# Or with build
pnpm dev:docker:build

# Shutdown
pnpm dev:docker:down
```

Accessible at:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- PgAdmin: http://localhost:5050 (admin@example.com / admin)

### Option 2: Local Development

#### Setup Database

```bash
# Create database
createdb influencer_db_dev

# Run migrations
pnpm prisma:migrate
```

#### Start Development Servers

In separate terminal windows:

```bash
# Terminal 1 - Start both frontend and backend
pnpm dev

# Or run separately:

# Terminal 1 - Backend
pnpm api

# Terminal 2 - Frontend
pnpm web
```

Accessible at:
- Frontend: http://localhost:3000
- API: http://localhost:3001

## Project Commands

### Development

```bash
pnpm dev                # Run all services
pnpm api                # Run backend only
pnpm web                # Run frontend only
pnpm dev:docker         # Run with Docker
```

### Building

```bash
pnpm build              # Build all packages
pnpm build:api          # Build backend only
pnpm build:web          # Build frontend only
```

### Testing & Linting

```bash
pnpm test               # Run all tests
pnpm lint               # Run linters
pnpm typecheck          # Run TypeScript type checking
```

### Database

```bash
pnpm prisma:generate   # Generate Prisma client
pnpm prisma:migrate    # Run migrations
pnpm prisma:studio     # Open Prisma Studio
```

### Cleanup

```bash
pnpm clean             # Clean all builds
pnpm clean:install     # Clean and reinstall
```

## Project Structure

### Backend Structure

```
apps/api/src/
├── controllers/        # HTTP request handlers
├── services/          # Business logic
├── models/            # Data models
├── middleware/        # Express middleware
├── routes/            # API route definitions
├── schemas/           # Validation schemas
├── utils/             # Utility functions
└── index.ts           # Entry point
```

### Frontend Structure

```
apps/web/src/
├── components/        # React components
├── pages/            # Next.js pages and API routes
├── hooks/            # Custom React hooks
├── services/         # API and utility services
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── styles/           # CSS modules and styles
└── app/              # Next.js app directory (if using App Router)
```

### Shared Packages

```
packages/
├── shared-types/     # API type definitions
├── shared-utils/     # Common utilities
└── api-client/       # Axios-based API client
```

## Creating New Features

### 1. Create Backend Endpoint

1. Create controller in `apps/api/src/controllers/`
2. Create service in `apps/api/src/services/` (if needed)
3. Create route in `apps/api/src/routes/`
4. Add route to `apps/api/src/index.ts`
5. Add types to `packages/shared-types/src/api.types.ts`

Example:

```typescript
// apps/api/src/controllers/feature.controller.ts
export const getFeature = async (req: Request, res: Response) => {
  try {
    // Implementation
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### 2. Create Frontend Page

1. Create page in `apps/web/src/pages/` or app directory
2. Create components in `apps/web/src/components/`
3. Create service in `apps/web/src/services/` if needed
4. Use API client from `@influencer-tool/api-client`

Example:

```typescript
// apps/web/src/pages/feature.tsx
import { ApiClient } from '@influencer-tool/api-client';

export default function FeaturePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const apiClient = new ApiClient({ baseURL: process.env.NEXT_PUBLIC_API_BASE_URL });
    apiClient.get('/feature').then(setData);
  }, []);

  return <div>{/* JSX */}</div>;
}
```

### 3. Add Types

Update `packages/shared-types/src/api.types.ts`:

```typescript
export interface FeatureDTO {
  id: string;
  name: string;
  description: string;
}
```

## Testing

### Backend Tests

```bash
# Run backend tests
pnpm --filter @influencer-tool/api test

# Watch mode
pnpm --filter @influencer-tool/api test:watch
```

### Frontend Tests

```bash
# Run frontend tests
pnpm --filter @influencer-tool/web test

# Watch mode
pnpm --filter @influencer-tool/web test:watch
```

### Coverage

```bash
pnpm test:coverage
```

## Debugging

### Backend Debugging

1. Set breakpoints in VS Code
2. Run with debug mode:

```bash
node --inspect-brk ./apps/api/dist/index.js
```

3. Open `chrome://inspect` in Chrome

### Frontend Debugging

Use Next.js built-in debugging:
- Open Developer Tools (F12)
- Set breakpoints in Source tab
- Use React DevTools extension

## Code Quality

### Linting

```bash
pnpm lint

# Fix issues automatically
pnpm lint --fix
```

### Type Checking

```bash
pnpm typecheck
```

### Formatting

Install Prettier extension in your IDE and configure save-on-format.

## Git Workflow

### Feature Branch

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/feature-name

# Create Pull Request on GitHub
```

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat: add influencer search filter

Add ability to filter influencers by category and location.
Implements pagination and sorting.

Closes #123
```

## Common Issues & Solutions

### Port Already in Use

```bash
# Find and kill process using port 3001
lsof -i :3001
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U postgres

# Verify DATABASE_URL in .env
# Recreate database
dropdb influencer_db_dev
createdb influencer_db_dev
pnpm prisma:migrate
```

### Dependencies Not Installing

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm clean:install
```

### Docker Issues

```bash
# Remove all containers and volumes
docker-compose -f docker-compose.dev.yml down -v

# Rebuild
docker-compose -f docker-compose.dev.yml build --no-cache

# Start
docker-compose -f docker-compose.dev.yml up
```

## IDE Setup

### VS Code Extensions (Recommended)

- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Thunder Client or REST Client
- Prisma
- SQLTools
- Docker
- GitHub Copilot (optional)

### VS Code Settings

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [pnpm Documentation](https://pnpm.io/docs)
- [Docker Documentation](https://docs.docker.com/)
