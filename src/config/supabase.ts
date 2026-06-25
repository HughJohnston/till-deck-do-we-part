// Supabase connection details for the global leaderboard.
//
// These are read from Vite env vars (see .env / .env.example) and are baked into
// the client bundle at build time. That is expected and safe: the publishable
// key only grants the access allowed by the Row Level Security policies on the
// `scores` and `player_stats` tables.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ?? '';

// When credentials are missing (e.g. a local build without .env) the game still
// runs; leaderboard calls simply no-op so nothing crashes.
export const leaderboardEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);
