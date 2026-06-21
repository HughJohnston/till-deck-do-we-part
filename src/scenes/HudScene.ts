import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { GameScene } from './GameScene';

// The score climbs every frame, but re-rasterizing the Text to a GPU texture
// 60x/sec is a real per-frame cost on mobile. Refreshing ~12x/sec is visually
// indistinguishable for a counter and removes that work from most frames.
const SCORE_REFRESH_MS = 80;

function getPersonalBest(): number {
  try { return parseInt(localStorage.getItem('tilldeck_topscore') || '0', 10); } catch { return 0; }
}

export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private synergyLetters: Phaser.GameObjects.Text[] = [];
  private gameScene!: Phaser.Scene;
  private lastScoreStr = '';
  private lastScoreAt = 0;
  private personalBest = 0;

  constructor() {
    super('HudScene');
  }

  init(data: { gameScene: Phaser.Scene }) {
    this.gameScene = data.gameScene;
  }

  create() {
    const w = this.scale.width;
    this.personalBest = getPersonalBest();

    this.scoreText = this.add.text(w / 2, 112, 'Slides made: 0', {
      fontSize: '34px', color: '#ffffff', fontFamily: FONT_FAMILY,
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5, 0);

    this.bestText = this.add.text(w / 2, 152, `Your best: ${this.personalBest}`, {
      fontSize: '14px', color: '#aaaacc', fontFamily: FONT_FAMILY,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0);

    this.multiplierText = this.add.text(w / 2, 178, '', {
      fontSize: '24px', color: '#FFD700', fontFamily: FONT_FAMILY,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0);

    const displayLetters = ['S', 'Y', 'N', 'E', 'R', 'G', 'Y'];
    const letterSpacing = 20;
    const synergyWidth = (displayLetters.length - 1) * letterSpacing;
    const synergyStartX = w / 2 - synergyWidth / 2;
    for (let i = 0; i < displayLetters.length; i++) {
      // Base fill is white so a GPU tint renders the exact target color.
      const letter = this.add.text(synergyStartX + i * letterSpacing, 12, displayLetters[i], {
        fontSize: '14px', color: '#ffffff', fontFamily: FONT_FAMILY,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 0);
      letter.setTint(0x555555);
      this.synergyLetters.push(letter);
    }

    this.gameScene.events.on('score-update', (score: number, label: string, multiplier: number) => {
      const str = `${label}: ${score}`;
      if (str !== this.lastScoreStr && this.time.now - this.lastScoreAt >= SCORE_REFRESH_MS) {
        this.lastScoreStr = str;
        this.lastScoreAt = this.time.now;
        this.scoreText.setText(str);
        this.scoreText.setX(this.scale.width / 2);
      }
      if (score > this.personalBest) {
        this.bestText.setText('NEW PB!');
        this.bestText.setColor('#FFD700');
      } else {
        this.bestText.setText(`Your best: ${this.personalBest}`);
        this.bestText.setColor('#aaaacc');
      }
      this.bestText.setX(this.scale.width / 2);
      // setText is a no-op when the value is unchanged, so the (usually empty)
      // multiplier text costs nothing on the vast majority of frames.
      this.multiplierText.setText(multiplier > 1 ? `${multiplier}x SYNERGY!` : '');
    });

    this.gameScene.events.on('synergy-letter', (progress: number) => {
      for (let i = 0; i < progress && i < this.synergyLetters.length; i++) {
        this.synergyLetters[i].setTint(0xFFD700);
      }
    });

    this.gameScene.events.on('synergy-complete', () => {
      for (const l of this.synergyLetters) l.setTint(0x555555);
    });

    const gs = this.gameScene as GameScene;
    if (gs.scoreManager?.isHoneymoonMode) {
      this.scoreText.setColor('#FF8844');
    }
  }
}
