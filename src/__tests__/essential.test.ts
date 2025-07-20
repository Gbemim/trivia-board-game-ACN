import request from 'supertest';
import express from 'express';
import { usersRouter } from '../routes/users';
import { sessionsRouter } from '../routes/sessions';
import { questionsRouter } from '../routes/questions';

// Mock the database service
jest.mock('../data/database', () => ({
  DatabaseService: {
    // User operations
    createUser: jest.fn(),
    getUser: jest.fn(),
    getUserSessions: jest.fn(),
    
    // Question operations
    createTriviaQuestion: jest.fn(),
    getAllTriviaQuestions: jest.fn(),
    isQuestionInUse: jest.fn(),
    updateTriviaQuestion: jest.fn(),
    deleteTriviaQuestion: jest.fn(),
    
    // Session operations
    createGameSession: jest.fn(),
    getGameSessionById: jest.fn(),
    getAllGameSessions: jest.fn(),
    getRandomQuestionsForSession: jest.fn()
  }
}));

// Mock validation helpers
jest.mock('../utils/userHelpers', () => ({
  isValidUserId: jest.fn(() => true),
  isValidUsername: jest.fn(() => true)
}));

const app = express();
app.use(express.json());
app.use('/users', usersRouter);
app.use('/sessions', sessionsRouter);
app.use('/questions', questionsRouter);

describe('Trivia Board Game API - Essential Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Management', () => {
    it('should create a new user', async () => {
      const { DatabaseService } = require('../data/database');
      DatabaseService.createUser.mockResolvedValue({
        user_id: 'test-user-id',
        username: null
      });

      const response = await request(app)
        .post('/users')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    });

    it('should get user details', async () => {
      const { DatabaseService } = require('../data/database');
      DatabaseService.getUser.mockResolvedValue({
        user_id: 'test-user-id',
        username: 'testuser'
      });

      const response = await request(app)
        .get('/users/test-user-id');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  describe('Question Management (Game Master)', () => {
    it('should create a trivia question', async () => {
      const { DatabaseService } = require('../data/database');
      DatabaseService.createTriviaQuestion.mockResolvedValue({
        id: 'test-question-id',
        category: 'Sports',
        question: 'What sport uses a net?',
        answers: ['Tennis', 'Golf'],
        correct_answer_index: 0,
        score: 10
      });

      const response = await request(app)
        .post('/questions')
        .send({
          category: 'Sports',
          question: 'What sport uses a net?',
          answers: ['Tennis', 'Golf'],
          correct_answer_index: 0,
          score: 10
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    });

    it('should get all questions', async () => {
      const { DatabaseService } = require('../data/database');
      DatabaseService.getAllTriviaQuestions.mockResolvedValue([]);

      const response = await request(app)
        .get('/questions');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  describe('Game Session Management', () => {
    it('should create a game session', async () => {
      const { DatabaseService } = require('../data/database');
      DatabaseService.getUser.mockResolvedValue({
        user_id: 'test-user-id',
        username: 'testuser'
      });
      DatabaseService.getRandomQuestionsForSession.mockResolvedValue([
        { id: 'q1', category: 'Sports', question: 'Test?', answers: ['A', 'B'], correct_answer_index: 0, score: 5 }
      ]);
      DatabaseService.createGameSession.mockResolvedValue({
        id: 'test-session-id',
        user_id: 'test-user-id',
        status: 'in_progress',
        current_score: 0,
        questions_answered: 0,
        selected_questions: ['q1']
      });

      const response = await request(app)
        .post('/sessions')
        .send({ user_id: 'test-user-id' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    });

    it('should get all sessions', async () => {
      const { DatabaseService } = require('../data/database');
      DatabaseService.getAllGameSessions.mockResolvedValue([]);

      const response = await request(app)
        .get('/sessions');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
});
