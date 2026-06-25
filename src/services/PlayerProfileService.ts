const KEYS = {
  playerName: 'tilldeck_player_name',
  character: 'tilldeck_character',
} as const;

export const DEFAULT_PLAYER_NAME = 'Shrek';

export type SavedCharacter = 'wilf' | 'ruth';

function readString(key: string): string | null {
  try {
    const value = localStorage.getItem(key)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

function writeString(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getSavedPlayerName(): string | null {
  return readString(KEYS.playerName);
}

export function savePlayerName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  writeString(KEYS.playerName, trimmed.substring(0, 20));
}

export function getSavedCharacter(): SavedCharacter | null {
  const value = readString(KEYS.character);
  return value === 'wilf' || value === 'ruth' ? value : null;
}

export function saveCharacter(character: SavedCharacter) {
  writeString(KEYS.character, character);
}

export function resolvePlayerName(name: unknown): string {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return trimmed || getSavedPlayerName() || DEFAULT_PLAYER_NAME;
}

export function hasReturningProfile(): boolean {
  return Boolean(getSavedPlayerName());
}
