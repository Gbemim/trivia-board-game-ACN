"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionsRouter = void 0;
const express_1 = __importDefault(require("express"));
const questionsRouter = express_1.default.Router();
exports.questionsRouter = questionsRouter;
// Create a new trivia question
questionsRouter.post('/', (req, res) => {
    // TODO: Create a new trivia question
    res.json({ message: 'Create question - not implemented yet' });
});
// Get all trivia questions
questionsRouter.get('/', (req, res) => {
    // TODO: Get all trivia questions
    res.json({ message: 'Get all questions - not implemented yet' });
});
// Get a single trivia question
questionsRouter.get('/:id', (req, res) => {
    // TODO: Get a single trivia question
    res.json({ message: 'Get question by ID - not implemented yet' });
});
// Update a trivia question
questionsRouter.put('/:id', (req, res) => {
    // TODO: Update a trivia question
    res.json({ message: 'Update question - not implemented yet' });
});
// Delete a trivia question
questionsRouter.delete('/:id', (req, res) => {
    // TODO: Delete a trivia question
    res.json({ message: 'Delete question - not implemented yet' });
});
