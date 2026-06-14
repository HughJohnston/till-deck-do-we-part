import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import {
  playerSprites,
  obstacleImages,
  collectableImages,
  synergyLetters,
  backgroundImages,
  uiImages,
  menuImages,
} from '../config/assetManifest';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;
    const barWidth = w * 0.5;
    const barHeight = 24;

    this.add.rectangle(w / 2, h / 2, barWidth + 4, barHeight + 4, 0x222222);
    const bar = this.add.rectangle(w / 2 - barWidth / 2 + 2, h / 2, 0, barHeight - 4, 0x4A90D9);
    bar.setOrigin(0, 0.5);

    this.add.text(w / 2, h / 2 - 30, 'Loading...', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = (barWidth - 4) * value;
    });

    for (const sprite of playerSprites) {
      this.load.spritesheet(sprite.key, sprite.path, {
        frameWidth: sprite.frameWidth,
        frameHeight: sprite.frameHeight,
      });
    }

    const allImages = [...obstacleImages, ...collectableImages, ...synergyLetters, ...backgroundImages, ...uiImages, ...menuImages];
    for (const img of allImages) {
      this.load.image(img.key, img.path);
    }

    this.load.audio('bgm', 'assets/audio/music/Crashed the wedding 8 bit.mp3');
    this.load.audio('menu-bgm', 'assets/audio/music/Wedding March Chiptune 8 Bit.mp3');

    this.load.audio('sfx-jump', 'assets/audio/soundFX/Jump.mp3');
    this.load.audio('sfx-run', 'assets/audio/soundFX/Running loop.mp3');
    this.load.audio('sfx-collect', 'assets/audio/soundFX/good asset collect.mp3');
    this.load.audio('sfx-grunt-male', 'assets/audio/soundFX/male grunt.mp3');
    this.load.audio('sfx-grunt-female', 'assets/audio/soundFX/female grunt.mp3');
    this.load.audio('sfx-ui', 'assets/audio/soundFX/UI button press.mp3');
    this.load.audio('sfx-synergy', 'assets/audio/soundFX/synergy.mp3');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
