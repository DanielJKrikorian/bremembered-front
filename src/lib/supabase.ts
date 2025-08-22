import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && 
           supabaseAnonKey && 
           supabaseUrl.startsWith('https://') &&
           supabaseUrl.includes('supabase.co') &&
           supabaseUrl !== 'https://placeholder.supabase.co' &&
           supabaseAnonKey !== 'placeholder-key' &&
           supabaseAnonKey.length > 20);
};

// Only create client if properly configured
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false, // Disable session persistence to avoid refresh token issues
        autoRefreshToken: false, // Disable auto refresh to prevent token errors
        detectSessionInUrl: false // Disable URL session detection
      }
    })
  : null;