import request from 'supertest';
import express from 'express';
import { sessionsRouter } from '../routes/sessions';
import { usersRouter } from '../routes/users';
import PostgreSQLProvider from '../data/postgresql';

/**
 * SESSIONS API INTEGRATION TEST SUITE
 * Integration tests using real PostgreSQL test database
 */

const app = express();
app.use(express.json());
app.use('/users', usersRouter);
app.use('/sessions', sessionsRouter);

describe('Sessions API Integration Tests', () => {
  let createdUserIds: string[] = [];
  let createdSessionIds: string[] = [];
  let dbProvider: PostgreSQLProvider;

  beforeAll(async () => {
    // Create a dedicated database provider for these tests
    dbProvider = new PostgreSQLProvider();
  });

  afterEach(async () => {
    // Clean up created data after each test
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

  describe('POST /sessions - Create Session (Integration)', () => {
    it('should create a new game session successfully with real database', async () => {
      // First create a user
      const userResponse = await request(app)
        .post('/users')
        .send({ username: 'session_test_user' });

      const userId = userResponse.body.data.user_id;
      createdUserIds.push(userId);

      // Then create a session for that user
      const sessionResponse = await request(app)
        .post('/sessions')
        .send({ user_id: userId });

      expect(sessionResponse.status).toBe(201);
      expect(sessionResponse.body.status).toBe('success');
      expect(sessionResponse.body.data).toHaveProperty('session_id');
      expect(sessionResponse.body.data.user_id).toBe(userId);
      expect(sessionResponse.body.data.status).toBe('in_progress');
      
      // Store for cleanup
      if (sessionResponse.body.data.session_id) {
        createdSessionIds.push(sessionResponse.body.data.session_id);
      }
    });

    it('should return 400 when user_id is missing', async () => {
      const response = await request(app)
        .post('/sessions')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('user_id is required and must be a valid string');
    });

    it('should return 404 when user does not exist', async () => {
      const nonExistentUserId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .post('/sessions')
        .send({ user_id: nonExistentUserId });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /sessions/:id - Get Session Details (Integration)', () => {
    it('should retrieve session details with progress', async () => {
      // First create a user
      const userResponse = await request(app)
        .post('/users')
        .send({ username: 'progress_test_user' });

      const userId = userResponse.body.data.user_id;
      createdUserIds.push(userId);

      // Then create a session
      const sessionResponse = await request(app)
        .post('/sessions')
        .send({ user_id: userId });

      const sessionId = sessionResponse.body.data.session_id;
      createdSessionIds.push(sessionId);

      // Then get session details
      const getResponse = await request(app)
        .get(`/sessions/${sessionId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.status).toBe('success');
      expect(getResponse.body.data.session.id).toBe(sessionId);
      expect(getResponse.body.data.session.user_id).toBe(userId);
      expect(getResponse.body.data).toHaveProperty('progress');
      expect(getResponse.body.data).toHaveProperty('questions');
      expect(getResponse.body.data.progress).toHaveProperty('total_questions');
      expect(getResponse.body.data.progress).toHaveProperty('questions_remaining');
    });

    it('should return 404 for non-existent session', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/sessions/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Session not found');
    });
  });

  describe('GET /sessions - List Sessions (Integration)', () => {
    it('should list all sessions with basic information', async () => {
      const response = await request(app)
        .get('/sessions');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('sessions');
      expect(Array.isArray(response.body.data.sessions)).toBe(true);
    });
  });
});
