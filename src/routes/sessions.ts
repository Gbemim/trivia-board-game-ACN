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
        message: 'user_id is required and must be a valid string',
        error: 'user_id field is required'
      });
    }

    // Validate UUID format
    if (!isValidUserId(user_id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user_id format',
        error: 'user_id must be a valid UUID'
      });
    }

    // Verify user exists
    const user = await DatabaseService.getUser(user_id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        error: 'Please create a user first using POST /users'
      });
    }

    // Validate time_limit if provided
    if (time_limit !== undefined && (typeof time_limit !== 'number' || time_limit <= 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid time limit',
        error: 'time_limit must be a positive number if provided'
      });
    }

    // Select 16 questions across 4 categories for this session
    let selectedQuestions;
    try {
      selectedQuestions = await DatabaseService.getRandomQuestionsForSession();
    } catch (questionError) {
      return res.status(400).json({
        status: 'error',
        message: 'Unable to create session',
        error: questionError instanceof Error ? questionError.message : 'Failed to select questions for session'
      });
    }

    // Create new game session with selected questions
    const session = await DatabaseService.createGameSession({
      user_id: user_id.trim(),
      status: 'in_progress',
      current_score: 0,
      questions_answered: 0,
      // selected_questions: selectedQuestions.map(q => q.id), // TODO: Add to DB schema
      time_limit: time_limit || null,
      completed_at: null
    });

    // Prepare response with session details and question summary
    const categorySummary = selectedQuestions.reduce((acc, question) => {
      acc[question.category] = (acc[question.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.status(201).json({
      status: 'success',
      message: 'Game session created successfully',
      data: {
        session_id: session.id,
        user_id: session.user_id,
        status: session.status,
        current_score: session.current_score,
        questions_answered: session.questions_answered,
        total_questions: selectedQuestions.length,
        questions_by_category: categorySummary,
        selected_questions: selectedQuestions.map(q => ({
          id: q.id,
          category: q.category,
          question: q.question,
          answers: q.answers,
          // Note: correct_answer_index is not included in session creation response for security
        })),
        started_at: session.started_at,
        time_limit: session.time_limit,
        session_rules: {
          total_questions: 16,
          questions_per_category: 4,
          win_condition: "80% correct answers (13 out of 16)",
          scoring: "1 point per correct answer, 0 for incorrect",
          note: "Answer each question by submitting to POST /sessions/{session_id}/answer"
        }
      }
    });
  } catch (error) {
    console.error('Error creating game session:', error);

    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; message?: string; details?: string };
      
      return res.status(400).json({
        status: 'error',
        message: 'Database error',
        error: dbError.message || 'Unknown database error'
      });
    }

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
