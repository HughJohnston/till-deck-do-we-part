import Phaser from 'phaser';
import { getGroundY, getGroundHeight, getPlayerX, JUMP_VELOCITY, PLAYER_SIZE } from '../utils/constants';
import { wilfAnimFrames, ruthAnimFrames, CharacterAnimFrames } from '../config/assetManifest';
import { FONT_FAMILY } from '../config/gameConfig';
import { ENV_LAYOUT, BG_TEXTURE_HEIGHTS } from '../config/dimensions';
import { difficultyConfig } from '../config/difficultyConfig';
import { DifficultyManager } from '../managers/DifficultyManager';
import { ScoreManager } from '../managers/ScoreManager';
import { SynergyManager } from '../managers/SynergyManager';
import { SpawnManager } from '../managers/SpawnManager';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { registerAudioConsole } from '../ui/AudioConsole';
import { stopMenuMusic } from '../ui/menuMusic';
import { playMusic, stopMusic } from '../ui/musicPlayer';
import { playSfx, playJumpSfx, startRunSfx, stopRunSfx, isRunSfxPlaying } from '../ui/sfxPlayer';
import {
  addRunSlides,
  isUnlocked,
} from '../services/HoneymoonProgressService';
import { submitScore } from '../services/LeaderboardService';
import { recordRunEnd } from '../services/PlayerStatsService';
import { resolvePlayerName } from '../services/PlayerProfileService';
import { applyTileScroll } from '../utils/scrollVisuals';

export type GameMode = 'normal' | 'honeymoon';

interface StreetSegment {
  image: Phaser.GameObjects.Image;
  /** Left edge in street-parallax space: screenX = worldLeft - scrollDistance * streetMult */
  worldLeft: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private skyLayer!: Phaser.GameObjects.TileSprite;
  private groundLayer!: Phaser.GameObjects.TileSprite;

  private streetSegments: StreetSegment[] = [];
  private nextStreetIsGap = false;
  private static readonly STREET_SCENE_KEYS = ['bg-ryelane', 'bg-wingfield', 'bg-pubs', 'bg-ryelane2'];
  private static readonly MAX_FRAME_DELTA_MS = 33;

  /** 1.0× scroll distance — backgrounds only; gameplay keeps physics velocity. */
  private scrollDistance = 0;

  difficultyManager!: DifficultyManager;
  scoreManager!: ScoreManager;
  synergyManager!: SynergyManager;
  spawnManager!: SpawnManager;

  private isGameOver = false;
  private gameMode: GameMode = 'normal';
  private jumpCount = 0;
  private maxJumps = 2;
  private character = 'wilf';
  private runKey = 'run';
  private jumpKey = 'jump';
  private doubleJumpKey = 'double-jump';
  private synergyGoldTimer?: Phaser.Time.TimerEvent;
  private runStartedAt = 0;
  private synergyCompletionsThisRun = 0;
  private obstacleCollider?: Phaser.Physics.Arcade.Collider;

  private testMode = false;
  private testScrollSpeed = 200;
  private testGraphics?: Phaser.GameObjects.Graphics;
  private testOverlay?: Phaser.GameObjects.Text;

  private scrollVelocity = 0;

  private get isHoneymoonRun(): boolean {
    return this.gameMode === 'honeymoon';
  }

  private get skyTextureKey(): string {
    return this.isHoneymoonRun ? 'bg-honeymoon-sky' : 'bg-sky';
  }

  private get groundTextureKey(): string {
    return this.isHoneymoonRun ? 'bg-honeymoon-sand' : 'bg-ground';
  }

  private get skyTextureHeight(): number {
    return this.isHoneymoonRun ? BG_TEXTURE_HEIGHTS.honeymoonSky : BG_TEXTURE_HEIGHTS.sky;
  }

  private get midLayerTextureHeight(): number {
    return this.isHoneymoonRun ? BG_TEXTURE_HEIGHTS.honeymoonShore : BG_TEXTURE_HEIGHTS.street;
  }

  private get groundTextureHeight(): number {
    return this.isHoneymoonRun ? BG_TEXTURE_HEIGHTS.honeymoonSand : BG_TEXTURE_HEIGHTS.ground;
  }

  private get skyBandRatio(): number {
    return ENV_LAYOUT.skyBandRatio;
  }

  private get streetBandRatio(): number {
    return this.isHoneymoonRun ? ENV_LAYOUT.honeymoonStreetBandRatio : ENV_LAYOUT.streetBandRatio;
  }

  constructor() {
    super('GameScene');
  }

  init(data: { gameMode?: GameMode }) {
    this.gameMode = data?.gameMode ?? 'normal';
  }

  // Hoisted so it can be passed to forEach without allocating a closure per frame.
  private applyScrollVelocity = (child: Phaser.GameObjects.GameObject) => {
    const body = (child as any).body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocityX(this.scrollVelocity);
  };

  create() {
    this.isGameOver = false;
    this.jumpCount = 0;
    this.scrollDistance = 0;
    this.runStartedAt = this.time.now;
    this.synergyCompletionsThisRun = 0;

    const isHoneymoonRun = this.gameMode === 'honeymoon';

    const w = this.scale.width;
    const h = this.scale.height;
    const groundY = getGroundY(h);
    const groundH = getGroundHeight(h);

    this.difficultyManager = new DifficultyManager();
    this.scoreManager = new ScoreManager(isHoneymoonRun);
    this.synergyManager = new SynergyManager();

    // Parallax backgrounds — created at origin, positioned/scaled by layoutEnvironment()
    this.skyLayer = this.add.tileSprite(0, 0, w, h, this.skyTextureKey).setDepth(-4);
    // Mid layer is a sequence of image segments (street scenes or repeating shore).
    this.groundLayer = this.add.tileSprite(0, 0, w, h, this.groundTextureKey).setDepth(-1);
    this.streetSegments = [];
    this.nextStreetIsGap = false;
    this.initStreetSegments();
    this.layoutEnvironment();

    // Physics ground
    this.ground = this.physics.add.staticGroup();
    const groundBody = this.ground.create(w / 2, h - groundH / 2, undefined) as Phaser.Physics.Arcade.Sprite;
    groundBody.setDisplaySize(w, groundH);
    groundBody.setVisible(false);
    groundBody.refreshBody();

    // Player
    const character = this.registry.get('character') || 'wilf';
    this.character = character;
    const playerX = getPlayerX(w);
    const animFrames: CharacterAnimFrames = character === 'ruth' ? ruthAnimFrames : wilfAnimFrames;
    this.runKey = `${character}-run`;
    this.jumpKey = `${character}-jump`;
    this.doubleJumpKey = `${character}-double-jump`;
    const firstTexture = animFrames.run[0].key;
    // Collision box is inset from the full sprite so hits match the visible
    // character. Lower factors = more forgiving collisions.
    const bodyWidthFactor = 0.28;
    const bodyHeightFactor = 0.44;
    const worldBodyH = PLAYER_SIZE * bodyHeightFactor;
    this.player = this.physics.add.sprite(playerX, groundY - worldBodyH / 2, firstTexture);
    this.player.setDisplaySize(PLAYER_SIZE, PLAYER_SIZE);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(0);
    this.player.setSize(
      PLAYER_SIZE * bodyWidthFactor / this.player.scaleX,
      PLAYER_SIZE * bodyHeightFactor / this.player.scaleY,
    );

    this.physics.add.collider(this.player, this.ground, () => { this.jumpCount = 0; });

    if (!this.anims.exists(this.runKey)) {
      this.anims.create({
        key: this.runKey,
        frames: animFrames.run.map(f => ({ key: f.key })),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!this.anims.exists(this.jumpKey)) {
      this.anims.create({
        key: this.jumpKey,
        frames: animFrames.jump.map(f => ({ key: f.key })),
        frameRate: 12,
        repeat: 0,
      });
    }
    if (!this.anims.exists(this.doubleJumpKey)) {
      this.anims.create({
        key: this.doubleJumpKey,
        frames: animFrames.doubleJump.map(f => ({ key: f.key })),
        frameRate: 14,
        repeat: 0,
      });
    }
    this.player.play(this.runKey);

    // Spawn manager
    this.spawnManager = new SpawnManager(this, this.difficultyManager);
    if (isHoneymoonRun) this.spawnManager.setHoneymoonMode(true);
    this.spawnManager.nextSynergyKey = () => this.synergyManager.nextLetterKey;
    this.spawnManager.getScore = () => this.scoreManager.getDisplayScore();

    this.physics.add.collider(this.player, this.spawnManager.platforms, () => { this.jumpCount = 0; });
    this.obstacleCollider = this.physics.add.collider(this.player, this.spawnManager.obstacles, () => this.handleDeath());
    this.physics.add.overlap(this.player, this.spawnManager.collectables, (_p, c) => {
      const sprite = c as Phaser.Physics.Arcade.Sprite;
      const px = sprite.x;
      const py = sprite.y;
      sprite.destroy();
      const { points, streak } = this.scoreManager.addCollectablePoints(this.time.now);
      this.showScorePopup(px, py, points, streak);
      playSfx('sfx-collect');
      this.events.emit('collect-streak', streak);
      this.events.emit('collectable-picked');
    });
    this.physics.add.overlap(this.player, this.spawnManager.synergyGroup, (_p, letter) => {
      const sprite = letter as Phaser.Physics.Arcade.Sprite;
      const key = (sprite as any).assetKey as string;
      const collected = this.synergyManager.collectLetter(key);
      sprite.destroy();
      if (collected) {
        playSfx('sfx-synergy-collect');
        this.events.emit('synergy-letter', this.synergyManager.progress);
        if (this.synergyManager.isComplete) {
          this.synergyCompletionsThisRun += 1;
          this.scoreManager.activateSynergyMultiplier();
          this.synergyManager.reset();
          this.events.emit('synergy-complete');
          this.activateSynergyGold();
        }
      }
    });

    this.input.on('pointerdown', () => this.jump());
    this.input.keyboard?.on('keydown-SPACE', () => this.jump());
    this.input.keyboard?.on('keydown-UP', () => this.jump());

    this.scene.launch('HudScene', { gameScene: this });

    stopMenuMusic(this);
    playMusic(isHoneymoonRun ? 'honeymoon-bgm' : 'bgm');

    createMuteButton(this);
    registerUiSound(this);
    registerAudioConsole(this);

    this.input.keyboard?.on('keydown-T', (event: KeyboardEvent) => {
      if (!event.shiftKey) return;
      this.toggleTestMode();
    });

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      stopRunSfx();
    });
  }

  private handleResize() {
    this.layoutEnvironment();
    this.applyBackgroundFromScroll();
    if (this.testMode) this.drawTestGuides();
  }

  private layoutEnvironment() {
    const w = this.scale.width;
    const h = this.scale.height;
    const datumY = h * ENV_LAYOUT.datumRatio;

    // Sky: top-anchored, uniform scale preserves aspect ratio, tiles horizontally.
    const skyH = h * this.skyBandRatio;
    const skyScale = skyH / this.skyTextureHeight;
    this.skyLayer.setSize(w, skyH).setPosition(w / 2, skyH / 2).setTileScale(skyScale);
    this.layoutStreetSegments();

    const groundBandH = h - datumY;
    this.groundLayer
      .setSize(w, groundBandH)
      .setPosition(w / 2, datumY + groundBandH / 2)
      .setTileScale(groundBandH / this.groundTextureHeight);
  }

  private getStreetScale(): number {
    return (this.scale.height * this.streetBandRatio) / this.midLayerTextureHeight;
  }

  private getStreetY(): number {
    const h = this.scale.height;
    return h * ENV_LAYOUT.datumRatio - h * this.streetBandRatio;
  }

  private initStreetSegments() {
    const w = this.scale.width;
    const scale = this.getStreetScale();
    const y = this.getStreetY();
    let worldLeft = 0;
    while (worldLeft < w + 1600 * scale) {
      const seg = this.spawnStreetSegment(worldLeft, y, scale);
      worldLeft += seg.image.displayWidth;
    }
  }

  private spawnStreetSegment(worldLeft: number, y: number, scale: number): StreetSegment {
    let key: string;
    if (this.isHoneymoonRun) {
      key = 'bg-honeymoon-shore';
    } else if (this.nextStreetIsGap) {
      key = 'bg-gap';
    } else {
      key = Phaser.Utils.Array.GetRandom(GameScene.STREET_SCENE_KEYS);
    }
    if (!this.isHoneymoonRun) this.nextStreetIsGap = !this.nextStreetIsGap;
    const streetMult = ENV_LAYOUT.scroll.street;
    const image = this.add
      .image(worldLeft - this.scrollDistance * streetMult, y, key)
      .setOrigin(0, 0)
      .setScale(scale)
      .setDepth(-2);
    if ('setRoundPixels' in image) (image as Phaser.GameObjects.Image & { setRoundPixels(v: boolean): void }).setRoundPixels(false);
    const segment = { image, worldLeft };
    this.streetSegments.push(segment);
    return segment;
  }

  private layoutStreetSegments() {
    const newScale = this.getStreetScale();
    const newY = this.getStreetY();
    const streetMult = ENV_LAYOUT.scroll.street;
    for (const seg of this.streetSegments) {
      const oldScale = seg.image.scaleX;
      if (oldScale > 0) seg.image.x = seg.image.x * (newScale / oldScale);
      seg.image.setScale(newScale).y = newY;
      seg.worldLeft = seg.image.x + this.scrollDistance * streetMult;
    }
    this.fillStreetRight();
  }

  private fillStreetRight() {
    const w = this.scale.width;
    const scale = this.getStreetScale();
    const y = this.getStreetY();
    const streetMult = ENV_LAYOUT.scroll.street;
    const scroll = this.scrollDistance;
    let rightScreen = 0;
    if (this.streetSegments.length > 0) {
      const last = this.streetSegments[this.streetSegments.length - 1];
      rightScreen = last.worldLeft - scroll * streetMult + last.image.displayWidth;
    }
    while (rightScreen < w + 400) {
      const worldLeft = this.streetSegments.length > 0
        ? this.streetSegments[this.streetSegments.length - 1].worldLeft +
          this.streetSegments[this.streetSegments.length - 1].image.displayWidth
        : 0;
      const seg = this.spawnStreetSegment(worldLeft, y, scale);
      rightScreen = seg.worldLeft - scroll * streetMult + seg.image.displayWidth;
    }
  }

  private applyBackgroundFromScroll() {
    const scroll = this.scrollDistance;
    applyTileScroll(this.skyLayer, scroll, ENV_LAYOUT.scroll.sky);
    applyTileScroll(this.groundLayer, scroll, ENV_LAYOUT.scroll.ground);

    const streetMult = ENV_LAYOUT.scroll.street;
    for (const seg of this.streetSegments) {
      seg.image.x = seg.worldLeft - scroll * streetMult;
    }

    while (this.streetSegments.length > 0) {
      const first = this.streetSegments[0];
      if (first.image.x + first.image.displayWidth < -50) {
        first.image.destroy();
        this.streetSegments.shift();
      } else break;
    }
    this.fillStreetRight();
  }

  private advanceBackgroundScroll(speed: number, dt: number) {
    this.scrollDistance += speed * dt;
    this.applyBackgroundFromScroll();
  }

  private toggleTestMode() {
    if (this.testMode) {
      // Exit: clean restart back to normal gameplay.
      this.scene.restart();
      return;
    }

    this.testMode = true;

    // Stop gameplay: hide player, clear and freeze spawns.
    this.physics.pause();
    stopRunSfx();
    this.player.setVisible(false);
    this.spawnManager.obstacles.clear(true, true);
    this.spawnManager.collectables.clear(true, true);
    this.spawnManager.synergyGroup.clear(true, true);
    this.spawnManager.platforms.clear(true, true);

    this.testGraphics = this.add.graphics().setDepth(900);
    this.testOverlay = this.add.text(10, 10, '', {
      fontSize: '12px', color: '#00ffcc', fontFamily: 'monospace',
      backgroundColor: '#000000aa', padding: { x: 6, y: 6 },
    }).setDepth(901).setScrollFactor(0);

    this.input.keyboard?.on('keydown-UP', this.tuneDatumUp, this);
    this.input.keyboard?.on('keydown-DOWN', this.tuneDatumDown, this);
    this.input.keyboard?.on('keydown-OPEN_BRACKET', this.tuneStreetDown, this);
    this.input.keyboard?.on('keydown-CLOSED_BRACKET', this.tuneStreetUp, this);
    this.input.keyboard?.on('keydown-MINUS', this.tuneSpeedDown, this);
    this.input.keyboard?.on('keydown-PLUS', this.tuneSpeedUp, this);
    this.input.keyboard?.on('keydown-ONE', this.tuneSkyUp, this);
    this.input.keyboard?.on('keydown-TWO', this.tuneSkyDown, this);

    this.drawTestGuides();
    this.updateTestOverlay();
  }

  private drawTestGuides() {
    if (!this.testGraphics) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const datumY = h * ENV_LAYOUT.datumRatio;
    const streetTopY = datumY - h * this.streetBandRatio;
    const skyBottomY = h * this.skyBandRatio;

    const g = this.testGraphics;
    g.clear();

    // Datum line (ground top == street bottom)
    g.lineStyle(2, 0x00ffcc, 1);
    g.lineBetween(0, datumY, w, datumY);

    // Street top boundary
    g.lineStyle(1, 0xffd700, 0.8);
    g.lineBetween(0, streetTopY, w, streetTopY);

    // Sky bottom edge
    g.lineStyle(1, 0x88aaff, 0.6);
    g.lineBetween(0, skyBottomY, w, skyBottomY);
  }

  private updateTestOverlay() {
    if (!this.testOverlay) return;
    const { datumRatio } = ENV_LAYOUT;
    this.testOverlay.setText([
      'TEST MODE  (T to exit)',
      `datumRatio:      ${datumRatio.toFixed(3)}   [Up/Down]`,
      `streetBandRatio: ${this.streetBandRatio.toFixed(3)}   [ [ / ] ]`,
      `skyBandRatio:    ${this.skyBandRatio.toFixed(3)}   [1 / 2]`,
      `scrollSpeed:     ${this.testScrollSpeed.toFixed(0)}     [ - / + ]`,
    ].join('\n'));
    console.log('[env tuning]', {
      datumRatio: +datumRatio.toFixed(3),
      streetBandRatio: +this.streetBandRatio.toFixed(3),
      skyBandRatio: +this.skyBandRatio.toFixed(3),
      scrollSpeed: Math.round(this.testScrollSpeed),
    });
  }

  private applyTuning() {
    this.layoutEnvironment();
    this.drawTestGuides();
    this.updateTestOverlay();
  }

  private tuneDatumUp() {
    ENV_LAYOUT.datumRatio = Phaser.Math.Clamp(ENV_LAYOUT.datumRatio - 0.005, 0.3, 0.98);
    this.applyTuning();
  }

  private tuneDatumDown() {
    ENV_LAYOUT.datumRatio = Phaser.Math.Clamp(ENV_LAYOUT.datumRatio + 0.005, 0.3, 0.98);
    this.applyTuning();
  }

  private tuneStreetUp() {
    const key = this.isHoneymoonRun ? 'honeymoonStreetBandRatio' : 'streetBandRatio';
    ENV_LAYOUT[key] = Phaser.Math.Clamp(ENV_LAYOUT[key] + 0.01, 0.05, 0.9);
    this.applyTuning();
  }

  private tuneStreetDown() {
    const key = this.isHoneymoonRun ? 'honeymoonStreetBandRatio' : 'streetBandRatio';
    ENV_LAYOUT[key] = Phaser.Math.Clamp(ENV_LAYOUT[key] - 0.01, 0.05, 0.9);
    this.applyTuning();
  }

  private tuneSpeedUp() {
    this.testScrollSpeed = Phaser.Math.Clamp(this.testScrollSpeed + 25, 0, 1000);
    this.updateTestOverlay();
  }

  private tuneSpeedDown() {
    this.testScrollSpeed = Phaser.Math.Clamp(this.testScrollSpeed - 25, 0, 1000);
    this.updateTestOverlay();
  }

  private tuneSkyUp() {
    ENV_LAYOUT.skyBandRatio = Phaser.Math.Clamp(ENV_LAYOUT.skyBandRatio + 0.01, 0.1, 1.0);
    this.applyTuning();
  }

  private tuneSkyDown() {
    ENV_LAYOUT.skyBandRatio = Phaser.Math.Clamp(ENV_LAYOUT.skyBandRatio - 0.01, 0.1, 1.0);
    this.applyTuning();
  }

  private showScorePopup(x: number, y: number, amount: number, streak = 1) {
    const unit = this.isHoneymoonRun ? 'sandcastles' : 'slides';
    const combo = streak >= 2 ? `\nx${streak} combo` : '';
    const popup = this.add.text(x, y, `+${amount} ${unit}${combo}`, {
      fontSize: '22px', color: '#33dd55', fontFamily: FONT_FAMILY,
      stroke: '#0a3315', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1000);
    this.tweens.add({
      targets: popup,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  private activateSynergyGold() {
    playSfx('sfx-synergy');
    this.player.setTint(0xFFD700);
    this.synergyGoldTimer?.remove();
    this.synergyGoldTimer = this.time.delayedCall(difficultyConfig.synergyMultiplierDuration, () => {
      if (!this.isGameOver) this.player.clearTint();
      this.synergyGoldTimer = undefined;
    });
  }

  private jump() {
    if (this.isGameOver || this.testMode) return;
    if (this.jumpCount < this.maxJumps) {
      this.player.setVelocityY(JUMP_VELOCITY);
      this.jumpCount++;
      const animKey = this.jumpCount === 1 ? this.jumpKey : this.doubleJumpKey;
      if (this.anims.exists(animKey)) {
        this.player.play(animKey);
        this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          if (!this.isOnGround()) this.player.anims.pause();
        });
      }
      playJumpSfx(this.character === 'ruth' ? 'ruth' : 'wilf');
      stopRunSfx();
    }
  }

  private isOnGround(): boolean {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    return body.touching.down || body.blocked.down;
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta, GameScene.MAX_FRAME_DELTA_MS) / 1000;

    if (this.testMode) {
      this.advanceBackgroundScroll(this.testScrollSpeed, dt);
      return;
    }

    if (this.isGameOver) return;

    const w = this.scale.width;

    this.difficultyManager.update(delta);
    this.scoreManager.update(delta, this.difficultyManager.currentSpeed);
    this.spawnManager.update(delta);

    const speed = this.difficultyManager.currentSpeed;
    this.advanceBackgroundScroll(speed, dt);

    // Reuse a single hoisted handler (see applyScrollVelocity) instead of
    // allocating a fresh closure every frame, which keeps GC pauses (a common
    // source of mobile judder) to a minimum.
    this.scrollVelocity = -speed;
    this.spawnManager.obstacles.getChildren().forEach(this.applyScrollVelocity);
    this.spawnManager.collectables.getChildren().forEach(this.applyScrollVelocity);
    this.spawnManager.synergyGroup.getChildren().forEach(this.applyScrollVelocity);
    this.spawnManager.platforms.getChildren().forEach(this.applyScrollVelocity);

    // Keep player at fixed X
    this.player.x = getPlayerX(w);

    const onGround = this.isOnGround();
    if (onGround) this.jumpCount = 0;

    if (onGround && this.anims.exists(this.runKey) && this.player.anims.currentAnim?.key !== this.runKey) {
      this.player.anims.resume();
      this.player.play(this.runKey);
    }

    // Running loop plays only while in contact with the ground.
    if (onGround && !isRunSfxPlaying()) startRunSfx();
    else if (!onGround && isRunSfxPlaying()) stopRunSfx();

    this.events.emit('score-update', this.scoreManager.getDisplayScore(), this.scoreManager.scoreLabel, this.scoreManager.multiplier);
  }

  private handleDeath() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    stopRunSfx();
    playSfx(this.character === 'ruth' ? 'sfx-grunt-female' : 'sfx-grunt-male');
    stopMusic();

    // Trip, fall and skid rather than stopping dead. Physics keeps running
    // (update() early-returns on isGameOver, so the player is no longer pinned
    // to its fixed X and tumbles freely under gravity).
    this.obstacleCollider?.destroy();
    this.player.anims.stop();
    this.player.setTint(0xff8888);
    this.player.setVelocity(220, -260);
    this.player.setAngularVelocity(520);
    this.player.setDragX(180);
    this.player.setAngularDrag(220);

    // Freeze the world so the focus is the player's tumble.
    const freeze = (group: Phaser.Physics.Arcade.Group) => {
      group.getChildren().forEach((child) => {
        const body = (child as any).body as Phaser.Physics.Arcade.Body;
        if (body) body.setVelocityX(0);
      });
    };
    freeze(this.spawnManager.obstacles);
    freeze(this.spawnManager.collectables);
    freeze(this.spawnManager.synergyGroup);
    freeze(this.spawnManager.platforms);

    this.time.delayedCall(1400, () => {
      this.scene.stop('HudScene');

      const score = this.scoreManager.getDisplayScore();
      const scoreLabel = this.scoreManager.scoreLabel;
      const character = this.registry.get('character') as string;
      const playerName = resolvePlayerName(this.registry.get('playerName'));

      const wasUnlocked = isUnlocked();
      addRunSlides(score);
      const justUnlocked = !wasUnlocked && isUnlocked();

      submitScore({ name: playerName, score, character });
      recordRunEnd({
        playerName,
        score,
        runMs: Math.floor(this.time.now - this.runStartedAt),
        synergyCompletions: this.synergyCompletionsThisRun,
        isHoneymoon: this.gameMode === 'honeymoon',
        character: this.character === 'ruth' ? 'ruth' : 'wilf',
      });

      const gameOverData = {
        score, scoreLabel, character, playerName, gameMode: this.gameMode,
      };

      if (this.gameMode === 'normal' && !wasUnlocked) {
        this.scene.start('HoneymoonInterstitialScene', { gameOverData, celebrateUnlock: justUnlocked });
      } else {
        this.scene.start('GameOverScene', gameOverData);
      }
    });
  }
}
