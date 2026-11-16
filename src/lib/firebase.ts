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
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CloudWorkspaceBundle } from './supabase';

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
  _isExisting?: boolean
): Promise<void> {
  const uid = sanitizeId(user.uid);
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
    if (exists) {
      await updateDoc(ref, {
        displayName: truncateString(displayName || user.displayName || 'Creator', 100, 1),
        roleTitle: truncateString(roleTitle || 'Worldbuilder & IP Architect', 120, 1),
        onboardingCompleted: Boolean(onboardingCompleted),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        uid,
        displayName: truncateString(displayName || user.displayName || 'Creator', 100, 1),
        roleTitle: truncateString(roleTitle || 'Worldbuilder & IP Architect', 120, 1),
        onboardingCompleted: Boolean(onboardingCompleted),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, exists ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function syncWorkspaceToFirestore(
  user: User,
  workspaceId: string,
  name: string,
  description: string,
  visibility: 'private' | 'public' | 'shared',
  _isExisting?: boolean
): Promise<void> {
  const safeId = sanitizeId(workspaceId);
  const path = `workspaces/${safeId}`;
  const ref = doc(db, 'workspaces', safeId);
  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
    const validVis = ['private', 'public', 'shared'].includes(visibility) ? visibility : 'private';
    if (exists) {
      await updateDoc(ref, {
        name: truncateString(name, 120, 1),
        description: truncateString(description, 1000, 0),
        visibility: validVis,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId: sanitizeId(user.uid),
        name: truncateString(name, 120, 1),
        description: truncateString(description, 1000, 0),
        visibility: validVis,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, exists ? OperationType.UPDATE : OperationType.CREATE, path);
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
  _isExisting?: boolean
): Promise<void> {
  const safeWorldId = sanitizeId(worldId);
  const safeWorkspaceId = sanitizeId(workspaceId);
  const path = `worlds/${safeWorldId}`;
  const ref = doc(db, 'worlds', safeWorldId);
  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
    const validVis = ['private', 'public', 'password'].includes(visibility) ? visibility : 'private';
    if (exists) {
      await updateDoc(ref, {
        name: truncateString(name, 120, 1),
        universe: truncateString(universe || 'Prime Universe', 120, 1),
        genre: truncateString(genre || 'Speculative Fiction', 120, 1),
        synopsis: truncateString(synopsis, 2000, 0),
        visibility: validVis,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId: sanitizeId(user.uid),
        workspaceId: safeWorkspaceId,
        name: truncateString(name, 120, 1),
        universe: truncateString(universe || 'Prime Universe', 120, 1),
        genre: truncateString(genre || 'Speculative Fiction', 120, 1),
        synopsis: truncateString(synopsis, 2000, 0),
        visibility: validVis,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, exists ? OperationType.UPDATE : OperationType.CREATE, path);
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
  _isExisting?: boolean
): Promise<void> {
  const safeArticleId = sanitizeId(articleId);
  const safeWorldId = sanitizeId(worldId);
  const path = `articles/${safeArticleId}`;
  const ref = doc(db, 'articles', safeArticleId);
  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
    const validStatus = ['draft', 'published', 'archived'].includes(status) ? status : 'draft';
    const validVis = ['public', 'private', 'secret'].includes(visibility) ? visibility : 'private';
    if (exists) {
      await updateDoc(ref, {
        title: truncateString(title, 200, 1),
        templateType: truncateString(templateType || 'Generic Article', 64, 1),
        category: truncateString(category || 'Lore', 64, 1),
        summary: truncateString(summary, 1000, 0),
        content: truncateString(content, 100000, 0),
        status: validStatus,
        visibility: validVis,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ownerId: sanitizeId(user.uid),
        worldId: safeWorldId,
        title: truncateString(title, 200, 1),
        templateType: truncateString(templateType || 'Generic Article', 64, 1),
        category: truncateString(category || 'Lore', 64, 1),
        summary: truncateString(summary, 1000, 0),
        content: truncateString(content, 100000, 0),
        status: validStatus,
        visibility: validVis,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, exists ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function saveWorkspaceBundleToFirestore(
  user: User,
  bundle: CloudWorkspaceBundle
): Promise<boolean> {
  const uid = sanitizeId(user.uid);
  const wsId = sanitizeId(`ws-${uid}`);
  const worldId = sanitizeId(`cloud-world-${uid}`);
  const bundleDocId = sanitizeId(`cloud-bundle-${uid}`);

  try {
    await syncWorkspaceToFirestore(
      user,
      wsId,
      'Cloud Synchronized Workspace',
      'Cross-device workspace snapshot',
      'private'
    );
    await syncWorldToFirestore(
      user,
      worldId,
      wsId,
      'Primary Cloud World',
      'Prime Universe',
      'Speculative Fiction',
      'Cloud sync container',
      'private'
    );

    const serialized = JSON.stringify(bundle);
    // Firestore rule allows up to 100,000 chars per article content
    if (serialized.length <= 99500) {
      await syncArticleToFirestore(
        user,
        bundleDocId,
        worldId,
        'Workspace Cloud Snapshot',
        'System Snapshot',
        'System',
        bundle.updatedAtIso || new Date().toISOString(),
        serialized,
        'published',
        'private'
      );
      return true;
    }
    return false;
  } catch (err) {
    console.error('Firestore cloud bundle save warning:', err);
    return false;
  }
}

export async function loadWorkspaceBundleFromFirestore(
  user: User
): Promise<CloudWorkspaceBundle | null> {
  const uid = sanitizeId(user.uid);
  const bundleDocId = sanitizeId(`cloud-bundle-${uid}`);
  try {
    const snap = await getDoc(doc(db, 'articles', bundleDocId));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data && typeof data.content === 'string' && data.content.startsWith('{')) {
      return JSON.parse(data.content) as CloudWorkspaceBundle;
    }
    return null;
  } catch (err) {
    console.error('Firestore cloud bundle load warning:', err);
    return null;
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

