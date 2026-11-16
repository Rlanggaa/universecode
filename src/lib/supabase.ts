/**
 * Supabase Cloud Synchronization Client (PostgREST & Auth compatible)
 * Automatically activates when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
 * in .env or Vercel / Cloudflare Pages Environment Variables.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
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

/**
 * Upserts the user's complete workspace state into the Supabase `user_workspaces` table.
 * Table schema in Supabase SQL Editor:
 *   create table if not exists public.user_workspaces (
 *     user_id text primary key,
 *     email text,
 *     workspace_data jsonb not null,
 *     updated_at timestamptz default now()
 *   );
 */
export async function saveWorkspaceBundleToSupabase(
  userId: string,
  email: string | null | undefined,
  bundle: CloudWorkspaceBundle
): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return false;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_workspaces?on_conflict=user_id`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
    return response.ok;
  } catch (err) {
    console.error('Supabase sync save error:', err);
    return false;
  }
}

/**
 * Loads the user's complete workspace state from the Supabase `user_workspaces` table.
 */
export async function loadWorkspaceBundleFromSupabase(
  userId: string
): Promise<CloudWorkspaceBundle | null> {
  if (!isSupabaseConfigured() || !userId) return null;

  try {
    const encodedId = encodeURIComponent(userId);
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_workspaces?user_id=eq.${encodedId}&select=workspace_data,updated_at&limit=1`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) return null;
    const rows = await response.json();
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.workspace_data) {
      return rows[0].workspace_data as CloudWorkspaceBundle;
    }
    return null;
  } catch (err) {
    console.error('Supabase sync load error:', err);
    return null;
  }
}
