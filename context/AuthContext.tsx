import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (email: string) => Promise<boolean>;
  register: (user: User) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is persisted in session (simplified)
    const storedId = localStorage.getItem('maz_current_user_id');
    if (storedId) {
      const users = storage.getUsers();
      const user = users.find(u => u.id === storedId);
      if (user) setCurrentUser(user);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = storage.login(email, password);
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
  };

  const loginWithGoogle = async (email: string): Promise<boolean> => {
    let user = storage.loginWithGoogle(email);

    if (!user) {
      // If user doesn't exist, create a new active account since it's an OAuth simulation
      const newUser: User = {
        id: `google-${Date.now()}`,
        firstName: email.split('@')[0],
        surnames: ['', '', '', ''],
        birthDate: '2000-01-01', // Default
        parentsNames: 'Desconocidos',
        email: email,
        password: Math.random().toString(36).slice(-8), // Random password
        role: 'member',
        status: 'active', // Auto-activate Google simulated accounts
        registeredAt: new Date().toISOString()
      };
      storage.saveUser(newUser);
      user = newUser;
    }

    if (user.status === 'rejected') {
       alert('Su cuenta ha sido rechazada por el administrador.');
       return false;
    }
    if (user.status === 'pending_approval') {
       // Since it's a simulated flow, we just update them to active
       user.status = 'active';
       storage.updateUser(user);
    }

    setCurrentUser(user);
    localStorage.setItem('maz_current_user_id', user.id);
    return true;
  };

  const register = async (newUser: User) => {
    storage.saveUser(newUser);
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

  const refreshUser = () => {
      if (currentUser) {
          const users = storage.getUsers();
          const refreshed = users.find(u => u.id === currentUser.id);
          if (refreshed) setCurrentUser(refreshed);
      }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, loginWithGoogle, register, logout, refreshUser }}>
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