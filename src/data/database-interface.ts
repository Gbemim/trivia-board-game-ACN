// Database abstraction interface
export interface User {
  user_id: string;
  username?: string | null;
}

export interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  answers: string[];
  correct_answer_index: number;
  score: number;
  is_ai_generated?: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  status: 'in_progress' | 'user_lost' | 'user_won' | 'expired';
  current_score: number;
  questions_answered: number;
  selected_questions: string[];
  started_at: string;
  time_limit?: number | null;
  completed_at?: string | null;
}

export interface UserAnswer {
  id: string;
  session_id: string;
  question_id: string;
  answer_index: number;
  is_correct: boolean;
  answered_at: string;
}

export interface SessionProgress {
  session: GameSession;
  current_question?: TriviaQuestion;
  total_questions: number;
  questions_remaining: number;
  answered_questions: UserAnswer[];
  total_possible_score: number;
  score_percentage: number;
  next_question?: TriviaQuestion;
}

export interface DatabaseProvider {
  // User operations
  createUser(username?: string): Promise<User>;
  getUserById(user_id: string): Promise<User | null>;
  getUserSessions(user_id: string): Promise<GameSession[]>;

  // Question operations
  createQuestion(questionData: Omit<TriviaQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<TriviaQuestion>;
  getAllQuestions(): Promise<TriviaQuestion[]>;
  getQuestionById(id: string): Promise<TriviaQuestion | null>;
  updateQuestion(id: string, questionData: Partial<Omit<TriviaQuestion, 'id' | 'created_at' | 'updated_at'>>): Promise<TriviaQuestion>;
  deleteQuestion(id: string): Promise<boolean>;
  getRandomQuestionsByCategory(categoryCounts: Record<string, number>): Promise<TriviaQuestion[]>;

  // Session operations
  createSession(user_id: string, time_limit?: number): Promise<GameSession>;
  getSessionById(session_id: string): Promise<GameSession | null>;
  getAllSessions(): Promise<GameSession[]>;
  updateSessionStatus(session_id: string, status: GameSession['status'], completed_at?: string): Promise<void>;
  updateSessionScore(session_id: string, current_score: number, questions_answered: number): Promise<void>;

  // Answer operations
  createAnswer(answerData: Omit<UserAnswer, 'id' | 'answered_at'>): Promise<UserAnswer>;
  getUserAnswersForSession(session_id: string): Promise<UserAnswer[]>;
  hasUserAnsweredQuestion(session_id: string, question_id: string): Promise<boolean>;

  // Session progress
  getSessionProgress(session_id: string): Promise<SessionProgress | null>;

  // Health check / connection test
  testConnection(): Promise<boolean>;
}
