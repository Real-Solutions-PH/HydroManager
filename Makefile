.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-24s\033[0m %s\n", $$1, $$2}'

export PATH := $(HOME)/.bun/bin:$(PATH)

# ---------------------------------------------------------------------------
# Docker
# ---------------------------------------------------------------------------
.PHONY: up up-infra down build logs ps

up: ## Start all services (dev mode with hot-reload)
	docker compose up -d

up-infra: ## Start only infra services (db, redis, minio)
	docker compose up -d db redis minio

down: ## Stop all services
	docker compose down

build: ## Build all Docker images
	docker compose build

logs: ## Tail logs for all services
	docker compose logs -f

ps: ## List running containers
	docker compose ps

# ---------------------------------------------------------------------------
# Backend
# ---------------------------------------------------------------------------
.PHONY: backend-dev backend-shell backend-lint backend-format backend-test backend-migrate backend-downgrade backend-revision backend-prestart

backend-dev: ## Run backend via uvicorn with hot-reload (host=0.0.0.0 port=8000)
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-shell: ## Open a bash shell in the backend container
	docker compose exec backend bash

backend-lint: ## Run backend linters (mypy, ty, ruff)
	cd backend && uv run mypy app && uv run ty check app && uv run ruff check app && uv run ruff format app --check

backend-format: ## Auto-format backend code (ruff)
	cd backend && bash scripts/format.sh

backend-test: ## Run backend tests with coverage
	cd backend && bash scripts/test.sh

backend-migrate: ## Run Alembic migrations (upgrade head)
	cd backend && uv run alembic upgrade head

backend-downgrade: ## Downgrade one Alembic migration
	cd backend && uv run alembic downgrade -1

backend-revision: ## Create a new Alembic migration (usage: make backend-revision MSG="add users table")
	cd backend && uv run alembic revision --autogenerate -m "$(MSG)"

backend-prestart: ## Run prestart script (healthcheck + migrations + initial data)
	cd backend && uv run bash scripts/prestart.sh

# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------
.PHONY: frontend-dev frontend-build frontend-lint frontend-preview frontend-generate-client frontend-test frontend-test-ui

frontend-dev: ## Start Vite dev server
	cd frontend && bun run dev

frontend-build: ## Build frontend for production
	cd frontend && bun run build

frontend-lint: ## Lint & auto-fix frontend code (Biome)
	cd frontend && bun run lint

frontend-preview: ## Preview production build locally
	cd frontend && bun run preview

frontend-generate-client: ## Generate TypeScript API client from OpenAPI spec
	bash scripts/generate-client.sh

frontend-test: ## Run Playwright E2E tests
	cd frontend && bunx playwright test

frontend-test-ui: ## Run Playwright tests with UI
	cd frontend && bunx playwright test --ui

# ---------------------------------------------------------------------------
# Mobile (Expo / EAS)
# ---------------------------------------------------------------------------
.PHONY: mobile-build mobile-build-ios mobile-build-android mobile-build-ios-preview mobile-build-android-preview mobile-build-ios-prod mobile-build-android-prod mobile-web-export mobile-web-deploy mobile-web-deploy-prod
PROFILE ?= preview

mobile-build: mobile-build-ios mobile-build-android ## Local EAS build iOS + Android (PROFILE=preview default)

mobile-web-export: ## Export Expo web bundle to mobile/dist
	cd mobile && bun run web:export

mobile-web-deploy: ## Deploy mobile web preview to Vercel
	cd mobile && bunx vercel --yes

mobile-web-deploy-prod: ## Deploy mobile web production to Vercel
	cd mobile && bunx vercel --prod --yes

mobile-build-ios: ## Local EAS build iOS (override: PROFILE=production|preview|development)
	cd mobile && bunx eas-cli build --local --platform ios --profile $(PROFILE)

mobile-build-android: ## Local EAS build Android (override: PROFILE=production|preview|development)
	cd mobile && bunx eas-cli build --local --platform android --profile $(PROFILE)

mobile-build-ios-prod: ## Local EAS production build iOS
	cd mobile && bunx eas-cli build --local --platform ios --profile production

mobile-build-android-prod: ## Local EAS production build Android
	cd mobile && bunx eas-cli build --local --platform android --profile production

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
.PHONY: install install-backend install-frontend

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Install backend Python dependencies (uv)
	cd backend && uv sync

install-frontend: ## Install frontend Node dependencies (bun)
	cd frontend && bun install

# ---------------------------------------------------------------------------
# Code Quality
# ---------------------------------------------------------------------------
.PHONY: lint format pre-commit

lint: backend-lint frontend-lint ## Run all linters

format: backend-format frontend-lint ## Run all formatters

pre-commit: ## Run pre-commit hooks on all files
	pre-commit run --all-files

# ---------------------------------------------------------------------------
# Testing (Docker-based)
# ---------------------------------------------------------------------------
.PHONY: test-docker

test-docker: ## Run backend tests inside Docker (build, up, test, down)
	bash scripts/test.sh

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
.PHONY: generate-client clean

generate-client: frontend-generate-client ## Alias for frontend-generate-client

clean: ## Remove Python caches and build artifacts
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name htmlcov -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -rf frontend/.next
