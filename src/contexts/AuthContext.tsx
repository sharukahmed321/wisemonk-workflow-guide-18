import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { AutoLogoutWarningModal } from '@/components/AutoLogoutWarningModal';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  isEmailVerified: boolean;
  lastActivity: number;
  signOut: (reason?: 'auto' | 'manual') => Promise<void>;
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
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email, 'Email confirmed:', session?.user?.email_confirmed_at);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check email verification status
        const emailVerified = session?.user?.email_confirmed_at !== null;
        setIsEmailVerified(emailVerified);
        
        // Fetch user role when user signs in and email is verified
        if (session?.user && emailVerified) {
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
      console.log('Initial session check:', session?.user?.email, 'Email confirmed:', session?.user?.email_confirmed_at);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check email verification status
      const emailVerified = session?.user?.email_confirmed_at !== null;
      setIsEmailVerified(emailVerified);
      
      if (session?.user && emailVerified) {
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

  const signOut = async (reason: 'auto' | 'manual' = 'manual') => {
    try {
      // Immediately clear local state for instant UI feedback
      const currentUser = user;
      
      // Log sign out event (before actual signout to avoid RLS issues)
      if (currentUser) {
        try {
          await supabase.from('auth_audit_logs').insert({
            user_id: currentUser.id,
            event_type: reason === 'auto' ? 'auto_logout' : 'sign_out',
            success: true,
            details: { 
              method: reason,
              inactivity_duration: reason === 'auto' ? Date.now() - lastActivity : undefined,
              timestamp: new Date().toISOString()
            },
            user_agent: navigator.userAgent,
          });
        } catch (auditError) {
          // Don't fail signout if audit logging fails
          console.warn('Failed to log sign out event:', auditError);
        }
      }

      // Sign out from all sessions globally first
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Error signing out:', error);
      }

      // Clear local state after successful signout
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsEmailVerified(false);
      setLoading(false);
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Ensure state is cleared even if signout fails
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsEmailVerified(false);
      setLoading(false);
    }
  };

  // Auto logout functionality
  const {
    showWarning,
    warningCountdown,
    extendSession,
    logoutNow,
  } = useAutoLogout({
    timeoutMs: 30 * 60 * 1000, // 30 minutes
    warningMs: 60 * 1000, // 1 minute warning
    onLogout: signOut,
    enabled: !!user && isEmailVerified,
  });

  // Update last activity when user is active
  useEffect(() => {
    if (user && isEmailVerified) {
      setLastActivity(Date.now());
    }
  }, [user, isEmailVerified]);

  const value = {
    user,
    session,
    loading,
    userRole,
    isEmailVerified,
    lastActivity,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AutoLogoutWarningModal
        isOpen={showWarning}
        countdown={warningCountdown}
        onStayLoggedIn={extendSession}
        onLogoutNow={logoutNow}
      />
    </AuthContext.Provider>
  );
};