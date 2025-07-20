import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Types for our database tables
export interface User {
  user_id: string;
  username?: string | null; // Can be null in database
}

export interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  answers: string[];
  correct_answer_index: number;
  is_ai_generated?: boolean; // Optional, defaults to false
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  status: 'in_progress' | 'user_lost' | 'user_won' | 'expired';
  current_score: number; // Number of correct answers (1 point per correct answer)
  questions_answered: number; // How many questions the user has answered
  // selected_questions?: string[]; // Array of question IDs for this session (16 questions) - TODO: Add to DB schema
  started_at: string; // Has DEFAULT now(), so it's always set
  time_limit?: number | null; // Can be null in database
  completed_at?: string | null; // Can be null in database
}

export interface UserAnswer {
  id: string;
  session_id: string;
  question_id: string;
  answer_index: number;
  is_correct: boolean;
  answered_at: string;
}

// Database service functions
export class DatabaseService {
  // User operations
  static async createUser(username?: string): Promise<User> {
    // Generate unique user ID
    const user_id = uuidv4();
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ user_id, username }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Trivia Question operations
  static async createTriviaQuestion(question: Omit<TriviaQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<TriviaQuestion> {
    const { data, error } = await supabase
      .from('trivia_questions')
      .insert([question])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAllTriviaQuestions(): Promise<TriviaQuestion[]> {
    const { data, error } = await supabase
      .from('trivia_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getTriviaQuestionById(id: string): Promise<TriviaQuestion | null> {
    const { data, error } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getQuestionsByCategory(category: string, limit?: number): Promise<TriviaQuestion[]> {
    let query = supabase
      .from('trivia_questions')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getRandomQuestionsForSession(): Promise<TriviaQuestion[]> {
    // Get all available categories
    const { data: categories, error: categoriesError } = await supabase
      .from('trivia_questions')
      .select('category')
      .order('category');

    if (categoriesError) throw categoriesError;

    // Get unique categories
    const uniqueCategories = Array.from(new Set((categories || []).map(q => q.category)));
    
    if (uniqueCategories.length < 4) {
      throw new Error(`Insufficient categories available. Need at least 4 categories, found ${uniqueCategories.length}`);
    }

    // Select exactly 4 categories (use first 4 if more available)
    const selectedCategories = uniqueCategories.slice(0, 4);
    const selectedQuestions: TriviaQuestion[] = [];

    // Get 4 random questions from each of the 4 categories
    for (const category of selectedCategories) {
      const { data: categoryQuestions, error } = await supabase
        .from('trivia_questions')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!categoryQuestions || categoryQuestions.length < 4) {
        throw new Error(`Insufficient questions in category "${category}". Need at least 4 questions, found ${categoryQuestions?.length || 0}`);
      }

      // Randomly select 4 questions from this category
      const shuffled = categoryQuestions.sort(() => 0.5 - Math.random());
      selectedQuestions.push(...shuffled.slice(0, 4));
    }

    // Shuffle the final 16 questions
    return selectedQuestions.sort(() => 0.5 - Math.random());
  }

  static async isQuestionInUse(questionId: string): Promise<boolean> {
    // Check if question is used in any active game sessions
    const { data, error } = await supabase
      .from('user_answers')
      .select('session_id, game_sessions!inner(status)')
      .eq('question_id', questionId)
      .in('game_sessions.status', ['in_progress']);

    if (error) throw error;
    return (data || []).length > 0;
  }

  static async updateTriviaQuestion(id: string, updates: Partial<TriviaQuestion>): Promise<TriviaQuestion> {
    const { data, error } = await supabase
      .from('trivia_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTriviaQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('trivia_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Game Session operations
  static async createGameSession(session: Omit<GameSession, 'id' | 'started_at'>): Promise<GameSession> {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([session])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAllGameSessions(): Promise<GameSession[]> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession> {
    const { data, error } = await supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // User Answer operations
  static async createUserAnswer(answer: Omit<UserAnswer, 'id' | 'answered_at'>): Promise<UserAnswer> {
    const { data, error } = await supabase
      .from('user_answers')
      .insert([answer])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserAnswers(sessionId: string): Promise<UserAnswer[]> {
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('answered_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
} 