import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle sign in event
        if (event === 'SIGNED_IN' && session?.user) {
          // Ensure user profile exists
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (!existingProfile) {
            // Create user profile if it doesn't exist
            await supabase
              .from('user_profiles')
              .insert({
                user_id: session.user.id,
                created_at: new Date().toISOString()
              });
          }
          
          // Ensure user points record exists
          const { data: existingPoints } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (!existingPoints) {
            // Create user points record if it doesn't exist (5 points for new users)
            await supabase
              .from('user_points')
              .insert({
                user_id: session.user.id,
                points: 5,
                created_at: new Date().toISOString()
              });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  };

  return {
    user,
    loading,
    signOut,
    signInWithEmail,
    signUpWithEmail
  };
}