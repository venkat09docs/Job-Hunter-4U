import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { CrossDomainStorage } from '@/utils/domainRedirect';

const SUPABASE_URL = "https://moirryvajzyriagqihbe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw";

// Import the interceptor to enable automatic request deduplication
import '@/utils/supabaseInterceptor';

// Create and export the Supabase client (deduplication is handled by the interceptor)
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => CrossDomainStorage.getItem(key),
      setItem: (key: string, value: string) => CrossDomainStorage.setItem(key, value),
      removeItem: (key: string) => CrossDomainStorage.removeItem(key),
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});