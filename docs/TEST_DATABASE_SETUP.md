# Test Database Setup Guide

## Overview

Jest API integration tests require a dedicated PostgreSQL database to run. The test suite uses `TEST_DATABASE_URL` environment variable to connect to a test database instance.

## Setup Options

### Option 1: Docker (Recommended for Local Development)

```bash
# Start a test Postgres container
docker run --name pg-test \
  -e POSTGRES_USER=ci_test \
  -e POSTGRES_PASSWORD=ci_pass \
  -e POSTGRES_DB=ci_testdb \
  -p 5433:5432 \
  -d postgres:15

# Set environment variable
export TEST_DATABASE_URL="postgresql://ci_test:ci_pass@localhost:5433/ci_testdb?sslmode=disable"

# Run migrations (if needed)
psql "$TEST_DATABASE_URL" -f database/init.sql

# Run tests
npm test -- --runInBand
```

### Option 2: Render Test Database (CI/Production Testing)

1. Create a dedicated test database in Render dashboard
2. Copy the connection string
3. Set as `TEST_DATABASE_URL` in CI secrets or `.env.test`

```bash
export TEST_DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
```

### Option 3: Local Postgres Instance

If you have Postgres installed locally:

```bash
# Create test database
createdb ci_testdb

# Set environment variable
export TEST_DATABASE_URL="postgresql://localhost:5432/ci_testdb"

# Run migrations
psql "$TEST_DATABASE_URL" -f database/init.sql

# Run tests
npm test -- --runInBand
```

## Test Database Schema

The test database should have the same schema as production. Run the initialization script:

```bash
psql "$TEST_DATABASE_URL" -f database/init.sql
```

Or apply the migration script:

```bash
psql "$TEST_DATABASE_URL" -f artifacts/sql/dashboard_migration.sql
```

## Environment Variables

Create a `.env.test` file (do not commit):

```env
TEST_DATABASE_URL=postgresql://ci_test:ci_pass@localhost:5433/ci_testdb?sslmode=disable
JWT_SECRET=test-jwt-secret-key-for-testing-only
NEXTAUTH_SECRET=test-nextauth-secret-key-for-testing-only
NEXTAUTH_URL=http://localhost:5000
```

## Running Tests

```bash
# With test database configured
npm test -- --runInBand

# Without test database (tests will skip with warning)
npm test -- --runInBand
```

## CI/CD Setup

For GitHub Actions or similar CI:

```yaml
env:
  TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## Notes

- Tests will emit a warning if `TEST_DATABASE_URL` is not set
- API tests that require database will fail gracefully
- Unit tests (no DB dependency) will still run
- Test database is automatically cleaned up between test runs (if using test helpers)

