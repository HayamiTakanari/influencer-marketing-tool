# ============================================
# Makefile - Project Commands
# ============================================

.PHONY: help install dev dev-docker build start start-prod clean test lint typecheck db-migrate db-studio

help:
	@echo "Influencer Marketing Tool - Available Commands"
	@echo "=============================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install              Install all dependencies"
	@echo "  make clean                Clean all builds and dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev                  Run development servers (frontend + backend)"
	@echo "  make dev-docker           Run development with Docker Compose"
	@echo "  make dev-api              Run backend API only"
	@echo "  make dev-web              Run frontend web only"
	@echo ""
	@echo "Building:"
	@echo "  make build                Build all packages"
	@echo "  make build-api            Build backend only"
	@echo "  make build-web            Build frontend only"
	@echo ""
	@echo "Production:"
	@echo "  make start-prod           Start production Docker services"
	@echo "  make start-prod-build     Build and start production"
	@echo "  make start-prod-down      Stop production services"
	@echo ""
	@echo "Quality:"
	@echo "  make test                 Run all tests"
	@echo "  make lint                 Run linters"
	@echo "  make typecheck            Check TypeScript types"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate           Run database migrations"
	@echo "  make db-studio            Open Prisma Studio"
	@echo "  make db-generate          Generate Prisma client"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-dev-up        Start dev Docker containers"
	@echo "  make docker-dev-down      Stop dev Docker containers"
	@echo "  make docker-dev-logs      View dev Docker logs"
	@echo "  make docker-prod-up       Start prod Docker containers"
	@echo "  make docker-prod-down     Stop prod Docker containers"
	@echo "  make docker-prod-logs     View prod Docker logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make env-setup            Create .env from .env.example"
	@echo "  make deps-check           Check for security vulnerabilities"
	@echo ""

# ============================================
# Setup & Installation
# ============================================

install:
	@echo "Installing dependencies..."
	pnpm install

env-setup:
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example..."; \
		cp .env.example .env; \
		echo "✓ .env created. Please update with your values."; \
	else \
		echo ".env already exists."; \
	fi

clean:
	@echo "Cleaning build artifacts and dependencies..."
	pnpm clean
	@echo "✓ Cleanup complete"

clean-install: clean install
	@echo "✓ Clean reinstall complete"

# ============================================
# Development
# ============================================

dev:
	@echo "Starting development servers..."
	pnpm dev

dev-docker:
	@echo "Starting development with Docker Compose..."
	pnpm dev:docker

dev-docker-build:
	@echo "Building and starting development containers..."
	pnpm dev:docker:build
	pnpm dev:docker

dev-docker-down:
	@echo "Stopping development containers..."
	pnpm dev:docker:down

dev-api:
	@echo "Starting API server..."
	pnpm api

dev-web:
	@echo "Starting Web server..."
	pnpm web

# ============================================
# Building
# ============================================

build:
	@echo "Building all packages..."
	pnpm build
	@echo "✓ Build complete"

build-api:
	@echo "Building API..."
	pnpm build:api
	@echo "✓ API build complete"

build-web:
	@echo "Building Web..."
	pnpm build:web
	@echo "✓ Web build complete"

# ============================================
# Production
# ============================================

start-prod:
	@echo "Starting production services..."
	pnpm start:prod

start-prod-build:
	@echo "Building and starting production services..."
	pnpm start:prod:build
	pnpm start:prod

start-prod-down:
	@echo "Stopping production services..."
	pnpm start:prod:down
	@echo "✓ Production services stopped"

# ============================================
# Quality Assurance
# ============================================

test:
	@echo "Running tests..."
	pnpm test

test-api:
	@echo "Running API tests..."
	pnpm --filter @influencer-tool/api test

test-web:
	@echo "Running Web tests..."
	pnpm --filter @influencer-tool/web test

lint:
	@echo "Running linters..."
	pnpm lint

lint-fix:
	@echo "Running linters and fixing issues..."
	pnpm lint -- --fix

typecheck:
	@echo "Type checking..."
	pnpm typecheck

# ============================================
# Database
# ============================================

db-migrate:
	@echo "Running database migrations..."
	pnpm prisma:migrate
	@echo "✓ Migrations complete"

db-studio:
	@echo "Opening Prisma Studio..."
	pnpm prisma:studio

db-generate:
	@echo "Generating Prisma client..."
	pnpm prisma:generate
	@echo "✓ Prisma client generated"

db-seed:
	@echo "Seeding database..."
	pnpm --filter @influencer-tool/api prisma db seed
	@echo "✓ Database seeded"

# ============================================
# Docker Management
# ============================================

docker-dev-up:
	@echo "Starting development Docker containers..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✓ Development containers started"

docker-dev-down:
	@echo "Stopping development Docker containers..."
	docker-compose -f docker-compose.dev.yml down -v
	@echo "✓ Development containers stopped"

docker-dev-logs:
	@echo "Showing development Docker logs..."
	docker-compose -f docker-compose.dev.yml logs -f

docker-dev-ps:
	@echo "Development containers status:"
	docker-compose -f docker-compose.dev.yml ps

docker-prod-up:
	@echo "Starting production Docker containers..."
	docker-compose -f docker-compose.yml up -d
	@echo "✓ Production containers started"

docker-prod-down:
	@echo "Stopping production Docker containers..."
	docker-compose -f docker-compose.yml down -v
	@echo "✓ Production containers stopped"

docker-prod-logs:
	@echo "Showing production Docker logs..."
	docker-compose -f docker-compose.yml logs -f

docker-prod-ps:
	@echo "Production containers status:"
	docker-compose -f docker-compose.yml ps

# ============================================
# Utilities
# ============================================

deps-check:
	@echo "Checking for security vulnerabilities..."
	npm audit
	pnpm audit

deps-update:
	@echo "Checking for dependency updates..."
	pnpm outdated

format:
	@echo "Formatting code..."
	pnpm prettier --write "apps/**/*.{ts,tsx,json,css}" "packages/**/*.{ts,json}"

info:
	@echo "Project Information:"
	@echo "==================="
	@echo "Node version: $$(node --version)"
	@echo "pnpm version: $$(pnpm --version)"
	@echo "Docker version: $$(docker --version)"
	@echo "Docker Compose version: $$(docker-compose --version)"

# ============================================
# Documentation
# ============================================

docs:
	@echo "Opening documentation..."
	@echo "Available docs:"
	@echo "  - docs/README.md          - Documentation overview"
	@echo "  - docs/ARCHITECTURE.md    - Project architecture"
	@echo "  - docs/DEVELOPMENT.md     - Development guide"
	@echo "  - docs/DEPLOYMENT.md      - Deployment guide"
	@echo "  - docs/API.md             - API reference"

# ============================================
# CI/CD
# ============================================

ci: typecheck lint test
	@echo "✓ CI checks passed"

# ============================================
# Default
# ============================================

.DEFAULT_GOAL := help
