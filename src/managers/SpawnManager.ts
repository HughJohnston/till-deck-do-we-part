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

type ScrollObject = Phaser.GameObjects.GameObject & {
  worldX?: number;
  x: number;
  body?: Phaser.Physics.Arcade.Body;
};

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

  private get obstaclePool() {
    return this.isHoneymoonMode ? workBadImages : playBadImages;
  }

  private get collectablePool() {
    return this.isHoneymoonMode ? playGoodImages : workGoodImages;
  }

  update(delta: number, scroll: number) {
    this.obstacleTimer += delta;
    this.collectableTimer += delta;
    this.synergyTimer += delta;
    this.platformTimer += delta;

    if (this.obstacleTimer >= this.difficultyManager.getObstacleSpawnInterval()) {
      this.spawnObstacle(scroll);
      this.obstacleTimer = 0;
    }
    if (this.collectableTimer >= this.difficultyManager.getCollectableSpawnInterval()) {
      this.spawnCollectable(scroll);
      this.collectableTimer = 0;
    }
    if (this.synergyTimer >= this.difficultyManager.getSynergySpawnInterval()) {
      this.spawnSynergyLetter(scroll);
      this.synergyTimer = 0;
    }
    if (this.platformTimer >= this.difficultyManager.getPlatformSpawnInterval()) {
      this.spawnPlatform(scroll);
      this.platformTimer = 0;
    }

    this.cleanOffscreen(this.obstacles, scroll);
    this.cleanOffscreen(this.collectables, scroll);
    this.cleanOffscreen(this.synergyGroup, scroll);
    this.cleanOffscreen(this.platforms, scroll);
  }

  syncToScroll(scroll: number) {
    this.obstacles.getChildren().forEach((child) => this.syncObject(child, scroll));
    this.collectables.getChildren().forEach((child) => this.syncObject(child, scroll));
    this.synergyGroup.getChildren().forEach((child) => this.syncObject(child, scroll));
    this.platforms.getChildren().forEach((child) => this.syncObject(child, scroll));
  }

  private syncObject(child: Phaser.GameObjects.GameObject, scroll: number) {
    const obj = child as ScrollObject;
    if (obj.worldX == null) return;
    obj.x = obj.worldX - scroll;
    if (obj.body) {
      obj.body.setVelocityX(0);
      obj.body.updateFromGameObject();
    }
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

  private spawnObstacle(scroll: number) {
    const pool = this.obstaclePool;
    const def = Phaser.Utils.Array.GetRandom(pool);
    const worldX = scroll + this.w + def.width;
    const x = worldX - scroll;
    const y = this.groundY - def.height / 2;
    if (this.wouldOverlap(x, y, def.width, def.height)) return;

    const obj = this.obstacles.create(x, y, def.key) as Phaser.Physics.Arcade.Sprite & ScrollObject;
    obj.setScale(0.6);
    (obj.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    obj.worldX = worldX;
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

  private spawnCollectable(scroll: number) {
    const pool = this.collectablePool;
    const def = Phaser.Utils.Array.GetRandom(pool);
    const worldX = scroll + this.w + def.width;
    const x = worldX - scroll;
    const y = this.spawnCollectableY(def.height);
    if (this.wouldOverlap(x, y, def.width, def.height)) return;

    const obj = this.collectables.create(x, y, def.key) as Phaser.Physics.Arcade.Sprite & ScrollObject;
    obj.setScale(0.6);
    (obj.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    obj.worldX = worldX;
    (obj as any).assetKey = def.key;
  }

  private spawnSynergyLetter(scroll: number) {
    if (this.synergyGroup.getLength() > 0) return;
    const nextKey = this.nextSynergyKey?.();
    const def = (nextKey && synergyLetters.find((l) => l.key === nextKey)) || synergyLetters[0];
    const worldX = scroll + this.w + def.width;
    const x = worldX - scroll;
    const y = Phaser.Math.Between(this.groundY - 140, this.groundY - 40);
    if (this.wouldOverlap(x, y, def.width, def.height)) return;

    const obj = this.synergyGroup.create(x, y, def.key) as Phaser.Physics.Arcade.Sprite & ScrollObject;
    (obj.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    obj.setTint(0xFFD700);
    obj.worldX = worldX;
    (obj as any).assetKey = def.key;
  }

  private spawnPlatform(scroll: number) {
    const platformWidth = Phaser.Math.Between(80, 150);
    const platformHeight = 16;
    const worldX = scroll + this.w + platformWidth;
    const x = worldX - scroll;
    const y = Phaser.Math.Between(this.groundY - 110, this.groundY - 60);

    const platform = this.scene.add.rectangle(x, y, platformWidth, platformHeight, 0x8B7355) as Phaser.GameObjects.Rectangle & ScrollObject;
    platform.setStrokeStyle(1, 0x6B5335);
    this.platforms.add(platform);

    const body = platform.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setImmovable(true);
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    platform.worldX = worldX;
  }

  private destroyIfOffscreen = (child: Phaser.GameObjects.GameObject, scroll: number) => {
    const obj = child as ScrollObject;
    const screenX = obj.worldX != null ? obj.worldX - scroll : obj.x;
    if (screenX < -150) obj.destroy();
  };

  private cleanOffscreen(group: Phaser.Physics.Arcade.Group, scroll: number) {
    group.getChildren().forEach((child) => this.destroyIfOffscreen(child, scroll));
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
