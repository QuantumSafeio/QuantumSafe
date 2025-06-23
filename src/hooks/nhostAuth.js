import { supabase } from '../lib/supabase';

export async function signInWithEmailPassword(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmailPassword(email, password) {
  return supabase.auth.signUp({ email, password });
}