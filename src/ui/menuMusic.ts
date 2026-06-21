import Phaser from 'phaser';
import { playMusic, stopMusic } from './musicPlayer';

// The menu/score theme streams via the shared HTML5 music player, which keeps a
// single element alive across the menu, intro and game over scenes.
export function playMenuMusic(_scene: Phaser.Scene) {
  playMusic('menu-bgm');
}

export function stopMenuMusic(_scene: Phaser.Scene) {
  stopMusic();
}
