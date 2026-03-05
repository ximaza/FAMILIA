import { User, Notice, FamilyHistory } from '../types';
import { db } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';

const USERS_COL = 'users';
const NOTICES_COL = 'notices';
const SYSTEM_COL = 'system';

// Initial Seed Data - Updated to Joaquín Mazarrasa Coll
const seedAdmin: User = {
  id: 'admin-1',
  firstName: 'Joaquín',
  surnames: ['Mazarrasa', 'Coll', '', ''],
  birthDate: '1960-01-01',
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

const seedHomePage: any = {
  welcomeMessage: "Bienvenido/a",
  mainTitle: "AL ENCUENTRO DE LOS MAZARRASA",
  bodyContent: "",
  lastUpdated: new Date().toISOString()
};

// Initial setup to seed empty database
export const initializeStorage = async () => {
  try {
    const adminDoc = await getDoc(doc(db, USERS_COL, seedAdmin.id));
    if (!adminDoc.exists()) {
      await setDoc(doc(db, USERS_COL, seedAdmin.id), seedAdmin);
    }
    const historyDoc = await getDoc(doc(db, SYSTEM_COL, 'history'));
    if (!historyDoc.exists()) {
      await setDoc(doc(db, SYSTEM_COL, 'history'), seedHistory);
    }
    const homeDoc = await getDoc(doc(db, SYSTEM_COL, 'homepage'));
    if (!homeDoc.exists()) {
      await setDoc(doc(db, SYSTEM_COL, 'homepage'), seedHomePage);
    }
  } catch (err) {
    console.error("Error seeding DB:", err);
  }
};

// Wait for initialization (should ideally be done once at startup)
initializeStorage();

export const storage = {
  getUsers: async (): Promise<User[]> => {
    const q = collection(db, USERS_COL);
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  },
  
  saveUser: async (user: User): Promise<void> => {
    await setDoc(doc(db, USERS_COL, user.id), user);
  },

  updateUser: async (updatedUser: User): Promise<void> => {
    await updateDoc(doc(db, USERS_COL, updatedUser.id), { ...updatedUser });
  },

  deleteUser: async (userId: string): Promise<void> => {
    await deleteDoc(doc(db, USERS_COL, userId));
  },

  getNotices: async (): Promise<Notice[]> => {
    const q = query(collection(db, NOTICES_COL), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Notice);
  },
  
  addNotice: async (notice: Notice): Promise<void> => {
    await setDoc(doc(db, NOTICES_COL, notice.id), notice);
  },

  getHistory: async (): Promise<FamilyHistory> => {
    const d = await getDoc(doc(db, SYSTEM_COL, 'history'));
    return d.exists() ? (d.data() as FamilyHistory) : seedHistory;
  },
  
  saveHistory: async (history: FamilyHistory): Promise<void> => {
    await setDoc(doc(db, SYSTEM_COL, 'history'), history);
  },

  getHomePage: async (): Promise<any> => {
    const d = await getDoc(doc(db, SYSTEM_COL, 'homepage'));
    return d.exists() ? d.data() : seedHomePage;
  },
  
  saveHomePage: async (content: any): Promise<void> => {
    await setDoc(doc(db, SYSTEM_COL, 'homepage'), content);
  },

  login: async (email: string, password: string): Promise<User | undefined> => {
    const users = await storage.getUsers();
    return users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password
    );
  }
};