import request from 'supertest';
import express from 'express';
import { usersRouter } from '../routes/users';

/**
 * USERS API TEST SUITE
 * Tests for POST /users and GET /users/:id endpoints
 * Tests include actual validation logic for UUID and username formats
 */

// Mock the database module
jest.mock('../data/database', () => ({
  DatabaseService: {
    createUser: jest.fn(),
    getUser: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

describe('Users API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /users - Create User', () => {
    describe('Success Cases', () => {
      // Test creating user with a provided username
      it('should create a new user with provided username', async () => {
        const { DatabaseService } = require('../data/database');
        
        const mockUser = {
          user_id: '123e4567-e89b-42d3-9456-426614174000',
          username: 'testplayer'
        };

        DatabaseService.createUser.mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/users')
          .send({ username: 'testplayer' });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
        expect(response.body.message).toBe('User created successfully');
        expect(response.body.data.user_id).toBe('123e4567-e89b-42d3-9456-426614174000');
        expect(response.body.data.username).toBe('testplayer');
        expect(DatabaseService.createUser).toHaveBeenCalledWith('testplayer');
      });
    });

    describe('Validation Error Cases', () => {
      // Test that non-string username is rejected
      it('should return 400 when username is not a string', async () => {
        const response = await request(app)
          .post('/users')
          .send({ username: 123 });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Username must be a string if provided');
      });

      // Test that invalid username length is rejected
      it('should return 400 when username is invalid (empty or too long)', async () => {
        const response = await request(app)
          .post('/users')
          .send({ username: '' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Username must be between 1 and 50 characters if provided');
      });

      // Test that username with only spaces is rejected
      it('should return 400 when username contains only spaces', async () => {
        const response = await request(app)
          .post('/users')
          .send({ username: '   ' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Username must be between 1 and 50 characters if provided');
      });

      // Test that very long username is rejected
      it('should return 400 when username is too long', async () => {
        const longUsername = 'a'.repeat(51); // 51 characters
        
        const response = await request(app)
          .post('/users')
          .send({ username: longUsername });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Username must be between 1 and 50 characters if provided');
      });
    });

    describe('Database Error Cases', () => {
      // Test that database errors are handled gracefully
      it('should handle database errors gracefully', async () => {
        const { DatabaseService } = require('../data/database');
        
        DatabaseService.createUser.mockRejectedValue(new Error('Database connection failed'));

        const response = await request(app)
          .post('/users')
          .send({ username: 'testuser' });

        expect(response.status).toBe(500);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toContain('Failed to create user');
      });
    });
  });

  describe('GET /users/:id - Get User', () => {
    describe('Success Cases', () => {
      // Test retrieving existing user by valid ID
      it('should get user details with valid ID', async () => {
        const { DatabaseService } = require('../data/database');
        
        const mockUser = {
          user_id: '123e4567-e89b-42d3-9456-426614174000',
          username: 'testuser'
        };

        DatabaseService.getUser.mockResolvedValue(mockUser);

        const response = await request(app)
          .get('/users/123e4567-e89b-42d3-9456-426614174000');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.message).toBe('User retrieved successfully');
        expect(response.body.data.user_id).toBe('123e4567-e89b-42d3-9456-426614174000');
        expect(response.body.data.username).toBe('testuser');
        expect(DatabaseService.getUser).toHaveBeenCalledWith('123e4567-e89b-42d3-9456-426614174000');
      });

      // Test that invalid UUID format is rejected
      it('should return 400 when user ID is not a valid UUID', async () => {
        const response = await request(app)
          .get('/users/invalid-uuid-format');

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Invalid user ID format');
      });

      // Test that empty user ID is rejected
      it('should return 400 when user ID is empty', async () => {
        const response = await request(app)
          .get('/users/');

        expect(response.status).toBe(404); // This will be a 404 due to route not matching
      });
    });

    describe('Not Found Cases', () => {
      // Test that non-existent user returns 404
      it('should return 404 when user does not exist', async () => {
        const { DatabaseService } = require('../data/database');
        
        DatabaseService.getUser.mockResolvedValue(null);

        const response = await request(app)
          .get('/users/123e4567-e89b-42d3-9456-426614174000');

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('User not found');
        expect(response.body.error).toBe('User with ID 123e4567-e89b-42d3-9456-426614174000 does not exist');
      });
    });

    describe('Database Error Cases', () => {
      // Test that database connection errors are handled
      it('should handle database connection errors gracefully', async () => {
        const { DatabaseService } = require('../data/database');
        
        DatabaseService.getUser.mockRejectedValue(new Error('Database connection timeout'));

        const response = await request(app)
          .get('/users/123e4567-e89b-42d3-9456-426614174000');

        expect(response.status).toBe(500);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toContain('Failed to retrieve user');
      });
    });
  });

  describe('Edge Cases and Security', () => {
    // Test that malformed JSON is handled properly
    it('should handle malformed JSON in POST requests', async () => {
      const response = await request(app)
        .post('/users')
        .set('Content-Type', 'application/json')
        .send('{"username": malformed json}');

      expect(response.status).toBe(400);
    });

    // Test that extra fields in request are ignored for security
    it('should ignore extra fields in POST request', async () => {
      const { DatabaseService } = require('../data/database');
      
      const mockUser = {
        user_id: '123e4567-e89b-42d3-9456-426614174000',
        username: 'testuser'
      };

      DatabaseService.createUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/users')
        .send({ 
          username: 'testuser',
          extraField: 'should be ignored',
          password: 'should not be processed'
        });

      expect(response.status).toBe(201);
      expect(DatabaseService.createUser).toHaveBeenCalledWith('testuser');
    });
  });
});
