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
} from '../utils/constants';
import { difficultyConfig } from '../config/difficultyConfig';
import { DifficultyManager } from './DifficultyManager';

export class SpawnManager {
  private scene: Phaser.Scene;
  private difficultyManager: DifficultyManager;
  private isHoneymoonMode = false;

  obstacles!: Phaser.Physics.Arcade.Group;
  collectables!: Phaser.Physics.Arcade.Group;
  synergyGroup!: Phaser.Physics.Arcade.Group;
  platforms!: Phaser.Physics.Arcade.Group;

  nextSynergyKey?: () => string | undefined;

  private obstacleTimer = 0;
  private collectableTimer = 0;
  private synergyTimer = 0;
  private platformTimer = 0;

  constructor(scene: Phaser.Scene, difficultyManager: DifficultyManager) {
    this.scene = scene;
    this.difficultyManager = difficultyManager;

    this.obstacles = scene.physics.add.group({ allowGravity: false });
    this.collectables = scene.physics.add.group({ allowGravity: false });
    this.synergyGroup = scene.physics.add.group({ allowGravity: false });
    this.platforms = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.primeObstacleTimer();
  }

  private primeObstacleTimer() {
    this.obstacleTimer = difficultyConfig.obstacleSpawnMax - difficultyConfig.obstacleFirstSpawnDelay;
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

    this.obstacleTimer += delta;
    this.collectableTimer += delta;
    this.synergyTimer += delta;
    this.platformTimer += delta;

    if (this.obstacleTimer >= this.difficultyManager.getObstacleSpawnInterval()) {
      this.spawnObstacle(speed);
      this.obstacleTimer = 0;
    }
    if (this.collectableTimer >= this.difficultyManager.getCollectableSpawnInterval()) {
      this.spawnCollectable(speed);
      this.collectableTimer = 0;
    }
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

  private spawnObstacle(speed: number) {
    const pool = this.obstaclePool;
    const def = Phaser.Utils.Array.GetRandom(pool);
    const x = this.w + def.width;
    const y = this.groundY - def.height / 2;
    if (this.wouldOverlap(x, y, def.width, def.height)) return;

    const obj = this.obstacles.create(x, y, def.key) as Phaser.Physics.Arcade.Sprite;
    obj.setScale(0.6);
    obj.setVelocityX(-speed);
    (obj.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    (obj as any).assetKey = def.key;
  }

  private spawnCollectableY(defHeight: number): number {
    const tier = Phaser.Math.Between(0, 2);
    if (tier === 0) return this.groundY - defHeight / 2;
    if (tier === 1) {
      return this.groundY - Phaser.Math.Between(COLLECTABLE_Y_JUMP_MIN, COLLECTABLE_Y_JUMP_MAX);
    }
    return this.groundY - Phaser.Math.Between(COLLECTABLE_Y_DOUBLE_JUMP_MIN, COLLECTABLE_Y_DOUBLE_JUMP_MAX);
  }

  private spawnCollectable(speed: number) {
    const pool = this.collectablePool;
    const def = Phaser.Utils.Array.GetRandom(pool);
    const x = this.w + def.width;
    const y = this.spawnCollectableY(def.height);
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
    const def = (nextKey && synergyLetters.find((l) => l.key === nextKey)) || synergyLetters[0];
    const x = this.w + def.width;
    const y = Phaser.Math.Between(this.groundY - 140, this.groundY - 40);
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
    this.primeObstacleTimer();
    this.collectableTimer = 0;
    this.synergyTimer = 0;
    this.platformTimer = 0;
    this.isHoneymoonMode = false;
  }
}
