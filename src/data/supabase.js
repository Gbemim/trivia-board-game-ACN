"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
}
if (!supabaseKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// For admin operations (if needed), you can create a separate client with service role key
// While the regular supabase client (using the anonymous key) is limited to operations allowed for regular users, the supabaseAdmin client can:
// Bypass Row Level Security (RLS) policies
// Access restricted tables and columns
// Perform privileged operations like:
// User management (create/delete users, reset passwords)
// Database schema modifications
// Access to protected data
// Bypassing security rules for administrative tasks
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
exports.supabaseAdmin = supabaseServiceKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey)
    : null;
