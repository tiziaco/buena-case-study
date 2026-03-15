.PHONY: help install setup dev build docker-build docker-up docker-down docker-restart docker-logs docker-logs-web docker-logs-db docker-clean docker-rebuild docker-up-db db-migrate db-seed db-reset test test-unit test-integration test-coverage

DOCKER_COMPOSE ?= docker compose

# Default target
help:
	@echo "🏠 Buenita Property Dashboard - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          - Install dependencies"
	@echo "  make setup            - Full setup: install + docker-up-db + db-migrate + db-seed"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up        - Start all services (web-app, postgres)"
	@echo "  make docker-build     - Build Docker images"
	@echo "  make docker-up-db            - Start only the postgres container"
	@echo "  make docker-down      - Stop all services"
	@echo "  make docker-restart   - Restart all services"
	@echo "  make docker-clean     - Remove containers, volumes, and images (full cleanup)"
	@echo "  make docker-rebuild   - Clean + build + up"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate       - Run Prisma migrations"
	@echo "  make db-seed          - Seed database with sample data"
	@echo "  make db-reset         - Reset database (drop, migrate, seed)"
	@echo ""
	@echo "Development:"
	@echo "  make build            - Build the Next.js app for production"
	@echo "  make dev              - Start Next.js dev server"
	@echo ""
	@echo "Testing:"
	@echo "  make test             - Run all tests (unit + integration)"
	@echo "  make test-unit        - Run unit tests only"
	@echo "  make test-integration - Run integration tests only"
	@echo "  make test-coverage    - Run tests with coverage report"
	@echo ""
	@echo "Logs:"
	@echo "  make docker-logs      - Follow all service logs"
	@echo "  make docker-logs-web  - Follow web-app logs only"
	@echo "  make docker-logs-db   - Follow postgres logs only"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@npm install
	@echo "✅ Dependencies installed"

# Full setup
setup: install docker-up-db db-migrate db-seed
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start the development server."

# Build the app for production
build:
	@npm run build

# Development server
dev:
	@npm run dev


# Docker commands
docker-build:
	@echo "🔨 Building services..."
	@$(DOCKER_COMPOSE) build
	@echo "✅ Build complete"

docker-up:
	@echo "🚀 Starting services..."
	@$(DOCKER_COMPOSE) up -d
	@echo "✅ Services running!"
	@echo "   Web App:  http://localhost:3000"
	@echo "   Database: localhost:5432"

docker-up-db:
	@echo "🐘 Starting postgres..."
	@$(DOCKER_COMPOSE) up -d postgres
	@echo "✅ Postgres running at localhost:5432"

docker-down:
	@echo "📛 Stopping services..."
	@$(DOCKER_COMPOSE) down
	@echo "✅ Services stopped"

docker-restart:
	@echo "🔄 Restarting services..."
	@$(DOCKER_COMPOSE) restart
	@echo "✅ Services restarted"

docker-logs:
	@$(DOCKER_COMPOSE) logs -f

docker-logs-web:
	@$(DOCKER_COMPOSE) logs -f web-app

docker-logs-db:
	@$(DOCKER_COMPOSE) logs -f postgres

docker-clean:
	@echo "🧹 Full cleanup..."
	@$(DOCKER_COMPOSE) down -v --remove-orphans
	@docker rmi buenita_app-web-app 2>/dev/null || true
	@echo "✅ Cleanup complete"

docker-rebuild: docker-clean docker-build docker-up
	@echo "✅ Rebuild complete"


# Database commands
db-migrate:
	@echo "🔄 Running database migrations..."
	@npx prisma migrate dev
	@echo "✅ Migrations complete"

db-seed:
	@echo "🌱 Seeding database..."
	@npx prisma db seed
	@echo "✅ Database seeded"

db-reset:
	@echo "⚠️  Resetting database (this will delete all data)..."
	@npx prisma migrate reset --force
	@echo "✅ Database reset complete"


# Test commands
test:
	@echo "🧪 Running all tests..."
	@npm test

test-unit:
	@echo "🧪 Running unit tests..."
	@npm run test:unit

test-integration:
	@echo "🧪 Running integration tests..."
	@npm run test:integration

test-coverage:
	@echo "🧪 Running tests with coverage..."
	@npm run test:coverage
