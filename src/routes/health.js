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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../data/supabase");
const healthRouter = express_1.default.Router();
exports.healthRouter = healthRouter;
// Health check endpoint
healthRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield supabase_1.supabase.from('users').select('count').limit(1);
        res.json({ status: 'ok', message: 'Database connection successful' });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ status: 'error', message: 'Database connection failed', error: errorMessage });
    }
}));
