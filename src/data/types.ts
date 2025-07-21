// Type definitions for the trivia game
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
