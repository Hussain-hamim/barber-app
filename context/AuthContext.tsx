import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserType = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
} | null;

type AuthContextType = {
  user: UserType;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, isAdmin: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const bootstrapAsync = async () => {
      try {
        const userString = await AsyncStorage.getItem('@user');
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (e) {
        console.error('Failed to load user data', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const signIn = async (email: string, password: string, isAdmin: boolean) => {
    setIsLoading(true);
    try {
      // Mock authentication - in a real app, you'd validate against an API
      // Simulating a network request with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: '1',
        name: email.split('@')[0],
        email,
        isAdmin,
      };
      
      await AsyncStorage.setItem('@user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (e) {
      console.error('Sign in failed', e);
      throw new Error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock registration - in a real app, you'd make an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        email,
        isAdmin: false,
      };
      
      await AsyncStorage.setItem('@user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (e) {
      console.error('Sign up failed', e);
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('@user');
      setUser(null);
    } catch (e) {
      console.error('Sign out failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user, 
        signIn, 
        signUp, 
        signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};