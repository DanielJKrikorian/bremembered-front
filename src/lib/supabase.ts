import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eecbrvehrhrvdzuutliq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODY2MzgsImV4cCI6MjA2MDA2MjYzOH0.5fJyTvdm9Sri0ZWYdNiaWXB5YCh3b0odadRPe0pPRNs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);