import request from 'supertest';
import express from 'express';
import { questionsRouter } from '../routes/questions';
import PostgreSQLProvider from '../data/postgresql';

/**
 * QUESTIONS API INTEGRATION TEST SUITE
 * Integration tests using real PostgreSQL test database
 */

const app = express();
app.use(express.json());
app.use('/questions', questionsRouter);

describe('Questions API Integration Tests', () => {
  let createdQuestionIds: string[] = [];
  let dbProvider: PostgreSQLProvider;

  beforeAll(async () => {
    // Create a dedicated database provider for these tests
    dbProvider = new PostgreSQLProvider();
  });

  afterEach(async () => {
    // Clean up created questions after each test
    // Note: For now we'll let the test database accumulate data
    // In a production setup, you'd want to clean up test data
  });

  afterAll(async () => {
    // Close the database connection to prevent open handles
    if (dbProvider && typeof dbProvider.close === 'function') {
      await dbProvider.close();
    }
    // Give some time for any pending database operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('POST /questions - Create Question (Integration)', () => {
    it('should create a new trivia question successfully with real database', async () => {
      const questionData = {
        category: 'Integration Test',
        question: 'What is 2 + 2?',
        answers: ['3', '4', '5', '6'],
        correct_answer_index: 1,
        score: 10
      };

      const response = await request(app)
        .post('/questions')
        .send(questionData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.category).toBe('Integration Test');
      expect(response.body.data.question).toBe('What is 2 + 2?');
      expect(response.body.data.score).toBe(10);
      
      // Store for cleanup
      if (response.body.data.id) {
        createdQuestionIds.push(response.body.data.id);
      }
    });

    it('should validate required fields with real database', async () => {
      const response = await request(app)
        .post('/questions')
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Category is required');
    });
  });

  describe('GET /questions - Get All Questions (Integration)', () => {
    it('should retrieve all questions from real database', async () => {
      const response = await request(app)
        .get('/questions');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('questions');
      expect(response.body.data).toHaveProperty('total_count');
      expect(Array.isArray(response.body.data.questions)).toBe(true);
    });
  });

  describe('GET /questions/:id - Get Single Question (Integration)', () => {
    it('should retrieve an existing question', async () => {
      // First create a question
      const createResponse = await request(app)
        .post('/questions')
        .send({
          category: 'Test Category',
          question: 'Test question for retrieval?',
          answers: ['A', 'B', 'C', 'D'],
          correct_answer_index: 0,
          score: 5
        });

      const questionId = createResponse.body.data.id;
      createdQuestionIds.push(questionId);

      // Then retrieve it
      const getResponse = await request(app)
        .get(`/questions/${questionId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.status).toBe('success');
      expect(getResponse.body.data.id).toBe(questionId);
      expect(getResponse.body.data.question).toBe('Test question for retrieval?');
    });

    it('should return 404 for non-existent question', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/questions/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Question not found');
    });
  });
});
