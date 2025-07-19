import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.SUPABASE_URL);
console.log(process.env.SUPABASE_KEY);


const port = process.env.PORT || 3000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;