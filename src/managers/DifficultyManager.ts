import { difficultyConfig } from '../config/difficultyConfig';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class DifficultyManager {
  currentSpeed: number;
  private elapsed = 0;

  constructor() {
    this.currentSpeed = difficultyConfig.initialSpeed;
  }

  update(delta: number) {
    this.elapsed += delta;
    this.currentSpeed = Math.min(
      difficultyConfig.maxSpeed,
      difficultyConfig.initialSpeed + (this.elapsed / 1000) * difficultyConfig.speedIncreaseRate
    );
  }

  getObstacleSpawnInterval(): number {
    return lerp(difficultyConfig.obstacleSpawnMax, difficultyConfig.obstacleSpawnMin, this.getProgressFraction());
  }

  getCollectableSpawnInterval(): number {
    return lerp(difficultyConfig.collectableSpawnMax, difficultyConfig.collectableSpawnMin, this.getProgressFraction());
  }

  getSynergySpawnInterval(): number {
    return lerp(difficultyConfig.synergyLetterSpawnMax, difficultyConfig.synergyLetterSpawnMin, this.getProgressFraction());
  }

  getPlatformSpawnInterval(): number {
    return lerp(difficultyConfig.platformSpawnMax, difficultyConfig.platformSpawnMin, this.getProgressFraction());
  }

  /** 0 at run start → 1 at max speed; drives hazard variety ramps. */
  get progressFraction(): number {
    return this.getProgressFraction();
  }

  private getProgressFraction(): number {
    return (this.currentSpeed - difficultyConfig.initialSpeed) /
      (difficultyConfig.maxSpeed - difficultyConfig.initialSpeed);
  }

  reset() {
    this.currentSpeed = difficultyConfig.initialSpeed;
    this.elapsed = 0;
  }
}
