import { SUPABASE_URL, SUPABASE_KEY, leaderboardEnabled } from '../config/supabase';

// Single point of contact for the leaderboard backend. The game scenes only
// ever talk to this module, so the transport (Supabase REST today) can change
// without touching any UI code. If the game later moves to a host with its own
// API, only the URLs/headers below need to change.

export interface LeaderboardEntry {
  name: string;
  score: number;
  character?: string | null;
}

const REST_ENDPOINT = `${SUPABASE_URL}/rest/v1/scores`;

function authHeaders(): Record<string, string> {
  // The new-style publishable key is passed as both the apikey header and the
  // bearer token; this matches what supabase-js does and works under RLS.
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
}

// Fire-and-forget: a failed submit should never block or crash the UI.
export async function submitScore(entry: LeaderboardEntry): Promise<void> {
  if (!leaderboardEnabled) return;

  const name = entry.name?.trim();
  if (!name || !Number.isFinite(entry.score)) return;

  try {
    await fetch(REST_ENDPOINT, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        name: name.substring(0, 40),
        score: Math.max(0, Math.floor(entry.score)),
        character: entry.character ?? null,
      }),
    });
  } catch (err) {
    console.warn('[leaderboard] submitScore failed', err);
  }
}

export async function fetchTopScores(limit = 100): Promise<LeaderboardEntry[]> {
  if (!leaderboardEnabled) return [];

  try {
    const url = `${REST_ENDPOINT}?select=name,score,character&order=score.desc,created_at.asc&limit=${limit}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      console.warn('[leaderboard] fetchTopScores HTTP', res.status);
      return [];
    }
    const rows = (await res.json()) as LeaderboardEntry[];
    if (!Array.isArray(rows)) return [];
    return dedupeDisplayRows(rows);
  } catch (err) {
    console.warn('[leaderboard] fetchTopScores failed', err);
    return [];
  }
}

function dedupeDisplayRows(rows: LeaderboardEntry[]): LeaderboardEntry[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${(row.name ?? '').trim().toLowerCase()}|${Math.floor(row.score)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
