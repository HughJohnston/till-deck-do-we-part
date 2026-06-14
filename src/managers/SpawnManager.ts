import Phaser from 'phaser';
import { obstacleImages, collectableImages, synergyLetters } from '../config/assetManifest';
import { getGroundY } from '../utils/constants';
import { DifficultyManager } from './DifficultyManager';

export class SpawnManager {
  private scene: Phaser.Scene;
  private difficultyManager: DifficultyManager;
  private isHoneymoonMode = false;

  obstacles!: Phaser.Physics.Arcade.Group;
  collectables!: Phaser.Physics.Arcade.Group;
  synergyGroup!: Phaser.Physics.Arcade.Group;
  platforms!: Phaser.Physics.Arcade.Group;

  // Returns the asset key of the next synergy letter that should appear, in sequence.
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
  }

  setHoneymoonMode(enabled: boolean) {
    this.isHoneymoonMode = enabled;
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

  private spawnObstacle(speed: number) {
    const pool = this.isHoneymoonMode ? collectableImages : obstacleImages;
    const def = Phaser.Utils.Array.GetRandom(pool);
    const x = this.w + def.width;
    const y = this.groundY - def.height / 2;

    const obj = this.obstacles.create(x, y, def.key) as Phaser.Physics.Arcade.Sprite;
    obj.setVelocityX(-speed);
    obj.body!.setAllowGravity(false);
    obj.setTint(0xff4444);
    (obj as any).assetKey = def.key;
  }

  private spawnCollectable(speed: number) {
    const pool = this.isHoneymoonMode ? obstacleImages : collectableImages;
    const def = Phaser.Utils.Array.GetRandom(pool);
    const x = this.w + def.width;
    const minY = this.groundY - 120;
    const maxY = this.groundY - def.height / 2;
    const y = Phaser.Math.Between(minY, maxY);

    const obj = this.collectables.create(x, y, def.key) as Phaser.Physics.Arcade.Sprite;
    obj.setVelocityX(-speed);
    obj.body!.setAllowGravity(false);
    obj.setTint(0x44dd44);
    (obj as any).assetKey = def.key;
  }

  private spawnSynergyLetter(speed: number) {
    // Only one synergy letter is on screen at a time, and it is always the next
    // letter needed in the SYNERGY sequence.
    if (this.synergyGroup.getLength() > 0) return;
    const nextKey = this.nextSynergyKey?.();
    const def = (nextKey && synergyLetters.find((l) => l.key === nextKey)) || synergyLetters[0];
    const x = this.w + def.width;
    const y = Phaser.Math.Between(this.groundY - 140, this.groundY - 40);

    const obj = this.synergyGroup.create(x, y, def.key) as Phaser.Physics.Arcade.Sprite;
    obj.setVelocityX(-speed);
    obj.body!.setAllowGravity(false);
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
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocityX(-speed);
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }

  private cleanOffscreen(group: Phaser.Physics.Arcade.Group) {
    group.getChildren().forEach((child) => {
      const obj = child as Phaser.GameObjects.Components.Transform & { destroy: () => void };
      if (obj.x < -150) obj.destroy();
    });
  }

  reset() {
    this.obstacles.clear(true, true);
    this.collectables.clear(true, true);
    this.synergyGroup.clear(true, true);
    this.platforms.clear(true, true);
    this.obstacleTimer = 0;
    this.collectableTimer = 0;
    this.synergyTimer = 0;
    this.platformTimer = 0;
    this.isHoneymoonMode = false;
  }
}
