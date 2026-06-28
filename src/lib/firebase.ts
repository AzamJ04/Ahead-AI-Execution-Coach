import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup as realSignInWithPopup, 
  GoogleAuthProvider as realGoogleAuthProvider, 
  onAuthStateChanged as realOnAuthStateChanged, 
  signOut as realSignOut
} from 'firebase/auth';
import { 
  getFirestore, 
  doc as realDoc, 
  setDoc as realSetDoc, 
  getDoc as realGetDoc, 
  onSnapshot as realOnSnapshot, 
  serverTimestamp as realServerTimestamp, 
  collection as realCollection, 
  query as realQuery, 
  where as realWhere, 
  limit as realLimit, 
  writeBatch as realWriteBatch,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Detect invalid/placeholder API key on startup
export let useMockMode = false;
if (
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === 'AIzaSyCKcNnbbyD3clBPcLAa5VQCZdhzXlJGHII' || 
  firebaseConfig.apiKey.includes('placeholder') || 
  firebaseConfig.apiKey.includes('YOUR_')
) {
  console.warn("Invalid/placeholder Firebase API Key detected. Initializing in Mock Firebase Mode.");
  useMockMode = true;
}

// Real Firebase initialization
let app: any;
let realDb: any;
let realAuth: any;

if (!useMockMode) {
  try {
    app = initializeApp(firebaseConfig);
    realDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    realAuth = getAuth(app);
  } catch (err) {
    console.error("Firebase initialization failed, falling back to mock mode:", err);
    useMockMode = true;
  }
}

// Mock auth object
export const mockAuth = {
  currentUser: null as any
};

// Export active auth and db as any to avoid TS union issues
export const auth: any = useMockMode ? mockAuth : realAuth;
export const db: any = useMockMode ? {} : realDb;

// Mock Auth implementation
export const GoogleAuthProvider: any = useMockMode 
  ? class MockGoogleAuthProvider { static PROVIDER_ID = 'google.com'; }
  : realGoogleAuthProvider;

const mockAuthListeners = new Set<(user: any) => void>();

export function triggerAuthStateChanged(user: any) {
  mockAuthListeners.forEach(listener => listener(user));
}

export function onAuthStateChanged(authObj: any, next: (user: any) => void, error?: any, completed?: any): any {
  if (useMockMode) {
    mockAuthListeners.add(next);
    // Trigger initial auth state asynchronously
    setTimeout(() => next(mockAuth.currentUser), 0);
    return () => {
      mockAuthListeners.delete(next);
    };
  }

  const realUnsubscribe = realOnAuthStateChanged(realAuth, (user) => {
    if (!useMockMode) next(user);
  }, error, completed);

  const mockCallback = (user: any) => {
    if (useMockMode) next(user);
  };
  mockAuthListeners.add(mockCallback);

  return () => {
    realUnsubscribe();
    mockAuthListeners.delete(mockCallback);
  };
}

export async function signInWithPopup(authObj: any, provider: any): Promise<any> {
  if (useMockMode) {
    const mockUser = {
      uid: 'mock-google-user',
      email: 'alex.worker@example.com',
      displayName: 'Alex Worker',
      emailVerified: true,
      isAnonymous: false,
      providerData: [{ providerId: 'google.com', email: 'alex.worker@example.com' }]
    } as any;
    mockAuth.currentUser = mockUser;
    triggerAuthStateChanged(mockUser);
    return { user: mockUser };
  }

  try {
    return await realSignInWithPopup(realAuth, provider);
  } catch (error: any) {
    if (error && (error.message?.includes('auth/api-key-not-valid') || error.message?.includes('API key not valid') || String(error).includes('400'))) {
      console.warn("Invalid API Key detected during sign in. Switching to Mock Mode.");
      useMockMode = true;
      const mockUser = {
        uid: 'mock-google-user',
        email: 'alex.worker@example.com',
        displayName: 'Alex Worker',
        emailVerified: true,
        isAnonymous: false,
        providerData: [{ providerId: 'google.com', email: 'alex.worker@example.com' }]
      } as any;
      mockAuth.currentUser = mockUser;
      triggerAuthStateChanged(mockUser);
      return { user: mockUser };
    }
    throw error;
  }
}

export async function signOut(authObj: any): Promise<any> {
  if (useMockMode) {
    mockAuth.currentUser = null;
    triggerAuthStateChanged(null);
    return;
  }
  await realSignOut(realAuth);
  mockAuth.currentUser = null;
  triggerAuthStateChanged(null);
}

// Mock Firestore Classes
export class MockDocRef {
  constructor(public db: any, public path: string, public id: string) {}
}

export class MockCollectionRef {
  constructor(public db: any, public name: string) {}
}

export class MockQuery {
  constructor(public collectionRef: MockCollectionRef, public constraints: any[]) {}
}

// Mock Firestore implementation
export function doc(parent: any, ...paths: string[]): any {
  if (useMockMode) {
    if (parent instanceof MockCollectionRef) {
      const randomId = Math.random().toString(36).substring(2, 11);
      return new MockDocRef(parent.db, `${parent.name}/${randomId}`, randomId);
    }
    const [collectionName, id] = paths;
    return new MockDocRef(parent, `${collectionName}/${id}`, id);
  }
  return realDoc(parent, ...paths);
}

export function collection(dbObj: any, name: string): any {
  if (useMockMode) {
    return new MockCollectionRef(dbObj, name);
  }
  return realCollection(realDb, name);
}

export function query(collectionRef: any, ...constraints: any[]): any {
  if (useMockMode) {
    return new MockQuery(collectionRef, constraints);
  }
  return realQuery(collectionRef, ...constraints);
}

export function where(field: string, operator: any, value: any): any {
  if (useMockMode) {
    return { type: 'where', field, operator, value };
  }
  return realWhere(field, operator, value);
}

export function limit(n: number): any {
  if (useMockMode) {
    return { type: 'limit', value: n };
  }
  return realLimit(n);
}

export function serverTimestamp(): any {
  if (useMockMode) {
    return new Date().toISOString();
  }
  return realServerTimestamp();
}

const docListeners = new Map<string, Set<(data: any) => void>>();
const collectionListeners = new Map<string, Set<() => void>>();

function triggerDocSnapshot(path: string, data: any) {
  const listeners = docListeners.get(path);
  if (listeners) {
    listeners.forEach(cb => cb(data));
  }
}

function triggerCollectionSnapshot(collectionName: string) {
  const listeners = collectionListeners.get(collectionName);
  if (listeners) {
    listeners.forEach(cb => cb());
  }
}

export async function getDoc(docRef: any): Promise<any> {
  if (useMockMode) {
    const dataStr = localStorage.getItem(`mock_firestore_${docRef.path}`);
    const data = dataStr ? JSON.parse(dataStr) : null;
    return {
      exists: () => data !== null,
      data: () => data,
      id: docRef.id
    };
  }
  return realGetDoc(docRef);
}

export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }): Promise<any> {
  if (useMockMode) {
    let finalData = data;
    if (options?.merge) {
      const existingStr = localStorage.getItem(`mock_firestore_${docRef.path}`);
      const existing = existingStr ? JSON.parse(existingStr) : {};
      finalData = { ...existing, ...data };
    }
    localStorage.setItem(`mock_firestore_${docRef.path}`, JSON.stringify(finalData));
    triggerDocSnapshot(docRef.path, finalData);
    const collectionName = docRef.path.split('/')[0];
    triggerCollectionSnapshot(collectionName);
    return;
  }
  return realSetDoc(docRef, data, options);
}

export function onSnapshot(target: any, onNext: (snap: any) => void, onError?: (err: any) => void): any {
  if (useMockMode) {
    if (target instanceof MockDocRef) {
      const path = target.path;
      if (!docListeners.has(path)) {
        docListeners.set(path, new Set());
      }
      const callback = (data: any) => {
        onNext({
          exists: () => data !== null,
          data: () => data,
          id: target.id
        });
      };
      docListeners.get(path)!.add(callback);
      
      const initialDataStr = localStorage.getItem(`mock_firestore_${path}`);
      const initialData = initialDataStr ? JSON.parse(initialDataStr) : null;
      setTimeout(() => callback(initialData), 0);

      return () => {
        docListeners.get(path)?.delete(callback);
        if (docListeners.get(path)?.size === 0) {
          docListeners.delete(path);
        }
      };
    }
    
    if (target instanceof MockQuery || target instanceof MockCollectionRef) {
      const collectionName = target instanceof MockQuery ? target.collectionRef.name : target.name;
      if (!collectionListeners.has(collectionName)) {
        collectionListeners.set(collectionName, new Set());
      }
      
      const callback = () => {
        const docs: any[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`mock_firestore_${collectionName}/`)) {
            const dataStr = localStorage.getItem(key);
            if (dataStr) {
              const data = JSON.parse(dataStr);
              const docId = key.substring(`mock_firestore_${collectionName}/`.length);
              docs.push({
                id: docId,
                data: () => data
              });
            }
          }
        }
        
        let filteredDocs = docs;
        if (target instanceof MockQuery) {
          for (const constraint of target.constraints) {
            if (constraint.type === 'where') {
              const { field, operator, value } = constraint;
              filteredDocs = filteredDocs.filter(d => {
                const docData = d.data();
                if (operator === '==') {
                  return docData[field] === value;
                }
                return true;
              });
            }
          }
          for (const constraint of target.constraints) {
            if (constraint.type === 'limit') {
              filteredDocs = filteredDocs.slice(0, constraint.value);
            }
          }
        }
        
        onNext({
          empty: filteredDocs.length === 0,
          docs: filteredDocs
        });
      };
      
      collectionListeners.get(collectionName)!.add(callback);
      setTimeout(callback, 0);
      
      return () => {
        collectionListeners.get(collectionName)?.delete(callback);
        if (collectionListeners.get(collectionName)?.size === 0) {
          collectionListeners.delete(collectionName);
        }
      };
    }
  }
  
  return realOnSnapshot(target, onNext, onError);
}

export function writeBatch(dbObj: any): any {
  if (useMockMode) {
    const operations: { docRef: MockDocRef; data?: any; type: 'set' | 'delete'; options?: any }[] = [];
    return {
      set: (docRef: MockDocRef, data: any, options?: any) => {
        operations.push({ docRef, data, type: 'set', options });
      },
      delete: (docRef: MockDocRef) => {
        operations.push({ docRef, type: 'delete' });
      },
      commit: async () => {
        for (const op of operations) {
          if (op.type === 'set') {
            await setDoc(op.docRef, op.data, op.options);
          } else if (op.type === 'delete') {
            localStorage.removeItem(`mock_firestore_${op.docRef.path}`);
            triggerDocSnapshot(op.docRef.path, null);
            const collectionName = op.docRef.path.split('/')[0];
            triggerCollectionSnapshot(collectionName);
          }
        }
      }
    };
  }
  return realWriteBatch(realDb);
}

// Error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test
async function testConnection() {
  if (useMockMode) return;
  try {
    await getDocFromServer(realDoc(realDb, 'test', 'connection'));
  } catch (error: any) {
    if (error && (error.message?.includes('API key not valid') || error.message?.includes('auth/api-key-not-valid') || String(error).includes('400'))) {
      console.warn("Invalid Firebase API Key detected during startup connection test. Activating Mock Firebase Mode.");
      useMockMode = true;
      triggerAuthStateChanged(null);
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

testConnection();
