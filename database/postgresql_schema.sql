-- PostgreSQL Schema for Trivia Board Game
-- Run this script to set up the database schema for PostgreSQL

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    username VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trivia_questions table
CREATE TABLE IF NOT EXISTS trivia_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answers JSONB NOT NULL, -- Array of answer options
    correct_answer_index INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 10,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'user_lost', 'user_won', 'expired')),
    current_score INTEGER NOT NULL DEFAULT 0,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    selected_questions JSONB NOT NULL, -- Array of question IDs
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    time_limit INTEGER, -- Time limit in seconds (optional)
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user_answers table
CREATE TABLE IF NOT EXISTS user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES trivia_questions(id) ON DELETE CASCADE,
    answer_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, question_id) -- Prevent duplicate answers for same question in same session
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trivia_questions_category ON trivia_questions(category);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_answers_session_id ON user_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);

-- Create trigger to update updated_at timestamp on trivia_questions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trivia_questions_updated_at 
    BEFORE UPDATE ON trivia_questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts for the trivia game';
COMMENT ON TABLE trivia_questions IS 'Trivia questions with answers and scoring';
COMMENT ON TABLE game_sessions IS 'Individual game sessions with progress tracking';
COMMENT ON TABLE user_answers IS 'User answers for questions in game sessions';

COMMENT ON COLUMN trivia_questions.answers IS 'JSON array of answer options';
COMMENT ON COLUMN trivia_questions.correct_answer_index IS 'Zero-based index of the correct answer in the answers array';
COMMENT ON COLUMN game_sessions.selected_questions IS 'JSON array of question IDs selected for this session';
COMMENT ON COLUMN game_sessions.current_score IS 'Total score earned from correct answers (weighted by question score)';
