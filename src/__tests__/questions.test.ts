import request from 'supertest';
import express from 'express';
import { questionsRouter } from '../routes/questions';

/**
 * QUESTIONS API TEST SUITE
 * Essential tests for trivia question management endpoints
 */

// Mock modules
jest.mock('../data/database', () => ({
  DatabaseService: {
    createTriviaQuestion: jest.fn(),
    getAllTriviaQuestions: jest.fn(),
    getTriviaQuestionById: jest.fn(),
    updateTriviaQuestion: jest.fn(),
    deleteTriviaQuestion: jest.fn(),
    isQuestionInUse: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/questions', questionsRouter);

describe('Questions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /questions - Create Question', () => {
    // Test successful creation of a new trivia question
    it('should create a new trivia question successfully', async () => {
      const { DatabaseService } = require('../data/database');
      
      const mockQuestion = {
        id: 'q-123',
        category: 'Sports',
        question: 'What is the most popular sport?',
        answers: ['Football', 'Basketball', 'Soccer', 'Tennis'],
        correct_answer_index: 2,
        score: 10
      };

      DatabaseService.createTriviaQuestion.mockResolvedValue(mockQuestion);

      const response = await request(app)
        .post('/questions')
        .send({
          category: 'Sports',
          question: 'What is the most popular sport?',
          answers: ['Football', 'Basketball', 'Soccer', 'Tennis'],
          correct_answer_index: 2,
          score: 10
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe('q-123');
    });

    // Test validation errors for required fields
    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/questions')
        .send({
          // Missing category, question, answers, etc.
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Category is required');
    });

    // Test validation for invalid data
    it('should return 400 when data is invalid', async () => {
      const response = await request(app)
        .post('/questions')
        .send({
          category: 'Sports',
          question: 'Test question?',
          answers: ['Only one answer'], // Invalid: less than 2 answers
          correct_answer_index: 0,
          score: 5
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid number of answers');
    });
  });

  describe('GET /questions - Get All Questions', () => {
    // Test successful retrieval of all trivia questions
    it('should retrieve all trivia questions successfully', async () => {
      const { DatabaseService } = require('../data/database');
      
      const mockQuestions = [
        { id: 'q-1', category: 'Sports', question: 'Question 1?', score: 5 },
        { id: 'q-2', category: 'Science', question: 'Question 2?', score: 10 }
      ];

      DatabaseService.getAllTriviaQuestions.mockResolvedValue(mockQuestions);

      const response = await request(app)
        .get('/questions');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.questions).toHaveLength(2);
      expect(response.body.data.total_count).toBe(2);
    });
  });

  describe('GET /questions/:id - Get Single Question', () => {
    // Test successful retrieval of a single question by ID
    it('should retrieve a single question by ID successfully', async () => {
      const { DatabaseService } = require('../data/database');
      
      const mockQuestion = {
        id: 'q-123',
        category: 'Sports',
        question: 'Test question?',
        answers: ['A', 'B', 'C'],
        score: 10
      };

      DatabaseService.getTriviaQuestionById.mockResolvedValue(mockQuestion);

      const response = await request(app)
        .get('/questions/q-123');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe('q-123');
    });

    // Test error when question not found
    it('should return 404 when question not found', async () => {
      const { DatabaseService } = require('../data/database');
      
      DatabaseService.getTriviaQuestionById.mockResolvedValue(null);

      const response = await request(app)
        .get('/questions/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Question not found');
    });
  });

  describe('PUT /questions/:id - Update Question', () => {
    // Test successful update of a trivia question
    it('should update a trivia question successfully', async () => {
      const { DatabaseService } = require('../data/database');
      
      const existingQuestion = {
        id: 'q-123',
        category: 'Sports',
        question: 'Old question?',
        answers: ['A', 'B'],
        score: 5
      };

      const updatedQuestion = {
        ...existingQuestion,
        question: 'Updated question?',
        score: 10
      };

      DatabaseService.getTriviaQuestionById.mockResolvedValue(existingQuestion);
      DatabaseService.isQuestionInUse.mockResolvedValue(false);
      DatabaseService.updateTriviaQuestion.mockResolvedValue(updatedQuestion);

      const response = await request(app)
        .put('/questions/q-123')
        .send({
          question: 'Updated question?',
          score: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.question).toBe('Updated question?');
    });

    // Test error when trying to update question in use
    it('should return 409 when trying to update question in use', async () => {
      const { DatabaseService } = require('../data/database');
      
      DatabaseService.getTriviaQuestionById.mockResolvedValue({ id: 'q-123' });
      DatabaseService.isQuestionInUse.mockResolvedValue(true);

      const response = await request(app)
        .put('/questions/q-123')
        .send({ score: 10 });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Cannot update question in use');
    });
  });

  describe('DELETE /questions/:id - Delete Question', () => {
    // Test successful deletion of a trivia question
    it('should delete a trivia question successfully', async () => {
      const { DatabaseService } = require('../data/database');
      
      const existingQuestion = { id: 'q-123', category: 'Sports', question: 'Test?' };

      DatabaseService.getTriviaQuestionById.mockResolvedValue(existingQuestion);
      DatabaseService.isQuestionInUse.mockResolvedValue(false);
      DatabaseService.deleteTriviaQuestion.mockResolvedValue(true);

      const response = await request(app)
        .delete('/questions/q-123');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.deleted_question_id).toBe('q-123');
    });

    // Test error when trying to delete question in use
    it('should return 409 when trying to delete question in use', async () => {
      const { DatabaseService } = require('../data/database');
      
      DatabaseService.getTriviaQuestionById.mockResolvedValue({ id: 'q-123' });
      DatabaseService.isQuestionInUse.mockResolvedValue(true);

      const response = await request(app)
        .delete('/questions/q-123');

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Cannot delete question in use');
    });

    // Test error when question not found
    it('should return 404 when trying to delete non-existent question', async () => {
      const { DatabaseService } = require('../data/database');
      
      DatabaseService.getTriviaQuestionById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/questions/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Question not found');
    });
  });
});
