import express, { Request, Response } from 'express';
import { supabase } from '../data/supabase';

const healthRouter = express.Router();

// Health check endpoint
healthRouter.get('/', async (req: Request, res: Response) => {
  try {
    await supabase.from('users').select('count').limit(1);
    res.json({ status: 'ok', message: 'Database connection successful' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: errorMessage });
  }
});

export { healthRouter };
