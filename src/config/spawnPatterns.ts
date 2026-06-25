export type ObstacleTier = 0 | 1 | 2;
export type CollectTier = 0 | 1 | 2;

export interface PatternSlot {
  /** Distance into the pattern (px at current scroll speed). */
  at: number;
  kind: 'obstacle' | 'collect';
  obstacleTier?: ObstacleTier;
  collectTier?: CollectTier;
}

export interface SpawnPattern {
  id: string;
  /** Minimum run progress (0–1) before this pattern can be chosen. */
  minProgress: number;
  /** Distance until the next breather after the last slot fires. */
  length: number;
  slots: PatternSlot[];
}

/**
 * Hand-authored hazard beats. Slots fire by run distance so spacing scales with speed.
 */
export const SPAWN_PATTERNS: SpawnPattern[] = [
  {
    id: 'opening',
    minProgress: 0,
    length: 200,
    slots: [
      { at: 0, kind: 'collect', collectTier: 0 },
      { at: 120, kind: 'obstacle', obstacleTier: 0 },
    ],
  },
  {
    id: 'single',
    minProgress: 0,
    length: 100,
    slots: [{ at: 0, kind: 'obstacle', obstacleTier: 0 }],
  },
  {
    id: 'slide_reward',
    minProgress: 0.05,
    length: 300,
    slots: [
      { at: 0, kind: 'obstacle', obstacleTier: 0 },
      { at: 200, kind: 'collect', collectTier: 1 },
    ],
  },
  {
    id: 'ground_gift',
    minProgress: 0,
    length: 260,
    slots: [
      { at: 0, kind: 'collect', collectTier: 0 },
      { at: 180, kind: 'obstacle', obstacleTier: 0 },
    ],
  },
  {
    id: 'double_jump',
    minProgress: 0.15,
    length: 300,
    slots: [
      { at: 0, kind: 'obstacle', obstacleTier: 0 },
      { at: 200, kind: 'obstacle', obstacleTier: 0 },
    ],
  },
  {
    id: 'breather_collect',
    minProgress: 0.12,
    length: 280,
    slots: [{ at: 80, kind: 'collect', collectTier: 0 }],
  },
  {
    id: 'stay_low',
    minProgress: 0.25,
    length: 300,
    slots: [
      { at: 0, kind: 'obstacle', obstacleTier: 2 },
      { at: 190, kind: 'collect', collectTier: 0 },
    ],
  },
  {
    id: 'risky_arc',
    minProgress: 0.35,
    length: 380,
    slots: [
      { at: 0, kind: 'obstacle', obstacleTier: 0 },
      { at: 140, kind: 'obstacle', obstacleTier: 1 },
      { at: 280, kind: 'collect', collectTier: 2 },
    ],
  },
  {
    id: 'triple_pressure',
    minProgress: 0.5,
    length: 400,
    slots: [
      { at: 0, kind: 'obstacle', obstacleTier: 0 },
      { at: 150, kind: 'obstacle', obstacleTier: 0 },
      { at: 280, kind: 'obstacle', obstacleTier: 1 },
    ],
  },
];

const OPENING_PATTERN = SPAWN_PATTERNS.find((p) => p.id === 'opening')!;

/** Multi-obstacle / high-tier beats held back until earlyGameScoreThreshold. */
const EARLY_GAME_BLOCKED_PATTERN_IDS = [
  'double_jump',
  'triple_pressure',
  'risky_arc',
  'stay_low',
] as const;

export function getOpeningPattern(): SpawnPattern {
  return OPENING_PATTERN;
}

function patternHasObstacle(p: SpawnPattern): boolean {
  return p.slots.some((s) => s.kind === 'obstacle');
}

function patternStartsWithObstacle(p: SpawnPattern): boolean {
  return p.slots[0]?.kind === 'obstacle';
}

function getPatternById(id: string): SpawnPattern | undefined {
  return SPAWN_PATTERNS.find((p) => p.id === id);
}

export function pickSpawnPattern(
  progress: number,
  excludeId?: string,
  score = Number.POSITIVE_INFINITY,
  earlyScoreThreshold = 500,
): SpawnPattern {
  let pool = SPAWN_PATTERNS.filter((p) => progress >= p.minProgress && p.id !== 'opening');
  if (score < earlyScoreThreshold) {
    pool = pool.filter((p) =>
      !(EARLY_GAME_BLOCKED_PATTERN_IDS as readonly string[]).includes(p.id),
    );
    if (excludeId) {
      const lastPattern = getPatternById(excludeId);
      if (lastPattern && patternHasObstacle(lastPattern)) {
        pool = pool.filter((p) => !patternStartsWithObstacle(p));
      }
    }
  }
  if (progress < 0.3) {
    pool = pool.filter((p) => p.id !== 'triple_pressure' && p.id !== 'risky_arc');
  }
  if (progress < 0.2) {
    pool = pool.filter((p) => p.id !== 'stay_low');
  }
  if (excludeId && pool.length > 1) {
    pool = pool.filter((p) => p.id !== excludeId);
  }
  if (pool.length === 0) {
    const fallback =
      getPatternById('ground_gift') ??
      getPatternById('breather_collect') ??
      getPatternById('single');
    if (fallback) return fallback;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
