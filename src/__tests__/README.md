# Testing Guide

## Test Structure

```
src/__tests__/
├── README.md                       # This file
├── questions.integration.test.ts  # Questions API integration tests
├── sessions.integration.test.ts   # Sessions API integration tests
└── users.integration.test.ts      # Users API integration tests
```

## Quick Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create test environment file**:
   ```bash
   # Copy the example file to create your test configuration
   cp ../../.env.test.example ../../.env.test
   # Edit .env.test - change POSTGRES_USER to your username
   ```

3. **Run tests** (database setup is automatic):
   ```bash
   npm test
   ```

That's it! No manual database setup required.

**If automatic setup fails**, use the manual setup:
```bash
npm run test:setup
```

## Find Your PostgreSQL Username

Run this command and look at the "Owner" column:
```bash
psql -l
```

Common usernames: `postgres`, your computer username, or `root`

## Troubleshooting

**"role 'postgres' does not exist"** → Update `POSTGRES_USER` in `.env.test`

**"password authentication failed"** → Add your password to `POSTGRES_PASSWORD` in `.env.test`

**"database does not exist"** → This is now handled automatically - just run `npm test` again

## How It Works

Jest automatically:
- Creates the test database if it doesn't exist
- Runs the database schema from `src/data/database/`
- Seeds test data
- Provides clear error messages if setup fails

**Fallback**: If automatic setup fails (e.g., missing psql), use: `npm run test:setup`

## Running Tests

```bash
npm test              # Run all tests
npm run test:coverage # Run with coverage report
```
