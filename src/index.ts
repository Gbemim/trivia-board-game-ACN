import 'dotenv/config';
import express, { Request, Response } from 'express';
import { supabase } from './config/supabase';
import { DatabaseService } from './services/database';
import { isValidUserId, isValidUsername } from './utils/userHelpers';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Questions Router
const questionsRouter = express.Router();
questionsRouter.post('/', (req: Request, res: Response) => {
  // TODO: Create a new trivia question
  res.json({ message: 'Create question - not implemented yet' });
});
questionsRouter.get('/', (req: Request, res: Response) => {
  // TODO: Get all trivia questions
  res.json({ message: 'Get all questions - not implemented yet' });
});
questionsRouter.get('/:id', (req: Request, res: Response) => {
  // TODO: Get a single trivia question
  res.json({ message: 'Get question by ID - not implemented yet' });
});
questionsRouter.put('/:id', (req: Request, res: Response) => {
  // TODO: Update a trivia question
  res.json({ message: 'Update question - not implemented yet' });
});
questionsRouter.delete('/:id', (req: Request, res: Response) => {
  // TODO: Delete a trivia question
  res.json({ message: 'Delete question - not implemented yet' });
});
app.use('/questions', questionsRouter);

// Sessions Router
const sessionsRouter = express.Router();

// Create a new game session - requires user_id
sessionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, time_limit } = req.body;
    
    // Validate required user_id
    if (!user_id || typeof user_id !== 'string' || user_id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id is required and must be a valid string'
      });
    }

    // Validate UUID format
    if (!isValidUserId(user_id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user_id format. Must be a valid UUID.'
      });
    }

    // Verify user exists
    const user = await DatabaseService.getUser(user_id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found. Please create a user first using POST /users'
      });
    }

    // Validate time_limit if provided
    if (time_limit !== undefined && (typeof time_limit !== 'number' || time_limit <= 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'time_limit must be a positive number if provided'
      });
    }

    // Create new game session
    const session = await DatabaseService.createGameSession({
      user_id: user_id.trim(),
      status: 'in_progress',
      current_score: 0,
      questions_answered: 0,
      time_limit: time_limit || null,
      completed_at: null
    });

    res.status(201).json({
      status: 'success',
      message: 'Game session created successfully',
      data: {
        session_id: session.id,
        user_id: session.user_id,
        status: session.status,
        current_score: session.current_score,
        questions_answered: session.questions_answered,
        started_at: session.started_at,
        time_limit: session.time_limit
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      message: 'Failed to create game session',
      error: errorMessage
    });
  }
});
sessionsRouter.get('/:id', (req: Request, res: Response) => {
  // TODO: Get session state/progress
  res.json({ message: 'Get session by ID - not implemented yet' });
});
sessionsRouter.post('/:id/answer', (req: Request, res: Response) => {
  // TODO: Submit answer for a question
  res.json({ message: 'Submit answer - not implemented yet' });
});
sessionsRouter.get('/', (req: Request, res: Response) => {
  // TODO: List all sessions (game master)
  res.json({ message: 'List all sessions - not implemented yet' });
});
app.use('/sessions', sessionsRouter);

// Users Router - User Identification System
const usersRouter = express.Router();

// Create/register a new user - generates unique user ID
usersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    // Username is optional - validate if provided
    if (username !== undefined) {
      if (typeof username !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Username must be a string if provided'
        });
      }
      
      if (!isValidUsername(username)) {
        return res.status(400).json({
          status: 'error',
          message: 'Username must be between 1 and 50 characters if provided'
        });
      }
    }

    const user = await DatabaseService.createUser(username ? username.trim() : undefined);
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user_id: user.user_id,
        username: user.username
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user',
      error: errorMessage
    });
  }
});

// Get user information by ID
usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // Validate UUID format (optional but recommended)
    if (!isValidUserId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format'
      });
    }

    const user = await DatabaseService.getUser(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        user_id: user.user_id,
        username: user.username
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user',
      error: errorMessage
    });
  }
});

app.use('/users', usersRouter);

// Add a user sessions endpoint for convenience
app.get('/users/:id/sessions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    if (!isValidUserId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format'
      });
    }

    // Verify user exists
    const user = await DatabaseService.getUser(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get all sessions for this user
    const allSessions = await DatabaseService.getAllGameSessions();
    const userSessions = allSessions.filter(session => session.user_id === id);

    res.json({
      status: 'success',
      data: {
        user_id: id,
        username: user.username,
        sessions: userSessions
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user sessions',
      error: errorMessage
    });
  }
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    await supabase.from('users').select('count').limit(1);
    res.json({ status: 'ok', message: 'Database connection successful' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: errorMessage });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Trivia Game API is running!' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err); // Log the error for debugging

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});