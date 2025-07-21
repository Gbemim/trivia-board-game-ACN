import express, { Request, Response } from 'express';
import PostgreSQLProvider from '../data/postgresql';

const healthRouter = express.Router();
const database = new PostgreSQLProvider();

// Health check endpoint
healthRouter.get('/', async (req: Request, res: Response) => {
  try {
    const isConnected = await database.testConnection();
    if (isConnected) {
      res.json({ status: 'ok', message: 'Database connection successful' });
    } else {
      res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: errorMessage });
  }
});

export { healthRouter };
