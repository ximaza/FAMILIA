import { User, Notice, FamilyHistory, HomePageContent } from '../types';

export const storage = {
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users');
    return res.json();
  },
  
  saveUser: async (user: User): Promise<User> => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return res.json();
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const res = await fetch(`/api/users/${updatedUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    });
    return res.json();
  },

  deleteUser: async (userId: string): Promise<void> => {
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
  },

  getNotices: async (): Promise<Notice[]> => {
    const res = await fetch('/api/notices');
    return res.json();
  },
  
  addNotice: async (notice: Notice): Promise<Notice> => {
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notice)
    });
    return res.json();
  },

  getHistory: async (): Promise<FamilyHistory> => {
    const res = await fetch('/api/history');
    return res.json();
  },
  
  saveHistory: async (history: FamilyHistory): Promise<FamilyHistory> => {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(history)
    });
    return res.json();
  },

  getHomePage: async (): Promise<HomePageContent> => {
    const res = await fetch('/api/homepage');
    return res.json();
  },
  
  saveHomePage: async (content: HomePageContent): Promise<HomePageContent> => {
    const res = await fetch('/api/homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    });
    return res.json();
  },

  login: async (email: string, password: string): Promise<User | undefined> => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) return res.json();
    return undefined;
  }
};
