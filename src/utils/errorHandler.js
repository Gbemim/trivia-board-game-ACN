"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
// Error handling middleware
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    console.error(err); // Log the error for debugging
    const status = err.status || 500;
    res.status(status).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : undefined,
    });
}
