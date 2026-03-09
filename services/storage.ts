import { User, Notice, FamilyHistory, HomePageContent } from '../types';


const getAuthHeaders = () => {
  const userId = localStorage.getItem('maz_current_user_id');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
};

export const storage = {
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  saveUser: async (user: User): Promise<User> => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const res = await fetch(`/api/users/${updatedUser.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedUser)
    });
    if (!res.ok) throw new Error(await res.text());
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
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  addNotice: async (notice: Notice): Promise<Notice> => {
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notice)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getHistory: async (): Promise<FamilyHistory> => {
    const res = await fetch('/api/history');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  saveHistory: async (history: FamilyHistory): Promise<FamilyHistory> => {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(history)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getHomePage: async (): Promise<HomePageContent> => {
    const res = await fetch('/api/homepage');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  saveHomePage: async (content: HomePageContent): Promise<HomePageContent> => {
    const res = await fetch('/api/homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  login: async (email: string, password: string): Promise<User | undefined> => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error(await res.text());
    if (res.ok) return res.json();
    return undefined;
  }
};
