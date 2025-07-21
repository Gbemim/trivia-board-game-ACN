import express from 'express';
import { questionsRouter } from './questions';
import { sessionsRouter } from './sessions';
import { usersRouter } from './users';
import { healthRouter } from './health';

export function setupRoutes(app: express.Application): void {
  // Mount all route modules
  app.use('/questions', questionsRouter);
  app.use('/sessions', sessionsRouter);
  app.use('/users', usersRouter);
  app.use('/health', healthRouter);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({ message: 'Trivia Game API is running!' });
  });
}
