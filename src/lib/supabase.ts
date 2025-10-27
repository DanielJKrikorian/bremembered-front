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
        persistSession: true, // Enable session persistence to maintain login state
        autoRefreshToken: true, // Enable auto refresh to keep sessions active
        detectSessionInUrl: false // Disable URL session detection
      }
    })
  : null;

  export const getPublicImageUrl = (path: string | null) => {
  if (!path) return null;
  const { data } = supabase.storage
    .from('service_packages_images') // ← BUCKET NAME
    .getPublicUrl(path);
  return data.publicUrl;
};