import request from 'supertest';
import express from 'express';
import { sessionsRouter } from '../routes/sessions';

/**
 * SESSIONS API TEST SUITE
 * Essential tests for session endpoints
 */

// Mock modules
jest.mock('../data/database', () => ({
  DatabaseService: {
    getUser: jest.fn(),
    getRandomQuestionsForSession: jest.fn(),
    createGameSession: jest.fn(),
    getGameSessionById: jest.fn(),
    getSessionQuestions: jest.fn(),
    getUserAnswers: jest.fn(),
    getTriviaQuestionById: jest.fn(),
    isQuestionInSession: jest.fn(),
    getUserAnswer: jest.fn(),
    createUserAnswer: jest.fn(),
    updateGameSession: jest.fn(),
    getAllGameSessions: jest.fn()
  }
}));

jest.mock('../utils/userHelpers', () => ({
  isValidUserId: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/sessions', sessionsRouter);

describe('Sessions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /sessions - Create Session', () => {
    // Test successful creation of a new game session with valid user ID
    it('should create a new game session successfully', async () => {
      const { DatabaseService } = require('../data/database');
      const { isValidUserId } = require('../utils/userHelpers');
      
      // Setup mocks
      isValidUserId.mockReturnValue(true);
      DatabaseService.getUser.mockResolvedValue({ user_id: 'user-123', username: 'testuser' });
      DatabaseService.getRandomQuestionsForSession.mockResolvedValue(
        Array.from({ length: 16 }, (_, i) => ({
          id: `q${i + 1}`,
          category: 'Sports',
          question: `Question ${i + 1}?`,
          answers: ['A', 'B'],
          score: 5
        }))
      );
      DatabaseService.createGameSession.mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        status: 'in_progress',
        current_score: 0
      });

      const response = await request(app)
        .post('/sessions')
        .send({ user_id: 'user-123' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.session_id).toBe('session-123');
    });

    // Test validation error when user_id is missing from request body
    it('should return 400 when user_id is missing', async () => {
      const response = await request(app)
        .post('/sessions')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('user_id is required');
    });

    // Test error handling when trying to create session for non-existent user
    it('should return 404 when user does not exist', async () => {
      const { DatabaseService } = require('../data/database');
      const { isValidUserId } = require('../utils/userHelpers');
      
      isValidUserId.mockReturnValue(true);
      DatabaseService.getUser.mockResolvedValue(null);

      const response = await request(app)
        .post('/sessions')
        .send({ user_id: 'user-123' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /sessions/:id - Get Session Details', () => {
    // Test successful retrieval of session details including progress and questions
    it('should return session details with progress', async () => {
      const { DatabaseService } = require('../data/database');
      
      DatabaseService.getGameSessionById.mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        status: 'in_progress',
        current_score: 10
      });
      DatabaseService.getSessionQuestions.mockResolvedValue([
        { id: 'q1', category: 'Sports', question: 'Question 1?', answers: ['A', 'B'], score: 5 }
      ]);
      DatabaseService.getUserAnswers.mockResolvedValue([]);

      const response = await request(app)
        .get('/sessions/session-123');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.session.id).toBe('session-123');
    });

    // Test error handling when requesting details for non-existent session
    it('should return 404 when session not found', async () => {
      const { DatabaseService } = require('../data/database');
      DatabaseService.getGameSessionById.mockResolvedValue(null);

      const response = await request(app)
        .get('/sessions/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });
  });

  describe('POST /sessions/:id/answer - Submit Answer', () => {
    // Test successful submission of correct answer and game state update
    it('should submit correct answer successfully', async () => {
      const { DatabaseService } = require('../data/database');
      
      DatabaseService.getGameSessionById.mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        status: 'in_progress'
      });
      DatabaseService.getTriviaQuestionById.mockResolvedValue({
        id: 'q1',
        answers: ['Correct', 'Wrong'],
        correct_answer_index: 0,
        score: 10
      });
      DatabaseService.isQuestionInSession.mockResolvedValue(true);
      DatabaseService.getUserAnswer.mockResolvedValue(null);
      DatabaseService.getUserAnswers.mockResolvedValue([]);
      DatabaseService.getSessionQuestions.mockResolvedValue([{ score: 10 }]);
      DatabaseService.updateGameSession.mockResolvedValue({});

      const response = await request(app)
        .post('/sessions/session-123/answer')
        .send({
          user_id: 'user-123',
          question_id: 'q1',
          answer_index: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Correct answer!');
      expect(response.body.data.answer_result.is_correct).toBe(true);
    });

    // Test security validation - users can only answer their own sessions
    it('should return 403 when user tries to answer another user\'s session', async () => {
      const { DatabaseService } = require('../data/database');
      
      DatabaseService.getGameSessionById.mockResolvedValue({
        id: 'session-123',
        user_id: 'different-user',
        status: 'in_progress'
      });

      const response = await request(app)
        .post('/sessions/session-123/answer')
        .send({
          user_id: 'user-123',
          question_id: 'q1',
          answer_index: 0
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    // Test prevention of duplicate answers - each question can only be answered once
    it('should return 409 when trying to answer same question twice', async () => {
      const { DatabaseService } = require('../data/database');
      
      DatabaseService.getGameSessionById.mockResolvedValue({
        id: 'session-123',
        user_id: 'user-123',
        status: 'in_progress'
      });
      DatabaseService.getTriviaQuestionById.mockResolvedValue({ 
        id: 'q1', 
        answers: ['A', 'B', 'C', 'D'],
        correct_answer_index: 0,
        score: 10
      });
      DatabaseService.isQuestionInSession.mockResolvedValue(true);
      DatabaseService.getUserAnswer.mockResolvedValue({ question_id: 'q1' });

      const response = await request(app)
        .post('/sessions/session-123/answer')
        .send({
          user_id: 'user-123',
          question_id: 'q1',
          answer_index: 0
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Answer already submitted');
    });
  });

  describe('GET /sessions - List Sessions', () => {
    // Test successful retrieval of all game sessions with user information
    it('should list all sessions with basic information', async () => {
      const { DatabaseService } = require('../data/database');
      
      const mockSessions = [
        { id: 'session-1', user_id: 'user-1', status: 'user_won', current_score: 80, questions_answered: 16 }
      ];

      DatabaseService.getAllGameSessions.mockResolvedValue(mockSessions);
      DatabaseService.getUser.mockResolvedValue({ username: 'testuser' });

      const response = await request(app)
        .get('/sessions');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.sessions).toHaveLength(1);
    });

    // Test query parameter filtering - sessions can be filtered by status
    it('should filter sessions by status', async () => {
      const { DatabaseService } = require('../data/database');
      
      const mockSessions = [
        { id: 'session-1', user_id: 'user-1', status: 'user_won' },
        { id: 'session-2', user_id: 'user-2', status: 'in_progress' }
      ];

      DatabaseService.getAllGameSessions.mockResolvedValue(mockSessions);
      DatabaseService.getUser.mockResolvedValue({ username: 'testuser' });

      const response = await request(app)
        .get('/sessions?status=user_won');

      expect(response.status).toBe(200);
      expect(response.body.data.sessions).toHaveLength(1);
      expect(response.body.data.sessions[0].status).toBe('user_won');
    });

  });
});
