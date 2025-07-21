import request from 'supertest';
import express from 'express';
import { usersRouter } from '../routes/users';
import PostgreSQLProvider from '../data/postgresql';

/**
 * USERS API INTEGRATION TEST SUITE
 * Integration tests using real PostgreSQL test database
 */

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

describe('Users API Integration Tests', () => {
  let createdUserIds: string[] = [];
  let dbProvider: PostgreSQLProvider;

  beforeAll(async () => {
    // Create a dedicated database provider for these tests
    dbProvider = new PostgreSQLProvider();
  });

  afterEach(async () => {
    // Clean up created users after each test
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

  describe('POST /users - Create User (Integration)', () => {
    it('should create a new user successfully with real database', async () => {
      const response = await request(app)
        .post('/users')
        .send({ username: 'integration_test_user' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user_id');
      expect(response.body.data.username).toBe('integration_test_user');
      
      // Track the created user for cleanup
      if (response.body.data?.user_id) {
        createdUserIds.push(response.body.data.user_id);
      }
    });

    it('should create a user without username', async () => {
      const response = await request(app)
        .post('/users')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user_id');
      expect(response.body.data.username).toBeNull();
      
      // Store for cleanup
      if (response.body.data.user_id) {
        createdUserIds.push(response.body.data.user_id);
      }
    });
  });

  describe('GET /users/:id - Get User (Integration)', () => {
    it('should retrieve an existing user', async () => {
      // First create a user
      const createResponse = await request(app)
        .post('/users')
        .send({ username: 'test_get_user' });

      const userId = createResponse.body.data.user_id;
      createdUserIds.push(userId);

      // Then retrieve it
      const getResponse = await request(app)
        .get(`/users/${userId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.status).toBe('success');
      expect(getResponse.body.data.user_id).toBe(userId);
      expect(getResponse.body.data.username).toBe('test_get_user');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/users/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User not found');
    });
  });
});
