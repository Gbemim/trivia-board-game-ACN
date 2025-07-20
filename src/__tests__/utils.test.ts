import { isValidUserId, isValidUsername } from '../utils/userHelpers';

describe('Basic Validation Tests', () => {
  it('should validate user IDs correctly', () => {
    expect(isValidUserId('123e4567-e89b-42d3-9456-426614174000')).toBe(true);
    expect(isValidUserId('invalid-uuid')).toBe(false);
    expect(isValidUserId('')).toBe(false);
  });

  it('should validate usernames correctly', () => {
    expect(isValidUsername('player123')).toBe(true);
    expect(isValidUsername('')).toBe(false);
    expect(isValidUsername('   ')).toBe(false);
  });
});
