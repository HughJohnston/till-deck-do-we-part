import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MenuScene } from '../scenes/MenuScene';
import { IntroScene } from '../scenes/IntroScene';
import { GameScene } from '../scenes/GameScene';
import { HudScene } from '../scenes/HudScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { LeaderboardScene } from '../scenes/LeaderboardScene';
import { HoneymoonInterstitialScene } from '../scenes/HoneymoonInterstitialScene';
import { AudioConsoleScene } from '../ui/AudioConsole';

export const FONT_FAMILY = 'Minecraft, monospace';

// Bump this on each deploy so the build can be identified on-device.
export const GAME_VERSION = 'v0.6.0';

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
  scene: [BootScene, PreloadScene, MenuScene, IntroScene, GameScene, HudScene, GameOverScene, HoneymoonInterstitialScene, LeaderboardScene, AudioConsoleScene],
  // Phaser drives the loop off requestAnimationFrame (matches the display, usually
  // 60Hz). target/min keep the simulation timestep stable so motion stays smooth
  // and degrades gracefully if a frame is slow rather than lurching.
  fps: {
    target: 60,
    min: 30,
    forceSetTimeOut: false,
  },
  render: {
    pixelArt: true,
    antialias: false,
    powerPreference: 'high-performance',
  },
  input: {
    activePointers: 1,
  },
  backgroundColor: '#87CEEB',
};
