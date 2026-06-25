import { SUPABASE_URL, SUPABASE_KEY, leaderboardEnabled } from '../config/supabase';
import { resolvePlayerName } from './PlayerProfileService';

const RPC_ENDPOINT = `${SUPABASE_URL}/rest/v1/rpc/record_player_activity`;
const FLUSH_INTERVAL_MS = 30_000;
const MAX_FLUSH_MS = 120_000;

export interface RunEndSummary {
  playerName?: string;
  score: number;
  runMs: number;
  synergyCompletions: number;
  isHoneymoon: boolean;
  character: 'wilf' | 'ruth';
}

let visibleSince = Date.now();
let pendingMs = 0;
let flushTimer: ReturnType<typeof setInterval> | undefined;
let initialized = false;

function authHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
}

interface ActivityPayload {
  p_name: string;
  p_time_delta_ms: number;
  p_games_delta: number;
  p_run_score: number;
  p_run_ms: number;
  p_synergy_delta: number;
  p_is_honeymoon: boolean;
  p_character: string | null;
}

async function postActivity(payload: ActivityPayload, keepalive = false): Promise<void> {
  if (!leaderboardEnabled) return;

  const trimmed = payload.p_name.trim().substring(0, 40);
  if (!trimmed) return;
  if (payload.p_time_delta_ms <= 0 && payload.p_games_delta <= 0) return;

  try {
    await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...payload, p_name: trimmed }),
      keepalive,
    });
  } catch (err) {
    console.warn('[player-stats] record failed', err);
  }
}

function accumulateVisibleTime() {
  if (typeof document !== 'undefined' && document.hidden) return;
  const now = Date.now();
  pendingMs += Math.max(0, now - visibleSince);
  visibleSince = now;
}

function takePendingTimeMs(): number {
  accumulateVisibleTime();
  const delta = Math.min(pendingMs, MAX_FLUSH_MS);
  pendingMs = 0;
  return delta;
}

function flushPendingTime(name?: string) {
  const delta = takePendingTimeMs();
  if (delta <= 0) return;
  void postActivity({
    p_name: resolvePlayerName(name),
    p_time_delta_ms: delta,
    p_games_delta: 0,
    p_run_score: 0,
    p_run_ms: 0,
    p_synergy_delta: 0,
    p_is_honeymoon: false,
    p_character: null,
  });
}

export function initPlayerStatsTracking() {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  visibleSince = Date.now();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushPendingTime();
    else visibleSince = Date.now();
  });

  window.addEventListener('pagehide', () => flushPendingTime());
  window.addEventListener('beforeunload', () => flushPendingTime());

  flushTimer = setInterval(() => flushPendingTime(), FLUSH_INTERVAL_MS);
}

export function recordRunEnd(summary: RunEndSummary) {
  const timeDelta = takePendingTimeMs();
  const name = resolvePlayerName(summary.playerName);

  void postActivity({
    p_name: name,
    p_time_delta_ms: timeDelta,
    p_games_delta: 1,
    p_run_score: Math.max(0, Math.floor(summary.score)),
    p_run_ms: Math.max(0, Math.floor(summary.runMs)),
    p_synergy_delta: Math.max(0, Math.floor(summary.synergyCompletions)),
    p_is_honeymoon: summary.isHoneymoon,
    p_character: summary.character,
  }, true);
}

export function shutdownPlayerStatsTracking() {
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = undefined;
  flushPendingTime();
  initialized = false;
}
