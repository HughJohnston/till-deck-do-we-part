import Phaser from 'phaser';
import {
  workGoodImages, workBadImages,
  playGoodImages, playBadImages,
  synergyLetters,
} from '../config/assetManifest';
import {
  getGroundY,
  COLLECTABLE_Y_JUMP_MIN,
  COLLECTABLE_Y_JUMP_MAX,
  COLLECTABLE_Y_DOUBLE_JUMP_MIN,
  COLLECTABLE_Y_DOUBLE_JUMP_MAX,
  OBSTACLE_Y_MID_MIN,
  OBSTACLE_Y_MID_MAX,
  OBSTACLE_Y_HIGH_MIN,
  OBSTACLE_Y_HIGH_MAX,
} from '../utils/constants';
import { difficultyConfig } from '../config/difficultyConfig';
import { DifficultyManager } from './DifficultyManager';
import {
  type CollectTier,
  type ObstacleTier,
  type PatternSlot,
  type SpawnPattern,
  getOpeningPattern,
  pickSpawnPattern,
} from '../config/spawnPatterns';

export class SpawnManager {
  private scene: Phaser.Scene;
  private difficultyManager: DifficultyManager;
  private isHoneymoonMode = false;

  obstacles!: Phaser.Physics.Arcade.Group;
  collectables!: Phaser.Physics.Arcade.Group;
  synergyGroup!: Phaser.Physics.Arcade.Group;
  platforms!: Phaser.Physics.Arcade.Group;

  nextSynergyKey?: () => string | undefined;
  getScore?: () => number;

  private patternState: 'initial-wait' | 'breather' | 'active' = 'initial-wait';
  private phaseDistance = 0;
  private phaseLength = 0;
  private currentPattern: SpawnPattern | null = null;
  private nextSlotIndex = 0;
  private lastPatternId?: string;
  private isFirstPattern = true;
  private initialWaitMs = difficultyConfig.patternFirstSpawnDelayMs;
  private synergyTimer = 0;
  private platformTimer = 0;

  constructor(scene: Phaser.Scene, difficultyManager: DifficultyManager) {
    this.scene = scene;
    this.difficultyManager = difficultyManager;

    this.obstacles = scene.physics.add.group({ allowGravity: false });
    this.collectables = scene.physics.add.group({ allowGravity: false });
    this.synergyGroup = scene.physics.add.group({ allowGravity: false });
    this.platforms = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.primePatternState();
  }

  private primePatternState() {
    this.patternState = 'initial-wait';
    this.phaseDistance = 0;
    this.phaseLength = 0;
    this.currentPattern = null;
    this.nextSlotIndex = 0;
    this.lastPatternId = undefined;
    this.isFirstPattern = true;
    this.initialWaitMs =
      difficultyConfig.patternFirstSpawnDelayMs + difficultyConfig.patternOpeningDelayMs;
    this.synergyTimer = difficultyConfig.synergyFirstSpawnMs;
  }

  private patternSpawnX(): number {
    return this.w + Phaser.Math.Between(
      difficultyConfig.patternSpawnLeadMin,
      difficultyConfig.patternSpawnLeadMax,
    );
  }

  private beginPattern() {
    if (this.isFirstPattern) {
      this.isFirstPattern = false;
      this.currentPattern = getOpeningPattern();
      this.lastPatternId = this.currentPattern.id;
      this.phaseDistance = 0;
      this.nextSlotIndex = 0;
      this.patternState = 'active';
      this.phaseLength = this.currentPattern.length;
      return;
    }

    this.currentPattern = pickSpawnPattern(
      this.difficultyManager.progressFraction,
      this.lastPatternId,
      this.getScore?.() ?? 0,
      difficultyConfig.earlyGameScoreThreshold,
    );
    this.lastPatternId = this.currentPattern.id;
    this.phaseDistance = 0;
    this.nextSlotIndex = 0;
    this.patternState = 'active';
    this.phaseLength = this.currentPattern.length;
  }

  private beginBreather() {
    this.currentPattern = null;
    this.phaseDistance = 0;
    this.patternState = 'breather';
    const progress = this.difficultyManager.progressFraction;
    const score = this.getScore?.() ?? 0;
    const earlyBlend = Phaser.Math.Clamp(
      score / difficultyConfig.earlyGameScoreThreshold,
      0,
      1,
    );
    const normalMin = Phaser.Math.Linear(
      difficultyConfig.patternBreatherMin,
      difficultyConfig.patternBreatherLateMin,
      progress,
    );
    const normalMax = Phaser.Math.Linear(
      difficultyConfig.patternBreatherMax,
      difficultyConfig.patternBreatherLateMax,
      progress,
    );
    const min = Phaser.Math.Linear(difficultyConfig.patternBreatherEarlyMin, normalMin, earlyBlend);
    const max = Phaser.Math.Linear(difficultyConfig.patternBreatherEarlyMax, normalMax, earlyBlend);
    this.phaseLength = Phaser.Math.Between(min, max);
  }

  private firePatternSlot(slot: PatternSlot, speed: number) {
    if (slot.kind === 'obstacle') {
      this.trySpawnOneObstacle(speed, 0, slot.obstacleTier ?? 0);
      return;
    }
    this.spawnCollectable(speed, slot.collectTier ?? 0);
  }

  private updatePatternSpawns(speed: number, delta: number) {
    if (this.patternState === 'initial-wait') {
      this.initialWaitMs -= delta;
      if (this.initialWaitMs <= 0) this.beginPattern();
      return;
    }

    this.phaseDistance += (speed * delta) / 1000;

    if (this.patternState === 'active' && this.currentPattern) {
      const slots = this.currentPattern.slots;
      while (this.nextSlotIndex < slots.length && this.phaseDistance >= slots[this.nextSlotIndex].at) {
        this.firePatternSlot(slots[this.nextSlotIndex], speed);
        this.nextSlotIndex += 1;
      }
      if (this.phaseDistance >= this.phaseLength) this.beginBreather();
      return;
    }

    if (this.patternState === 'breather' && this.phaseDistance >= this.phaseLength) {
      this.beginPattern();
    }
  }

  setHoneymoonMode(enabled: boolean) {
    this.isHoneymoonMode = enabled;
  }

  // Normal mode:    obstacles = bad Play,   collectables = good Work
  // Honeymoon mode: obstacles = bad Work,   collectables = good Play
  private get obstaclePool() {
    return this.isHoneymoonMode ? workBadImages : playBadImages;
  }

  private get collectablePool() {
    return this.isHoneymoonMode ? playGoodImages : workGoodImages;
  }

  update(delta: number) {
    const speed = this.difficultyManager.currentSpeed;

    this.updatePatternSpawns(speed, delta);
    this.synergyTimer += delta;
    this.platformTimer += delta;

    if (this.synergyTimer >= this.difficultyManager.getSynergySpawnInterval()) {
      this.spawnSynergyLetter(speed);
      this.synergyTimer = 0;
    }
    if (this.platformTimer >= this.difficultyManager.getPlatformSpawnInterval()) {
      this.spawnPlatform(speed);
      this.platformTimer = 0;
    }

    this.cleanOffscreen(this.obstacles);
    this.cleanOffscreen(this.collectables);
    this.cleanOffscreen(this.synergyGroup);
    this.cleanOffscreen(this.platforms);
  }

  private get w() { return this.scene.scale.width; }
  private get h() { return this.scene.scale.height; }
  private get groundY() { return getGroundY(this.h); }

  private wouldOverlap(x: number, y: number, w: number, h: number): boolean {
    const pad = 8;
    const check = (group: Phaser.Physics.Arcade.Group) => {
      for (const child of group.getChildren()) {
        const obj = child as Phaser.Physics.Arcade.Sprite;
        const ow = obj.displayWidth || 96;
        const oh = obj.displayHeight || 96;
        if (Math.abs(obj.x - x) < (w + ow) / 2 + pad &&
            Math.abs(obj.y - y) < (h + oh) / 2 + pad) {
          return true;
        }
      }
      return false;
    };
    return check(this.obstacles) || check(this.collectables) || check(this.synergyGroup);
  }

  private spawnObstacleY(displayHeight: number, tier: ObstacleTier): number {
    if (tier === 0) return this.groundY - displayHeight / 2;
    if (tier === 1) {
      return this.groundY - Phaser.Math.Between(OBSTACLE_Y_MID_MIN, OBSTACLE_Y_MID_MAX);
    }
    return this.groundY - Phaser.Math.Between(OBSTACLE_Y_HIGH_MIN, OBSTACLE_Y_HIGH_MAX);
  }

  private trySpawnOneObstacle(speed: number, xOffset = 0, tier: ObstacleTier = 0, xOverride?: number) {
    const pool = this.obstaclePool;
    const def = Phaser.Utils.Array.GetRandom(pool);
    const scale = 0.6;
    const displayW = def.width * scale;
    const displayH = def.height * scale;
    const x = xOverride ?? this.patternSpawnX() + xOffset + Phaser.Math.Between(-15, 35);
    const y = this.spawnObstacleY(displayH, tier);
    if (this.wouldOverlap(x, y, displayW, displayH)) return;

    const obj = this.obstacles.create(x, y, def.key) as Phaser.Physics.Arcade.Sprite;
    obj.setScale(scale);
    obj.setVelocityX(-speed);
    (obj.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    (obj as any).assetKey = def.key;
  }

  private spawnCollectableY(defHeight: number, tier: CollectTier): number {
    if (tier === 0) return this.groundY - defHeight / 2;
    if (tier === 1) {
      return this.groundY - Phaser.Math.Between(COLLECTABLE_Y_JUMP_MIN, COLLECTABLE_Y_JUMP_MAX);
    }
    return this.groundY - Phaser.Math.Between(COLLECTABLE_Y_DOUBLE_JUMP_MIN, COLLECTABLE_Y_DOUBLE_JUMP_MAX);
  }

  private spawnCollectable(speed: number, tier: CollectTier = 0, xOverride?: number) {
    const pool = this.collectablePool;
    const def = Phaser.Utils.Array.GetRandom(pool);
    const x = xOverride ?? this.patternSpawnX();
    const y = this.spawnCollectableY(def.height, tier);
    if (this.wouldOverlap(x, y, def.width, def.height)) return;

    const obj = this.collectables.create(x, y, def.key) as Phaser.Physics.Arcade.Sprite;
    obj.setScale(0.6);
    obj.setVelocityX(-speed);
    (obj.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    (obj as any).assetKey = def.key;
  }

  private spawnSynergyLetter(speed: number) {
    if (this.synergyGroup.getLength() > 0) return;
    const nextKey = this.nextSynergyKey?.();
    if (!nextKey) return;
    const def = synergyLetters.find((l) => l.key === nextKey);
    if (!def) return;

    const x = this.w + def.width;
    const y = this.groundY - Phaser.Math.Between(
      COLLECTABLE_Y_DOUBLE_JUMP_MIN,
      COLLECTABLE_Y_DOUBLE_JUMP_MAX,
    );
    if (this.wouldOverlap(x, y, def.width, def.height)) return;

    const obj = this.synergyGroup.create(x, y, def.key) as Phaser.Physics.Arcade.Sprite;
    obj.setVelocityX(-speed);
    (obj.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    obj.setTint(0xFFD700);
    (obj as any).assetKey = def.key;
  }

  private spawnPlatform(speed: number) {
    const platformWidth = Phaser.Math.Between(80, 150);
    const platformHeight = 16;
    const x = this.w + platformWidth;
    const y = Phaser.Math.Between(this.groundY - 110, this.groundY - 60);

    const platform = this.scene.add.rectangle(x, y, platformWidth, platformHeight, 0x8B7355);
    platform.setStrokeStyle(1, 0x6B5335);
    this.platforms.add(platform);

    const body = platform.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setImmovable(true);
    body.setVelocityX(-speed);
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }

  private destroyIfOffscreen = (child: Phaser.GameObjects.GameObject) => {
    const obj = child as Phaser.Physics.Arcade.Sprite;
    if (obj.x < -150) obj.destroy();
  };

  private cleanOffscreen(group: Phaser.Physics.Arcade.Group) {
    group.getChildren().forEach(this.destroyIfOffscreen);
  }

  reset() {
    this.obstacles.clear(true, true);
    this.collectables.clear(true, true);
    this.synergyGroup.clear(true, true);
    this.platforms.clear(true, true);
    this.primePatternState();
    this.synergyTimer = 0;
    this.platformTimer = 0;
    this.isHoneymoonMode = false;
  }
}
