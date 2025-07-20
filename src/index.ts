import 'dotenv/config';
import express, { Request, Response } from 'express';
import { supabase } from './config/supabase';
import { DatabaseService } from './services/database';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Test database connection
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test the connection by trying to get a user (this will fail but show connection works)
    await supabase.from('users').select('count').limit(1);
    res.json({ status: 'ok', message: 'Database connection successful' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: errorMessage });
  }
});

// Basic route to test the server
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Trivia Game API is running!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});