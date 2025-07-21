// Re-export types and database instance for backwards compatibility
export { User, TriviaQuestion, GameSession, UserAnswer, SessionProgress } from './database-interface';
export { database } from './database-factory';

// Backwards compatible class that delegates to the database provider
export class DatabaseService {
  private static get db() {
    // Import dynamically to avoid circular dependency
    const { database } = require('./database-factory');
    return database;
  }

  // User operations
  static async createUser(username?: string) {
    return DatabaseService.db.createUser(username);
  }

  static async getUser(userId: string) {
    return DatabaseService.db.getUserById(userId);
  }

  // Question operations
  static async createTriviaQuestion(question: any) {
    return DatabaseService.db.createQuestion(question);
  }

  static async getAllTriviaQuestions() {
    return DatabaseService.db.getAllQuestions();
  }

  static async getTriviaQuestionById(id: string) {
    return DatabaseService.db.getQuestionById(id);
  }

  static async getRandomQuestionsForSession() {
    const categoryCounts = { 'Sports': 4, 'Science': 4, 'Music': 4, 'Technology': 4 };
    return DatabaseService.db.getRandomQuestionsByCategory(categoryCounts);
  }

  static async shuffleArray<T>(array: T[]): Promise<T[]> {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static async updateTriviaQuestion(id: string, updates: any) {
    return DatabaseService.db.updateQuestion(id, updates);
  }

  static async deleteTriviaQuestion(id: string) {
    return DatabaseService.db.deleteQuestion(id);
  }

  // Session operations
  static async createGameSession(user_id: string, time_limit?: number) {
    return DatabaseService.db.createSession(user_id, time_limit);
  }

  static async getGameSession(session_id: string) {
    return DatabaseService.db.getSessionById(session_id);
  }

  static async getAllGameSessions() {
    return DatabaseService.db.getAllSessions();
  }

  static async updateGameSessionStatus(session_id: string, status: any, completed_at?: string) {
    return DatabaseService.db.updateSessionStatus(session_id, status, completed_at);
  }

  static async updateGameSessionScore(session_id: string, current_score: number, questions_answered: number) {
    return DatabaseService.db.updateSessionScore(session_id, current_score, questions_answered);
  }

  static async getUserSessions(user_id: string) {
    return DatabaseService.db.getUserSessions(user_id);
  }

  // Answer operations
  static async createUserAnswer(answerData: any) {
    return DatabaseService.db.createAnswer(answerData);
  }

  static async getUserAnswersForSession(session_id: string) {
    return DatabaseService.db.getUserAnswersForSession(session_id);
  }

  static async hasUserAnsweredQuestion(session_id: string, question_id: string) {
    return DatabaseService.db.hasUserAnsweredQuestion(session_id, question_id);
  }

  // Session progress
  static async getSessionProgress(session_id: string) {
    return DatabaseService.db.getSessionProgress(session_id);
  }

  // Additional methods for backwards compatibility
  static async isQuestionInUse(questionId: string): Promise<boolean> {
    // Check if question is used in any active sessions
    const sessions = await DatabaseService.db.getAllSessions();
    return sessions.some((session: any) => 
      session.status === 'in_progress' && 
      session.selected_questions.includes(questionId)
    );
  }

  static async getGameSessionById(session_id: string) {
    return DatabaseService.db.getSessionById(session_id);
  }

  static async getSessionQuestions(sessionId: string) {
    const session = await DatabaseService.db.getSessionById(sessionId);
    if (!session) return [];
    
    const questions = [];
    for (const questionId of session.selected_questions) {
      const question = await DatabaseService.db.getQuestionById(questionId);
      if (question) questions.push(question);
    }
    return questions;
  }

  static async getUserAnswers(sessionId: string) {
    return DatabaseService.db.getUserAnswersForSession(sessionId);
  }

  static async isQuestionInSession(sessionId: string, questionId: string): Promise<boolean> {
    const session = await DatabaseService.db.getSessionById(sessionId);
    return session ? session.selected_questions.includes(questionId) : false;
  }

  static async getUserAnswer(sessionId: string, questionId: string) {
    const answers = await DatabaseService.db.getUserAnswersForSession(sessionId);
    return answers.find((answer: any) => answer.question_id === questionId) || null;
  }

  static async updateGameSession(id: string, updates: any) {
    // For now, only handle status updates
    if (updates.status) {
      await DatabaseService.db.updateSessionStatus(id, updates.status, updates.completed_at);
    }
    if (updates.current_score !== undefined && updates.questions_answered !== undefined) {
      await DatabaseService.db.updateSessionScore(id, updates.current_score, updates.questions_answered);
    }
    return DatabaseService.db.getSessionById(id);
  }
}
