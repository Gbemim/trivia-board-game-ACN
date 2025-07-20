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
questionsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Question ID is required',
        error: 'Question ID must be a non-empty string'
      });
    }

    const question = await DatabaseService.getTriviaQuestionById(id);
    
    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Question not found',
        error: `Trivia question with ID ${id} does not exist`
      });
    }

    res.json({
      status: 'success',
      message: 'Question retrieved successfully',
      data: question
    });
  } catch (error) {
    console.error('Error retrieving question:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve question',
      error: errorMessage
    });
  }
});

// Update a trivia question
questionsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, question, answers, correct_answer_index, is_ai_generated } = req.body;

    // Validate question ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Question ID is required',
        error: 'Question ID must be a non-empty string'
      });
    }

    // Check if question exists
    const existingQuestion = await DatabaseService.getTriviaQuestionById(id);
    if (!existingQuestion) {
      return res.status(404).json({
        status: 'error',
        message: 'Question not found',
        error: `Trivia question with ID ${id} does not exist`
      });
    }

    // Check if question is in use by an active session
    const isInUse = await DatabaseService.isQuestionInUse(id);
    if (isInUse) {
      return res.status(409).json({
        status: 'error',
        message: 'Cannot update question in use',
        error: 'This question is currently being used in an active game session and cannot be modified'
      });
    }

    // Build update object with validation
    const updates: Partial<typeof existingQuestion> = {};

    // Validate category if provided
    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim().length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid category',
          error: 'Category must be a non-empty string'
        });
      }
      updates.category = category.trim();
    }

    // Validate question if provided
    if (question !== undefined) {
      if (typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid question',
          error: 'Question must be a non-empty string'
        });
      }
      updates.question = question.trim();
    }

    // Validate answers if provided
    if (answers !== undefined) {
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

      updates.answers = answers.map((answer: string) => answer.trim());
    }

    // Validate correct_answer_index if provided
    if (correct_answer_index !== undefined) {
      if (typeof correct_answer_index !== 'number' || !Number.isInteger(correct_answer_index)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid correct answer index',
          error: 'Correct answer index must be an integer'
        });
      }

      // Use the updated answers array if provided, otherwise use existing one
      const answersToCheck = updates.answers || existingQuestion.answers;
      if (correct_answer_index < 0 || correct_answer_index >= answersToCheck.length) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid correct answer index',
          error: `Correct answer index must be between 0 and ${answersToCheck.length - 1}`
        });
      }

      updates.correct_answer_index = correct_answer_index;
    }

    // Validate is_ai_generated if provided
    if (is_ai_generated !== undefined) {
      if (typeof is_ai_generated !== 'boolean') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid AI generated flag',
          error: 'is_ai_generated must be a boolean'
        });
      }
      updates.is_ai_generated = is_ai_generated;
    }

    // Check if any updates were provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid updates provided',
        error: 'At least one field must be provided for update'
      });
    }

    // Update the trivia question
    const updatedQuestion = await DatabaseService.updateTriviaQuestion(id, updates);

    res.json({
      status: 'success',
      message: 'Trivia question updated successfully',
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Error updating trivia question:', error);

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
      message: 'Failed to update trivia question',
      error: errorMessage
    });
  }
});

// Delete a trivia question
questionsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate question ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Question ID is required',
        error: 'Question ID must be a non-empty string'
      });
    }

    // Check if question exists
    const existingQuestion = await DatabaseService.getTriviaQuestionById(id);
    if (!existingQuestion) {
      return res.status(404).json({
        status: 'error',
        message: 'Question not found',
        error: `Trivia question with ID ${id} does not exist`
      });
    }

    // Check if question is in use by an active session
    const isInUse = await DatabaseService.isQuestionInUse(id);
    if (isInUse) {
      return res.status(409).json({
        status: 'error',
        message: 'Cannot delete question in use',
        error: 'This question is currently being used in an active game session and cannot be deleted'
      });
    }

    // Delete the trivia question
    await DatabaseService.deleteTriviaQuestion(id);

    res.json({
      status: 'success',
      message: 'Trivia question deleted successfully',
      data: {
        deleted_question_id: id,
        deleted_question: existingQuestion
      }
    });
  } catch (error) {
    console.error('Error deleting trivia question:', error);

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
      message: 'Failed to delete trivia question',
      error: errorMessage
    });
  }
});

export { questionsRouter };
