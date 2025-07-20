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
    
    // Handle specific database constraint errors
    if (dbError.code === '23505') {
      res.status(409).json({
        status: 'error',
        message: 'Duplicate entry',
        error: 'This value already exists. Please choose a different value.'
      });
      return;
    }
    
    if (dbError.code === '42501') {
      res.status(403).json({
        status: 'error',
        message: 'Permission denied',
        error: 'Insufficient permissions to perform this operation. Please contact administrator.'
      });
      return;
    }
    
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

// Specialized error handler for user operations
export function handleUserError(error: unknown, res: express.Response, operation: string): void {
  console.error(`Error ${operation}:`, error);

  // Handle specific database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; message?: string; details?: string };
    
    if (dbError.code === '23505') {
      res.status(409).json({
        status: 'error',
        message: 'Username already exists',
        error: 'A user with this username already exists. Please choose a different username.'
      });
      return;
    }
    
    if (dbError.code === '42501') {
      res.status(403).json({
        status: 'error',
        message: 'Permission denied',
        error: 'Insufficient permissions to create user. Please contact administrator.'
      });
      return;
    }
    
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
