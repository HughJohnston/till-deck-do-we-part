import Phaser from 'phaser';

const CONFETTI_COLORS = [0xffd700, 0xff6b6b, 0x4ecdc4, 0xff8844, 0x88dd88, 0xffffff, 0x4a90d9];

export function spawnConfetti(scene: Phaser.Scene, count = 80, depth = 100) {
  const w = scene.scale.width;
  const h = scene.scale.height;

  for (let i = 0; i < count; i++) {
    const x = Phaser.Math.Between(0, w);
    const y = Phaser.Math.Between(-h * 0.15, h * 0.05);
    const size = Phaser.Math.Between(4, 10);
    const piece = scene.add.rectangle(
      x, y, size, size * 1.4,
      Phaser.Utils.Array.GetRandom(CONFETTI_COLORS),
    ).setDepth(depth).setAngle(Phaser.Math.Between(0, 360));

    scene.tweens.add({
      targets: piece,
      y: h + 24,
      x: x + Phaser.Math.Between(-140, 140),
      angle: piece.angle + Phaser.Math.Between(-540, 540),
      duration: Phaser.Math.Between(2200, 4200),
      delay: Phaser.Math.Between(0, 900),
      ease: 'Cubic.easeIn',
      onComplete: () => piece.destroy(),
    });
  }
}
