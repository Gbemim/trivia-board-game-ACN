import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique user ID using UUID v4
 * @returns A unique string identifier for a user
 */
export function generateUserId(): string {
  return uuidv4();
}

/**
 * Validates a user ID format
 * @param userId - The user ID to validate
 * @returns True if the user ID is a valid UUID format
 * 8-4-4-4-12 format
 */
export function isValidUserId(userId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

/**
 * Validates a username
 * @param username - The username to validate
 * @returns True if the username is valid (non-empty string)
 */
export function isValidUsername(username: string): boolean {
  return typeof username === 'string' && username.trim().length > 0 && username.trim().length <= 50;
}

// /**
//  * Sanitizes a username by trimming whitespace
//  * @param username - The username to sanitize
//  * @returns The sanitized username
//  */
// export function sanitizeUsername(username: string): string {
//   return username.trim();
// }
