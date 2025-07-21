# Trivia Board Game Backend

A simple REST API for a trivia board game built with Node.js, TypeScript, Express, and PostgreSQL.

## Overview
- **Game Master**: Manage trivia questions and view all game sessions
- **Player**: Create account, start game sessions, answer questions, track progress
- **Open Access**: No authentication required

## Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL database

### Setup
1. Clone and install:
   ```bash
   git clone <repository-url>
   cd trivia-board-game
   npm install
   ```

2. Setup environment:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. Setup database:
   ```bash
   # Create database and run schema
   createdb trivia_game
   psql trivia_game < src/data/database/postgresql_schema.sql
   
   # Optional: Add sample questions
   psql trivia_game < src/data/database/seed_trivia_questions.sql
   ```

4. Run the application:
   ```bash
   npm start                # Development mode
   npm run build && npm run start:prod  # Production mode
   ```

API available at: `http://localhost:3000`

## Project Structure

```
src/
├── data/                   # Database operations & setup files
│   ├── database/           # Database schema & seed files
│   ├── postgresql.ts       # PostgreSQL provider
│   └── types.ts           # Type definitions
├── routes/                 # API endpoints
├── utils/                  # Helper functions
└── __tests__/              # Integration tests
```

## API Usage

### For Players
1. **Create account**: `POST /users` 
2. **Start game**: `POST /sessions` with your user_id
3. **Answer questions**: `POST /sessions/:id/answer`
4. **Check progress**: `GET /sessions/:id`

### For Game Masters
- **Manage questions**: `POST|GET|PUT|DELETE /questions`
- **View all sessions**: `GET /sessions`

### Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/users` | Create user account |
| `POST` | `/sessions` | Start new game |
| `POST` | `/sessions/:id/answer` | Submit answer |
| `GET` | `/sessions/:id` | Get game progress |
| `POST` | `/questions` | Create question (Game Master) |
| `GET` | `/questions` | List all questions |

## Testing

**For complete test setup instructions, see: [src/__tests__/README.md](src/__tests__/README.md)**

Quick overview:
```bash
# Setup test environment (first time only)
cp .env.test.example .env.test
# Edit .env.test with your database settings

# Setup test database
cd src/__tests__
./setup-test-db.sh

# Run tests
npm test
npm run test:coverage
```

**Note**: Test setup requires PostgreSQL configuration. See the detailed testing guide at [src/__tests__/README.md](src/__tests__/README.md) for troubleshooting and environment-specific setup.

## Environment Configuration

See `.env.example` for configuration options. Key variables:
- `POSTGRES_*`: Database connection settings
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## Game Rules

- 4 random questions per category per game
- Each question has its own score value
- Win condition: 80% of total possible score
- Multiple concurrent sessions per user allowed

---

For detailed information, see:
- `src/data/database/` - Database schema and seed files
- [src/__tests__/README.md](src/__tests__/README.md) - Testing guide 