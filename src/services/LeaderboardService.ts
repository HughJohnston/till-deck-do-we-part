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
const FETCH_TIMEOUT_MS = 8000;

export interface FetchTopScoresResult {
  entries: LeaderboardEntry[];
  failed: boolean;
}

// Soft reset: rows before this instant (UTC) stay in Supabase but are not shown.
// Default = 26 Jun 2026 00:00 UK (BST) = 25 Jun 23:00 UTC
const LEADERBOARD_RESET_AFTER =
  import.meta.env.VITE_LEADERBOARD_RESET_AFTER ?? '2026-06-25T23:00:00Z';

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
    const res = await fetch(REST_ENDPOINT, {
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
    if (!res.ok) {
      console.warn('[leaderboard] submitScore HTTP', res.status);
    }
  } catch (err) {
    console.warn('[leaderboard] submitScore failed', err);
  }
}

export async function fetchTopScores(limit = 100): Promise<FetchTopScoresResult> {
  if (!leaderboardEnabled) return { entries: [], failed: false };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const cutoff = encodeURIComponent(LEADERBOARD_RESET_AFTER);
    const url =
      `${REST_ENDPOINT}?select=name,score,character` +
      `&created_at=gte.${cutoff}` +
      `&order=score.desc,created_at.asc&limit=${limit}`;
    const res = await fetch(url, { headers: authHeaders(), signal: controller.signal });
    if (!res.ok) {
      console.warn('[leaderboard] fetchTopScores HTTP', res.status);
      return { entries: [], failed: true };
    }
    const rows = (await res.json()) as LeaderboardEntry[];
    if (!Array.isArray(rows)) return { entries: [], failed: true };
    return { entries: dedupeDisplayRows(rows), failed: false };
  } catch (err) {
    console.warn('[leaderboard] fetchTopScores failed', err);
    return { entries: [], failed: true };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchPlayerRank(playerName: string): Promise<number | null> {
  const name = playerName.trim();
  if (!name || !leaderboardEnabled) return null;

  const { entries } = await fetchTopScores();
  const key = name.toLowerCase();
  const index = entries.findIndex((entry) => (entry.name ?? '').trim().toLowerCase() === key);
  return index >= 0 ? index + 1 : null;
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
