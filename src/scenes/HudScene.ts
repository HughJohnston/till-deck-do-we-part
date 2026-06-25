import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { GameScene } from './GameScene';
import { isTouchDevice } from '../utils/device';

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
  private comboText!: Phaser.GameObjects.Text;
  private synergyLetters: Phaser.GameObjects.Text[] = [];
  private gameScene!: Phaser.Scene;
  private lastScoreStr = '';
  private lastScoreAt = 0;
  private personalBest = 0;
  private currentSynergyProgress = 0;
  private wasMultiplierActive = false;
  private synergyGlowTween?: Phaser.Tweens.Tween;

  constructor() {
    super('HudScene');
  }

  init(data: { gameScene: Phaser.Scene }) {
    this.gameScene = data.gameScene;
  }

  create() {
    this.synergyLetters = [];
    this.currentSynergyProgress = 0;
    this.wasMultiplierActive = false;

    const w = this.scale.width;
    const h = this.scale.height;
    const base = Math.min(w, h);
    this.personalBest = getPersonalBest();

    this.scoreText = this.add.text(w / 2, 112, 'Slides made: 0', {
      fontSize: '34px', color: '#ffffff', fontFamily: FONT_FAMILY,
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5, 0);

    this.bestText = this.add.text(w / 2, 152, `Your best: ${this.personalBest}`, {
      fontSize: '28px', color: '#ddddf0', fontFamily: FONT_FAMILY,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0);

    this.multiplierText = this.add.text(w / 2, 186, '', {
      fontSize: '24px', color: '#FFD700', fontFamily: FONT_FAMILY,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0);

    this.comboText = this.add.text(w / 2, 216, '', {
      fontSize: '18px', color: '#33dd55', fontFamily: FONT_FAMILY,
      stroke: '#0a3315', strokeThickness: 3,
    }).setOrigin(0.5, 0).setAlpha(0);

    const displayLetters = ['S', 'Y', 'N', 'E', 'R', 'G', 'Y'];
    const letterFontSize = Phaser.Math.Clamp(Math.round(base * 0.045), 16, 22);
    const letterSpacing = Phaser.Math.Clamp(Math.round(base * 0.065), 24, 30);
    const synergyWidth = (displayLetters.length - 1) * letterSpacing;
    const synergyStartX = w / 2 - synergyWidth / 2;
    for (let i = 0; i < displayLetters.length; i++) {
      const letter = this.add.text(synergyStartX + i * letterSpacing, 10, displayLetters[i], {
        fontSize: `${letterFontSize}px`, color: '#555555', fontFamily: FONT_FAMILY,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 0);
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
        this.bestText.setColor('#ddddf0');
      }
      this.bestText.setX(this.scale.width / 2);
      // setText is a no-op when the value is unchanged, so the (usually empty)
      // multiplier text costs nothing on the vast majority of frames.
      const multiplierActive = multiplier > 1;
      this.multiplierText.setText(multiplierActive ? `${multiplier}x SYNERGY!` : '');

      if (multiplierActive && !this.wasMultiplierActive) {
        this.startSynergyGlow();
        this.applySynergyDisplay(this.currentSynergyProgress, true);
      } else if (!multiplierActive && this.wasMultiplierActive) {
        this.stopSynergyGlow();
        this.applySynergyDisplay(this.currentSynergyProgress, false);
      } else if (multiplierActive) {
        this.applySynergyDisplay(this.currentSynergyProgress, true);
      }
      this.wasMultiplierActive = multiplierActive;
    });

    this.gameScene.events.on('collect-streak', (streak: number) => {
      if (streak < 2) return;
      this.comboText.setText(`x${streak} combo!`);
      this.comboText.setX(this.scale.width / 2);
      this.comboText.setAlpha(1);
      this.tweens.killTweensOf(this.comboText);
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 900,
        delay: 400,
        ease: 'Cubic.easeOut',
      });
    });

    this.gameScene.events.on('synergy-letter', (progress: number) => {
      this.currentSynergyProgress = progress;
      this.applySynergyDisplay(progress, this.wasMultiplierActive);
    });

    this.gameScene.events.on('synergy-complete', () => {
      this.currentSynergyProgress = 0;
    });

    const gs = this.gameScene as GameScene;
    if (gs.scoreManager?.isHoneymoonMode) {
      this.scoreText.setColor('#FF8844');
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopSynergyGlow();
      this.synergyLetters = [];
    });

    this.showJumpTutorial();
  }

  private applySynergyDisplay(progress: number, multiplierActive: boolean) {
    for (let i = 0; i < this.synergyLetters.length; i++) {
      const filled = multiplierActive || i < progress;
      this.synergyLetters[i].setColor(filled ? '#FFD700' : '#555555');
    }
  }

  private startSynergyGlow() {
    this.stopSynergyGlow();
    for (const letter of this.synergyLetters) {
      letter.setScale(1);
      letter.setAlpha(1);
    }
    this.synergyGlowTween = this.tweens.add({
      targets: this.synergyLetters,
      alpha: { from: 0.75, to: 1 },
      scale: { from: 1, to: 1.08 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopSynergyGlow() {
    this.synergyGlowTween?.stop();
    this.synergyGlowTween = undefined;
    this.tweens.killTweensOf(this.synergyLetters);
    for (const letter of this.synergyLetters) {
      letter.setAlpha(1);
      letter.setScale(1);
    }
  }

  private showJumpTutorial() {
    const w = this.scale.width;
    const h = this.scale.height;
    const lines = isTouchDevice()
      ? 'tap = jump\ntap twice = double jump'
      : 'click / space = jump\nclick twice = double jump';
    const tutorial = this.add.text(w / 2, h * 0.58, lines, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: FONT_FAMILY,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: tutorial,
      alpha: 0,
      delay: 1500,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => tutorial.destroy(),
    });
  }
}
