import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { User, TriviaQuestion, GameSession, UserAnswer } from './types';

export class PostgreSQLProvider {
  private static sharedPool: Pool | null = null;
  private pool: Pool;

  constructor(connectionConfig?: any) {
    // Use shared pool to prevent multiple connection pools
    if (PostgreSQLProvider.sharedPool) {
      this.pool = PostgreSQLProvider.sharedPool;
    } else {
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
      PostgreSQLProvider.sharedPool = this.pool;
    }
  }

  // Utility
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

  async getUser(user_id: string): Promise<User | null> {
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
      const row = result.rows[0];
      
      return {
        id: row.id,
        category: row.category,
        question: row.question,
        answers: row.answers,
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
        answers: row.answers,
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
        answers: row.answers,
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
      const row = result.rows[0];
      
      return {
        id: row.id,
        category: row.category,
        question: row.question,
        answers: row.answers,
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

  async deleteQuestion(id: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = 'DELETE FROM trivia_questions WHERE id = $1';
      await client.query(query, [id]);
    } catch (error) {
      throw new Error(`Failed to delete question: ${error}`);
    } finally {
      client.release();
    }
  }

  async isQuestionInUse(questionId: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 1 FROM game_sessions 
        WHERE status = 'in_progress' 
        AND selected_questions @> $1
        LIMIT 1
      `;
      const result = await client.query(query, [JSON.stringify([questionId])]);
      
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check if question is in use: ${error}`);
    } finally {
      client.release();
    }
  }

  async getRandomQuestionsForSession(): Promise<string[]> {
    const client = await this.pool.connect();
    
    try {
      // Get 4 questions from each category
      const categories = ['Sports', 'Science', 'Music', 'Technology'];
      const questionIds: string[] = [];
      
      for (const category of categories) {
        const query = `
          SELECT id FROM trivia_questions 
          WHERE category = $1 
          ORDER BY RANDOM() 
          LIMIT 4
        `;
        const result = await client.query(query, [category]);
        questionIds.push(...result.rows.map(row => row.id));
      }
      
      return questionIds;
    } catch (error) {
      throw new Error(`Failed to get random questions: ${error}`);
    } finally {
      client.release();
    }
  }

  // Session operations
  async createGameSession(user_id: string, time_limit?: number): Promise<GameSession> {
    const id = uuidv4();
    const client = await this.pool.connect();
    
    try {
      const questionIds = await this.getRandomQuestionsForSession();
      
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
      const row = result.rows[0];
      
      return {
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        current_score: row.current_score,
        questions_answered: row.questions_answered,
        selected_questions: row.selected_questions,
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

  async getGameSessionById(session_id: string): Promise<GameSession | null> {
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
        selected_questions: row.selected_questions,
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

  async getAllGameSessions(): Promise<GameSession[]> {
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
        selected_questions: row.selected_questions,
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

  async updateGameSession(session_id: string, updates: Partial<GameSession>): Promise<GameSession> {
    const client = await this.pool.connect();
    
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        values.push(updates.status);
      }
      if (updates.current_score !== undefined) {
        updateFields.push(`current_score = $${paramCount++}`);
        values.push(updates.current_score);
      }
      if (updates.questions_answered !== undefined) {
        updateFields.push(`questions_answered = $${paramCount++}`);
        values.push(updates.questions_answered);
      }
      if (updates.completed_at !== undefined) {
        updateFields.push(`completed_at = $${paramCount++}`);
        values.push(updates.completed_at);
      }

      values.push(session_id);

      const query = `
        UPDATE game_sessions 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      const row = result.rows[0];
      
      return {
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        current_score: row.current_score,
        questions_answered: row.questions_answered,
        selected_questions: row.selected_questions,
        started_at: row.started_at,
        time_limit: row.time_limit,
        completed_at: row.completed_at
      };
    } catch (error) {
      throw new Error(`Failed to update session: ${error}`);
    } finally {
      client.release();
    }
  }

  async getSessionQuestions(session_id: string): Promise<TriviaQuestion[]> {
    const client = await this.pool.connect();
    
    try {
      const sessionQuery = 'SELECT selected_questions FROM game_sessions WHERE id = $1';
      const sessionResult = await client.query(sessionQuery, [session_id]);
      
      if (sessionResult.rows.length === 0) {
        return [];
      }
      
      const questionIds = sessionResult.rows[0].selected_questions;
      
      const questionsQuery = `
        SELECT id, category, question, answers, correct_answer_index, 
               score, is_ai_generated, created_at, updated_at
        FROM trivia_questions 
        WHERE id = ANY($1)
      `;
      const questionsResult = await client.query(questionsQuery, [questionIds]);
      
      return questionsResult.rows.map(row => ({
        id: row.id,
        category: row.category,
        question: row.question,
        answers: row.answers,
        correct_answer_index: row.correct_answer_index,
        score: row.score,
        is_ai_generated: row.is_ai_generated,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      throw new Error(`Failed to get session questions: ${error}`);
    } finally {
      client.release();
    }
  }

  async isQuestionInSession(session_id: string, question_id: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 1 FROM game_sessions 
        WHERE id = $1 
        AND selected_questions @> $2
        LIMIT 1
      `;
      const result = await client.query(query, [session_id, JSON.stringify([question_id])]);
      
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check if question is in session: ${error}`);
    } finally {
      client.release();
    }
  }

  // Answer operations
  async createUserAnswer(answerData: Omit<UserAnswer, 'id' | 'answered_at'>): Promise<UserAnswer> {
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

  async getUserAnswers(session_id: string): Promise<UserAnswer[]> {
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

  async getUserAnswer(session_id: string, question_id: string): Promise<UserAnswer | null> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT id, session_id, question_id, answer_index, is_correct, answered_at
        FROM user_answers 
        WHERE session_id = $1 AND question_id = $2
        LIMIT 1
      `;
      const result = await client.query(query, [session_id, question_id]);
      
      if (result.rows.length === 0) {
        return null;
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
      throw new Error(`Failed to get user answer: ${error}`);
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (PostgreSQLProvider.sharedPool) {
      await PostgreSQLProvider.sharedPool.end();
      PostgreSQLProvider.sharedPool = null;
    }
  }
}

export default PostgreSQLProvider;
