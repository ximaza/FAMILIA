import { User, Notice, FamilyHistory } from '../types';

const USERS_KEY = 'maz_users';
const NOTICES_KEY = 'maz_notices';
const HISTORY_KEY = 'maz_history';
const CURRENT_USER_KEY = 'maz_current_user_id';

// Initial Seed Data - Updated to Joaquín Mazarrasa Coll
const seedAdmin: User = {
  id: 'admin-1',
  firstName: 'Joaquín',
  surnames: ['Mazarrasa', 'Coll', '', ''], // Assuming 3rd and 4th are empty or not provided
  birthDate: '1960-01-01', // Placeholder date
  parentsNames: 'Fundadores de la rama',
  email: 'joaquin@maz.com',
  password: 'admin123', 
  role: 'admin',
  status: 'active',
  registeredAt: new Date().toISOString()
};

const seedHistory: FamilyHistory = {
  content: "La familia MAZ tiene sus orígenes en el siglo XIX...",
  lastUpdated: new Date().toISOString(),
  updatedBy: 'Joaquín'
};

const initializeStorage = () => {
  // Handle Users
  let users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  
  // Force update or add the seed admin (Joaquín) to replace the old default admin
  const adminIndex = users.findIndex(u => u.id === seedAdmin.id);
  if (adminIndex !== -1) {
    users[adminIndex] = seedAdmin; // Overwrite existing admin
  } else {
    users.push(seedAdmin); // Add if not exists
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Handle History
  if (!localStorage.getItem(HISTORY_KEY)) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(seedHistory));
  }

  // Handle Notices
  if (!localStorage.getItem(NOTICES_KEY)) {
    localStorage.setItem(NOTICES_KEY, JSON.stringify([]));
  }
};

initializeStorage();

export const storage = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  
  saveUser: (user: User) => {
    const users = storage.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  updateUser: (updatedUser: User) => {
    const users = storage.getUsers().map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: (userId: string) => {
    const users = storage.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getNotices: (): Notice[] => JSON.parse(localStorage.getItem(NOTICES_KEY) || '[]'),
  
  addNotice: (notice: Notice) => {
    const notices = storage.getNotices();
    notices.unshift(notice); // Newest first
    localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
  },

  getHistory: (): FamilyHistory => JSON.parse(localStorage.getItem(HISTORY_KEY) || JSON.stringify(seedHistory)),
  
  saveHistory: (history: FamilyHistory) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  login: (email: string, password: string): User | undefined => {
    const users = storage.getUsers();
    return users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password
    );
  }
};