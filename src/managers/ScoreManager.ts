import { difficultyConfig } from '../config/difficultyConfig';

export class ScoreManager {
  score = 0;
  multiplier = 1;
  private multiplierTimer = 0;
  private _isHoneymoonMode = false;

  get isHoneymoonMode() { return this._isHoneymoonMode; }

  get scoreLabel() {
    return this._isHoneymoonMode ? 'Holiday Time' : 'Slides made';
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

    if (!this._isHoneymoonMode && this.score >= difficultyConfig.honeymoonScoreThreshold) {
      this._isHoneymoonMode = true;
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
    this._isHoneymoonMode = false;
  }
}
