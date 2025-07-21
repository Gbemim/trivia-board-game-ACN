import express, { Request, Response } from 'express';
import PostgreSQLProvider from '../data/postgresql';
import { handleDatabaseError } from '../utils/errorHandler';
import { isValidUserId } from '../utils/userHelpers';

const sessionsRouter = express.Router();
const database = new PostgreSQLProvider();

// Create a new game session - requires user_id
sessionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, time_limit } = req.body;
    
    // Validate required user_id
    if (!user_id || typeof user_id !== 'string' || user_id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id is required and must be a valid string',
        error: 'user_id field is required'
      });
    }

    // Validate UUID format
    if (!isValidUserId(user_id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user_id format',
        error: 'user_id must be a valid UUID'
      });
    }

    // Verify user exists
    const user = await database.getUser(user_id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        error: 'Please create a user first using POST /users'
      });
    }

    // Validate time_limit if provided
    if (time_limit !== undefined && (typeof time_limit !== 'number' || time_limit <= 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid time limit',
        error: 'time_limit must be a positive number if provided'
      });
    }

    // Select 16 questions across 4 categories for this session
    let selectedQuestions;
    try {
      selectedQuestions = await database.getRandomQuestionsForSession();
    } catch (questionError) {
      return res.status(400).json({
        status: 'error',
        message: 'Unable to create session',
        error: questionError instanceof Error ? questionError.message : 'Failed to select questions for session'
      });
    }

    // Create new game session with selected questions
    const session = await database.createGameSession(user_id.trim(), time_limit || undefined);

    // Prepare response with session details and question summary
    const categorySummary = selectedQuestions.reduce((acc: Record<string, number>, question: any) => {
      acc[question.category] = (acc[question.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.status(201).json({
      status: 'success',
      message: 'Game session created successfully',
      data: {
        session_id: session.id,
        user_id: session.user_id,
        status: session.status,
        current_score: session.current_score,
        questions_answered: session.questions_answered,
        total_questions: selectedQuestions.length,
        questions_by_category: categorySummary,
        selected_questions: selectedQuestions.map((q: any) => ({
          id: q.id,
          category: q.category,
          question: q.question,
          answers: q.answers,
          score: q.score,
          // Note: correct_answer_index is not included in session creation response for security
        })),
        started_at: session.started_at,
        time_limit: session.time_limit,
        session_rules: {
          total_questions: 16,
          questions_per_category: 4,
          win_condition: "80% of total possible score points",
          scoring: "Variable points per question based on difficulty/weight (see question.score field)",
          scoring_note: "Each question has its own score value. Win by earning 80% of total possible points.",
          note: "Answer each question by submitting to POST /sessions/{session_id}/answer"
        }
      }
    });
  } catch (error) {
    handleDatabaseError(error, res, 'create game session');
  }
});

// Get session state/progress
sessionsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Session ID is required',
        error: 'Valid session ID must be provided'
      });
    }

    // Get session details
    const session = await database.getGameSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
        error: `Game session with ID ${sessionId} does not exist`
      });
    }

    // Get session questions
    const sessionQuestions = await database.getSessionQuestions(sessionId);
    
    // Get user answers for progress tracking
    const userAnswers = await database.getUserAnswers(sessionId);

    // Prepare questions with answer status (but don't show correct answers for unanswered questions)
    const questionsWithStatus = sessionQuestions.map((question: any) => {
      const userAnswer = userAnswers.find((answer: any) => answer.question_id === question.id);
      
      if (userAnswer) {
        // Question has been answered - show full details including correct answer
        return {
          id: question.id,
          category: question.category,
          question: question.question,
          answers: question.answers,
          score: question.score,
          answered: true,
          user_answer_index: userAnswer.answer_index,
          user_answer: question.answers[userAnswer.answer_index],
          is_correct: userAnswer.is_correct,
          correct_answer_index: question.correct_answer_index,
          correct_answer: question.answers[question.correct_answer_index]
        };
      } else {
        // Question not yet answered - hide correct answer
        return {
          id: question.id,
          category: question.category,
          question: question.question,
          answers: question.answers,
          score: question.score,
          answered: false
        };
      }
    });

    // Calculate progress with proper score calculation
    const totalQuestions = sessionQuestions.length;
    const questionsAnswered = userAnswers.length;
    
    // Calculate actual score based on question weights
    let currentScore = 0;
    let totalPossibleScore = 0;
    
    for (const sessionQuestion of sessionQuestions) {
      totalPossibleScore += sessionQuestion.score;
      
      // Find if this question was answered correctly
      const userAnswer = userAnswers.find((answer: any) => answer.question_id === sessionQuestion.id);
      if (userAnswer && userAnswer.is_correct) {
        currentScore += sessionQuestion.score;
      }
    }
    
    const scorePercentage = totalPossibleScore > 0 ? (currentScore / totalPossibleScore) * 100 : 0;
    
    res.json({
      status: 'success',
      message: 'Session details retrieved successfully',
      data: {
        session: {
          id: session.id,
          user_id: session.user_id,
          status: session.status,
          current_score: currentScore,
          questions_answered: questionsAnswered,
          total_questions: totalQuestions,
          started_at: session.started_at,
          time_limit: session.time_limit,
          completed_at: session.completed_at
        },
        progress: {
          questions_answered: questionsAnswered,
          total_questions: totalQuestions,
          current_score: currentScore,
          total_possible_score: totalPossibleScore,
          progress_percentage: Math.round((questionsAnswered / totalQuestions) * 100),
          questions_remaining: totalQuestions - questionsAnswered,
          score_percentage: Math.round(scorePercentage)
        },
        questions: questionsWithStatus,
        game_rules: {
          total_questions: totalQuestions,
          win_condition: "80% of total possible score points",
          win_threshold: `${Math.round(totalPossibleScore * 0.8)} out of ${totalPossibleScore} points`,
          scoring: "Variable points per question based on difficulty/weight (see question.score field)"
        }
      }
    });

  } catch (error) {
    handleDatabaseError(error, res, 'retrieve session details');
  }
});

// Submit answer for a question
sessionsRouter.post('/:id/answer', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const { question_id, answer_index, user_id } = req.body;

    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Session ID is required',
        error: 'Valid session ID must be provided'
      });
    }

    // Validate user_id (SECURITY: Ensure only session owner can submit answers)
    if (!user_id || typeof user_id !== 'string' || user_id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required',
        error: 'user_id is required to verify session ownership'
      });
    }

    // Validate question_id
    if (!question_id || typeof question_id !== 'string' || question_id.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Question ID is required',
        error: 'question_id must be a non-empty string'
      });
    }

    // Validate answer_index
    if (typeof answer_index !== 'number' || !Number.isInteger(answer_index) || answer_index < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid answer index',
        error: 'answer_index must be a non-negative integer'
      });
    }

    // Check if session exists and is active
    const session = await database.getGameSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
        error: `Game session with ID ${sessionId} does not exist`
      });
    }

    // SECURITY: Verify that the user_id matches the session owner
    if (session.user_id !== user_id.trim()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        error: 'You can only submit answers for your own game sessions'
      });
    }

    if (session.status !== 'in_progress') {
      return res.status(400).json({
        status: 'error',
        message: 'Session not active',
        error: `Cannot submit answers to a session with status: ${session.status}`
      });
    }

    // Check if question exists
    const question = await database.getQuestionById(question_id);
    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Question not found',
        error: `Trivia question with ID ${question_id} does not exist`
      });
    }

    // Validate that this question belongs to this session
    const isQuestionInSession = await database.isQuestionInSession(sessionId, question_id);
    if (!isQuestionInSession) {
      return res.status(400).json({
        status: 'error',
        message: 'Question not in session',
        error: 'This question is not part of your current game session'
      });
    }

    // Validate answer_index is within bounds for this question
    if (answer_index >= question.answers.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid answer index',
        error: `answer_index must be between 0 and ${question.answers.length - 1} for this question`
      });
    }

    // Check for duplicate submission (enforce one attempt per question per session)
    const existingAnswer = await database.getUserAnswer(sessionId, question_id);
    if (existingAnswer) {
      return res.status(409).json({
        status: 'error',
        message: 'Answer already submitted',
        error: 'You have already answered this question. Only one attempt per question is allowed.'
      });
    }

    // Determine if the answer is correct
    const isCorrect = answer_index === question.correct_answer_index;

    // Create the user answer record
    await database.createUserAnswer({
      session_id: sessionId,
      question_id: question_id,
      answer_index: answer_index,
      is_correct: isCorrect
    });

    // Get current session progress with proper score calculation
    const currentAnswers = await database.getUserAnswers(sessionId);
    const questionsAnswered = currentAnswers.length;
    
    // Calculate actual score based on question weights
    let currentScore = 0;
    let totalPossibleScore = 0;
    
    // Get all session questions to calculate total possible score and actual score
    const sessionQuestions = await database.getSessionQuestions(sessionId);
    
    for (const sessionQuestion of sessionQuestions) {
      totalPossibleScore += sessionQuestion.score;
      
      // Find if this question was answered correctly
      const userAnswer = currentAnswers.find((answer: any) => answer.question_id === sessionQuestion.id);
      if (userAnswer && userAnswer.is_correct) {
        currentScore += sessionQuestion.score;
      }
    }

    // Check if game is complete
    const totalQuestions = sessionQuestions.length;
    const isGameComplete = questionsAnswered >= totalQuestions;
    
    // Calculate win condition based on score percentage (80% of total possible score)
    const scorePercentage = totalPossibleScore > 0 ? (currentScore / totalPossibleScore) * 100 : 0;
    const winThreshold = 80; // 80% of total possible score
    
    let newStatus: 'in_progress' | 'user_lost' | 'user_won' | 'expired' = session.status;
    let completedAt = session.completed_at;

    if (isGameComplete) {
      newStatus = scorePercentage >= winThreshold ? 'user_won' : 'user_lost';
      completedAt = new Date().toISOString();
    }

    // Update session with new score and status
    const updatedSession = await database.updateGameSession(sessionId, {
      current_score: currentScore,
      questions_answered: questionsAnswered,
      status: newStatus,
      completed_at: completedAt
    });

    // Prepare response with game state
    const progress = {
      questions_answered: questionsAnswered,
      total_questions: totalQuestions,
      current_score: currentScore,
      total_possible_score: totalPossibleScore,
      score_percentage: Math.round(scorePercentage),
      progress_percentage: Math.round((questionsAnswered / totalQuestions) * 100),
      questions_remaining: totalQuestions - questionsAnswered
    };

    interface SubmitAnswerResponse {
      status: string;
      message: string;
      data: {
        answer_result: {
          question_id: string;
          your_answer_index: number;
          your_answer: string;
          is_correct: boolean;
          correct_answer_index: number;
          correct_answer: string;
          explanation: string;
        };
        session_progress: typeof progress;
        session_status: string;
        game_complete: boolean;
        final_results?: {
          final_score: number;
          total_possible_score: number;
          total_questions: number;
          score_percentage: number;
          result: string;
          win_threshold: string;
        };
      };
    }

    const response: SubmitAnswerResponse = {
      status: 'success',
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
      data: {
        answer_result: {
          question_id: question_id,
          your_answer_index: answer_index,
          your_answer: question.answers[answer_index],
          is_correct: isCorrect,
          correct_answer_index: question.correct_answer_index,
          correct_answer: question.answers[question.correct_answer_index],
          explanation: isCorrect ? 'Well done!' : `The correct answer was: ${question.answers[question.correct_answer_index]}`
        },
        session_progress: progress,
        session_status: updatedSession.status,
        game_complete: isGameComplete
      }
    };

    // Add completion details if game is finished
    if (isGameComplete) {
      response.data.final_results = {
        final_score: currentScore,
        total_possible_score: totalPossibleScore,
        total_questions: totalQuestions,
        score_percentage: Math.round(scorePercentage),
        result: newStatus === 'user_won' ? 'Congratulations! You won!' : 'Game over. Better luck next time!',
        win_threshold: `${winThreshold}% of total possible score (${Math.round(totalPossibleScore * 0.8)} out of ${totalPossibleScore} points)`
      };
    }

    res.json(response);

  } catch (error) {
    handleDatabaseError(error, res, 'submit answer');
  }
});

// List all sessions (game master)
sessionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Optional query parameters for filtering
    const { status, user_id, limit } = req.query;

    // Get all game sessions
    let sessions = await database.getAllGameSessions();

    // Apply filters if provided
    if (status && typeof status === 'string') {
      sessions = sessions.filter((session: any) => session.status === status);
    }

    if (user_id && typeof user_id === 'string') {
      sessions = sessions.filter((session: any) => session.user_id === user_id);
    }

    // Apply limit if provided
    if (limit && typeof limit === 'string') {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        sessions = sessions.slice(0, limitNum);
      }
    }

    // Get user information for each session
    const sessionsWithUserInfo = await Promise.all(
      sessions.map(async (session: any) => {
        try {
          const user = await database.getUser(session.user_id);
          
          return {
            session_id: session.id,
            user_id: session.user_id,
            username: user?.username || 'Unknown User',
            status: session.status,
            progress: {
              questions_answered: session.questions_answered,
              total_questions: 16,
              current_score: session.current_score,
              progress_percentage: Math.round((session.questions_answered / 16) * 100),
              score_percentage: session.questions_answered > 0 ? Math.round((session.current_score / 16) * 100) : 0
            },
            timing: {
              started_at: session.started_at,
              completed_at: session.completed_at,
              time_limit: session.time_limit
            },
            game_result: session.status === 'user_won' ? 'WIN' : 
                        session.status === 'user_lost' ? 'LOSS' : 
                        session.status === 'expired' ? 'EXPIRED' : 'IN_PROGRESS'
          };
        } catch {
          // If user lookup fails, still return session data
          return {
            session_id: session.id,
            user_id: session.user_id,
            username: 'Unknown User',
            status: session.status,
            progress: {
              questions_answered: session.questions_answered,
              total_questions: 16,
              current_score: session.current_score,
              progress_percentage: Math.round((session.questions_answered / 16) * 100),
              score_percentage: session.questions_answered > 0 ? Math.round((session.current_score / 16) * 100) : 0
            },
            timing: {
              started_at: session.started_at,
              completed_at: session.completed_at,
              time_limit: session.time_limit
            },
            game_result: session.status === 'user_won' ? 'WIN' : 
                        session.status === 'user_lost' ? 'LOSS' : 
                        session.status === 'expired' ? 'EXPIRED' : 'IN_PROGRESS'
          };
        }
      })
    );

    // Calculate summary statistics (from all sessions, not just filtered ones)
    const allSessions = await database.getAllGameSessions();
    const totalSessions = allSessions.length;
    const completedSessions = allSessions.filter((s: any) => s.status === 'user_won' || s.status === 'user_lost').length;
    const activeSessions = allSessions.filter((s: any) => s.status === 'in_progress').length;
    const wonSessions = allSessions.filter((s: any) => s.status === 'user_won').length;
    const lostSessions = allSessions.filter((s: any) => s.status === 'user_lost').length;

    res.json({
      status: 'success',
      message: 'All game sessions retrieved successfully',
      data: {
        filters_applied: {
          status: status || null,
          user_id: user_id || null,
          limit: limit || null
        },
        summary: {
          total_sessions: totalSessions,
          active_sessions: activeSessions,
          completed_sessions: completedSessions,
          won_sessions: wonSessions,
          lost_sessions: lostSessions,
          win_rate: completedSessions > 0 ? Math.round((wonSessions / completedSessions) * 100) : 0,
          filtered_results: sessions.length
        },
        sessions: sessionsWithUserInfo
      }
    });

  } catch (error) {
    handleDatabaseError(error, res, 'retrieve game sessions');
  }
});

export { sessionsRouter };
