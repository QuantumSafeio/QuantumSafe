import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 10000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle sign in event
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Ensure user profile exists
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (!existingProfile) {
              // Create user profile if it doesn't exist
              const walletAddress = session.user.user_metadata?.wallet_address || 
                                  session.user.email?.split('@')[0];
              
              await supabase
                .from('user_profiles')
                .insert({
                  user_id: session.user.id,
                  wallet_address: walletAddress,
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

              // Record initial points transaction
              await supabase
                .from('points_transactions')
                .insert({
                  user_id: session.user.id,
                  points_change: 5,
                  source: 'welcome_bonus',
                  metadata: {
                    description: 'Welcome bonus for new users',
                    wallet_address: session.user.user_metadata?.wallet_address
                  },
                  created_at: new Date().toISOString()
                });
            }
          } catch (error) {
            console.error('Error setting up user data:', error);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user,
    loading,
    signOut
  };
}