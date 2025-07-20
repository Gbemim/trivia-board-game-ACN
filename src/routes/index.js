"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const questions_1 = require("./questions");
const sessions_1 = require("./sessions");
const users_1 = require("./users");
const health_1 = require("./health");
function setupRoutes(app) {
    // Mount all route modules
    app.use('/questions', questions_1.questionsRouter);
    app.use('/sessions', sessions_1.sessionsRouter);
    app.use('/users', users_1.usersRouter);
    app.use('/health', health_1.healthRouter);
    // Root endpoint
    app.get('/', (req, res) => {
        res.json({ message: 'Trivia Game API is running!' });
    });
}
