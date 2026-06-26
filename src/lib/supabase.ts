import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Forge Rush: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Auth and leaderboard are disabled.',
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
