# Testing Guide

## Test Structure

```
src/__tests__/
├── README.md                       # This file
├── setup-test-db.sh               # Database setup script
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

3. **Setup test database**:
   ```bash
   cd src/__tests__
   ./setup-test-db.sh
   ```

4. **Run tests**:
   ```bash
   cd ../..
   npm test
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

**"database does not exist"** → Run the setup script: `./setup-test-db.sh`

This script will:
- Create a test database (`trivia_game_test`)
- Run the database schema from `src/data/database/`
- Seed test data

## Running Tests

```bash
npm test              # Run all tests
npm run test:coverage # Run with coverage report
```
