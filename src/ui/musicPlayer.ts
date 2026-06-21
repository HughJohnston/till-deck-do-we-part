import { isMuted } from './MuteButton';
import { getAudioVolume } from './AudioConsole';

// Background music is played through a streaming HTML5 <audio> element instead
// of Phaser's WebAudio. iOS WebAudio decodes the entire file into memory before
// playing, which fails for long tracks (our music is several minutes long), so
// the music silently never starts on iPhone. HTML5 audio streams the file and
// has no such limit. Short SFX keep using Phaser/WebAudio (handles concurrency).

const TRACKS: Record<string, string> = {
  'menu-bgm': 'assets/audio/music/Wedding March Chiptune 8 Bit.mp3',
  bgm: 'assets/audio/music/All Star - 8B.mp3',
  'honeymoon-bgm': 'assets/audio/music/Crashed the wedding 8 bit.mp3',
};

let el: HTMLAudioElement | null = null;
let currentKey: string | null = null;
let gestureBound = false;

function resolveUrl(path: string): string {
  // Relative path, resolved against the document URL exactly like Phaser's
  // loader does (so it works under the GitHub Pages base path too).
  return encodeURI(path);
}

function attemptPlay() {
  if (!el) return;
  const result = el.play();
  if (result && typeof result.catch === 'function') {
    // Autoplay was blocked (mobile): retry on the next user gesture.
    result.catch(() => bindGestureRetry());
  }
}

function bindGestureRetry() {
  if (gestureBound) return;
  gestureBound = true;
  const retry = () => {
    gestureBound = false;
    window.removeEventListener('pointerdown', retry);
    window.removeEventListener('touchend', retry);
    if (el && el.paused) attemptPlay();
  };
  window.addEventListener('pointerdown', retry, { once: true });
  window.addEventListener('touchend', retry, { once: true });
}

export function playMusic(key: string) {
  if (currentKey === key && el && !el.paused) return;
  const path = TRACKS[key];
  if (!path) return;

  if (el) {
    el.pause();
    el.src = '';
    el = null;
  }

  currentKey = key;
  el = new Audio(resolveUrl(path));
  el.loop = true;
  el.preload = 'auto';
  el.volume = getAudioVolume(key);
  el.muted = isMuted();
  attemptPlay();
}

export function stopMusic() {
  if (el) el.pause();
  currentKey = null;
}

export function setMusicMuted(muted: boolean) {
  if (el) el.muted = muted;
}
