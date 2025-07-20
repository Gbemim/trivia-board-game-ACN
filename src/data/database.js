"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const supabase_1 = require("./supabase");
const uuid_1 = require("uuid");
// Database service functions
class DatabaseService {
    // User operations
    static createUser(username) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate unique user ID
            const user_id = (0, uuid_1.v4)();
            const { data, error } = yield supabase_1.supabase
                .from('users')
                .insert([{ user_id, username }])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        });
    }
    static getUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('users')
                .select('*')
                .eq('user_id', userId)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data;
        });
    }
    // Trivia Question operations
    static createTriviaQuestion(question) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('trivia_questions')
                .insert([question])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        });
    }
    static getAllTriviaQuestions() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('trivia_questions')
                .select('*')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data || [];
        });
    }
    static updateTriviaQuestion(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('trivia_questions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        });
    }
    static deleteTriviaQuestion(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield supabase_1.supabase
                .from('trivia_questions')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
        });
    }
    // Game Session operations
    static createGameSession(session) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('game_sessions')
                .insert([session])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        });
    }
    static getAllGameSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('game_sessions')
                .select('*')
                .order('started_at', { ascending: false });
            if (error)
                throw error;
            return data || [];
        });
    }
    static updateGameSession(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('game_sessions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        });
    }
    // User Answer operations
    static createUserAnswer(answer) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('user_answers')
                .insert([answer])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        });
    }
    static getUserAnswers(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('user_answers')
                .select('*')
                .eq('session_id', sessionId)
                .order('answered_at', { ascending: true });
            if (error)
                throw error;
            return data || [];
        });
    }
}
exports.DatabaseService = DatabaseService;
