-- trivia_game.schema.sql
-- Complete schema for Trivia Game backend (PostgreSQL/Supabase)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE
);

-- Trivia Questions table
CREATE TABLE IF NOT EXISTS trivia_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answers JSONB NOT NULL, -- e.g. '["Answer A", "Answer B", "Answer C"]'
  correct_answer_index INTEGER NOT NULL CHECK (
    correct_answer_index >= 0 AND correct_answer_index < jsonb_array_length(answers)
  ),
  score INTEGER NOT NULL DEFAULT 0, -- Mandatory with default 0
  is_ai_generated BOOLEAN DEFAULT FALSE, -- Optional, defaults to false
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Game Sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'user_lost', 'user_won', 'expired')),
  current_score INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  time_limit INTEGER, -- in seconds, nullable if not using timer (no NOT NULL constraint)
  completed_at TIMESTAMP WITH TIME ZONE -- nullable, only set when game ends (no NOT NULL constraint)
);

-- User Answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES trivia_questions(id) ON DELETE CASCADE,
  answer_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (session_id, question_id)
); 