import request from 'supertest';
import express from 'express';
import { questionsRouter } from '../routes/questions';
import { usersRouter } from '../routes/users';
import { sessionsRouter } from '../routes/sessions';

// Mock the database service
jest.mock('../data/database', () => ({
  DatabaseService: {
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getAllUsers: jest.fn(),
    getTriviaQuestionById: jest.fn(),
    getAllTriviaQuestions: jest.fn(),
    createTriviaQuestion: jest.fn(),
    updateTriviaQuestion: jest.fn(),
    deleteTriviaQuestion: jest.fn(),
    getGameSessionById: jest.fn(),
    getAllGameSessions: jest.fn(),
    createGameSession: jest.fn(),
    getRandomQuestionsForSession: jest.fn(),
    isQuestionInSession: jest.fn(),
    getUserAnswer: jest.fn(),
    createUserAnswer: jest.fn(),
    updateGameSession: jest.fn(),
    getSessionQuestions: jest.fn(),
    getUserAnswers: jest.fn()
  }
}));

// Mock user helpers
jest.mock('../utils/userHelpers', () => ({
  isValidUserId: jest.fn(() => true),
  isValidUsername: jest.fn(() => true)
}));

const app = express();
app.use(express.json());
app.use('/questions', questionsRouter);
app.use('/users', usersRouter);
app.use('/sessions', sessionsRouter);

describe('Trivia Board Game API - User Stories Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // US1: As a game master, I can create trivia questions
  describe('US1: Game Master can create trivia questions', () => {
    it('should create a new trivia question with all required fields', async () => {
      const { DatabaseService } = require('../data/database');
      
      const newQuestion = {
        category: 'Sports',
        question: 'What sport is known as "The Beautiful Game"?',
        answers: ['Basketball', 'Football/Soccer', 'Tennis', 'Baseball'],
        correct_answer_index: 1,
        score: 10
      };

      const createdQuestion = {
        id: 'q-12345',
        ...newQuestion,
        created_at: '2024-01-01T00:00:00Z'
      };

      DatabaseService.createTriviaQuestion.mockResolvedValue(createdQuestion);

      const response = await request(app)
        .post('/questions')
        .send(newQuestion);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.question).toBe(newQuestion.question);
      expect(response.body.data.category).toBe(newQuestion.category);
      expect(response.body.data.answers).toHaveLength(4);
    });
  });

  // US2: As a game master, I can view all trivia questions
  describe('US2: Game Master can view all trivia questions', () => {
    it('should retrieve all trivia questions', async () => {
      const { DatabaseService } = require('../data/database');
      
      const mockQuestions = [
        {
          id: 'q1',
          category: 'Sports',
          question: 'Sports question?',
          answers: ['A', 'B', 'C'],
          correct_answer_index: 1,
          score: 5
        },
        {
          id: 'q2',
          category: 'Science',
          question: 'Science question?',
          answers: ['X', 'Y'],
          correct_answer_index: 0,
          score: 10
        }
      ];

      DatabaseService.getAllTriviaQuestions.mockResolvedValue(mockQuestions);

      const response = await request(app)
        .get('/questions');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.questions).toHaveLength(2);
    });
  });

  // US3: As a user, I can create my profile
  describe('US3: User can create profile', () => {
    it('should create a new user profile', async () => {
      const { DatabaseService } = require('../data/database');
      
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testplayer',
        created_at: '2024-01-01T00:00:00Z'
      };

      DatabaseService.createUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users')
        .send({ username: 'testplayer' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.username).toBe('testplayer');
      expect(response.body.data.user_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  // US4: As a user, I can start a new trivia game session
  describe('US4: User can start new trivia game session', () => {
    it('should create a new game session with 16 questions', async () => {
      const { DatabaseService } = require('../data/database');
      const validUserId = '123e4567-e89b-12d3-a456-426614174000';
      
      const mockUser = { user_id: validUserId, username: 'testuser' };
      const mockQuestions = Array.from({length: 16}, (_, i) => ({
        id: `q${i+1}`,
        category: ['Sports', 'Science', 'Music', 'Nature'][i % 4],
        question: `Question ${i+1}?`,
        answers: ['A', 'B'],
        correct_answer_index: 0,
        score: 5
      }));

      const mockSession = {
        id: 'session-123',
        user_id: validUserId,
        status: 'in_progress',
        current_score: 0,
        questions_answered: 0,
        selected_questions: mockQuestions.map(q => q.id),
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        time_limit: null
      };

      DatabaseService.getUser.mockResolvedValue(mockUser);
      DatabaseService.getRandomQuestionsForSession.mockResolvedValue(mockQuestions);
      DatabaseService.createGameSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/sessions')
        .send({ user_id: validUserId });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.session_id).toBe('session-123');
      expect(response.body.data.total_questions).toBe(16);
      expect(response.body.data.status).toBe('in_progress');
    });
  });

  // US5: As a user, I can submit answers to questions
  describe('US5: User can submit answers to questions', () => {
    it('should allow user to submit correct answer and get points', async () => {
      const { DatabaseService } = require('../data/database');
      const sessionId = 'session-123';
      const questionId = 'question-456';
      const answerIndex = 1;

      const mockSession = {
        id: sessionId,
        user_id: 'user-123',
        status: 'in_progress',
        current_score: 0,
        questions_answered: 0,
        selected_questions: [questionId]
      };

      const mockQuestion = {
        id: questionId,
        category: 'Sports',
        question: 'Test question?',
        answers: ['Wrong', 'Correct', 'Also Wrong'],
        correct_answer_index: 1,
        score: 10
      };

      const mockAnswer = {
        id: 'answer-789',
        session_id: sessionId,
        question_id: questionId,
        answer_index: answerIndex,
        is_correct: true,
        answered_at: '2024-01-01T00:00:00Z'
      };

      DatabaseService.getGameSessionById.mockResolvedValue(mockSession);
      DatabaseService.getTriviaQuestionById.mockResolvedValue(mockQuestion);
      DatabaseService.isQuestionInSession.mockResolvedValue(true);
      DatabaseService.getUserAnswer.mockResolvedValue(null);
      DatabaseService.createUserAnswer.mockResolvedValue(mockAnswer);
      
      // Mock getUserAnswers to return current answers
      const currentAnswers = [{
        id: 'answer-789',
        session_id: sessionId,
        question_id: questionId,
        answer_index: answerIndex,
        is_correct: true
      }];
      DatabaseService.getUserAnswers.mockResolvedValue(currentAnswers);
      
      // Mock getSessionQuestions to return session questions
      const sessionQuestions = [{
        id: questionId,
        category: 'Sports',
        question: 'Test question?',
        answers: ['Wrong', 'Correct', 'Also Wrong'],
        correct_answer_index: 1,
        score: 10
      }];
      DatabaseService.getSessionQuestions.mockResolvedValue(sessionQuestions);
      
      DatabaseService.updateGameSession.mockResolvedValue({
        ...mockSession,
        current_score: 10,
        questions_answered: 1
      });

      const response = await request(app)
        .post(`/sessions/${sessionId}/answer`)
        .send({
          question_id: questionId,
          answer_index: answerIndex,
          user_id: 'user-123' // Required field
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.answer_result.is_correct).toBe(true);
      expect(response.body.data.answer_result.question_id).toBe(questionId);
    });

    it('should prevent submitting answer twice for same question', async () => {
      const { DatabaseService } = require('../data/database');
      const sessionId = 'session-123';
      const questionId = 'question-456';

      const mockSession = {
        id: sessionId,
        user_id: 'user-123',
        status: 'in_progress',
        current_score: 10,
        questions_answered: 1,
        selected_questions: [questionId]
      };

      const mockQuestion = {
        id: questionId,
        category: 'Sports',
        question: 'Test question?',
        answers: ['A', 'B', 'C'],
        correct_answer_index: 1,
        score: 10
      };

      const existingAnswer = {
        id: 'answer-existing',
        session_id: sessionId,
        question_id: questionId,
        answer_index: 1,
        is_correct: true,
        answered_at: '2024-01-01T00:00:00Z'
      };

      DatabaseService.getGameSessionById.mockResolvedValue(mockSession);
      DatabaseService.getTriviaQuestionById.mockResolvedValue(mockQuestion);
      DatabaseService.isQuestionInSession.mockResolvedValue(true);
      DatabaseService.getUserAnswer.mockResolvedValue(existingAnswer);

      const response = await request(app)
        .post(`/sessions/${sessionId}/answer`)
        .send({
          question_id: questionId,
          answer_index: 0,
          user_id: 'user-123'
        });

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Answer already submitted');
    });
  });

  // US6: As a user, I can win if I get >80% correct
  describe('US6: User can win with >80% correct answers', () => {
    it('should mark game as won when final score >80%', async () => {
      const { DatabaseService } = require('../data/database');
      const sessionId = 'session-123';
      const questionId = 'final-question';

      // Mock session with 15 questions answered, high score
      const mockSession = {
        id: sessionId,
        user_id: 'user-123',
        status: 'in_progress',
        current_score: 130, // 13 correct answers
        questions_answered: 15,
        selected_questions: Array.from({length: 16}, (_, i) => `q${i+1}`)
      };

      const mockQuestion = {
        id: questionId,
        question: 'Final question?',
        answers: ['Correct', 'Wrong'],
        correct_answer_index: 0,
        score: 10
      };

      DatabaseService.getGameSessionById.mockResolvedValue(mockSession);
      DatabaseService.getTriviaQuestionById.mockResolvedValue(mockQuestion);
      DatabaseService.isQuestionInSession.mockResolvedValue(true);
      DatabaseService.getUserAnswer.mockResolvedValue(null);
      DatabaseService.createUserAnswer.mockResolvedValue({
        id: 'final-answer',
        session_id: sessionId,
        question_id: questionId,
        answer_index: 0,
        is_correct: true
      });
      
      // Mock getUserAnswers to return all 16 answers
      const allAnswers = Array.from({length: 16}, (_, i) => ({
        id: `answer-${i}`,
        session_id: sessionId,
        question_id: `q${i+1}`,
        answer_index: 0,
        is_correct: i < 14 // 14 correct answers
      }));
      DatabaseService.getUserAnswers.mockResolvedValue(allAnswers);
      
      // Mock getSessionQuestions to return all 16 questions
      const allQuestions = Array.from({length: 16}, (_, i) => ({
        id: `q${i+1}`,
        category: 'Test',
        question: `Question ${i+1}?`,
        answers: ['A', 'B'],
        correct_answer_index: 0,
        score: 10
      }));
      DatabaseService.getSessionQuestions.mockResolvedValue(allQuestions);
      
      // 14 correct out of 16 = 87.5% > 80% = WIN
      DatabaseService.updateGameSession.mockResolvedValue({
        ...mockSession,
        status: 'user_won',
        current_score: 140,
        questions_answered: 16,
        completed_at: '2024-01-01T01:00:00Z'
      });

      const response = await request(app)
        .post(`/sessions/${sessionId}/answer`)
        .send({
          question_id: questionId,
          answer_index: 0,
          user_id: 'user-123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.session_status).toBe('user_won');
      expect(response.body.data.game_complete).toBe(true);
      expect(response.body.data.final_results.score_percentage).toBeGreaterThan(80);
    });
  });

  // US7: As a game master, I can view all game sessions
  describe('US7: Game Master can view all game sessions', () => {
    it('should retrieve all game sessions with user details', async () => {
      const { DatabaseService } = require('../data/database');
      
      const mockSessions = [
        {
          id: 'session-1',
          user_id: 'user-1',
          status: 'user_won',
          current_score: 140,
          questions_answered: 16,
          selected_questions: Array.from({length: 16}, (_, i) => `q${i+1}`),
          started_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T01:00:00Z',
          time_limit: null
        },
        {
          id: 'session-2',
          user_id: 'user-2',
          status: 'in_progress',
          current_score: 50,
          questions_answered: 8,
          selected_questions: Array.from({length: 16}, (_, i) => `q${i+1}`),
          started_at: '2024-01-01T02:00:00Z',
          completed_at: null,
          time_limit: 1800
        }
      ];

      DatabaseService.getAllGameSessions.mockResolvedValue(mockSessions);
      DatabaseService.getUser
        .mockResolvedValueOnce({ user_id: 'user-1', username: 'player1' })
        .mockResolvedValueOnce({ user_id: 'user-2', username: 'player2' });

      const response = await request(app)
        .get('/sessions');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.sessions).toHaveLength(2);
      
      const sessions = response.body.data.sessions;
      expect(sessions.find((s: any) => s.session_id === 'session-1').status).toBe('user_won');
      expect(sessions.find((s: any) => s.session_id === 'session-2').status).toBe('in_progress');
    });
  });

  // US8: Validation - Invalid user ID format rejected
  describe('US8: Validation for user ID format', () => {
    it('should reject invalid user ID format', async () => {
      const { isValidUserId } = require('../utils/userHelpers');
      isValidUserId.mockReturnValue(false);

      const response = await request(app)
        .post('/sessions')
        .send({ user_id: 'invalid-uuid' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid user_id format');
    });
  });

  // US9: Error handling - Non-existent resources
  describe('US9: Handle non-existent resources gracefully', () => {
    it('should return 404 for non-existent user', async () => {
      const { DatabaseService } = require('../data/database');
      const { isValidUserId } = require('../utils/userHelpers');
      
      isValidUserId.mockReturnValue(true); // Valid format
      DatabaseService.getUser.mockResolvedValue(null); // User not found

      const response = await request(app)
        .get('/users/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('User not found');
    });

    it('should return 404 for non-existent question', async () => {
      const { DatabaseService } = require('../data/database');
      
      DatabaseService.getTriviaQuestionById.mockResolvedValue(null);

      const response = await request(app)
        .get('/questions/non-existent-question');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Question not found');
    });
  });

  // US10: Required field validation
  describe('US10: Required field validation', () => {
    it('should reject session creation without user_id', async () => {
      const response = await request(app)
        .post('/sessions')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('user_id is required');
    });

    it('should reject question creation without required fields', async () => {
      const response = await request(app)
        .post('/questions')
        .send({
          question: 'Incomplete question?'
          // Missing category, answers, correct_answer_index, score
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });
});
