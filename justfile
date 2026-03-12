set dotenv-load := true

# List all available recipes
default:
    @just --list

# Initial project setup (install deps, setup .env, generate prisma client)
setup:
    pnpm install
    @if [ ! -f .env ]; then \
        cp .env-example .env; \
        echo "Created .env from .env-example"; \
    fi
    pnpm exec prisma generate

# Run the development server with watch mode
dev:
    pnpm dev

# Build the project for production
build:
    pnpm build

# Run all tests using Jest
test:
    pnpm test

# Generate a new database migration
db-migrate name:
    pnpm exec prisma migrate dev --name {{name}}

# Push schema changes to the database without creating a migration
db-push:
    pnpm exec prisma db push

# Seed the database with initial data
db-seed:
    pnpm exec prisma db seed

# Open Prisma Studio to view/edit data
db-studio:
    pnpm exec prisma studio

# Run linting, type-checking, and tests
check:
    pnpm lint
    pnpm build
    pnpm test

# Clean up build artifacts and logs
clean:
    rm -rf dist/
    rm -rf logs/*.log
