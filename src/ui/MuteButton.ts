import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { setMusicMuted } from './musicPlayer';
import { setSfxMuted } from './sfxPlayer';

const STORAGE_KEY = 'tilldeck_muted';

export function isMuted(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

function saveMuted(muted: boolean) {
  try { localStorage.setItem(STORAGE_KEY, muted ? '1' : '0'); } catch { /* */ }
}

export function createMuteButton(scene: Phaser.Scene): Phaser.GameObjects.Text {
  const w = scene.scale.width;
  const muted = isMuted();
  scene.sound.mute = muted;
  setMusicMuted(muted);
  setSfxMuted(muted);

  const btn = scene.add.text(w - 12, 12, muted ? '🔇' : '🔊', {
    fontSize: '20px',
    fontFamily: FONT_FAMILY,
  }).setOrigin(1, 0)
    .setInteractive({ useHandCursor: true })
    .setScrollFactor(0)
    .setDepth(1000);

  btn.on('pointerdown', () => {
    const nowMuted = !scene.sound.mute;
    scene.sound.mute = nowMuted;
    setMusicMuted(nowMuted);
    setSfxMuted(nowMuted);
    saveMuted(nowMuted);
    btn.setText(nowMuted ? '🔇' : '🔊');
  });

  scene.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
    btn.setX(gameSize.width - 12);
  });

  return btn;
}
