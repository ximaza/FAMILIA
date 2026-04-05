export type Role = 'admin' | 'member' | 'guest' | 'publicador';

export interface User {
  id: string;
  firstName: string;
  surnames: [string, string, string, string]; // 4 surnames
  birthDate: string;
  fatherName?: string;
  motherName?: string;
  email: string;
  password?: string; // In a real app, this is hashed. Here simplistic.
  personalInfo?: string; // New field for bio/personal info
  photoUrl?: string; // Base64 string for profile picture
  role: Role;
  status: 'active' | 'pending_approval' | 'rejected';
  registeredAt: string;
  rejectedAt?: string;
  resetRequested?: boolean;
}

export interface Notice {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  imageUrl?: string; // Base64 string for notice image
  type: 'general' | 'offer' | 'event';
  date: string;
  eventDate?: string;
}

export interface FamilyHistory {
  content: string;
  images?: string[]; // Array of Base64 strings for history gallery
  lastUpdated: string;
  sections?: HomeSection[];
  updatedBy: string;
}

export interface GeneanetConfig {
  url: string;
}


export interface HomeSection {
  id: string;
  // Legacy fields
  title?: string;
  content?: string;
  imageUrl?: string;

  // New block renderer fields
  tipo?: 'texto' | 'imagen';
  contenido?: string; // Text content
  src?: string; // Image URL
  caption?: string; // Image caption
  posicion?: 'izquierda' | 'derecha' | 'centro' | 'ancho_completo'; // Image alignment
  aspectRatio?: string; // To prevent layout shifts (e.g., '16/9')
}

export interface HomePageContent {

  welcomeMessage: string;
  mainTitle: string;
  bodyContent: string;
  imageUrl?: string;
  lastUpdated: string;
  sections?: HomeSection[];
}