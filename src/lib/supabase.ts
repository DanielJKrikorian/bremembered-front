import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && 
           supabaseAnonKey && 
           supabaseUrl.includes('supabase.co') &&
           supabaseUrl !== 'https://placeholder.supabase.co' &&
           supabaseAnonKey !== 'placeholder-key');
           supabaseUrl !== 'https://placeholder.supabase.co' &&
           supabaseAnonKey !== 'placeholder-key');
};

// Only create client if properly configured
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;