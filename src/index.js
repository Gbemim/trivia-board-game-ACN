"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const routes_1 = require("./routes");
const errorHandler_1 = require("./utils/errorHandler");
// Create Express application
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
// Setup all routes
(0, routes_1.setupRoutes)(app);
// Error handling middleware (must be last)
app.use(errorHandler_1.errorHandler);
// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health check available at http://localhost:${port}/health`);
});
