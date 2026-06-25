import { difficultyConfig } from '../config/difficultyConfig';

export interface CollectResult {
  points: number;
  streak: number;
}

export class ScoreManager {
  score = 0;
  multiplier = 1;
  private multiplierTimer = 0;
  private isHoneymoonRun: boolean;
  collectStreak = 0;
  private lastCollectAt = 0;

  constructor(isHoneymoonRun = false) {
    this.isHoneymoonRun = isHoneymoonRun;
  }

  get isHoneymoonMode() { return this.isHoneymoonRun; }

  get scoreLabel() {
    return this.isHoneymoonRun ? 'Sandcastles built' : 'Slides made';
  }

  update(delta: number, currentSpeed: number) {
    const speedFactor = currentSpeed / difficultyConfig.initialSpeed;
    this.score += (difficultyConfig.baseScorePerSecond * speedFactor * this.multiplier * delta) / 1000;

    if (this.multiplierTimer > 0) {
      this.multiplierTimer -= delta;
      if (this.multiplierTimer <= 0) {
        this.multiplier = 1;
        this.multiplierTimer = 0;
      }
    }
  }

  addCollectablePoints(nowMs: number): CollectResult {
    if (this.lastCollectAt > 0 && nowMs - this.lastCollectAt > difficultyConfig.collectStreakWindowMs) {
      this.collectStreak = 0;
    }
    this.collectStreak += 1;
    this.lastCollectAt = nowMs;

    const streakBonus = Math.min(
      1 + (this.collectStreak - 1) * difficultyConfig.collectStreakBonusPerStep,
      difficultyConfig.collectStreakBonusCap,
    );
    const points = Math.round(difficultyConfig.collectablePoints * this.multiplier * streakBonus);
    this.score += points;
    return { points, streak: this.collectStreak };
  }

  activateSynergyMultiplier() {
    this.multiplier = difficultyConfig.synergyMultiplier;
    this.multiplierTimer = difficultyConfig.synergyMultiplierDuration;
  }

  getDisplayScore(): number {
    return Math.floor(this.score);
  }

  reset() {
    this.score = 0;
    this.multiplier = 1;
    this.multiplierTimer = 0;
    this.collectStreak = 0;
    this.lastCollectAt = 0;
  }
}
