import { GAME_VERSION } from '../config/version';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ?? '';
const FETCH_TIMEOUT_MS = 10_000;

export interface PlayerStatRow {
  name: string;
  total_time_ms: number;
  games_played: number;
  best_score: number;
  longest_run_ms: number;
  synergy_completions: number;
  honeymoon_games: number;
  wilf_games: number;
  ruth_games: number;
  first_played_at: string | null;
  last_played_at: string | null;
  active_days: number;
}

type SortKey =
  | 'total_time_ms'
  | 'games_played'
  | 'best_score'
  | 'longest_run_ms'
  | 'synergy_completions'
  | 'active_days'
  | 'honeymoon_games'
  | 'name';

const SORT_LABELS: Record<SortKey, string> = {
  total_time_ms: 'Time on app',
  games_played: 'Games played',
  best_score: 'Best score',
  longest_run_ms: 'Longest run',
  synergy_completions: 'SYNERGY completes',
  active_days: 'Active days',
  honeymoon_games: 'Honeymoon runs',
  name: 'Name (A–Z)',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatCell(key: SortKey, row: PlayerStatRow): string {
  switch (key) {
    case 'total_time_ms':
    case 'longest_run_ms':
      return formatDuration(row[key]);
    case 'name':
      return row.name;
    default:
      return String(row[key as keyof PlayerStatRow] ?? 0);
  }
}

export async function fetchPlayerStats(): Promise<PlayerStatRow[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase credentials are not configured for this build.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/player_stats` +
      '?select=name,total_time_ms,games_played,best_score,longest_run_ms,' +
      'synergy_completions,honeymoon_games,wilf_games,ruth_games,' +
      'first_played_at,last_played_at,active_days' +
      '&order=total_time_ms.desc&limit=500';
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as PlayerStatRow[];
    if (!Array.isArray(rows)) throw new Error('Invalid response');
    return rows;
  } finally {
    clearTimeout(timeoutId);
  }
}

function summarize(rows: PlayerStatRow[]) {
  return {
    players: rows.length,
    games: rows.reduce((s, r) => s + r.games_played, 0),
    timeMs: rows.reduce((s, r) => s + r.total_time_ms, 0),
    synergy: rows.reduce((s, r) => s + r.synergy_completions, 0),
    wilf: rows.reduce((s, r) => s + r.wilf_games, 0),
    ruth: rows.reduce((s, r) => s + r.ruth_games, 0),
  };
}

function topN(rows: PlayerStatRow[], key: SortKey, n = 5, formatter?: (row: PlayerStatRow) => string) {
  const sorted = [...rows].sort((a, b) => {
    if (key === 'name') return a.name.localeCompare(b.name);
    return (b[key as keyof PlayerStatRow] as number) - (a[key as keyof PlayerStatRow] as number);
  });
  return sorted.slice(0, n).map((row) => ({
    name: row.name,
    value: formatter ? formatter(row) : formatCell(key, row),
  }));
}

function renderLeaderCard(title: string, items: { name: string; value: string }[]): string {
  const rows = items.length === 0
    ? '<p class="sub">No data yet</p>'
    : items.map((item, i) => `
        <div class="leader-row">
          <span class="leader-name">${i + 1}. ${escapeHtml(item.name)}</span>
          <span class="leader-val">${escapeHtml(item.value)}</span>
        </div>
      `).join('');
  return `
    <div class="card leader-card">
      <h2>${escapeHtml(title)}</h2>
      ${rows}
    </div>
  `;
}

function renderTable(rows: PlayerStatRow[], sortKey: SortKey): string {
  const sorted = [...rows].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    return (b[sortKey as keyof PlayerStatRow] as number) - (a[sortKey as keyof PlayerStatRow] as number);
  });

  const head = `
    <tr>
      <th class="rank">#</th>
      <th>Player</th>
      <th class="num">Time</th>
      <th class="num">Games</th>
      <th class="num">Best</th>
      <th class="num">Longest</th>
      <th class="num">SYNERGY</th>
      <th class="num">Days</th>
      <th class="num">Wilf</th>
      <th class="num">Ruth</th>
      <th class="num">Hmoon</th>
      <th>Last seen</th>
    </tr>
  `;

  const body = sorted.map((row, i) => `
    <tr>
      <td class="rank">${i + 1}</td>
      <td class="name">${escapeHtml(row.name)}</td>
      <td class="num">${formatDuration(row.total_time_ms)}</td>
      <td class="num">${row.games_played}</td>
      <td class="num">${row.best_score}</td>
      <td class="num">${formatDuration(row.longest_run_ms)}</td>
      <td class="num">${row.synergy_completions}</td>
      <td class="num">${row.active_days}</td>
      <td class="num">${row.wilf_games}</td>
      <td class="num">${row.ruth_games}</td>
      <td class="num">${row.honeymoon_games}</td>
      <td>${formatDate(row.last_played_at)}</td>
    </tr>
  `).join('');

  return `
    <div class="table-wrap">
      <table>
        <thead>${head}</thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function renderDashboard(rows: PlayerStatRow[], sortKey: SortKey): string {
  const summary = summarize(rows);

  const sortOptions = (Object.keys(SORT_LABELS) as SortKey[]).map((key) => `
    <option value="${key}"${key === sortKey ? ' selected' : ''}>${SORT_LABELS[key]}</option>
  `).join('');

  return `
    <section class="cards">
      <div class="card"><div class="card-label">Players</div><div class="card-value">${summary.players}</div></div>
      <div class="card"><div class="card-label">Total games</div><div class="card-value">${summary.games}</div></div>
      <div class="card"><div class="card-label">Total time</div><div class="card-value">${formatDuration(summary.timeMs)}</div></div>
      <div class="card"><div class="card-label">SYNERGY completes</div><div class="card-value">${summary.synergy}</div></div>
      <div class="card"><div class="card-label">Wilf runs</div><div class="card-value">${summary.wilf}</div></div>
      <div class="card"><div class="card-label">Ruth runs</div><div class="card-value">${summary.ruth}</div></div>
    </section>

    <section class="leaders">
      ${renderLeaderCard('Most time on app', topN(rows, 'total_time_ms'))}
      ${renderLeaderCard('Most games', topN(rows, 'games_played'))}
      ${renderLeaderCard('Best scores', topN(rows, 'best_score'))}
      ${renderLeaderCard('SYNERGY masters', topN(rows, 'synergy_completions'))}
    </section>

    <div class="toolbar">
      <label for="sort">Sort table by</label>
      <select id="sort">${sortOptions}</select>
      <button type="button" id="refresh">Refresh</button>
    </div>

    <section class="panel">
      ${rows.length === 0
        ? '<p class="status">No player stats yet — play a run on the game first.</p>'
        : renderTable(rows, sortKey)}
    </section>
  `;
}

let cachedRows: PlayerStatRow[] = [];
let currentSort: SortKey = 'total_time_ms';

function bindControls() {
  document.getElementById('sort')?.addEventListener('change', (e) => {
    currentSort = (e.target as HTMLSelectElement).value as SortKey;
    const app = document.getElementById('app');
    if (app) app.innerHTML = renderDashboard(cachedRows, currentSort);
    bindControls();
  });
  document.getElementById('refresh')?.addEventListener('click', () => {
    void load();
  });
}

function mount(rows: PlayerStatRow[]) {
  cachedRows = rows;
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = renderDashboard(rows, currentSort);
  bindControls();
}

async function load() {
  const app = document.getElementById('app');
  const footer = document.getElementById('footer');
  if (!app) return;

  app.innerHTML = '<p class="status">Loading stats…</p>';
  if (footer) footer.textContent = `${GAME_VERSION} · stats dashboard`;

  try {
    const rows = await fetchPlayerStats();
    mount(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const needsMigration = message.includes('404');
    app.innerHTML = `
      <p class="status error">Could not load stats: ${escapeHtml(message)}</p>
      <p class="status">${needsMigration
        ? 'The <code>player_stats</code> table is missing in Supabase. Open the SQL editor for your project, paste the contents of <code>supabase/player_stats.sql</code>, and run it once.'
        : 'Check your Supabase credentials and that <code>supabase/player_stats.sql</code> has been applied.'}</p>
    `;
  }
}

void load();
