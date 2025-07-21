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

```bash
cd src/__tests__
./setup-test-db.sh
```

This script will:
- Create a test database (`trivia_game_test`)
- Run the database schema
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

The tests use environment variables to connect to the test database:
- `POSTGRES_DB=trivia_game_test`
- `POSTGRES_USER=your_username` 
- `POSTGRES_HOST=localhost`
- `POSTGRES_PORT=5432`

## Integration Tests

- **Purpose**: Test real database operations and end-to-end functionality
- **Dependencies**: Real PostgreSQL database connections
- **Coverage**: Database queries, data persistence, API responses
- **Database**: Uses PostgreSQL test database (`trivia_game_test`)

## Configuration

- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Test environment setup

## Best Practices

1. **Integration tests** test real database operations and API responses
2. **Database cleanup** is handled automatically via test setup
3. **Connection pooling** prevents resource leaks
4. **Test isolation** ensures reliable test execution
