export const difficultyConfig = {
  initialSpeed: 220,
  maxSpeed: 550,
  speedIncreaseRate: 2,

  obstacleSpawnMin: 1400,
  obstacleSpawnMax: 2800,
  obstacleFirstSpawnDelay: 500,
  /** Ms before the first hazard beat (keep short — travel time adds more). */
  patternFirstSpawnDelayMs: 200,
  /** Extra ms before the opening collect + obstacle (first two assets). */
  patternOpeningDelayMs: 1000,
  /** Display score below this skips multi-obstacle / high-tier patterns. */
  earlyGameScoreThreshold: 500,
  /** Breather gap (px) while score is still in the early band. */
  patternBreatherEarlyMin: 320,
  patternBreatherEarlyMax: 480,
  /** Distance gap between patterns; early run uses the lower end via progress scaling. */
  patternBreatherMin: 140,
  patternBreatherMax: 260,
  patternBreatherLateMin: 320,
  patternBreatherLateMax: 520,
  /** How far past the right edge pattern spawns appear (smaller = snappier). */
  patternSpawnLeadMin: 60,
  patternSpawnLeadMax: 140,
  /** Ms without a collect before combo streak resets. */
  collectStreakWindowMs: 2800,
  /** Bonus per consecutive collect (e.g. 0.12 → +12% per streak step). */
  collectStreakBonusPerStep: 0.12,
  collectStreakBonusCap: 2.5,
  collectableSpawnMin: 900,
  collectableSpawnMax: 1750,
  synergyLetterSpawnMin: 2000,
  synergyLetterSpawnMax: 4500,
  /** First SYNERGY letter appears sooner; later letters use the normal interval. */
  synergyFirstSpawnMs: 1200,
  platformSpawnMin: 1500,
  platformSpawnMax: 3000,

  honeymoonUnlockThreshold: 10000,

  synergyMultiplier: 5,
  synergyMultiplierDuration: 10000,

  collectablePoints: 100,
  baseScorePerSecond: 5,
};
