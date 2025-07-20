"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = __importDefault(require("express"));
const database_1 = require("../data/database");
const userHelpers_1 = require("../utils/userHelpers");
const usersRouter = express_1.default.Router();
exports.usersRouter = usersRouter;
// Create/register a new user - generates unique user ID
usersRouter.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        // Username is optional - validate if provided
        if (username !== undefined) {
            if (typeof username !== 'string') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Username must be a string if provided'
                });
            }
            if (!(0, userHelpers_1.isValidUsername)(username)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Username must be between 1 and 50 characters if provided'
                });
            }
        }
        const user = yield database_1.DatabaseService.createUser(username ? username.trim() : undefined);
        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: {
                user_id: user.user_id,
                username: user.username
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            message: 'Failed to create user',
            error: errorMessage
        });
    }
}));
// Get user information by ID
usersRouter.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string' || id.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }
        // Validate UUID format (optional but recommended)
        if (!(0, userHelpers_1.isValidUserId)(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user ID format'
            });
        }
        const user = yield database_1.DatabaseService.getUser(id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        res.json({
            status: 'success',
            data: {
                user_id: user.user_id,
                username: user.username
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve user',
            error: errorMessage
        });
    }
}));
// Get all sessions for a specific user
usersRouter.get('/:id/sessions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string' || id.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }
        if (!(0, userHelpers_1.isValidUserId)(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user ID format'
            });
        }
        // Verify user exists
        const user = yield database_1.DatabaseService.getUser(id);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        // Get all sessions for this user
        const allSessions = yield database_1.DatabaseService.getAllGameSessions();
        const userSessions = allSessions.filter(session => session.user_id === id);
        res.json({
            status: 'success',
            data: {
                user_id: id,
                username: user.username,
                sessions: userSessions
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve user sessions',
            error: errorMessage
        });
    }
}));
