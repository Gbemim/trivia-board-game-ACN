# Test Organization

This project uses integration tests with a real PostgreSQL database to ensure robust testing.

## Test Structure

```
src/__tests__/
├── README.md                       # This file
├── setup-test-db.sh               # Database setup script
├── questions.integration.test.ts  # Questions API integration tests
├── sessions.integration.test.ts   # Sessions API integration tests
└── users.integration.test.ts      # Users API integration tests
```

## Database Setup

Before running tests, set up the test database:

### Quick Setup for First-Time Users

1. **Install dependencies**:
   ```bash
   npm install
   # This automatically installs Jest and all testing dependencies from package.json
   ```

2. **Create your test configuration**:
   ```bash
   cp ../../.env.test.example ../../.env.test
   # Edit .env.test with your database username (e.g., replace 'postgres' with your actual username)
   ```

3. **Run database setup**:
   ```bash
   cd src/__tests__
   ./setup-test-db.sh
   ```

4. **Run tests**:
   ```bash
   cd ../..  # Back to project root
   npm test
   ```

### Common Issues and Solutions

**Issue**: Tests fail with "role 'postgres' does not exist"
**Solution**: Your PostgreSQL username is different. Check with `psql -l` and update `POSTGRES_USER` in `.env.test`

**Issue**: Database connection errors
**Solution**: Ensure PostgreSQL is running and your user has CREATE DATABASE privileges

**Issue**: "password authentication failed"
**Solution**: Set the correct password in `POSTGRES_PASSWORD` in `.env.test`

**Issue**: Tests fail on different servers/environments
**Solutions**: 
- Check PostgreSQL version compatibility (requires PostgreSQL 12+)
- Verify Node.js version (requires Node.js 16+)
- For cloud databases, use `DATABASE_URL` instead of individual config
- Check firewall settings for PostgreSQL port (default 5432)
- Ensure test database can be created/dropped by your user

**Issue**: SSL connection errors
**Solution**: For remote databases, use `DATABASE_URL` with SSL parameters:
```bash
DATABASE_URL=postgresql://username:password@host:5432/trivia_game_test?sslmode=require
```

This script will:
- Create a test database (`trivia_game_test`)
- Run the database schema from `src/data/database/`
- Seed test data

## Running Tests

From the project root:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Test Database Configuration

The tests use environment variables to connect to the test database. You can configure these in several ways:

### Method 1: Environment Variables
Set these before running tests:
```bash
export POSTGRES_USER=your_username
export POSTGRES_PASSWORD=your_password
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB_TEST=trivia_game_test
```

### Method 2: .env.test file (Recommended)
```bash
# Copy the example and edit it
cp ../../.env.test.example ../../.env.test
# Edit .env.test with your settings
```

### Method 3: Default Configuration
If no configuration is provided, tests will use:
- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=` (empty)
- `POSTGRES_HOST=localhost`
- `POSTGRES_PORT=5432`
- `POSTGRES_DB_TEST=trivia_game_test`

### Troubleshooting Database Connection Issues

If tests fail with database connection errors on different computers:

1. **Check PostgreSQL is running**:
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. **Verify user permissions**:
   ```bash
   psql -h localhost -U your_username -d postgres -c "SELECT 1;"
   ```

3. **Ensure user can create databases**:
   ```bash
   psql -h localhost -U your_username -d postgres -c "CREATE DATABASE test_permissions_check;"
   psql -h localhost -U your_username -d postgres -c "DROP DATABASE test_permissions_check;"
   ```

4. **Use .env.test for custom settings**:
   ```bash
   # Create .env.test with your specific database settings
   cp ../../.env.test.example ../../.env.test
   # Edit the file with your actual database credentials
   ```

## Integration Tests

- **Purpose**: Test real database operations and end-to-end functionality
- **Dependencies**: Real PostgreSQL database connections
- **Coverage**: Database queries, data persistence, API responses
- **Database**: Uses PostgreSQL test database (`trivia_game_test`)

## Configuration

- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Test environment setup

### Testing Dependencies (automatically installed via npm install):
- `jest` - Testing framework
- `@types/jest` - TypeScript types for Jest
- `ts-jest` - TypeScript preprocessor for Jest
- `supertest` - HTTP assertion library for testing APIs
- `@types/supertest` - TypeScript types for Supertest

### Environment Compatibility Requirements:
- **Node.js**: Version 16 or higher
- **PostgreSQL**: Version 12 or higher
- **Operating System**: Linux, macOS, or Windows with WSL
- **Memory**: At least 1GB RAM available for tests
- **Network**: PostgreSQL port 5432 accessible (or custom port configured)

## Best Practices

1. **Integration tests** test real database operations and API responses
2. **Database cleanup** is handled automatically via test setup
3. **Connection pooling** prevents resource leaks
4. **Test isolation** ensures reliable test execution
