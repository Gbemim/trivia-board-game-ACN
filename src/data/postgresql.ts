import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseProvider, User, TriviaQuestion, GameSession, UserAnswer, SessionProgress } from './database-interface';

export class PostgreSQLProvider implements DatabaseProvider {
  private pool: Pool;

  constructor(connectionConfig?: any) {
    // Use connection string if provided, otherwise use individual config options
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    } else {
      this.pool = new Pool({
        user: process.env.POSTGRES_USER || 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'trivia_game',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        ...connectionConfig
      });
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('PostgreSQL connection test failed:', error);
      return false;
    }
  }

  // User operations
  async createUser(username?: string): Promise<User> {
    const user_id = uuidv4();
    const client = await this.pool.connect();
    
    try {
      const query = 'INSERT INTO users (user_id, username) VALUES ($1, $2) RETURNING *';
      const values = [user_id, username || null];
      const result = await client.query(query, values);
      
      if (!result.rows[0]) {
        throw new Error('Failed to create user');
      }
      
      return {
        user_id: result.rows[0].user_id,
        username: result.rows[0].username
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    } finally {
      client.release();
    }
  }

  async getUserById(user_id: string): Promise<User | null> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT user_id, username FROM users WHERE user_id = $1';
      const result = await client.query(query, [user_id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return {
        user_id: result.rows[0].user_id,
        username: result.rows[0].username
      };
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    } finally {
      client.release();
    }
  }

  async getUserSessions(user_id: string): Promise<GameSession[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT id, user_id, status, current_score, questions_answered, 
               selected_questions, started_at, time_limit, completed_at
        FROM game_sessions 
        WHERE user_id = $1 
        ORDER BY started_at DESC
      `;
      const result = await client.query(query, [user_id]);
      
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        current_score: row.current_score,
        questions_answered: row.questions_answered,
        selected_questions: row.selected_questions,
        started_at: row.started_at,
        time_limit: row.time_limit,
        completed_at: row.completed_at
      }));
    } catch (error) {
      throw new Error(`Failed to get user sessions: ${error}`);
    } finally {
      client.release();
    }
  }

  // Question operations
  async createQuestion(questionData: Omit<TriviaQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<TriviaQuestion> {
    const id = uuidv4();
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO trivia_questions 
        (id, category, question, answers, correct_answer_index, score, is_ai_generated)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [
        id,
        questionData.category,
        questionData.question,
        JSON.stringify(questionData.answers),
        questionData.correct_answer_index,
        questionData.score,
        questionData.is_ai_generated || false
      ];
      
      const result = await client.query(query, values);
      
      if (!result.rows[0]) {
        throw new Error('Failed to create question');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        category: row.category,
        question: row.question,
        answers: row.answers, // PostgreSQL automatically parses jsonb columns
        correct_answer_index: row.correct_answer_index,
        score: row.score,
        is_ai_generated: row.is_ai_generated,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to create question: ${error}`);
    } finally {
      client.release();
    }
  }

  async getAllQuestions(): Promise<TriviaQuestion[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT id, category, question, answers, correct_answer_index, 
               score, is_ai_generated, created_at, updated_at
        FROM trivia_questions 
        ORDER BY created_at DESC
      `;
      const result = await client.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        category: row.category,
        question: row.question,
        answers: row.answers, // PostgreSQL automatically parses jsonb columns
        correct_answer_index: row.correct_answer_index,
        score: row.score,
        is_ai_generated: row.is_ai_generated,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      throw new Error(`Failed to get questions: ${error}`);
    } finally {
      client.release();
    }
  }

  async getQuestionById(id: string): Promise<TriviaQuestion | null> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT id, category, question, answers, correct_answer_index, 
               score, is_ai_generated, created_at, updated_at
        FROM trivia_questions 
        WHERE id = $1
      `;
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        category: row.category,
        question: row.question,
        answers: row.answers, // PostgreSQL automatically parses jsonb columns
        correct_answer_index: row.correct_answer_index,
        score: row.score,
        is_ai_generated: row.is_ai_generated,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to get question: ${error}`);
    } finally {
      client.release();
    }
  }

  async updateQuestion(id: string, questionData: Partial<Omit<TriviaQuestion, 'id' | 'created_at' | 'updated_at'>>): Promise<TriviaQuestion> {
    const client = await this.pool.connect();
    
    try {
      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (questionData.category !== undefined) {
        updates.push(`category = $${paramCount++}`);
        values.push(questionData.category);
      }
      if (questionData.question !== undefined) {
        updates.push(`question = $${paramCount++}`);
        values.push(questionData.question);
      }
      if (questionData.answers !== undefined) {
        updates.push(`answers = $${paramCount++}`);
        values.push(JSON.stringify(questionData.answers));
      }
      if (questionData.correct_answer_index !== undefined) {
        updates.push(`correct_answer_index = $${paramCount++}`);
        values.push(questionData.correct_answer_index);
      }
      if (questionData.score !== undefined) {
        updates.push(`score = $${paramCount++}`);
        values.push(questionData.score);
      }
      if (questionData.is_ai_generated !== undefined) {
        updates.push(`is_ai_generated = $${paramCount++}`);
        values.push(questionData.is_ai_generated);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE trivia_questions 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      
      if (!result.rows[0]) {
        throw new Error('Question not found');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        category: row.category,
        question: row.question,
        answers: row.answers, // PostgreSQL automatically parses jsonb columns
        correct_answer_index: row.correct_answer_index,
        score: row.score,
        is_ai_generated: row.is_ai_generated,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to update question: ${error}`);
    } finally {
      client.release();
    }
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      const query = 'DELETE FROM trivia_questions WHERE id = $1';
      const result = await client.query(query, [id]);
      
      return result.rowCount! > 0;
    } catch (error) {
      throw new Error(`Failed to delete question: ${error}`);
    } finally {
      client.release();
    }
  }

  async getRandomQuestionsByCategory(categoryCounts: Record<string, number>): Promise<TriviaQuestion[]> {
    const client = await this.pool.connect();
    
    try {
      const questions: TriviaQuestion[] = [];
      
      for (const [category, count] of Object.entries(categoryCounts)) {
        const query = `
          SELECT id, category, question, answers, correct_answer_index, 
                 score, is_ai_generated, created_at, updated_at
          FROM trivia_questions 
          WHERE category = $1 
          ORDER BY RANDOM() 
          LIMIT $2
        `;
        const result = await client.query(query, [category, count]);
        
        const categoryQuestions = result.rows.map(row => ({
          id: row.id,
          category: row.category,
          question: row.question,
          answers: row.answers, // PostgreSQL automatically parses jsonb columns
          correct_answer_index: row.correct_answer_index,
          score: row.score,
          is_ai_generated: row.is_ai_generated,
          created_at: row.created_at,
          updated_at: row.updated_at
        }));
        
        questions.push(...categoryQuestions);
      }
      
      return questions;
    } catch (error) {
      throw new Error(`Failed to get random questions: ${error}`);
    } finally {
      client.release();
    }
  }

  // Session operations
  async createSession(user_id: string, time_limit?: number): Promise<GameSession> {
    const id = uuidv4();
    const client = await this.pool.connect();
    
    try {
      // Get random questions (4 from each category)
      const categoryCounts = { 'Sports': 4, 'Science': 4, 'Music': 4, 'Technology': 4 };
      const questions = await this.getRandomQuestionsByCategory(categoryCounts);
      const questionIds = questions.map(q => q.id);
      
      const query = `
        INSERT INTO game_sessions 
        (id, user_id, status, current_score, questions_answered, selected_questions, time_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [
        id,
        user_id,
        'in_progress',
        0,
        0,
        JSON.stringify(questionIds),
        time_limit || null
      ];
      
      const result = await client.query(query, values);
      
      if (!result.rows[0]) {
        throw new Error('Failed to create session');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        current_score: row.current_score,
        questions_answered: row.questions_answered,
        selected_questions: row.selected_questions, // PostgreSQL automatically parses jsonb columns
        started_at: row.started_at,
        time_limit: row.time_limit,
        completed_at: row.completed_at
      };
    } catch (error) {
      throw new Error(`Failed to create session: ${error}`);
    } finally {
      client.release();
    }
  }

  async getSessionById(session_id: string): Promise<GameSession | null> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT id, user_id, status, current_score, questions_answered, 
               selected_questions, started_at, time_limit, completed_at
        FROM game_sessions 
        WHERE id = $1
      `;
      const result = await client.query(query, [session_id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        current_score: row.current_score,
        questions_answered: row.questions_answered,
        selected_questions: row.selected_questions, // PostgreSQL automatically parses jsonb columns
        started_at: row.started_at,
        time_limit: row.time_limit,
        completed_at: row.completed_at
      };
    } catch (error) {
      throw new Error(`Failed to get session: ${error}`);
    } finally {
      client.release();
    }
  }

  async getAllSessions(): Promise<GameSession[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT id, user_id, status, current_score, questions_answered, 
               selected_questions, started_at, time_limit, completed_at
        FROM game_sessions 
        ORDER BY started_at DESC
      `;
      const result = await client.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        current_score: row.current_score,
        questions_answered: row.questions_answered,
        selected_questions: row.selected_questions, // PostgreSQL automatically parses jsonb columns
        started_at: row.started_at,
        time_limit: row.time_limit,
        completed_at: row.completed_at
      }));
    } catch (error) {
      throw new Error(`Failed to get sessions: ${error}`);
    } finally {
      client.release();
    }
  }

  async updateSessionStatus(session_id: string, status: GameSession['status'], completed_at?: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      let query: string;
      let values: any[];
      
      if (completed_at) {
        query = 'UPDATE game_sessions SET status = $1, completed_at = $2 WHERE id = $3';
        values = [status, completed_at, session_id];
      } else {
        query = 'UPDATE game_sessions SET status = $1 WHERE id = $2';
        values = [status, session_id];
      }
      
      await client.query(query, values);
    } catch (error) {
      throw new Error(`Failed to update session status: ${error}`);
    } finally {
      client.release();
    }
  }

  async updateSessionScore(session_id: string, current_score: number, questions_answered: number): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = 'UPDATE game_sessions SET current_score = $1, questions_answered = $2 WHERE id = $3';
      await client.query(query, [current_score, questions_answered, session_id]);
    } catch (error) {
      throw new Error(`Failed to update session score: ${error}`);
    } finally {
      client.release();
    }
  }

  // Answer operations
  async createAnswer(answerData: Omit<UserAnswer, 'id' | 'answered_at'>): Promise<UserAnswer> {
    const id = uuidv4();
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO user_answers 
        (id, session_id, question_id, answer_index, is_correct)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [
        id,
        answerData.session_id,
        answerData.question_id,
        answerData.answer_index,
        answerData.is_correct
      ];
      
      const result = await client.query(query, values);
      
      if (!result.rows[0]) {
        throw new Error('Failed to create answer');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        session_id: row.session_id,
        question_id: row.question_id,
        answer_index: row.answer_index,
        is_correct: row.is_correct,
        answered_at: row.answered_at
      };
    } catch (error) {
      throw new Error(`Failed to create answer: ${error}`);
    } finally {
      client.release();
    }
  }

  async getUserAnswersForSession(session_id: string): Promise<UserAnswer[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT id, session_id, question_id, answer_index, is_correct, answered_at
        FROM user_answers 
        WHERE session_id = $1 
        ORDER BY answered_at ASC
      `;
      const result = await client.query(query, [session_id]);
      
      return result.rows.map(row => ({
        id: row.id,
        session_id: row.session_id,
        question_id: row.question_id,
        answer_index: row.answer_index,
        is_correct: row.is_correct,
        answered_at: row.answered_at
      }));
    } catch (error) {
      throw new Error(`Failed to get user answers: ${error}`);
    } finally {
      client.release();
    }
  }

  async hasUserAnsweredQuestion(session_id: string, question_id: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT 1 FROM user_answers WHERE session_id = $1 AND question_id = $2 LIMIT 1';
      const result = await client.query(query, [session_id, question_id]);
      
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check if user answered question: ${error}`);
    } finally {
      client.release();
    }
  }

  // Session progress
  async getSessionProgress(session_id: string): Promise<SessionProgress | null> {
    const client = await this.pool.connect();
    
    try {
      const session = await this.getSessionById(session_id);
      if (!session) {
        return null;
      }

      const answeredQuestions = await this.getUserAnswersForSession(session_id);
      
      // Get all questions for this session
      const questionIds = session.selected_questions;
      const questionQuery = `
        SELECT id, category, question, answers, correct_answer_index, 
               score, is_ai_generated, created_at, updated_at
        FROM trivia_questions 
        WHERE id = ANY($1)
      `;
      const questionResult = await client.query(questionQuery, [questionIds]);
      
      const questions = questionResult.rows.map(row => ({
        id: row.id,
        category: row.category,
        question: row.question,
        answers: row.answers, // PostgreSQL automatically parses jsonb columns
        correct_answer_index: row.correct_answer_index,
        score: row.score,
        is_ai_generated: row.is_ai_generated,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      const totalPossibleScore = questions.reduce((sum, q) => sum + q.score, 0);
      const scorePercentage = totalPossibleScore > 0 ? (session.current_score / totalPossibleScore) * 100 : 0;
      
      const answeredQuestionIds = answeredQuestions.map(a => a.question_id);
      const unansweredQuestions = questions.filter(q => !answeredQuestionIds.includes(q.id));
      const currentQuestion = unansweredQuestions.length > 0 ? unansweredQuestions[0] : undefined;
      const nextQuestion = unansweredQuestions.length > 1 ? unansweredQuestions[1] : undefined;

      return {
        session,
        current_question: currentQuestion,
        total_questions: questions.length,
        questions_remaining: unansweredQuestions.length,
        answered_questions: answeredQuestions,
        total_possible_score: totalPossibleScore,
        score_percentage: scorePercentage,
        next_question: nextQuestion
      };
    } catch (error) {
      throw new Error(`Failed to get session progress: ${error}`);
    } finally {
      client.release();
    }
  }
}
