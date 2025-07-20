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

### Roles & Endpoints

| Role         | Endpoints (Actions)                                                                 |
|--------------|-------------------------------------------------------------------------------------|
| **Game Master** | `POST /questions`<br>`GET /questions`<br>`GET /questions/:id`<br>`PUT /questions/:id`<br>`DELETE /questions/:id`<br>`GET /sessions` |
| **User**        | `POST /sessions`<br>`GET /sessions/:id`<br>`POST /sessions/:id/answer`           |

- **Game Master**: Use the `/questions` endpoints to manage trivia questions and `/sessions` to view all game sessions.
- **User**: Use the `/sessions` endpoints to start a game, answer questions, and view your progress.

### Example Requests

#### Create a Trivia Question (Game Master)
```http
POST /questions
Content-Type: application/json

{
  "category": "Sports",
  "question": "What's the diameter of a basketball hoop in inches?",
  "answers": ["14 inches", "16 inches", "18 inches"],
  "correct_answer_index": 2,
  "score": 10
}
```

#### Start a New Game Session (User)
```http
POST /sessions
Content-Type: application/json

{
  "user_id": "user-uuid",
  "username": "player1" // optional
}
```

#### Submit an Answer (User)
```http
POST /sessions/{session_id}/answer
Content-Type: application/json

{
  "question_id": "question-uuid",
  "answer_index": 1
}
```

## Notes
- There is **no authentication**; anyone can use any endpoint.
- The intended usage is for the frontend or API user to choose their role and use the appropriate endpoints.
- For more details on the database schema, see `src/trivia_game.schema.sql`.

## Development
- API routes are scaffolded in `src/index.ts`.
- Business logic is implemented in `src/services/database.ts`.
- Error handling and JSON parsing middleware are set up in the Express app.

## License
MIT 