# Trivia Board Game Backend

This is a backend API for a Trivia Board Game, built with Node.js, TypeScript, Express, and Supabase.

## Overview
- **Game Master**: Can create, update, delete, and list trivia questions; view all game sessions.
- **User**: Can start a new game session, answer questions, and view their game progress.
- **Open Access**: There is no authentication or authorization. Anyone can use any endpoint, but the intended usage is documented below.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Supabase project (with tables set up as per `src/trivia_game.schema.sql`)

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root with your Supabase credentials:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=3000
   NODE_ENV=development
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
5. The API will be available at `http://localhost:3000/`

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

## User Identification Rules

- **User ID**: Automatically generated UUID v4 format (e.g., `a1b2c3d4-e5f6-7890-1234-567890abcdef`)
- **Username**: Optional field for user tracking (1-50 characters, trimmed automatically)
- **Session Management**: Each user can have multiple concurrent game sessions
- **Validation**: All user IDs are validated for proper UUID format
- **No Authentication**: Open access system - no passwords or tokens required

## Notes
- There is **no authentication**; anyone can use any endpoint.
- Users must create an account first before starting any game sessions.
- User IDs are automatically generated using UUID v4 for uniqueness.
- Username is optional but recommended for better user experience.
- For more details on the database schema, see `src/trivia_game.schema.sql`.

## Development
- API routes are implemented in `src/index.ts`.
- Business logic is implemented in `src/services/database.ts`.
- User utilities are available in `src/utils/userHelpers.ts`.
- Error handling and JSON parsing middleware are set up in the Express app.

## License
MIT 