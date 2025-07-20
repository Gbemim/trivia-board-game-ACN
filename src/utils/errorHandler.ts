import express from 'express';

// Error handling middleware
export function errorHandler(
  err: Error, 
  req: express.Request, 
  res: express.Response, 
  _next: express.NextFunction
): void {
  console.error(err); // Log the error for debugging

  const status = (err as Error & { status?: number }).status || 500;
  
  res.status(status).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
}
