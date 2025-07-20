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

// Utility function for handling database errors consistently
export function handleDatabaseError(error: unknown, res: express.Response, operation: string): void {
  console.error(`Error ${operation}:`, error);

  // Handle specific database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; message?: string; details?: string };
    
    res.status(400).json({
      status: 'error',
      message: 'Database error',
      error: dbError.message || 'Unknown database error'
    });
    return;
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  res.status(500).json({
    status: 'error',
    message: `Failed to ${operation}`,
    error: errorMessage
  });
}
