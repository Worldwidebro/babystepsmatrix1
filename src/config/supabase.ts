import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

// Use environment variables with fallback to direct credentials
export const supabaseUrl =
  process.env.SUPABASE_URL || "https://oobqauxgqnvdqocnibiz.supabase.co";
export const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYnFhdXhncW52ZHFvY25pYml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjcyMjIsImV4cCI6MjA2MDA0MzIyMn0.o2XGt-m2szHie6vR3sE0jcaaEDeIu0KhVOP7aIUOzDk";

// This approach allows for flexibility between development and production environments

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper function to get the current user
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to get the current session
export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
