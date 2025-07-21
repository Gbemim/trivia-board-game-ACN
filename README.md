# Trivia Board Game Backend

This is a backend API for a Trivia Board Game, built with Node.js, TypeScript, Express, and Supabase.

## Overview
- **Game Master**: Can create, update, delete, and list trivia questions; view all game sessions.
- **User**: Can start a new game session, answer questions, and view their game progress.
- **Open Access**: There is no authentication or authorization. Anyone can use any endpoint, but the intended usage is documented below.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- **Choose one database option:**
  - **Supabase**: Hosted PostgreSQL (recommended for quick start)
  - **PostgreSQL**: Local PostgreSQL installation

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. **Choose your database setup** (see Database Setup Instructions below)
4. Create a `.env` file in the project root (copy from `.env.example` and update):
   
   **For Supabase:**
   ```env
   DATABASE_TYPE=supabase
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=3000
   NODE_ENV=development
   ```
   
   **For PostgreSQL:**
   ```env
   DATABASE_TYPE=postgresql
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=trivia_game
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password
   PORT=3000
   NODE_ENV=development
   ```

### Running the Application

#### Development Mode (TypeScript)
```bash
npm start        # Quick start for development
```

#### Production Mode (Compiled JavaScript)
```bash
npm run build    # Compile TypeScript to JavaScript
npm run start:prod  # Run compiled version
```

#### Other Commands
```bash
npm run lint     # Check code quality
npm run format   # Format code with Prettier
npm run clean    # Remove compiled files
```

The API will be available at `http://localhost:3000/`
Health check: `http://localhost:3000/health`

## Project Structure

```
database/                   # Database setup files
├── schemas/                # Database schema files
│   ├── supabase.sql        # Supabase-compatible schema
│   └── postgresql_schema.sql # PostgreSQL schema with indexes
├── seeds/                  # Seed data files
│   └── seed_trivia_questions.sql # Sample trivia questions
└── README.md              # Database setup guide
src/
├── index.ts                # Main application entry point
├── data/                   # Data access layer
│   ├── supabase.ts         # Supabase client configuration
│   └── database.ts         # Database service operations
├── routes/                 # API route definitions
│   ├── index.ts            # Route setup and mounting
│   ├── questions.ts        # Question management endpoints
│   ├── sessions.ts         # Game session endpoints
│   ├── users.ts            # User management endpoints
│   └── health.ts           # Health check endpoint
├── utils/                  # Utility functions
│   ├── userHelpers.ts      # User validation and helpers
│   └── errorHandler.ts     # Error handling middleware
└── __tests__/              # Test suite
    ├── users.test.ts       # User API + validation tests
    ├── sessions.test.ts    # Session management tests
    └── questions.test.ts   # Question CRUD tests
```

### Architecture Highlights
- **Pure TypeScript**: Clean TypeScript source code, compiled JavaScript output
- **Modular Routes**: Organized by functionality (users, sessions, questions, health)
- **Data Layer**: Centralized database operations and Supabase configuration
- **Utilities**: Reusable helper functions and middleware
- **Clean Separation**: Business logic separated from route definitions
- **Comprehensive Testing**: 34 tests covering all endpoints with real validation logic

## API Usage

### User Identification System

Before starting any game session, users must first create a user account to get a unique user ID. This system supports optional usernames for better user tracking.

#### User Registration Flow
1. **Create User**: `POST /users` - Generates a unique UUID-based user ID
2. **Start Session**: `POST /sessions` - Use the user ID to create game sessions
3. **Track Progress**: All game sessions are linked to the user ID

### Roles & Endpoints

| Role         | Endpoints (Actions)                                                                 |
|--------------|-------------------------------------------------------------------------------------|
| **Anyone**      | `POST /users` (Create user)<br>`GET /users/:id` (Get user info)<br>`GET /users/:id/sessions` (Get user's sessions) |
| **Game Master** | `POST /questions`<br>`GET /questions`<br>`GET /questions/:id`<br>`PUT /questions/:id`<br>`DELETE /questions/:id`<br>`GET /sessions` |
| **User**        | `POST /sessions`<br>`GET /sessions/:id`<br>`POST /sessions/:id/answer`           |

- **User Management**: Anyone can create a user account and view user information
- **Game Master**: Use the `/questions` endpoints to manage trivia questions and `/sessions` to view all game sessions
- **User**: Use the `/sessions` endpoints to start a game, answer questions, and view your progress

### How to Use the API (No Authentication Required)

This API uses a **role-based approach without authentication**. Choose your role based on what you want to accomplish:

#### As a Game Master
**Purpose**: Manage trivia questions and monitor all game sessions

**Workflow**:
1. Use `POST /questions` to create new trivia questions
2. Use `GET /questions` to view all available questions
3. Use `PUT /questions/:id` to update existing questions
4. Use `DELETE /questions/:id` to remove questions (if not in active use)
5. Use `GET /sessions` to monitor all player game sessions

**No special setup required** - just start calling the question management endpoints.

#### As a Player/User
**Purpose**: Play trivia games

**Workflow**:
1. **First**: Create your user account with `POST /users` to get a unique user ID
2. **Then**: Start a game session with `POST /sessions` using your user ID
3. **Play**: Submit answers using `POST /sessions/:id/answer`
4. **Track**: View your progress with `GET /sessions/:id`
5. **Review**: See all your past games with `GET /users/:id/sessions`

**Important**: You must create a user account before you can start any game sessions.

#### Security Model
- **Open Access**: No API keys, tokens, or authentication required
- **Role Separation**: Roles are determined by which endpoints you use, not by permissions
- **Data Isolation**: Each user's sessions are linked to their unique user ID
- **Validation**: All inputs are validated, but anyone can call any endpoint

### Example Requests

#### 1. Create a User Account (Required First Step)
```bash
POST /users
Content-Type: application/json

{
  "username": "player123"  // Optional: can be omitted
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "user_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "username": "player123"
  }
}
```

#### 2. Get User Information
```bash
GET /users/a1b2c3d4-e5f6-7890-1234-567890abcdef
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef", 
    "username": "player123"
  }
}
```

#### 3. Get All Sessions for a User
```bash
GET /users/a1b2c3d4-e5f6-7890-1234-567890abcdef/sessions
```

#### 4. Create a Game Session (Requires User ID)
```bash
POST /sessions
Content-Type: application/json

{
  "user_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "time_limit": 1800  // Optional: 30 minutes in seconds
}
```

#### 5. Create a Trivia Question (Game Master)
```bash
POST /questions
Content-Type: application/json

{
  "category": "Sports",
  "question": "What's the diameter of a basketball hoop in inches?",
  "answers": ["14 inches", "16 inches", "18 inches"],
  "correct_answer_index": 2,
  "score": 10,
  "is_ai_generated": false
}
```

#### 6. Submit an Answer (User)
```bash
POST /sessions/{session_id}/answer
Content-Type: application/json

{
  "question_id": "question-uuid",
  "answer_index": 1
}
```

## Complete API Endpoints Reference

### Postman Collection
A complete Postman collection is available in `postman-collection.json` with all endpoints pre-configured. Import this file into Postman for easy testing.

**Environment Variables:**
- `base_url`: `http://localhost:3000` (or your server URL)

### User Management Endpoints

| Method | Endpoint | Description | Required Fields |
|--------|----------|-------------|-----------------|
| `POST` | `/users` | Create a new user account | `username` (optional) |
| `GET` | `/users/:id` | Get user information by ID | - |
| `GET` | `/users/:id/sessions` | Get all sessions for a user | - |

### Question Management Endpoints (Game Master)

| Method | Endpoint | Description | Required Fields |
|--------|----------|-------------|-----------------|
| `POST` | `/questions` | Create a new trivia question | `category`, `question`, `answers`, `correct_answer_index`, `score` |
| `GET` | `/questions` | Get all trivia questions | - |
| `GET` | `/questions/:id` | Get specific question by ID | - |
| `PUT` | `/questions/:id` | Update existing question | Any field to update |
| `DELETE` | `/questions/:id` | Delete a question | - |

### Game Session Endpoints (Users)

| Method | Endpoint | Description | Required Fields |
|--------|----------|-------------|-----------------|
| `POST` | `/sessions` | Create new game session | `user_id` |
| `GET` | `/sessions/:id` | Get session progress and details | - |
| `POST` | `/sessions/:id/answer` | Submit answer for a question | `question_id`, `answer_index` |
| `GET` | `/sessions` | Get all sessions (Game Master) | - |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check endpoint |
| `GET` | `/` | Root endpoint with API info |

## Testing

### Unit Tests

The project includes comprehensive unit tests using Jest and Supertest:

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)  
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test Coverage:**
- ✅ **Users API**: Complete endpoint testing with real validation logic
- ✅ **Sessions API**: Game session creation, progress tracking, answer submission
- ✅ **Questions API**: Full CRUD operations, validation, error responses
- ✅ **Validation Logic**: UUID and username validation integrated into endpoint tests
- ✅ **Error Handling**: Database errors, input validation, edge cases
- ✅ **Security**: Malformed JSON, extra fields, boundary testing

**Test Structure (34 Tests Total):**
```
src/__tests__/
├── users.test.ts         (13 tests) - User endpoints + validation logic
├── sessions.test.ts      (11 tests) - Session management & gameplay  
└── questions.test.ts     (10 tests) - Question CRUD operations
```

**Key Testing Features:**
- **Real Validation**: Tests actual `isValidUserId` and `isValidUsername` functions through API calls
- **No Test Duplication**: Each test serves a unique purpose, no redundant coverage
- **Comprehensive Scenarios**: Success cases, validation errors, database failures, edge cases
- **Integration Testing**: Tests validate both individual functions AND their usage in real endpoints

### API Testing with Postman

1. **Import Collection**: Import `postman-collection.json` into Postman
2. **Set Environment**: Create environment with `base_url = http://localhost:3000`
3. **Test Workflow**:
   - Start with health check
   - Create a user account
   - Create some trivia questions
   - Start a game session
   - Submit answers
   - Check progress and results

## Local Development Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Supabase project with database setup

### Step-by-Step Setup

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd trivia-board-game
   npm install
   ```

2. **Environment Configuration**:
   Create `.env` file:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=3000
   NODE_ENV=development
   ```

3. **Database Setup**:
   - **For Supabase**: Copy contents of `database/schemas/supabase.sql` and run in Supabase SQL Editor
   - **For PostgreSQL**: Run `psql trivia_game < database/schemas/postgresql_schema.sql`
   - **Optional**: Run `database/seeds/seed_trivia_questions.sql` for 32 sample questions from the challenge
   - **Verify**: Run `verify_database.sql` to confirm setup

4. **Development**:
   ```bash
   npm start          # Start development server
   npm run lint       # Check code quality
   npm run format     # Format code
   npm test           # Run unit tests
   ```

5. **Production**:
   ```bash
   npm run build      # Compile TypeScript
   npm run start:prod # Run compiled version
   ```

## Database Setup Instructions

### Database Options

The project now supports multiple database backends. Choose the one that best fits your needs:

#### Option 1: Supabase (Cloud PostgreSQL)
**Best for:** Quick setup, hosted solution, automatic backups

1. **Create Tables**: Run `database/schemas/supabase.sql` in Supabase SQL Editor
2. **Environment Setup**: 
   ```env
   DATABASE_TYPE=supabase
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. **Verify Setup**: Run `verify_database.sql` to confirm schema
4. **Add Sample Data**: Optionally run `database/seeds/seed_trivia_questions.sql`

#### Option 2: PostgreSQL (Local/Self-hosted)
**Best for:** Full control, local development, no external dependencies

1. **Install PostgreSQL**:
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create Database**:
   ```bash
   createdb trivia_game
   psql trivia_game < database/schemas/postgresql_schema.sql
   ```

3. **Environment Setup**:
   ```env
   DATABASE_TYPE=postgresql
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=trivia_game
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password
   
   # Alternative: Use connection string
   # DATABASE_URL=postgresql://postgres:password@localhost:5432/trivia_game
   ```

4. **Add Sample Data**:
   ```bash
   psql trivia_game < database/seeds/seed_trivia_questions.sql
   ```

### Database Schema Files

- **`database/schemas/supabase.sql`** - Supabase-compatible schema
- **`database/schemas/postgresql_schema.sql`** - PostgreSQL-specific schema with indexes and triggers
- **`database/seeds/seed_trivia_questions.sql`** - Sample trivia questions (32 questions from challenge)
- **`verify_database.sql`** - Schema verification queries
- **`.env.example`** - Environment template for both database types

### Switching Between Databases

Simply change the `DATABASE_TYPE` environment variable:
- `DATABASE_TYPE=supabase` - Use Supabase
- `DATABASE_TYPE=postgresql` - Use PostgreSQL

No code changes required! The application automatically uses the correct database provider.

## User Identification Rules

- **User ID**: Automatically generated UUID v4 format (e.g., `a1b2c3d4-e5f6-7890-1234-567890abcdef`)
- **Username**: Optional field for user tracking (1-50 characters, trimmed automatically)
- **Session Management**: Each user can have multiple concurrent game sessions
- **Validation**: All user IDs are validated for proper UUID format
- **No Authentication**: Open access system - no passwords or tokens required

## Game Rules & Scoring

- **Question Selection**: Each game session selects 4 random questions from each category
- **Weighted Scoring**: Each question has its own score value (stored in `question.score` field)
- **Win Condition**: Achieve 80% of the total possible score points
- **Win Calculation**: Sum of all score values from correctly answered questions
- **Example**: If total possible score is 100 points, you need 80+ points to win
- **Session Status**: Automatically updated to 'user_won' or 'user_lost' when all questions are answered
- **Progress Tracking**: Real-time score percentage and questions remaining available via progress endpoint

## Notes
- **No Authentication**: Open access system - anyone can use any endpoint
- **TypeScript First**: Pure TypeScript development with compiled JavaScript for production
- **User Registration Required**: Users must create an account before starting game sessions
- **UUID-based IDs**: All user IDs are automatically generated using UUID v4
- **Optional Usernames**: Username field is optional but recommended for user experience
- **Concurrent Sessions**: Each user can have multiple active game sessions
- **Input Validation**: All inputs are validated for proper format and types
- **Database Schema**: See `database/schemas/` for complete database structure
- **Comprehensive Testing**: 34 tests covering all endpoints with real validation logic
- **Clean Test Structure**: No duplicate tests, each test serves a unique purpose

## Development

### Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Validation**: Custom validation functions
- **Code Quality**: ESLint + Prettier
- **Build System**: TypeScript Compiler

### File Organization
- **Entry Point**: `src/index.ts` - Application setup and middleware
- **Data Layer**: `src/data/` - Database operations and Supabase client
- **API Routes**: `src/routes/` - RESTful endpoint definitions
- **Utilities**: `src/utils/` - Helper functions and middleware
- **Schema**: `database/schemas/` - Database structure
- **Tests**: `src/__tests__/` - Comprehensive test suite (34 tests, 3 files)

### Development Workflow
1. **Write Code**: Edit TypeScript files in `src/`
2. **Run Dev Server**: `npm start` (uses ts-node for direct TS execution)
3. **Test Changes**: `npm test` (runs comprehensive test suite - 34 tests)
4. **Lint & Format**: `npm run lint` and `npm run format`
5. **Build for Production**: `npm run build` (compiles to `dist/`)
6. **Run Production**: `npm run start:prod`

### Code Quality
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for consistent code style
- **Type Safety**: Full TypeScript coverage with strict typing
- **Error Handling**: Centralized error handling middleware
- **Validation**: Input validation for all endpoints
- **Testing**: Comprehensive test suite with real validation logic (no mocks for validation functions)
- **Clean Architecture**: Modular design with clear separation of concerns

## License
MIT 