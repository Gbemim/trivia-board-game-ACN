import express, { Request, Response } from 'express';
import { DatabaseService } from '../data/database';
import { isValidUserId, isValidUsername } from '../utils/userHelpers';

const usersRouter = express.Router();

/**
 * Create a new user with optional username
 * POST /users
 */
usersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    // Validate username if provided
    if (username !== undefined) {
      if (typeof username !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Username must be a string if provided',
          error: 'Invalid username type'
        });
      }
      
      if (!isValidUsername(username)) {
        return res.status(400).json({
          status: 'error',
          message: 'Username must be between 1 and 50 characters if provided',
          error: 'Invalid username length'
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
    console.error('Error creating user:', error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; message?: string; details?: string };
      
      if (dbError.code === '23505') {
        return res.status(409).json({
          status: 'error',
          message: 'Username already exists',
          error: 'A user with this username already exists. Please choose a different username.'
        });
      }
      
      if (dbError.code === '42501') {
        return res.status(403).json({
          status: 'error',
          message: 'Permission denied',
          error: 'Insufficient permissions to create user. Please contact administrator.'
        });
      }
      
      return res.status(400).json({
        status: 'error',
        message: 'Database error',
        error: dbError.message || 'Unknown database error'
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user',
      error: errorMessage
    });
  }
});

/**
 * Get user information by ID
 * GET /users/:id
 */
usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required',
        error: 'User ID parameter is missing or empty'
      });
    }

    if (!isValidUserId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format',
        error: 'User ID must be a valid UUID'
      });
    }

    const user = await DatabaseService.getUser(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        error: `User with ID ${id} does not exist`
      });
    }

    res.json({
      status: 'success',
      message: 'User retrieved successfully',
      data: {
        user_id: user.user_id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error retrieving user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user',
      error: errorMessage
    });
  }
});

/**
 * Get all game sessions for a specific user
 * GET /users/:id/sessions
 */
usersRouter.get('/:id/sessions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required',
        error: 'User ID parameter is missing or empty'
      });
    }

    if (!isValidUserId(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format',
        error: 'User ID must be a valid UUID'
      });
    }

    // Verify user exists first
    const user = await DatabaseService.getUser(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        error: `User with ID ${id} does not exist`
      });
    }

    // Get all sessions for this user
    const allSessions = await DatabaseService.getAllGameSessions();
    const userSessions = allSessions.filter(session => session.user_id === id);

    res.json({
      status: 'success',
      message: `Retrieved ${userSessions.length} sessions for user`,
      data: {
        user_id: id,
        username: user.username,
        sessions: userSessions,
        total_sessions: userSessions.length
      }
    });
  } catch (error) {
    console.error('Error retrieving user sessions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user sessions',
      error: errorMessage
    });
  }
});

export { usersRouter };
