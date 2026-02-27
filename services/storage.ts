import { User, Notice, FamilyHistory, HomePageContent } from '../types';
import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const NOTICES_COLLECTION = 'notices';
const HISTORY_COLLECTION = 'history';
const HOMEPAGE_COLLECTION = 'homePage';

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

const seedHomePage: HomePageContent = {
  welcomeMessage: "Bienvenido/a",
  mainTitle: "AL ENCUENTRO DE LOS MAZARRASA",
  bodyContent: "",
  lastUpdated: new Date().toISOString()
};

const initializeStorage = async () => {
  // Check if admin exists
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where("role", "==", "admin"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // Check if we need to migrate from local storage or just seed
    const localUsers = localStorage.getItem('maz_users');
    if (localUsers) {
       // Migration could happen here, but for now let's just ensure the seed admin exists
       // if we are starting fresh with Firebase
    }

    // Create seed admin
    await setDoc(doc(db, USERS_COLLECTION, seedAdmin.id), seedAdmin);
    console.log("Seed admin created in Firestore");
  }

  // Initialize History if not exists
  const historyRef = doc(db, HISTORY_COLLECTION, 'main');
  const historySnap = await getDoc(historyRef);
  if (!historySnap.exists()) {
    await setDoc(historyRef, seedHistory);
  }

  // Initialize Home Page if not exists
  const homePageRef = doc(db, HOMEPAGE_COLLECTION, 'main');
  const homePageSnap = await getDoc(homePageRef);
  if (!homePageSnap.exists()) {
    await setDoc(homePageRef, seedHomePage);
  }
};

// Start initialization
initializeStorage().catch(console.error);

export const storage = {
  getUsers: async (): Promise<User[]> => {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return querySnapshot.docs.map(doc => doc.data() as User);
  },
  
  saveUser: async (user: User): Promise<void> => {
    await setDoc(doc(db, USERS_COLLECTION, user.id), user);
  },

  updateUser: async (updatedUser: User): Promise<void> => {
    await updateDoc(doc(db, USERS_COLLECTION, updatedUser.id), { ...updatedUser });
  },

  deleteUser: async (userId: string): Promise<void> => {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  },

  getUserById: async (userId: string): Promise<User | undefined> => {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return undefined;
  },

  getNotices: async (): Promise<Notice[]> => {
    const q = query(collection(db, NOTICES_COLLECTION), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Notice);
  },
  
  addNotice: async (notice: Notice): Promise<void> => {
    await setDoc(doc(db, NOTICES_COLLECTION, notice.id), notice);
  },

  getHistory: async (): Promise<FamilyHistory> => {
    const docRef = doc(db, HISTORY_COLLECTION, 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as FamilyHistory;
    }
    return seedHistory;
  },
  
  saveHistory: async (history: FamilyHistory): Promise<void> => {
    await setDoc(doc(db, HISTORY_COLLECTION, 'main'), history);
  },

  getHomePage: async (): Promise<HomePageContent> => {
    const docRef = doc(db, HOMEPAGE_COLLECTION, 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as HomePageContent;
    }
    return seedHomePage;
  },
  
  saveHomePage: async (content: HomePageContent): Promise<void> => {
    await setDoc(doc(db, HOMEPAGE_COLLECTION, 'main'), content);
  },

  login: async (email: string, password: string): Promise<User | undefined> => {
    // In a real app, do not query by password. Use Firebase Auth or similar.
    // For this migration, we query by email and then check password.
    const q = query(collection(db, USERS_COLLECTION), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Assuming email is unique, but let's find the match
        const user = querySnapshot.docs.find(d => {
            const u = d.data() as User;
            return u.password === password;
        });
        return user ? (user.data() as User) : undefined;
    }
    return undefined;
  }
};
