import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MenuScene } from '../scenes/MenuScene';
import { IntroScene } from '../scenes/IntroScene';
import { GameScene } from '../scenes/GameScene';
import { HudScene } from '../scenes/HudScene';
import { GameOverScene } from '../scenes/GameOverScene';

export const FONT_FAMILY = 'Minecraft, monospace';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
    width: '100%',
    height: '100%',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1400 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, MenuScene, IntroScene, GameScene, HudScene, GameOverScene],
  render: {
    pixelArt: true,
    antialias: false,
  },
  input: {
    activePointers: 1,
  },
  backgroundColor: '#87CEEB',
};
