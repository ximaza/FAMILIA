import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (user: User) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedId = localStorage.getItem('maz_current_user_id');
      if (storedId) {
        try {
          const users = await storage.getUsers();
          const user = users.find(u => u.id === storedId);
          if (user) setCurrentUser(user);
        } catch (error) {
          console.error("Failed to initialize auth:", error);
        }
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await storage.login(email, password);
      if (user) {
        if (user.status === 'rejected') {
           alert('Su cuenta ha sido rechazada por el administrador.');
           return false;
        }
        if (user.status === 'pending_approval') {
           alert('Su cuenta está pendiente de aprobación por el administrador.');
           return false;
        }
        setCurrentUser(user);
        localStorage.setItem('maz_current_user_id', user.id);
        return true;
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
    return false;
  };

  const register = async (newUser: User) => {
    try {
      await storage.saveUser(newUser);
      if (newUser.role === 'admin') {
          setCurrentUser(newUser);
          localStorage.setItem('maz_current_user_id', newUser.id);
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('maz_current_user_id');
  };

  const refreshUser = async () => {
      if (currentUser) {
          try {
            const users = await storage.getUsers();
            const refreshed = users.find(u => u.id === currentUser.id);
            if (refreshed) setCurrentUser(refreshed);
          } catch (error) {
            console.error("Failed to refresh user:", error);
          }
      }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
