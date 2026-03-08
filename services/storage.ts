import { User, Notice, FamilyHistory, HomePageContent } from '../types';

const getHeaders = () => {
  const userId = localStorage.getItem('maz_current_user_id');
  return {
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {})
  };
};

export const storage = {
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users', { headers: getHeaders() });
    if (!res.ok) return []; // Fallback for non-admins to prevent crash, though only admins should call this typically in current flow
    return res.json();
  },
  
  saveUser: async (user: User): Promise<User> => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user)
    });
    return res.json();
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const res = await fetch(`/api/users/${updatedUser.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updatedUser)
    });
    return res.json();
  },

  deleteUser: async (userId: string): Promise<void> => {
    await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  getNotices: async (): Promise<Notice[]> => {
    const res = await fetch('/api/notices');
    return res.json();
  },
  
  addNotice: async (notice: Notice): Promise<Notice> => {
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(notice)
    });
    return res.json();
  },

  getHistory: async (): Promise<FamilyHistory> => {
    const res = await fetch('/api/history', { headers: getHeaders() });
    return res.json();
  },
  
  saveHistory: async (history: FamilyHistory): Promise<FamilyHistory> => {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(history)
    });
    return res.json();
  },

  getHomePage: async (): Promise<HomePageContent> => {
    const res = await fetch('/api/homepage', { headers: getHeaders() });
    return res.json();
  },
  
  saveHomePage: async (content: HomePageContent): Promise<HomePageContent> => {
    const res = await fetch('/api/homepage', {
      method: 'POST',
      headers: getHeaders(),
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
