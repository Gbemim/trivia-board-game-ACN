import 'dotenv/config';
import express, { Request, Response } from 'express';
import { supabase } from './config/supabase';
import { DatabaseService } from './services/database';

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
sessionsRouter.post('/', (req: Request, res: Response) => {
  // TODO: Start a new game session
  res.json({ message: 'Start session - not implemented yet' });
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

// Users Router (optional)
const usersRouter = express.Router();
usersRouter.post('/', (req: Request, res: Response) => {
  // TODO: Create/register user
  res.json({ message: 'Create user - not implemented yet' });
});
usersRouter.get('/:id', (req: Request, res: Response) => {
  // TODO: Get user info
  res.json({ message: 'Get user by ID - not implemented yet' });
});
app.use('/users', usersRouter);

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