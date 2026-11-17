/**
 * Cross-Browser & Cross-Device Cloud Account Helpers (Cloud Vault + Supabase)
 */

export const CLOUD_ACCOUNT_SESSION_KEY = 'alt_universe_cloud_account_session_v1';
export const SHARED_WORLD_LINK_SESSION_KEY = 'alt_universe_shared_world_link_v1';

export interface SharedWorldLinkSession {
  vaultKey: string;
  passwordToken: string;
  accessMode: 'editor' | 'viewer';
  ownerName: string;
}

export interface CloudUserProfile {
  displayName: string;
  roleTitle: string;
  bio: string;
  avatarUrl: string;
}

export type TeamRolePermission = 'owner' | 'editor' | 'viewer';

export interface CloudTeamMember {
  email: string;
  displayName: string;
  role: TeamRolePermission;
  addedAtIso: string;
}

export interface CloudAccountSession {
  uid: string; // passwordToken (derived from email + password)
  emailLookupId?: string; // deterministic ID derived solely from email
  email: string;
  displayName: string;
  roleTitle?: string;
  bio?: string;
  avatarUrl?: string;
  authMethod: 'supabase-account' | 'google';
  // Optional: Join another owner's World Vault via Canva-style Share Link
  joinedWorldVaultId?: string;
  joinedWorldPin?: string;
  joinedWorldOwnerName?: string;
  joinedWorldAccessMode?: 'editor' | 'viewer';
}

export interface SupabaseConnectionConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConnectionConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { url: envUrl, anonKey: envKey };
}

export function isSupabaseConfigured(): boolean {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.anonKey);
}

/**
 * Generates a deterministic lookup ID from the user's email/username alone.
 * Ensures the same email always maps to the exact same Cloud Account document
 * across Chrome, Edge, Firefox, Safari, Laptop, and Mobile.
 */
export async function deriveEmailLookupId(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const rawInput = `alt-universe-email-lookup-v1:${normalizedEmail}`;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoded = new TextEncoder().encode(rawInput);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      const safePrefix = normalizedEmail.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 24);
      return `email-${safePrefix}-${hex.slice(0, 28)}`;
    } catch {
      // Fallback below
    }
  }

  let hash = 2166136261;
  for (let i = 0; i < rawInput.length; i++) {
    hash ^= rawInput.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const safePrefix = normalizedEmail.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 24);
  return `email-${safePrefix}-${(hash >>> 0).toString(16)}`;
}

/**
 * Generates a deterministic, URL-safe credential token from email + password/PIN.
 */
export async function deriveCloudAccountId(email: string, passwordOrPin: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const rawInput = `alt-universe-v1:${normalizedEmail}:${passwordOrPin.trim()}`;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoded = new TextEncoder().encode(rawInput);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      const safeUserPrefix = normalizedEmail.replace(/[^a-z0-9]/g, '-').slice(0, 24);
      return `acct-${safeUserPrefix}-${hex.slice(0, 24)}`;
    } catch {
      // Fallback hash below
    }
  }

  let hash = 2166136261;
  for (let i = 0; i < rawInput.length; i++) {
    hash ^= rawInput.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const safeUserPrefix = normalizedEmail.replace(/[^a-z0-9]/g, '-').slice(0, 24);
  return `acct-${safeUserPrefix}-${(hash >>> 0).toString(16)}`;
}

export interface CloudWorkspaceBundle {
  worlds: unknown[];
  activeWorldId: string;
  universes: unknown[];
  articles: unknown[];
  relationships: unknown[];
  maps: unknown[];
  timelineEvents: unknown[];
  manuscripts: unknown[];
  notes: unknown[];
  tasks: unknown[];
  digitalAssets: unknown[];
  recentlyOpened: unknown[];
  recentlyEdited: unknown[];
  timelineStudioRaw: string | null;
  relationshipStudioRaw: string | null;
  userProfile?: CloudUserProfile;
  teamMembers?: CloudTeamMember[];
  lastEditorSessionId?: string;
  lastEditorName?: string;
  lastEditorEmail?: string;
  updatedAtIso: string;
}

export function hasWorkspaceBundleContent(
  bundle: Partial<CloudWorkspaceBundle> | null | undefined
): boolean {
  if (!bundle) return false;
  if (Array.isArray(bundle.worlds) && bundle.worlds.length > 0) return true;
  if (Array.isArray(bundle.articles) && bundle.articles.length > 0) return true;
  if (Array.isArray(bundle.maps) && bundle.maps.length > 0) return true;
  if (Array.isArray(bundle.timelineEvents) && bundle.timelineEvents.length > 0) return true;
  if (Array.isArray(bundle.manuscripts) && bundle.manuscripts.length > 0) return true;
  if (Array.isArray(bundle.relationships) && bundle.relationships.length > 0) return true;
  if (Array.isArray(bundle.notes) && bundle.notes.length > 0) return true;
  if (Array.isArray(bundle.tasks) && bundle.tasks.length > 0) return true;
  if (Array.isArray(bundle.digitalAssets) && bundle.digitalAssets.length > 0) return true;
  if (
    bundle.userProfile &&
    Boolean(
      bundle.userProfile.avatarUrl ||
        bundle.userProfile.bio ||
        bundle.userProfile.roleTitle
    )
  ) {
    return true;
  }
  if (
    typeof bundle.timelineStudioRaw === 'string' &&
    bundle.timelineStudioRaw.trim().length > 4 &&
    bundle.timelineStudioRaw.trim() !== '[]'
  ) {
    return true;
  }
  if (
    typeof bundle.relationshipStudioRaw === 'string' &&
    bundle.relationshipStudioRaw.trim().length > 4 &&
    bundle.relationshipStudioRaw.trim() !== '{}'
  ) {
    return true;
  }
  return false;
}

export async function saveWorkspaceBundleToSupabase(
  userId: string,
  email: string | null | undefined,
  bundle: CloudWorkspaceBundle
): Promise<{ ok: boolean; error?: string }> {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey || !userId) {
    return { ok: false, error: 'URL atau Anon Key Supabase belum diisi.' };
  }

  try {
    const response = await fetch(
      `${cfg.url}/rest/v1/user_workspaces?on_conflict=user_id`,
      {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          user_id: userId,
          email: email || '',
          workspace_data: bundle,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return {
        ok: false,
        error: `Supabase HTTP ${response.status}: ${errText.slice(0, 160)}`
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gagal menghubungi server Supabase.'
    };
  }
}

export async function loadWorkspaceBundleFromSupabase(
  userId: string
): Promise<{ bundle: CloudWorkspaceBundle | null; error?: string }> {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey || !userId) {
    return { bundle: null, error: 'URL atau Anon Key Supabase belum diisi.' };
  }

  try {
    const encodedId = encodeURIComponent(userId);
    const response = await fetch(
      `${cfg.url}/rest/v1/user_workspaces?user_id=eq.${encodedId}&select=workspace_data,updated_at&limit=1`,
      {
        method: 'GET',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return {
        bundle: null,
        error: `Supabase HTTP ${response.status}: ${errText.slice(0, 160)}`
      };
    }

    const rows = await response.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.workspace_data) {
      return { bundle: rows[0].workspace_data as CloudWorkspaceBundle };
    }
    return { bundle: null };
  } catch (err) {
    return {
      bundle: null,
      error: err instanceof Error ? err.message : 'Gagal memuat data dari Supabase.'
    };
  }
}
