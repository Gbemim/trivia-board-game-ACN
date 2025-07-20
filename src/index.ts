import 'dotenv/config';
import express from 'express';
import { setupRoutes } from './routes';
import { errorHandler } from './utils/errorHandler';

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Setup all routes
setupRoutes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});