import { isMuted } from './MuteButton';
import { getAudioVolume } from './AudioConsole';

// All sound effects play through raw HTML5 <audio> elements (the same approach
// as musicPlayer.ts) instead of Phaser's sound manager. On iOS, Phaser's
// WebAudio path silently fails to decode some MP3s and its HTML5 path fails to
// unlock, leaving SFX inconsistent or silent. Raw HTML5 Audio is the one engine
// proven to play reliably on the target devices.
//
// Each one-shot sound owns a small FIXED pool of elements created once at init.
// We never create new elements per play: iOS caps how many audio elements can
// play at once, and cloning a fresh element on every trigger (the old approach)
// eventually exhausts that budget so sounds silently stop part-way through a
// session. Reusing a bounded, pre-unlocked pool keeps playback reliable.

const SFX: Record<string, string> = {
  'sfx-jump': 'assets/audio/soundFX/Jump.mp3',
  'sfx-fart-1': 'assets/audio/soundFX/wilf_farts/fart1.mp3',
  'sfx-fart-2': 'assets/audio/soundFX/wilf_farts/fart2.mp3',
  'sfx-fart-3': 'assets/audio/soundFX/wilf_farts/fart3.mp3',
  'sfx-run': 'assets/audio/soundFX/Running loop.mp3',
  'sfx-collect': 'assets/audio/soundFX/good asset collect.mp3',
  'sfx-grunt-male': 'assets/audio/soundFX/male grunt.mp3',
  'sfx-grunt-female': 'assets/audio/soundFX/female grunt.mp3',
  'sfx-ui': 'assets/audio/soundFX/UI button press.mp3',
  'sfx-synergy': 'assets/audio/soundFX/synergy.mp3',
  'sfx-synergy-collect': 'assets/audio/soundFX/synergy collect.mp3',
};

const RUN_KEY = 'sfx-run';
const WILF_FART_KEYS = ['sfx-fart-1', 'sfx-fart-2', 'sfx-fart-3'] as const;

// How many simultaneous voices each one-shot needs. Collect fires in rapid
// bursts and benefits from overlap; everything else rarely overlaps itself.
const POOL_SIZES: Record<string, number> = {
  'sfx-collect': 4,
};
const DEFAULT_POOL_SIZE = 2;

const pools: Record<string, HTMLAudioElement[]> = {};
const nextIndex: Record<string, number> = {};
let runEl: HTMLAudioElement | null = null;

let initialised = false;
let unlocked = false;
let muted = false;

function createElement(path: string, loop: boolean): HTMLAudioElement {
  const a = new Audio(encodeURI(path));
  a.preload = 'auto';
  a.loop = loop;
  return a;
}

export function initSfx() {
  if (initialised) return;
  initialised = true;
  muted = isMuted();

  for (const [key, path] of Object.entries(SFX)) {
    if (key === RUN_KEY) {
      runEl = createElement(path, true);
      continue;
    }
    const size = POOL_SIZES[key] ?? DEFAULT_POOL_SIZE;
    pools[key] = Array.from({ length: size }, () => createElement(path, false));
    nextIndex[key] = 0;
  }

  bindUnlock();
}

function forEachElement(fn: (el: HTMLAudioElement) => void) {
  for (const pool of Object.values(pools)) {
    for (const el of pool) fn(el);
  }
  if (runEl) fn(runEl);
}

// iOS only lets an <audio> element start once it has been played inside a user
// gesture. SFX are triggered programmatically (collisions, timers), so we prime
// every pooled element on the first touch/click by briefly playing then pausing
// it. Because the pool is fixed, every element that will ever play is unlocked.
function bindUnlock() {
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchend', unlock);
    window.removeEventListener('keydown', unlock);
    forEachElement((el) => {
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      el.pause();
      el.currentTime = 0;
    });
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('touchend', unlock);
  window.addEventListener('keydown', unlock);
}

export function playJumpSfx(character: 'wilf' | 'ruth') {
  if (character === 'wilf') {
    const key = WILF_FART_KEYS[Math.floor(Math.random() * WILF_FART_KEYS.length)];
    playSfx(key, getAudioVolume('sfx-jump'));
  } else {
    playSfx('sfx-jump');
  }
}

export function playSfx(key: string, volume?: number) {
  if (muted) return;
  if (key === RUN_KEY) return;
  const pool = pools[key];
  if (!pool || pool.length === 0) return;

  // Prefer a free element; otherwise reuse the oldest in round-robin order.
  let el = pool.find((e) => e.paused || e.ended);
  if (!el) {
    const i = nextIndex[key];
    el = pool[i];
    nextIndex[key] = (i + 1) % pool.length;
  }

  el.volume = volume ?? getAudioVolume(key);
  el.muted = muted;
  el.currentTime = 0;
  const p = el.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

export function startRunSfx() {
  if (muted) return;
  if (!runEl) return;
  runEl.volume = getAudioVolume(RUN_KEY);
  runEl.muted = muted;
  if (runEl.paused) {
    const p = runEl.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }
}

export function stopRunSfx() {
  if (runEl && !runEl.paused) {
    runEl.pause();
    runEl.currentTime = 0;
  }
}

export function isRunSfxPlaying(): boolean {
  return !!runEl && !runEl.paused;
}

export function setSfxMuted(m: boolean) {
  muted = m;
  forEachElement((el) => { el.muted = m; });
  if (m) stopRunSfx();
}
