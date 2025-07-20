import express, { Request, Response } from 'express';
import { DatabaseService } from '../data/database';

const questionsRouter = express.Router();

/**
 * Create a new trivia question (Game Master)
 * POST /questions
 */
questionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { category, question, answers, correct_answer_index, is_ai_generated } = req.body;

    // Validate required fields
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Category is required',
        error: 'Category must be a non-empty string'
      });
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Question is required',
        error: 'Question must be a non-empty string'
      });
    }

    // Validate answers array
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        status: 'error',
        message: 'Answers must be an array',
        error: 'Answers field must be an array of strings'
      });
    }

    // Check answers length (2-4 answers required)
    if (answers.length < 2 || answers.length > 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid number of answers',
        error: 'Must provide between 2 and 4 possible answers'
      });
    }

    // Validate each answer is a non-empty string
    for (let i = 0; i < answers.length; i++) {
      if (typeof answers[i] !== 'string' || answers[i].trim().length === 0) {
        return res.status(400).json({
          status: 'error',
          message: `Answer ${i + 1} is invalid`,
          error: `Answer ${i + 1} must be a non-empty string`
        });
      }
    }

    // Validate correct_answer_index
    if (typeof correct_answer_index !== 'number' || !Number.isInteger(correct_answer_index)) {
      return res.status(400).json({
        status: 'error',
        message: 'Correct answer index is required',
        error: 'Correct answer index must be an integer'
      });
    }

    if (correct_answer_index < 0 || correct_answer_index >= answers.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid correct answer index',
        error: `Correct answer index must be between 0 and ${answers.length - 1}`
      });
    }

    // Validate is_ai_generated (optional, defaults to false)
    if (is_ai_generated !== undefined && typeof is_ai_generated !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid AI generated flag',
        error: 'is_ai_generated must be a boolean if provided'
      });
    }

    // Create the trivia question
    const questionData = {
      category: category.trim(),
      question: question.trim(),
      answers: answers.map((answer: string) => answer.trim()),
      correct_answer_index,
      is_ai_generated: is_ai_generated || false
    };

    const newQuestion = await DatabaseService.createTriviaQuestion(questionData);

    res.status(201).json({
      status: 'success',
      message: 'Trivia question created successfully',
      data: newQuestion
    });
  } catch (error) {
    console.error('Error creating trivia question:', error);

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
      message: 'Failed to create trivia question',
      error: errorMessage
    });
  }
});

/**
 * Get all trivia questions (Game Master)
 * GET /questions
 */
questionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const questions = await DatabaseService.getAllTriviaQuestions();

    res.json({
      status: 'success',
      message: `Retrieved ${questions.length} trivia questions`,
      data: {
        questions,
        total_count: questions.length
      }
    });
  } catch (error) {
    console.error('Error retrieving trivia questions:', error);

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
      message: 'Failed to retrieve trivia questions',
      error: errorMessage
    });
  }
});

// Get a single trivia question
questionsRouter.get('/:id', (req: Request, res: Response) => {
  // TODO: Get a single trivia question
  res.json({ message: 'Get question by ID - not implemented yet' });
});

// Update a trivia question
questionsRouter.put('/:id', (req: Request, res: Response) => {
  // TODO: Update a trivia question
  res.json({ message: 'Update question - not implemented yet' });
});

// Delete a trivia question
questionsRouter.delete('/:id', (req: Request, res: Response) => {
  // TODO: Delete a trivia question
  res.json({ message: 'Delete question - not implemented yet' });
});

export { questionsRouter };
