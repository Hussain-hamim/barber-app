import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;

  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ user: User | null; error: Error | null }>;
  verifyOtp: (
    email: string,
    token: string
  ) => Promise<{ session: Session | null; error: Error | null }>;

  signIn: (
    email: string,
    password: string,
    isAdmin: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isLoading: boolean;

  sendPasswordResetOtp: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  verifyPasswordResetOtp: (
    email: string,
    token: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      // if (data.user) {
      //   await supabase.from('profiles').insert({
      //     id: data.user.id,
      //     name: name,
      //     email: email,
      //     is_admin: false,
      //   });
      // }
      setIsLoading(false);

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) throw error;
      return { session: data.session, error: null };
    } catch (error) {
      return { session: null, error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (
    email: string,
    password: string,
    isAdmin: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          await supabase.auth.signInWithPassword({ email, password });
          return { success: true };
        }
        throw error;
      }

      if (isAdmin && data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();

        if (!profile?.is_admin) {
          await supabase.auth.signOut();
          throw new Error('You are not authorized as an admin');
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordResetOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'myapp://reset-password', // Not used but required
          shouldCreateUser: false, // Important! Prevents new user creation
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const verifyPasswordResetOtp = async (
    email: string,
    token: string,
    newPassword: string
  ) => {
    try {
      // First verify the OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });

      if (error) throw error;

      // If OTP is valid, update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        session,
        signUp,
        signIn,
        signOut,
        verifyOtp,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// export const useAuth = () => useContext(AuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
