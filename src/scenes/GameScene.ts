import Phaser from 'phaser';
import { getGroundY, getGroundHeight, getPlayerX, JUMP_VELOCITY, PLAYER_SIZE } from '../utils/constants';
import { ENV_LAYOUT, BG_TEXTURE_HEIGHTS } from '../config/dimensions';
import { difficultyConfig } from '../config/difficultyConfig';
import { DifficultyManager } from '../managers/DifficultyManager';
import { ScoreManager } from '../managers/ScoreManager';
import { SynergyManager } from '../managers/SynergyManager';
import { SpawnManager } from '../managers/SpawnManager';
import { createMuteButton } from '../ui/MuteButton';
import { isMuted } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { stopMenuMusic } from '../ui/menuMusic';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private skyLayer!: Phaser.GameObjects.TileSprite;
  private midLayer!: Phaser.GameObjects.TileSprite;
  private streetLayer!: Phaser.GameObjects.TileSprite;
  private groundLayer!: Phaser.GameObjects.TileSprite;

  difficultyManager!: DifficultyManager;
  scoreManager!: ScoreManager;
  synergyManager!: SynergyManager;
  spawnManager!: SpawnManager;

  private isGameOver = false;
  private wasHoneymoonMode = false;
  private jumpCount = 0;
  private maxJumps = 2;
  private bgm?: Phaser.Sound.BaseSound;
  private runSound?: Phaser.Sound.BaseSound;
  private character = 'wilf';
  private readonly SFX_VOLUME = 0.6;
  private synergyGoldTimer?: Phaser.Time.TimerEvent;

  private testMode = false;
  private testScrollSpeed = 200;
  private testGraphics?: Phaser.GameObjects.Graphics;
  private testOverlay?: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create() {
    this.isGameOver = false;
    this.wasHoneymoonMode = false;
    this.jumpCount = 0;

    const w = this.scale.width;
    const h = this.scale.height;
    const groundY = getGroundY(h);
    const groundH = getGroundHeight(h);

    this.difficultyManager = new DifficultyManager();
    this.scoreManager = new ScoreManager();
    this.synergyManager = new SynergyManager();

    // Parallax backgrounds — created at origin, positioned/scaled by layoutEnvironment()
    this.skyLayer = this.add.tileSprite(0, 0, w, h, 'bg-sky');
    this.midLayer = this.add.tileSprite(0, 0, w, h, 'bg-mid');
    this.streetLayer = this.add.tileSprite(0, 0, w, h, 'bg-street');
    this.groundLayer = this.add.tileSprite(0, 0, w, h, 'bg-ground');
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
    this.player = this.physics.add.sprite(playerX, groundY - PLAYER_SIZE / 2, character);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(0);
    this.player.setSize(PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.9);

    this.physics.add.collider(this.player, this.ground, () => { this.jumpCount = 0; });

    if (this.textures.get(character).frameTotal > 1) {
      this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers(character, { start: 1, end: 3 }), frameRate: 10, repeat: -1 });
      this.anims.create({ key: 'jump', frames: [{ key: character, frame: 4 }], frameRate: 1 });
      this.player.play('run');
    }

    // Spawn manager
    this.spawnManager = new SpawnManager(this, this.difficultyManager);
    this.spawnManager.nextSynergyKey = () => `synergy-${this.synergyManager.nextLetterNeeded}`;

    this.physics.add.collider(this.player, this.spawnManager.platforms, () => { this.jumpCount = 0; });
    this.physics.add.collider(this.player, this.spawnManager.obstacles, () => this.handleDeath());
    this.physics.add.overlap(this.player, this.spawnManager.collectables, (_p, c) => {
      (c as Phaser.Physics.Arcade.Sprite).destroy();
      this.scoreManager.addCollectablePoints();
      this.playSfx('sfx-collect');
      this.events.emit('collectable-picked');
    });
    this.physics.add.overlap(this.player, this.spawnManager.synergyGroup, (_p, letter) => {
      const sprite = letter as Phaser.Physics.Arcade.Sprite;
      const key = (sprite as any).assetKey as string;
      const collected = this.synergyManager.collectLetter(key);
      sprite.destroy();
      if (collected) {
        this.events.emit('synergy-letter', this.synergyManager.progress);
        if (this.synergyManager.isComplete) {
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

    if (this.cache.audio.exists('bgm') && !isMuted()) {
      this.bgm = this.sound.add('bgm', { loop: true, volume: 0.4 });
      this.bgm.play();
    }

    if (this.cache.audio.exists('sfx-run')) {
      this.runSound = this.sound.add('sfx-run', { loop: true, volume: this.SFX_VOLUME });
    }

    createMuteButton(this);
    registerUiSound(this);

    this.input.keyboard?.on('keydown-T', () => this.toggleTestMode());

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });
  }

  private handleResize() {
    this.layoutEnvironment();
    if (this.testMode) this.drawTestGuides();
  }

  private layoutEnvironment() {
    const w = this.scale.width;
    const h = this.scale.height;
    const datumY = h * ENV_LAYOUT.datumRatio;

    // Sky / Mid: fill the full viewport. Uniform tileScale prevents vertical tiling.
    const skyScale = h / BG_TEXTURE_HEIGHTS.sky;
    this.skyLayer.setSize(w, h).setPosition(w / 2, h / 2).setTileScale(skyScale);
    const midScale = h / BG_TEXTURE_HEIGHTS.mid;
    this.midLayer.setSize(w, h).setPosition(w / 2, h / 2).setTileScale(midScale);

    // Street: bottom edge sits exactly on the datum.
    const streetH = h * ENV_LAYOUT.streetBandRatio;
    this.streetLayer
      .setSize(w, streetH)
      .setPosition(w / 2, datumY - streetH / 2)
      .setTileScale(streetH / BG_TEXTURE_HEIGHTS.street);

    // Ground: top edge sits exactly on the datum, extends to the bottom of the screen.
    const groundBandH = h - datumY;
    this.groundLayer
      .setSize(w, groundBandH)
      .setPosition(w / 2, datumY + groundBandH / 2)
      .setTileScale(groundBandH / BG_TEXTURE_HEIGHTS.ground);
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
    if (this.runSound?.isPlaying) this.runSound.stop();
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

    this.drawTestGuides();
    this.updateTestOverlay();
  }

  private drawTestGuides() {
    if (!this.testGraphics) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const datumY = h * ENV_LAYOUT.datumRatio;
    const streetTopY = datumY - h * ENV_LAYOUT.streetBandRatio;

    const g = this.testGraphics;
    g.clear();

    // Datum line (ground top == street bottom)
    g.lineStyle(2, 0x00ffcc, 1);
    g.lineBetween(0, datumY, w, datumY);

    // Street top boundary
    g.lineStyle(1, 0xffd700, 0.8);
    g.lineBetween(0, streetTopY, w, streetTopY);
  }

  private updateTestOverlay() {
    if (!this.testOverlay) return;
    const { datumRatio, streetBandRatio } = ENV_LAYOUT;
    this.testOverlay.setText([
      'TEST MODE  (T to exit)',
      `datumRatio:      ${datumRatio.toFixed(3)}   [Up/Down]`,
      `streetBandRatio: ${streetBandRatio.toFixed(3)}   [ [ / ] ]`,
      `scrollSpeed:     ${this.testScrollSpeed.toFixed(0)}     [ - / + ]`,
    ].join('\n'));
    console.log('[env tuning]', {
      datumRatio: +datumRatio.toFixed(3),
      streetBandRatio: +streetBandRatio.toFixed(3),
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
    ENV_LAYOUT.streetBandRatio = Phaser.Math.Clamp(ENV_LAYOUT.streetBandRatio + 0.01, 0.05, 0.9);
    this.applyTuning();
  }

  private tuneStreetDown() {
    ENV_LAYOUT.streetBandRatio = Phaser.Math.Clamp(ENV_LAYOUT.streetBandRatio - 0.01, 0.05, 0.9);
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

  private playSfx(key: string, volume = this.SFX_VOLUME) {
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
  }

  private activateSynergyGold() {
    this.playSfx('sfx-synergy');
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
      if (this.anims.exists('jump')) this.player.play('jump');
      // Jump sound is intentionally half the volume of other SFX.
      this.playSfx('sfx-jump', this.SFX_VOLUME * 0.5);
      if (this.runSound?.isPlaying) this.runSound.stop();
    }
  }

  private isOnGround(): boolean {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    return body.touching.down || body.blocked.down;
  }

  private scrollLayers(speed: number, dt: number) {
    // tilePositionX is in texture space, so on-screen movement = delta * tileScaleX.
    // Divide by tileScaleX so the scroll multipliers map directly to on-screen speed
    // (otherwise layers with a larger tileScale appear to scroll faster).
    const advance = (layer: Phaser.GameObjects.TileSprite, mult: number) => {
      const s = layer.tileScaleX || 1;
      layer.tilePositionX += (speed * mult * dt) / s;
    };
    advance(this.skyLayer, ENV_LAYOUT.scroll.sky);
    advance(this.midLayer, ENV_LAYOUT.scroll.mid);
    advance(this.streetLayer, ENV_LAYOUT.scroll.street);
    advance(this.groundLayer, ENV_LAYOUT.scroll.ground);
  }

  update(_time: number, delta: number) {
    if (this.testMode) {
      this.scrollLayers(this.testScrollSpeed, delta / 1000);
      return;
    }

    if (this.isGameOver) return;

    const w = this.scale.width;

    this.difficultyManager.update(delta);
    this.scoreManager.update(delta, this.difficultyManager.currentSpeed);
    this.spawnManager.update(delta);

    const speed = this.difficultyManager.currentSpeed;
    const dt = delta / 1000;
    this.scrollLayers(speed, dt);

    const updateVelocity = (child: Phaser.GameObjects.GameObject) => {
      const body = (child as any).body as Phaser.Physics.Arcade.Body;
      if (body) body.setVelocityX(-speed);
    };
    this.spawnManager.obstacles.getChildren().forEach(updateVelocity);
    this.spawnManager.collectables.getChildren().forEach(updateVelocity);
    this.spawnManager.synergyGroup.getChildren().forEach(updateVelocity);
    this.spawnManager.platforms.getChildren().forEach(updateVelocity);

    // Keep player at fixed X
    this.player.x = getPlayerX(w);

    const onGround = this.isOnGround();
    if (onGround) this.jumpCount = 0;

    if (onGround && this.anims.exists('run') && this.player.anims.currentAnim?.key !== 'run') {
      this.player.play('run');
    }

    // Running loop plays only while in contact with the ground.
    if (this.runSound) {
      if (onGround && !this.runSound.isPlaying) this.runSound.play();
      else if (!onGround && this.runSound.isPlaying) this.runSound.stop();
    }

    if (this.scoreManager.isHoneymoonMode && !this.wasHoneymoonMode) {
      this.wasHoneymoonMode = true;
      this.spawnManager.setHoneymoonMode(true);
      this.events.emit('honeymoon-activated');
      this.cameras.main.flash(500, 255, 200, 100);
    }

    this.events.emit('score-update', this.scoreManager.getDisplayScore(), this.scoreManager.scoreLabel, this.scoreManager.multiplier);
  }

  private handleDeath() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.player.setTint(0xff0000);
    this.player.setVelocity(0, -200);
    this.physics.pause();

    if (this.runSound?.isPlaying) this.runSound.stop();
    this.playSfx(this.character === 'ruth' ? 'sfx-grunt-female' : 'sfx-grunt-male');

    if (this.bgm) this.bgm.stop();

    this.time.delayedCall(800, () => {
      this.scene.stop('HudScene');
      this.scene.start('GameOverScene', {
        score: this.scoreManager.getDisplayScore(),
        scoreLabel: this.scoreManager.scoreLabel,
        character: this.registry.get('character'),
        playerName: this.registry.get('playerName'),
      });
    });
  }
}
