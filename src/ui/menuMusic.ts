import Phaser from 'phaser';
import { isMuted } from './MuteButton';

const MENU_MUSIC_KEY = 'menu-bgm';
const MENU_MUSIC_VOLUME = 0.01;

// Plays the menu/score theme. The sound manager is game-global, so a single
// instance stays continuous across the menu, intro and game over scenes.
export function playMenuMusic(scene: Phaser.Scene) {
  if (!scene.cache.audio.exists(MENU_MUSIC_KEY)) return;
  scene.sound.mute = isMuted();

  let sound = scene.sound.get(MENU_MUSIC_KEY);
  if (!sound) {
    sound = scene.sound.add(MENU_MUSIC_KEY, { loop: true, volume: MENU_MUSIC_VOLUME });
  }
  if (!sound.isPlaying) {
    sound.play({ loop: true, volume: MENU_MUSIC_VOLUME });
  }
}

export function stopMenuMusic(scene: Phaser.Scene) {
  const sound = scene.sound.get(MENU_MUSIC_KEY);
  if (sound) sound.stop();
}
