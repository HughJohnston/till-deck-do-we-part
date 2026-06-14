import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';

export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private synergyLetters: Phaser.GameObjects.Text[] = [];
  private gameScene!: Phaser.Scene;

  constructor() {
    super('HudScene');
  }

  init(data: { gameScene: Phaser.Scene }) {
    this.gameScene = data.gameScene;
  }

  create() {
    const w = this.scale.width;

    this.scoreText = this.add.text(w / 2, 12, 'Billable Hours: 0', {
      fontSize: '16px', color: '#ffffff', fontFamily: FONT_FAMILY,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0);

    this.multiplierText = this.add.text(w / 2, 34, '', {
      fontSize: '12px', color: '#FFD700', fontFamily: FONT_FAMILY,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0);

    const synergyStartX = 16;
    const letterSpacing = 20;
    const displayLetters = ['S', 'Y', 'N', 'E', 'R', 'G', 'Y'];
    for (let i = 0; i < displayLetters.length; i++) {
      // Base fill is white so a GPU tint renders the exact target color.
      const letter = this.add.text(synergyStartX + i * letterSpacing, 12, displayLetters[i], {
        fontSize: '14px', color: '#ffffff', fontFamily: FONT_FAMILY,
        stroke: '#000000', strokeThickness: 2,
      });
      letter.setTint(0x555555);
      this.synergyLetters.push(letter);
    }

    this.gameScene.events.on('score-update', (score: number, label: string, multiplier: number) => {
      this.scoreText.setText(`${label}: ${score}`);
      this.scoreText.setX(this.scale.width / 2);
      if (multiplier > 1) this.multiplierText.setText(`${multiplier}x SYNERGY!`);
      else this.multiplierText.setText('');
    });

    this.gameScene.events.on('synergy-letter', (progress: number) => {
      for (let i = 0; i < progress && i < this.synergyLetters.length; i++) {
        this.synergyLetters[i].setTint(0xFFD700);
      }
    });

    this.gameScene.events.on('synergy-complete', () => {
      for (const l of this.synergyLetters) l.setTint(0x555555);
    });

    this.gameScene.events.on('honeymoon-activated', () => {
      this.scoreText.setColor('#FF8844');
    });
  }
}
