/**
 * Supabase Cloud Synchronization & Cross-Device Account Client
 * Supports VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY from environment variables
 * OR runtime configuration saved in the app's Cloud Sync settings modal.
 */

export const CLOUD_ACCOUNT_SESSION_KEY = 'alt_universe_cloud_account_session_v1';

export interface CloudAccountSession {
  uid: string;
  email: string;
  displayName: string;
  authMethod: 'supabase-account' | 'google';
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
 * Generates a deterministic, URL-safe account ID from email + password/PIN
 * so logging in with the same credentials on any device resolves to the exact same row in Supabase.
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
  updatedAtIso: string;
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
