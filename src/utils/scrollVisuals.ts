import Phaser from 'phaser';

/** Linear filtering on backgrounds only — smooth parallax scroll without affecting sprite crispness. */
export function setBackgroundLinearFilter(
  textures: Phaser.Textures.TextureManager,
  keys: string[],
): void {
  for (const key of keys) {
    if (textures.exists(key)) {
      textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
  }
}
