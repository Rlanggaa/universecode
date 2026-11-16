import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot per skill directive
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Blueprint validation constants (synced verbatim with firebase-blueprint.json & firestore.rules)
export const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
  return cleaned.length > 0 ? cleaned : 'id-default';
}

export function truncateString(val: string, maxLen: number, minLen = 0): string {
  const trimmed = (val || '').slice(0, maxLen);
  if (trimmed.length < minLen) {
    return 'Untitled'.slice(0, maxLen);
  }
  return trimmed;
}

export async function signInWithGoogle(): Promise<User | null> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { User };

export async function syncUserProfileToFirestore(
  user: User,
  displayName: string,
  roleTitle: string,
  onboardingCompleted: boolean,
  isExisting: boolean
): Promise<void> {
  const uid = sanitizeId(user.uid);
  const path = `users/${uid}`;
  try {
    const payload: Record<string, unknown> = {
      uid,
      displayName: truncateString(displayName || user.displayName || 'Creator', 100, 1),
      roleTitle: truncateString(roleTitle || 'Worldbuilder & IP Architect', 120, 1),
      onboardingCompleted: Boolean(onboardingCompleted),
      updatedAt: serverTimestamp(),
    };
    if (!isExisting) {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(doc(db, 'users', uid), payload, { merge: isExisting });
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function syncWorkspaceToFirestore(
  user: User,
  workspaceId: string,
  name: string,
  description: string,
  visibility: 'private' | 'public' | 'shared',
  isExisting: boolean
): Promise<void> {
  const safeId = sanitizeId(workspaceId);
  const path = `workspaces/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      ownerId: sanitizeId(user.uid),
      name: truncateString(name, 120, 1),
      description: truncateString(description, 1000, 0),
      visibility: ['private', 'public', 'shared'].includes(visibility) ? visibility : 'private',
      updatedAt: serverTimestamp(),
    };
    if (!isExisting) {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(doc(db, 'workspaces', safeId), payload, { merge: isExisting });
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function syncWorldToFirestore(
  user: User,
  worldId: string,
  workspaceId: string,
  name: string,
  universe: string,
  genre: string,
  synopsis: string,
  visibility: 'private' | 'public' | 'password',
  isExisting: boolean
): Promise<void> {
  const safeWorldId = sanitizeId(worldId);
  const safeWorkspaceId = sanitizeId(workspaceId);
  const path = `worlds/${safeWorldId}`;
  try {
    const payload: Record<string, unknown> = {
      ownerId: sanitizeId(user.uid),
      workspaceId: safeWorkspaceId,
      name: truncateString(name, 120, 1),
      universe: truncateString(universe || 'Prime Universe', 120, 1),
      genre: truncateString(genre || 'Speculative Fiction', 120, 1),
      synopsis: truncateString(synopsis, 2000, 0),
      visibility: ['private', 'public', 'password'].includes(visibility) ? visibility : 'private',
      updatedAt: serverTimestamp(),
    };
    if (!isExisting) {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(doc(db, 'worlds', safeWorldId), payload, { merge: isExisting });
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function syncArticleToFirestore(
  user: User,
  articleId: string,
  worldId: string,
  title: string,
  templateType: string,
  category: string,
  summary: string,
  content: string,
  status: 'draft' | 'published' | 'archived',
  visibility: 'public' | 'private' | 'secret',
  isExisting: boolean
): Promise<void> {
  const safeArticleId = sanitizeId(articleId);
  const safeWorldId = sanitizeId(worldId);
  const path = `articles/${safeArticleId}`;
  try {
    const payload: Record<string, unknown> = {
      ownerId: sanitizeId(user.uid),
      worldId: safeWorldId,
      title: truncateString(title, 200, 1),
      templateType: truncateString(templateType || 'Generic Article', 64, 1),
      category: truncateString(category || 'Lore', 64, 1),
      summary: truncateString(summary, 1000, 0),
      content: truncateString(content, 100000, 0),
      status: ['draft', 'published', 'archived'].includes(status) ? status : 'draft',
      visibility: ['public', 'private', 'secret'].includes(visibility) ? visibility : 'private',
      updatedAt: serverTimestamp(),
    };
    if (!isExisting) {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(doc(db, 'articles', safeArticleId), payload, { merge: isExisting });
  } catch (error) {
    handleFirestoreError(error, isExisting ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteArticleFromFirestore(articleId: string): Promise<void> {
  const safeId = sanitizeId(articleId);
  const path = `articles/${safeId}`;
  try {
    await deleteDoc(doc(db, 'articles', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserArticles(
  uid: string,
  onData: (articles: Record<string, unknown>[]) => void
): Unsubscribe {
  const q = query(collection(db, 'articles'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'articles');
    }
  );
}
