import { User, Notice, FamilyHistory } from '../types';
import { getDb } from './firebase';
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
    const db = await getDb();
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

// Start initialization gracefully in background (React components will await actual requests)
initializeStorage();

export const storage = {
  getUsers: async (): Promise<User[]> => {
    try {
      console.log("Fetching users from Firestore...");
      const db = await getDb();
      const q = collection(db, USERS_COL);
      const snap = await getDocs(q);
      console.log(`Fetched ${snap.docs.length} users.`);
      return snap.docs.map(d => d.data() as User);
    } catch (err) {
      console.error("FIRESTORE ERROR GETTING USERS:", err);
      alert("Error de conexión con la base de datos (getUsers). Abre la consola (F12) para ver detalles.");
      return [];
    }
  },
  
  saveUser: async (user: User): Promise<void> => {
    try {
      console.log("Saving user to Firestore:", user.id);
      const db = await getDb();
      await setDoc(doc(db, USERS_COL, user.id), user);
      console.log("User saved successfully.");
    } catch (err) {
      console.error("FIRESTORE ERROR SAVING USER:", err);
      alert("Error guardando usuario. Abre la consola (F12) para ver detalles.");
    }
  },

  updateUser: async (updatedUser: User): Promise<void> => {
    const db = await getDb();
    await updateDoc(doc(db, USERS_COL, updatedUser.id), { ...updatedUser });
  },

  deleteUser: async (userId: string): Promise<void> => {
    const db = await getDb();
    await deleteDoc(doc(db, USERS_COL, userId));
  },

  getNotices: async (): Promise<Notice[]> => {
    const db = await getDb();
    const q = query(collection(db, NOTICES_COL), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Notice);
  },
  
  addNotice: async (notice: Notice): Promise<void> => {
    const db = await getDb();
    await setDoc(doc(db, NOTICES_COL, notice.id), notice);
  },

  getHistory: async (): Promise<FamilyHistory> => {
    const db = await getDb();
    const d = await getDoc(doc(db, SYSTEM_COL, 'history'));
    return d.exists() ? (d.data() as FamilyHistory) : seedHistory;
  },
  
  saveHistory: async (history: FamilyHistory): Promise<void> => {
    const db = await getDb();
    await setDoc(doc(db, SYSTEM_COL, 'history'), history);
  },

  getHomePage: async (): Promise<any> => {
    const db = await getDb();
    const d = await getDoc(doc(db, SYSTEM_COL, 'homepage'));
    return d.exists() ? d.data() : seedHomePage;
  },
  
  saveHomePage: async (content: any): Promise<void> => {
    const db = await getDb();
    await setDoc(doc(db, SYSTEM_COL, 'homepage'), content);
  },

  login: async (email: string, password: string): Promise<User | undefined> => {
    try {
      const users = await storage.getUsers();
      return users.find(u =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
      );
    } catch (err) {
       console.error("FIRESTORE ERROR ON LOGIN:", err);
       alert("Fallo crítico en Login. Revisa la consola.");
       return undefined;
    }
  }
};