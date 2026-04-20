import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://eggwbtnfpycvqeuwsvrv.supabase.co';
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZ3didG5mcHljdnFldXdzdnJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDYyNTIsImV4cCI6MjA5MTYyMjI1Mn0.BiRTGsu-2J1EdLFG4dRv6vjYVG3JE7dz6i187hyWv1w';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create client with service role key for admin operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional admin client only when service key is supplied.
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;
