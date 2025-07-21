import express, { Request, Response } from 'express';
import { DatabaseService } from '../data/database';
import { handleDatabaseError, handleUserError } from '../utils/errorHandler';
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
    handleUserError(error, res, 'create user');
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
    handleDatabaseError(error, res, 'retrieve user');
  }
});

export { usersRouter };
