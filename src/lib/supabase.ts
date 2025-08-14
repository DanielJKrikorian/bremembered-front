import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  // Clean the URL by removing any trailing paths that Supabase client adds automatically
  const cleanUrl = supabaseUrl?.replace(/\/(rest|auth|storage).*$/, '');
  
  return !!(cleanUrl && 
           supabaseAnonKey && 
           cleanUrl.startsWith('https://') &&
           cleanUrl.includes('supabase.co') &&
           cleanUrl !== 'https://placeholder.supabase.co' &&
           supabaseAnonKey !== 'placeholder-key' &&
           supabaseAnonKey.length > 20);
};

// Clean the Supabase URL to remove any trailing API paths
const getCleanSupabaseUrl = () => {
  if (!supabaseUrl) return '';
  return supabaseUrl.replace(/\/(rest|auth|storage).*$/, '');
};

// Only create client if properly configured
export const supabase = isSupabaseConfigured() 
  ? createClient(getCleanSupabaseUrl(), supabaseAnonKey!)
  : null;