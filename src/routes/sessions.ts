import express, { Request, Response } from 'express';
import { DatabaseService } from '../data/database';
import { isValidUserId } from '../utils/userHelpers';

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

// Get session state/progress
sessionsRouter.get('/:id', (req: Request, res: Response) => {
  // TODO: Get session state/progress
  res.json({ message: 'Get session by ID - not implemented yet' });
});

// Submit answer for a question
sessionsRouter.post('/:id/answer', (req: Request, res: Response) => {
  // TODO: Submit answer for a question
  res.json({ message: 'Submit answer - not implemented yet' });
});

// List all sessions (game master)
sessionsRouter.get('/', (req: Request, res: Response) => {
  // TODO: List all sessions (game master)
  res.json({ message: 'List all sessions - not implemented yet' });
});

export { sessionsRouter };
