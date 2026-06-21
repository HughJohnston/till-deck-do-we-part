import { difficultyConfig } from '../config/difficultyConfig';

export class ScoreManager {
  score = 0;
  multiplier = 1;
  private multiplierTimer = 0;
  private isHoneymoonRun: boolean;

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

  addCollectablePoints(): number {
    const points = difficultyConfig.collectablePoints * this.multiplier;
    this.score += points;
    return points;
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
  }
}
