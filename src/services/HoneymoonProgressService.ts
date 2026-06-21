import { difficultyConfig } from '../config/difficultyConfig';

const KEYS = {
  totalSlides: 'tilldeck_total_slides',
  unlocked: 'tilldeck_honeymoon_unlocked',
  interstitialSeen: 'tilldeck_honeymoon_interstitial_seen',
  playedOnce: 'tilldeck_honeymoon_played_once',
} as const;

function readInt(key: string): number {
  try { return parseInt(localStorage.getItem(key) || '0', 10); } catch { return 0; }
}

function readFlag(key: string): boolean {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}

function writeInt(key: string, value: number) {
  try { localStorage.setItem(key, String(value)); } catch { /* */ }
}

function writeFlag(key: string, value: boolean) {
  try { localStorage.setItem(key, value ? '1' : '0'); } catch { /* */ }
}

export function getTotalSlides(): number {
  return readInt(KEYS.totalSlides);
}

export function getSlidesToGo(): number {
  return Math.max(0, difficultyConfig.honeymoonUnlockThreshold - getTotalSlides());
}

export function isUnlocked(): boolean {
  return readFlag(KEYS.unlocked) || getTotalSlides() >= difficultyConfig.honeymoonUnlockThreshold;
}

export function hasSeenInterstitial(): boolean {
  return readFlag(KEYS.interstitialSeen);
}

export function markInterstitialSeen() {
  writeFlag(KEYS.interstitialSeen, true);
}

export function hasPlayedHoneymoonOnce(): boolean {
  return readFlag(KEYS.playedOnce);
}

export function markHoneymoonPlayed() {
  writeFlag(KEYS.playedOnce, true);
}

export function addRunSlides(score: number) {
  const total = getTotalSlides() + score;
  writeInt(KEYS.totalSlides, total);
  if (total >= difficultyConfig.honeymoonUnlockThreshold) {
    writeFlag(KEYS.unlocked, true);
  }
}

export function unlockHoneymoon() {
  writeInt(KEYS.totalSlides, difficultyConfig.honeymoonUnlockThreshold);
  writeFlag(KEYS.unlocked, true);
}

export function formatSlides(n: number): string {
  return n.toLocaleString('en-US');
}
