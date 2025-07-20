import express from 'express';

// Error handling middleware
export function errorHandler(
  err: any, 
  req: express.Request, 
  res: express.Response, 
  next: express.NextFunction
): void {
  console.error(err); // Log the error for debugging

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
}
