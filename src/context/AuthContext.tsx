import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoadingAuth: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null; user: User | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null; user: User | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          console.warn('⚠️ Supabase credentials are not fully configured.');
          if (isMounted) {
            setUser(null);
            setSession(null);
            setIsLoadingAuth(false);
          }
          return;
        }

        // Get initial session from Supabase
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Error getting Supabase session:', error.message);
        }

        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setIsLoadingAuth(false);
        }
      } catch (err: any) {
        console.error('❌ Exception in initializeAuth:', err);
        if (isMounted) {
          setUser(null);
          setSession(null);
          setIsLoadingAuth(false);
        }
      }
    };

    initializeAuth();

    // Listen to real-time auth changes (sign in, sign out, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsLoadingAuth(false);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignInWithPassword = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { error, user: null };
      }

      setUser(data.user);
      setSession(data.session);
      return { error: null, user: data.user };
    } catch (err: any) {
      const errorObj = { message: err?.message || 'فشل تسجيل الدخول' } as AuthError;
      setAuthError(errorObj.message);
      return { error: errorObj, user: null };
    }
  };

  const handleSignUp = async (email: string, password: string, fullName?: string) => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() || '',
            display_name: fullName?.trim() || '',
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        return { error, user: null, needsEmailConfirmation: false };
      }

      // Check if session was created immediately or requires email confirmation
      const needsEmailConfirmation = !data.session;
      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
      }

      return { error: null, user: data.user, needsEmailConfirmation };
    } catch (err: any) {
      const errorObj = { message: err?.message || 'فشل إنشاء الحساب' } as AuthError;
      setAuthError(errorObj.message);
      return { error: errorObj, user: null, needsEmailConfirmation: false };
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError(error.message);
        return { error };
      }
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (err: any) {
      const errorObj = { message: err?.message || 'فشل تسجيل الخروج' } as AuthError;
      setAuthError(errorObj.message);
      return { error: errorObj };
    }
  };

  const handleResetPassword = async (email: string) => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) {
        setAuthError(error.message);
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      const errorObj = { message: err?.message || 'فشل إرسال رابط استعادة كلمة المرور' } as AuthError;
      setAuthError(errorObj.message);
      return { error: errorObj };
    }
  };

  const handleSignInWithGoogle = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        setAuthError(error.message);
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      const errorObj = { message: err?.message || 'فشل تسجيل الدخول باستخدام Google' } as AuthError;
      setAuthError(errorObj.message);
      return { error: errorObj };
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      isLoadingAuth,
      authError,
      setAuthError,
      signInWithPassword: handleSignInWithPassword,
      signUp: handleSignUp,
      signOut: handleSignOut,
      resetPassword: handleResetPassword,
      signInWithGoogle: handleSignInWithGoogle,
    }),
    [user, session, isLoadingAuth, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
