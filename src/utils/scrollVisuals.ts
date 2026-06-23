import Phaser from 'phaser';

/** Snap tileScale to quarter steps so parallax texel rates stay predictable. */
export function quantizeTileScale(raw: number): number {
  return Math.max(0.25, Math.round(raw * 4) / 4);
}

/** TileSprite scroll in whole texture pixels (smooth with linear filtering). */
export function scrollTileLayer(
  layer: Phaser.GameObjects.TileSprite,
  scroll: number,
  parallax: number,
): void {
  const scale = layer.tileScaleX || 1;
  layer.tilePositionX = Math.floor((scroll * parallax) / scale);
}

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
