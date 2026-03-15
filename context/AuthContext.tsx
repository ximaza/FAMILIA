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
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
    const initAuth = async () => {
      const storedId = localStorage.getItem('maz_current_user_id');
      if (storedId) {
        try {
          const users = await storage.getUsers();
          const user = users.find(u => u.id === storedId);
          // ONLY set user if active or admin
          if (user && (user.status === 'active' || user.role === 'admin')) {
             setCurrentUser(user);
          } else {
             localStorage.removeItem('maz_current_user_id');
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
          localStorage.removeItem('maz_current_user_id');
        }
      }
      setIsLoading(false);
    };
    initAuth();
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
        return false;
    } catch(e) {
        return false; // Invalid credentials throw error
    }
  };

  const register = async (newUser: User) => {
    await storage.saveUser(newUser);
    // Auto login is disabled because approval is needed, unless it's the first admin seed
    if (newUser.role === 'admin') {
        setCurrentUser(newUser);
        localStorage.setItem('maz_current_user_id', newUser.id);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('maz_current_user_id');
  };

  const refreshUser = async () => {
      if (currentUser) {
          const users = await storage.getUsers();
          const refreshed = users.find(u => u.id === currentUser.id);
          if (refreshed) setCurrentUser(refreshed);
      }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

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
