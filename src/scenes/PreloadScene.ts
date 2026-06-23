import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import {
  playerSprites,
  wilfAnimFrames,
  ruthAnimFrames,
  workGoodImages,
  workBadImages,
  playGoodImages,
  playBadImages,
  synergyLetters,
  backgroundImages,
  uiImages,
  menuImages,
  comicImages,
} from '../config/assetManifest';
import { initSfx } from '../ui/sfxPlayer';
import { setBackgroundLinearFilter } from '../utils/scrollVisuals';

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

    for (const animFrames of [wilfAnimFrames, ruthAnimFrames]) {
      for (const frames of Object.values(animFrames)) {
        for (const frame of frames) {
          this.load.image(frame.key, frame.path);
        }
      }
    }

    const allImages = [...workGoodImages, ...workBadImages, ...playGoodImages, ...playBadImages, ...synergyLetters, ...backgroundImages, ...uiImages, ...menuImages, ...comicImages];
    for (const img of allImages) {
      this.load.image(img.key, img.path);
    }

    // Music streams via an HTML5 <audio> element (see musicPlayer.ts), so it is
    // intentionally NOT loaded through Phaser/WebAudio here: iOS fails to decode
    // these multi-minute tracks into memory, which silently breaks playback.
    this.load.audio('sfx-jump', 'assets/audio/soundFX/Jump.mp3');
    this.load.audio('sfx-run', 'assets/audio/soundFX/Running loop.mp3');
    this.load.audio('sfx-collect', 'assets/audio/soundFX/good asset collect.mp3');
    this.load.audio('sfx-grunt-male', 'assets/audio/soundFX/male grunt.mp3');
    this.load.audio('sfx-grunt-female', 'assets/audio/soundFX/female grunt.mp3');
    this.load.audio('sfx-ui', 'assets/audio/soundFX/UI button press.mp3');
    this.load.audio('sfx-synergy', 'assets/audio/soundFX/synergy.mp3');
  }

  create() {
    setBackgroundLinearFilter(
      this.textures,
      backgroundImages.map((img) => img.key),
    );
    initSfx();
    this.scene.start('MenuScene');
  }
}
