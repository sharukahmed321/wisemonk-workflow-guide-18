import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role when user signs in
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserRole(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('role')
        .limit(1);

      if (error) {
        console.error('Failed to fetch user role:', error);
        return;
      }

      if (data && data.length > 0) {
        setUserRole(data[0].role);
      } else {
        // Default role if none found
        setUserRole('employee');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('employee');
    }
  };

  const signOut = async () => {
    try {
      // Immediately clear local state for instant UI feedback
      const currentUser = user;
      setUser(null);
      setSession(null);
      setUserRole(null);
      setLoading(false);

      // Log sign out event (before actual signout to avoid RLS issues)
      if (currentUser) {
        try {
          await supabase.from('auth_audit_logs').insert({
            user_id: currentUser.id,
            event_type: 'sign_out',
            success: true,
            details: { method: 'manual' },
            user_agent: navigator.userAgent,
          });
        } catch (auditError) {
          // Don't fail signout if audit logging fails
          console.warn('Failed to log sign out event:', auditError);
        }
      }

      // Sign out from all sessions globally
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Error signing out:', error);
        // Don't throw here since we already cleared local state
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Ensure state is cleared even if signout fails
      setUser(null);
      setSession(null);
      setUserRole(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};