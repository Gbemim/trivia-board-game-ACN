#!/bin/bash

# Test Database Setup Script
# This script creates a separate test database for Jest integration tests
# Run from the __tests__ folder: ./setup-test-db.sh

DB_NAME="trivia_game_test"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

echo "Setting up test database: $DB_NAME"
echo "Using database user: $DB_USER"

# Create test database if it doesn't exist
psql -h $DB_HOST -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME already exists"

# Run schema creation (adjusted path from test folder)
echo "Creating tables in test database..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f ../../database/postgresql_schema.sql

# Optionally run seed data for tests (adjusted path from test folder)
echo "Seeding test data..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f ../../database/seed_trivia_questions.sql

echo "Test database setup complete!"
echo "Database: $DB_NAME"
echo "Connection: postgresql://$DB_USER:@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "To run tests: npm test"
echo "To run with coverage: npm run test:coverage"
echo ""
echo "Note: Ensure your PostgreSQL user has CREATE DATABASE privileges"
