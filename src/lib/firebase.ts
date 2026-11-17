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

const resolvedFirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim() || firebaseConfig.apiKey,
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim() || firebaseConfig.authDomain,
  projectId:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim() || firebaseConfig.projectId,
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim() ||
    firebaseConfig.storageBucket,
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim() ||
    firebaseConfig.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim() || firebaseConfig.appId
};

const resolvedDatabaseId =
  (import.meta.env.VITE_FIREBASE_DATABASE_ID || '').trim() ||
  ((import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim() &&
  (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim() !== firebaseConfig.projectId
    ? '(default)'
    : firebaseConfig.firestoreDatabaseId);

export const ACTIVE_FIREBASE_PROJECT_ID = resolvedFirebaseConfig.projectId;
export const ACTIVE_FIREBASE_AUTH_DOMAIN = resolvedFirebaseConfig.authDomain;

const app = initializeApp(resolvedFirebaseConfig);
export const db =
  resolvedDatabaseId && resolvedDatabaseId !== '(default)'
    ? getFirestore(app, resolvedDatabaseId)
    : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

const CHUNK_SIZE_CHARS = 700000;
const MAX_CHUNKS = 25;

export function normalizeVaultPasswordToken(rawToken: string): string {
  const cleaned = sanitizeId(rawToken || 'vault-token-default');
  return cleaned.length >= 8 ? cleaned : cleaned.padEnd(8, '0');
}

function buildCompactSingleChunkJson(bundle: CloudWorkspaceBundle, maxChars: number): string {
  const compactArticles = Array.isArray(bundle.articles)
    ? bundle.articles.map((art) => {
        if (!art || typeof art !== 'object') return art;
        const a = art as Record<string, unknown>;
        const tv =
          a.templateValues && typeof a.templateValues === 'object'
            ? { ...(a.templateValues as Record<string, unknown>) }
            : {};
        if (typeof tv.ThumbnailUrl === 'string' && tv.ThumbnailUrl.length > 120000) {
          tv.ThumbnailUrl = '';
        }
        return {
          ...a,
          secretNotes:
            typeof a.secretNotes === 'string' && a.secretNotes.length > 120000
              ? ''
              : a.secretNotes,
          templateValues: tv
        };
      })
    : [];

  const compactWorlds = Array.isArray(bundle.worlds)
    ? bundle.worlds.map((w) => {
        if (!w || typeof w !== 'object') return w;
        const worldObj = w as Record<string, unknown>;
        return {
          ...worldObj,
          customCss:
            typeof worldObj.customCss === 'string' && worldObj.customCss.length > 120000
              ? ''
              : worldObj.customCss
        };
      })
    : [];

  const compactBundle: CloudWorkspaceBundle = {
    ...bundle,
    worlds: compactWorlds,
    articles: compactArticles,
    recentlyOpened: [],
    recentlyEdited: []
  };

  const compactStr = JSON.stringify(compactBundle);
  if (compactStr.length <= maxChars) {
    return compactStr;
  }
  return compactStr.slice(0, maxChars);
}

export async function saveCloudAccountVaultToFirestore(
  emailLookupId: string,
  passwordToken: string,
  displayName: string,
  bundle: CloudWorkspaceBundle
): Promise<{ ok: boolean; error?: string; canonicalPasswordToken?: string }> {
  const safeAccountId = sanitizeId(emailLookupId);
  const safePasswordToken = normalizeVaultPasswordToken(passwordToken);
  const safeDisplayName = truncateString(displayName || 'Creator', 100, 1);

  try {
    const serialized = JSON.stringify(bundle);
    const chunks: string[] = [];
    for (let i = 0; i < serialized.length; i += CHUNK_SIZE_CHARS) {
      chunks.push(serialized.slice(i, i + CHUNK_SIZE_CHARS));
    }
    if (chunks.length === 0) {
      chunks.push('{}');
    }
    let chunkCount = Math.min(chunks.length, MAX_CHUNKS);
    let chunk0 = chunks[0];

    const accountRef = doc(db, 'cloud_accounts', safeAccountId);
    let existingSnap;
    try {
      existingSnap = await getDocFromServer(accountRef);
    } catch {
      existingSnap = await getDoc(accountRef);
    }

    // Always adopt the vault's existing passwordToken if the document already exists in Firestore.
    let effectivePasswordToken = safePasswordToken;
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (
        typeof existingData.passwordToken === 'string' &&
        existingData.passwordToken.length >= 8
      ) {
        effectivePasswordToken = existingData.passwordToken;
      }
    } else {
      await setDoc(accountRef, {
        accountId: safeAccountId,
        passwordToken: effectivePasswordToken,
        displayName: safeDisplayName,
        chunkCount: 1,
        payloadChunk0: chunk0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Write overflow chunks (1..chunkCount-1) in PARALLEL via Promise.all
    if (chunkCount > 1) {
      try {
        const chunkPromises: Promise<void>[] = [];
        for (let idx = 1; idx < chunkCount; idx++) {
          const chunkPayload = chunks[idx];
          chunkPromises.push(
            (async () => {
              const chunkDocId = sanitizeId(`${safeAccountId}-c${idx}`);
              const chunkRef = doc(db, 'cloud_backups', chunkDocId);
              let existingChunk;
              try {
                existingChunk = await getDocFromServer(chunkRef);
              } catch {
                existingChunk = await getDoc(chunkRef);
              }
              if (existingChunk.exists()) {
                if (existingChunk.data()?.passwordToken === effectivePasswordToken) {
                  await updateDoc(chunkRef, {
                    payloadChunk: chunkPayload,
                    updatedAt: serverTimestamp()
                  });
                } else {
                  await updateDoc(chunkRef, {
                    passwordToken: effectivePasswordToken,
                    payloadChunk: chunkPayload,
                    updatedAt: serverTimestamp()
                  });
                }
              } else {
                await setDoc(chunkRef, {
                  accountId: safeAccountId,
                  passwordToken: effectivePasswordToken,
                  chunkIndex: idx,
                  payloadChunk: chunkPayload,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              }
            })()
          );
        }
        await Promise.all(chunkPromises);
      } catch (chunkErr) {
        console.warn('Overflow chunk write fallback to single-chunk vault:', chunkErr);
        chunk0 = buildCompactSingleChunkJson(bundle, CHUNK_SIZE_CHARS);
        chunkCount = 1;
      }
    }

    // Update main cloud_accounts document last so real-time onSnapshot listeners immediately receive the update
    if (existingSnap.exists() || chunkCount >= 1) {
      await updateDoc(accountRef, {
        displayName: safeDisplayName,
        chunkCount,
        payloadChunk0: chunk0,
        updatedAt: serverTimestamp()
      });
    }

    return { ok: true, canonicalPasswordToken: effectivePasswordToken };
  } catch (err) {
    console.error('CloudAccountVault save error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gagal menyimpan data ke Cloud Vault.'
    };
  }
}

export async function loadCloudAccountVaultFromFirestore(
  emailLookupId: string,
  passwordToken?: string,
  bypassPasswordForGoogleAuth = false
): Promise<{
  status: 'ok' | 'wrong_password' | 'not_found' | 'error';
  bundle: CloudWorkspaceBundle | null;
  displayName?: string;
  passwordToken?: string;
  error?: string;
}> {
  const safeAccountId = sanitizeId(emailLookupId);
  const safePasswordToken = passwordToken ? normalizeVaultPasswordToken(passwordToken) : '';

  try {
    const accountRef = doc(db, 'cloud_accounts', safeAccountId);
    let snap;
    try {
      snap = await getDocFromServer(accountRef);
    } catch {
      snap = await getDoc(accountRef);
    }

    if (!snap.exists()) {
      return { status: 'not_found', bundle: null };
    }

    const data = snap.data();
    if (
      !bypassPasswordForGoogleAuth &&
      safePasswordToken &&
      data.passwordToken &&
      data.passwordToken !== safePasswordToken
    ) {
      return {
        status: 'wrong_password',
        bundle: null,
        passwordToken: typeof data.passwordToken === 'string' ? data.passwordToken : undefined,
        error:
          'Akun dengan Email/Username ini sudah terdaftar di Cloud, tetapi Password/PIN yang Anda masukkan salah.'
      };
    }

    const chunkCount = typeof data.chunkCount === 'number' ? data.chunkCount : 1;
    let fullJson = typeof data.payloadChunk0 === 'string' ? data.payloadChunk0 : '';

    if (chunkCount > 1) {
      const indices = Array.from({ length: chunkCount - 1 }, (_, i) => i + 1);
      const extraChunks = await Promise.all(
        indices.map(async (idx) => {
          const chunkDocId = sanitizeId(`${safeAccountId}-c${idx}`);
          const chunkRef = doc(db, 'cloud_backups', chunkDocId);
          try {
            const chunkSnap = await getDocFromServer(chunkRef);
            if (chunkSnap.exists()) {
              const cData = chunkSnap.data();
              return typeof cData.payloadChunk === 'string' ? cData.payloadChunk : '';
            }
          } catch {
            try {
              const fallbackSnap = await getDoc(chunkRef);
              if (fallbackSnap.exists()) {
                const cData = fallbackSnap.data();
                return typeof cData.payloadChunk === 'string' ? cData.payloadChunk : '';
              }
            } catch {
              // ignore
            }
          }
          return '';
        })
      );
      fullJson += extraChunks.join('');
    }

    if (fullJson && fullJson.startsWith('{')) {
      const parsed = JSON.parse(fullJson) as CloudWorkspaceBundle;
      return {
        status: 'ok',
        bundle: parsed,
        displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
        passwordToken: typeof data.passwordToken === 'string' ? data.passwordToken : undefined
      };
    }

    return {
      status: 'ok',
      bundle: null,
      displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
      passwordToken: typeof data.passwordToken === 'string' ? data.passwordToken : undefined
    };
  } catch (err) {
    console.error('CloudAccountVault load error:', err);
    return {
      status: 'error',
      bundle: null,
      error: err instanceof Error ? err.message : 'Gagal memuat data dari Cloud Vault.'
    };
  }
}

/**
 * Real-time Firestore listener for collaborative multi-device / multi-user editing.
 * Triggers immediately whenever any connected device or team member saves changes to the Cloud Vault.
 */
export function subscribeCloudAccountVault(
  emailLookupId: string,
  _passwordToken: string,
  onRemoteBundle: (bundle: CloudWorkspaceBundle, displayName?: string) => void
): Unsubscribe {
  const safeAccountId = sanitizeId(emailLookupId);
  const accountRef = doc(db, 'cloud_accounts', safeAccountId);

  return onSnapshot(
    accountRef,
    async (snap) => {
      if (!snap.exists()) return;
      // Ignore local pending writes so we only react to committed server updates from collaborators
      if (snap.metadata.hasPendingWrites) return;

      const data = snap.data();
      const chunkCount = typeof data.chunkCount === 'number' ? data.chunkCount : 1;
      let fullJson = typeof data.payloadChunk0 === 'string' ? data.payloadChunk0 : '';

      if (chunkCount > 1) {
        const indices = Array.from({ length: chunkCount - 1 }, (_, i) => i + 1);
        const extraChunks = await Promise.all(
          indices.map(async (idx) => {
            const chunkDocId = sanitizeId(`${safeAccountId}-c${idx}`);
            const chunkRef = doc(db, 'cloud_backups', chunkDocId);
            try {
              const chunkSnap = await getDocFromServer(chunkRef);
              if (chunkSnap.exists()) {
                const cData = chunkSnap.data();
                return typeof cData.payloadChunk === 'string' ? cData.payloadChunk : '';
              }
            } catch {
              try {
                const fallbackSnap = await getDoc(chunkRef);
                if (fallbackSnap.exists()) {
                  const cData = fallbackSnap.data();
                  return typeof cData.payloadChunk === 'string' ? cData.payloadChunk : '';
                }
              } catch {
                // ignore
              }
            }
            return '';
          })
        );
        fullJson += extraChunks.join('');
      }

      if (fullJson && fullJson.startsWith('{')) {
        try {
          const parsed = JSON.parse(fullJson) as CloudWorkspaceBundle;
          onRemoteBundle(
            parsed,
            typeof data.displayName === 'string' ? data.displayName : undefined
          );
        } catch {
          // ignore malformed JSON
        }
      }
    },
    (err) => {
      console.warn('Real-time Cloud Vault listener warning:', err);
    }
  );
}



