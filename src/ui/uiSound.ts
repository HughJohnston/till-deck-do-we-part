import Phaser from 'phaser';

const UI_SOUND_KEY = 'sfx-ui';
const UI_SOUND_VOLUME = 0.1;

// Plays a click sound whenever any interactive game object in the scene is pressed.
// Respects the global mute (scene.sound.mute) automatically.
export function registerUiSound(scene: Phaser.Scene) {
  scene.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, () => {
    if (scene.cache.audio.exists(UI_SOUND_KEY)) {
      scene.sound.play(UI_SOUND_KEY, { volume: UI_SOUND_VOLUME });
    }
  });
}
