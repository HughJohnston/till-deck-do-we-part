import Phaser from 'phaser';
import { playSfx } from './sfxPlayer';

const UI_SOUND_KEY = 'sfx-ui';

// Plays a click sound whenever any interactive game object in the scene is
// pressed. Routed through the shared HTML5 sfx player (respects global mute).
export function registerUiSound(scene: Phaser.Scene) {
  scene.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, () => {
    playSfx(UI_SOUND_KEY);
  });
}
