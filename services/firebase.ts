import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let initializationPromise: Promise<Firestore> | null = null;

export const initializeFirebase = async (): Promise<Firestore> => {
  if (db) return db;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      // Fetch config from server instead of build-time env vars
      const response = await fetch('/api/config/firebase');
      const config = await response.json();

      if (!config.apiKey) {
        console.error("FIREBASE ERROR: API Key is missing from server configuration.");
        throw new Error("Missing Firebase config");
      }

      app = initializeApp(config);
      db = getFirestore(app);
      console.log("Firebase initialized successfully from runtime config.");
      return db;
    } catch (error) {
      console.error("FIREBASE INITIALIZATION ERROR:", error);
      throw error;
    }
  })();

  return initializationPromise;
};

// We still export a function to get DB since it might not be ready immediately
export const getDb = async (): Promise<Firestore> => {
  if (db) return db;
  return initializeFirebase();
};
