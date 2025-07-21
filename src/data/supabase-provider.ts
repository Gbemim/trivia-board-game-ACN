import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseProvider, User, TriviaQuestion, GameSession, UserAnswer, SessionProgress } from './database-interface';

export class SupabaseProvider implements DatabaseProvider {
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('users').select('user_id').limit(1);
      return !error;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }

  // User operations
  async createUser(username?: string): Promise<User> {
    // Generate unique user ID
    const user_id = uuidv4();
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ user_id, username: username || null }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create user: No data returned');
    }

    return {
      user_id: data.user_id,
      username: data.username
    };
  }

  async getUserById(user_id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, username')
      .eq('user_id', user_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  async getUserSessions(user_id: string): Promise<GameSession[]> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user_id)
      .order('started_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }

    return data || [];
  }

  // Question operations
  async createQuestion(questionData: Omit<TriviaQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<TriviaQuestion> {
    const id = uuidv4();
    
    const { data, error } = await supabase
      .from('trivia_questions')
      .insert([{
        id,
        category: questionData.category,
        question: questionData.question,
        answers: questionData.answers,
        correct_answer_index: questionData.correct_answer_index,
        score: questionData.score,
        is_ai_generated: questionData.is_ai_generated || false
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create question: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create question: No data returned');
    }

    return data;
  }

  async getAllQuestions(): Promise<TriviaQuestion[]> {
    const { data, error } = await supabase
      .from('trivia_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get all questions: ${error.message}`);
    }

    return data || [];
  }

  async getQuestionById(id: string): Promise<TriviaQuestion | null> {
    const { data, error } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Question not found
      }
      throw new Error(`Failed to get question: ${error.message}`);
    }

    return data;
  }

  async updateQuestion(id: string, questionData: Partial<Omit<TriviaQuestion, 'id' | 'created_at' | 'updated_at'>>): Promise<TriviaQuestion> {
    const { data, error } = await supabase
      .from('trivia_questions')
      .update(questionData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update question: ${error.message}`);
    }

    if (!data) {
      throw new Error('Question not found');
    }

    return data;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('trivia_questions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete question: ${error.message}`);
    }

    return true;
  }

  async getRandomQuestionsByCategory(categoryCounts: Record<string, number>): Promise<TriviaQuestion[]> {
    const allQuestions: TriviaQuestion[] = [];
    
    for (const [category, count] of Object.entries(categoryCounts)) {
      const { data, error } = await supabase
        .from('trivia_questions')
        .select('*')
        .eq('category', category)
        .limit(count);

      if (error) {
        throw new Error(`Failed to get questions for category ${category}: ${error.message}`);
      }

      if (data && data.length < count) {
        throw new Error(`Not enough questions available for category: ${category}. Required: ${count}, Available: ${data.length}`);
      }

      // Shuffle and take the required count
      const shuffled = data ? [...data].sort(() => Math.random() - 0.5) : [];
      allQuestions.push(...shuffled.slice(0, count));
    }

    return allQuestions;
  }

  // Session operations
  async createSession(user_id: string, time_limit?: number): Promise<GameSession> {
    const id = uuidv4();
    
    // Get random questions (4 from each category)
    const categoryCounts = { 'Sports': 4, 'Science': 4, 'Music': 4, 'Technology': 4 };
    const questions = await this.getRandomQuestionsByCategory(categoryCounts);
    const questionIds = questions.map(q => q.id);

    const { data, error } = await supabase
      .from('game_sessions')
      .insert([{
        id,
        user_id,
        status: 'in_progress',
        current_score: 0,
        questions_answered: 0,
        selected_questions: questionIds,
        time_limit: time_limit || null
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create session: No data returned');
    }

    return data;
  }

  async getSessionById(session_id: string): Promise<GameSession | null> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Session not found
      }
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return data;
  }

  async getAllSessions(): Promise<GameSession[]> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get all sessions: ${error.message}`);
    }

    return data || [];
  }

  async updateSessionStatus(session_id: string, status: GameSession['status'], completed_at?: string): Promise<void> {
    const updateData: any = { status };
    if (completed_at) {
      updateData.completed_at = completed_at;
    }

    const { error } = await supabase
      .from('game_sessions')
      .update(updateData)
      .eq('id', session_id);

    if (error) {
      throw new Error(`Failed to update session status: ${error.message}`);
    }
  }

  async updateSessionScore(session_id: string, current_score: number, questions_answered: number): Promise<void> {
    const { error } = await supabase
      .from('game_sessions')
      .update({
        current_score,
        questions_answered
      })
      .eq('id', session_id);

    if (error) {
      throw new Error(`Failed to update session score: ${error.message}`);
    }
  }

  // Answer operations
  async createAnswer(answerData: Omit<UserAnswer, 'id' | 'answered_at'>): Promise<UserAnswer> {
    const id = uuidv4();
    
    const { data, error } = await supabase
      .from('user_answers')
      .insert([{
        id,
        session_id: answerData.session_id,
        question_id: answerData.question_id,
        answer_index: answerData.answer_index,
        is_correct: answerData.is_correct
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create answer: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create answer: No data returned');
    }

    return data;
  }

  async getUserAnswersForSession(session_id: string): Promise<UserAnswer[]> {
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('session_id', session_id)
      .order('answered_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get user answers: ${error.message}`);
    }

    return data || [];
  }

  async hasUserAnsweredQuestion(session_id: string, question_id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_answers')
      .select('id')
      .eq('session_id', session_id)
      .eq('question_id', question_id)
      .limit(1);

    if (error) {
      throw new Error(`Failed to check if user answered question: ${error.message}`);
    }

    return (data && data.length > 0) || false;
  }

  // Session progress
  async getSessionProgress(session_id: string): Promise<SessionProgress | null> {
    const session = await this.getSessionById(session_id);
    if (!session) {
      return null;
    }

    const answeredQuestions = await this.getUserAnswersForSession(session_id);
    
    // Get all questions for this session
    const { data: questions, error } = await supabase
      .from('trivia_questions')
      .select('*')
      .in('id', session.selected_questions);

    if (error) {
      throw new Error(`Failed to get session questions: ${error.message}`);
    }

    if (!questions) {
      throw new Error('Failed to get session questions: No data returned');
    }

    const totalPossibleScore = questions.reduce((sum: number, q: TriviaQuestion) => sum + q.score, 0);
    const scorePercentage = totalPossibleScore > 0 ? (session.current_score / totalPossibleScore) * 100 : 0;
    
    const answeredQuestionIds = answeredQuestions.map(a => a.question_id);
    const unansweredQuestions = questions.filter((q: TriviaQuestion) => !answeredQuestionIds.includes(q.id));
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
  }
}
