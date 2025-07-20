import express, { Request, Response } from 'express';

const questionsRouter = express.Router();

// Create a new trivia question
questionsRouter.post('/', (req: Request, res: Response) => {
  // TODO: Create a new trivia question
  res.json({ message: 'Create question - not implemented yet' });
});

// Get all trivia questions
questionsRouter.get('/', (req: Request, res: Response) => {
  // TODO: Get all trivia questions
  res.json({ message: 'Get all questions - not implemented yet' });
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
