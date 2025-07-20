import express, { Request, Response } from 'express';
import { DatabaseService } from '../data/database';
import { isValidUserId, isValidUsername } from '../utils/userHelpers';

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

// Get all sessions for a specific user
usersRouter.get('/:id/sessions', async (req: Request, res: Response) => {
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

export { usersRouter };
