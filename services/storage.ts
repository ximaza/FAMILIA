import { User, Notice, FamilyHistory, HomePageContent } from '../types';


const getAuthHeaders = () => {
  const userStr = localStorage.getItem('maz_current_user');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        headers['x-user-id'] = user.id;
      }
    } catch (e) {}
  }
  return headers;
};

export const storage = {
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users', {
      headers: getAuthHeaders()
    });
    return res.json();
  },
  
  saveUser: async (user: User): Promise<User> => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user)
    });
    return res.json();
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const res = await fetch(`/api/users/${updatedUser.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedUser)
    });
    return res.json();
  },

  deleteUser: async (userId: string): Promise<void> => {
    await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
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
