import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { playMenuMusic } from '../ui/menuMusic';

const STORY_CARDS = [
  'Till Deck Do Us!',
  'Wilf & Ruth are late\nfor their honeymoon.',
  "But they're stuck at work.",
  'Help them finish their\npresentation deck and escape!',
  'Collect items that\nboost productivity.',
  'Avoid distractions.',
  'Better deck = more\nbillable hours.',
  'Honeymoon =\n1,000,000 billable hours.',
];

export class IntroScene extends Phaser.Scene {
  private cardIndex = 0;
  private cardText!: Phaser.GameObjects.Text;
  private canAdvance = true;

  constructor() {
    super('IntroScene');
  }

  create() {
    this.cardIndex = 0;
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x1a1a2e);

    this.cardText = this.add.text(w / 2, h / 2 - 20, STORY_CARDS[0], {
      fontSize: '20px', color: '#ffffff', fontFamily: FONT_FAMILY, align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);

    const base = Math.min(w, h);
    const fontBtn = Phaser.Math.Clamp(Math.round(base * 0.048), 16, 24);
    const fontSm = Phaser.Math.Clamp(Math.round(base * 0.028), 10, 16);
    const btnH = Phaser.Math.Clamp(Math.round(base * 0.06), 38, 50);
    const btnW = Phaser.Math.Clamp(Math.round(w * 0.42), 140, 200);

    const continueY = h - btnH - fontSm - 26;
    const continueBtn = this.add.rectangle(w / 2, continueY, btnW, btnH, 0x22AA44)
      .setStrokeStyle(2, 0x33CC55)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, continueY, 'CONTINUE', {
      fontSize: `${fontBtn}px`, color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    continueBtn.on('pointerdown', () => { if (this.canAdvance) this.advanceCard(); });
    continueBtn.on('pointerover', () => continueBtn.setFillStyle(0x33BB55));
    continueBtn.on('pointerout', () => continueBtn.setFillStyle(0x22AA44));

    const skipBtn = this.add.text(w / 2, continueY + btnH / 2 + fontSm + 6, 'Skip', {
      fontSize: `${fontSm}px`, color: '#888899', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerdown', () => this.startGame());
    skipBtn.on('pointerover', () => skipBtn.setColor('#aaaacc'));
    skipBtn.on('pointerout', () => skipBtn.setColor('#888899'));

    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.includes(skipBtn) || over.includes(continueBtn)) return;
      if (!this.canAdvance) return;
      this.advanceCard();
    });

    this.input.keyboard?.on('keydown-SPACE', () => this.advanceCard());
    createMuteButton(this);
    registerUiSound(this);
    playMenuMusic(this);
  }

  private advanceCard() {
    this.cardIndex++;
    if (this.cardIndex >= STORY_CARDS.length) { this.startGame(); return; }
    this.canAdvance = false;
    this.tweens.add({
      targets: this.cardText, alpha: 0, duration: 200,
      onComplete: () => {
        this.cardText.setText(STORY_CARDS[this.cardIndex]);
        this.tweens.add({ targets: this.cardText, alpha: 1, duration: 200,
          onComplete: () => { this.canAdvance = true; },
        });
      },
    });
  }

  private startGame() { this.scene.start('GameScene'); }
}
