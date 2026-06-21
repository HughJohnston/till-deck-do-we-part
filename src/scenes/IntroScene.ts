import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { registerAudioConsole } from '../ui/AudioConsole';
import { playMenuMusic } from '../ui/menuMusic';
import { createButton } from '../ui/Button';

interface StoryCard {
  image: string;
  text: string;
}

const STORY_CARDS: StoryCard[] = [
  { image: 'comic-1', text: 'Wilf and Ruth are stuck at work!' },
  { image: 'comic-2', text: "and they're late for their honeymoon!" },
  { image: 'comic-3', text: 'Help them finish their deck!' },
  { image: 'comic-4', text: 'Collect productivity boosts!' },
  { image: 'comic-5', text: 'Dodge distractions' },
  { image: 'comic-6', text: 'Make 10,000 slides = unlock honeymoon' },
];

export class IntroScene extends Phaser.Scene {
  private cardIndex = 0;
  private bg!: Phaser.GameObjects.Image;
  private comicImage!: Phaser.GameObjects.Image;
  private cardText!: Phaser.GameObjects.Text;
  private canAdvance = true;
  private resizeHandler?: (gameSize: Phaser.Structs.Size) => void;

  constructor() {
    super('IntroScene');
  }

  create() {
    this.cardIndex = 0;
    const w = this.scale.width;
    const h = this.scale.height;

    // Cover the whole screen, keeping aspect, so there are never letterbox bars.
    // Re-cover on resize because mobile Safari grows the viewport after the URL
    // bar hides, which otherwise leaves gaps at the top/bottom.
    this.bg = this.add.image(w / 2, h / 2, 'menu-home-faded').setOrigin(0.5);
    this.coverBackground(w, h);
    this.resizeHandler = (gameSize) => this.coverBackground(gameSize.width, gameSize.height);
    this.scale.on('resize', this.resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off('resize', this.resizeHandler);
    });

    const imgSize = Phaser.Math.Clamp(Math.min(w * 0.7, h * 0.42) * 1.4, 140, 588);
    const imgCenterY = h * 0.08 + imgSize / 2;
    this.comicImage = this.add.image(w / 2, imgCenterY, STORY_CARDS[0].image)
      .setOrigin(0.5)
      .setDisplaySize(imgSize, imgSize);

    const captionY = imgCenterY + imgSize / 2 + Math.max(20, h * 0.03);
    this.cardText = this.add.text(w / 2, captionY, STORY_CARDS[0].text, {
      fontSize: '30px', color: '#ffffff', fontFamily: FONT_FAMILY, align: 'center', lineSpacing: 8,
      wordWrap: { width: w * 0.9 },
    }).setOrigin(0.5, 0);

    const base = Math.min(w, h);
    const fontBtn = Phaser.Math.Clamp(Math.round(base * 0.048), 16, 24);
    const btnH = Phaser.Math.Clamp(Math.round(base * 0.06), 38, 50);
    const btnW = Phaser.Math.Clamp(Math.round(w * 0.42), 140, 200);
    const stackGap = Math.max(10, h * 0.015);

    // Two stacked, full-size buttons near the bottom: Continue (primary) above Skip (tertiary).
    const skipY = h - btnH / 2 - Math.max(24, h * 0.04);
    const continueY = skipY - btnH - stackGap;

    const continueBtn = createButton(this, {
      x: w / 2, y: continueY, width: btnW, height: btnH,
      label: 'CONTINUE', variant: 'primary', fontSize: fontBtn,
      onClick: () => { if (this.canAdvance) this.advanceCard(); },
    });

    const skipBtn = createButton(this, {
      x: w / 2, y: skipY, width: btnW, height: btnH,
      label: 'Skip', variant: 'tertiary', fontSize: fontBtn,
      onClick: () => this.startGame(),
    });

    const buttonObjects = [...continueBtn.getObjects(), ...skipBtn.getObjects()];
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.some((obj) => buttonObjects.includes(obj))) return;
      if (!this.canAdvance) return;
      this.advanceCard();
    });

    this.input.keyboard?.on('keydown-SPACE', () => this.advanceCard());
    createMuteButton(this);
    registerUiSound(this);
    registerAudioConsole(this);
    playMenuMusic(this);
  }

  private coverBackground(w: number, h: number) {
    // Use the texture's real dimensions so cover-scaling stays correct even if
    // the source image is later resized.
    const scale = Math.max(w / this.bg.width, h / this.bg.height);
    this.bg.setPosition(w / 2, h / 2).setScale(scale);
  }

  private advanceCard() {
    this.cardIndex++;
    if (this.cardIndex >= STORY_CARDS.length) { this.startGame(); return; }
    this.canAdvance = false;
    const card = STORY_CARDS[this.cardIndex];
    this.tweens.add({
      targets: [this.comicImage, this.cardText], alpha: 0, duration: 200,
      onComplete: () => {
        this.comicImage.setTexture(card.image);
        this.cardText.setText(card.text);
        this.tweens.add({ targets: [this.comicImage, this.cardText], alpha: 1, duration: 200,
          onComplete: () => { this.canAdvance = true; },
        });
      },
    });
  }

  private startGame() { this.scene.start('GameScene'); }
}
