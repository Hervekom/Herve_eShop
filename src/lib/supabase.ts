import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const supabaseUrl = runtimeEnv?.VITE_SUPABASE_URL;
const supabaseAnonKey = runtimeEnv?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required!');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
