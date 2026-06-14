import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { playMenuMusic } from '../ui/menuMusic';

type VisibleGameObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

interface MenuLayout {
  w: number;
  h: number;
  cx: number;
  titleY: number;
  titleHeight: number;
  titleWidth: number;
  subtitleY: number;
  subtitleSize: number;
  contentTop: number;
  contentHeight: number;
  btnY: number;
  btnW: number;
  btnH: number;
  fontSm: number;
  fontMd: number;
  fontLg: number;
  fontBtn: number;
}

export class MenuScene extends Phaser.Scene {
  private step: 1 | 2 = 1;
  private selectedCharacter: 'wilf' | 'ruth' = 'wilf';
  private bg!: Phaser.GameObjects.Rectangle;
  private titleImage!: Phaser.GameObjects.Image;
  private subtitle!: Phaser.GameObjects.Text;
  private nameLabel!: Phaser.GameObjects.Text;
  private nameBox!: Phaser.GameObjects.Rectangle;
  private nameDisplay!: Phaser.GameObjects.Text;
  private nextBtn!: Phaser.GameObjects.Rectangle;
  private nextText!: Phaser.GameObjects.Text;
  private charLabel!: Phaser.GameObjects.Text;
  private wilfImage!: Phaser.GameObjects.Image;
  private ruthImage!: Phaser.GameObjects.Image;
  private wilfFrame!: Phaser.GameObjects.Rectangle;
  private ruthFrame!: Phaser.GameObjects.Rectangle;
  private wilfName!: Phaser.GameObjects.Text;
  private ruthName!: Phaser.GameObjects.Text;
  private playBtn!: Phaser.GameObjects.Rectangle;
  private playText!: Phaser.GameObjects.Text;
  private backText!: Phaser.GameObjects.Text;
  private nameStepObjects: VisibleGameObject[] = [];
  private charStepObjects: VisibleGameObject[] = [];
  private playerName = '';
  private cursorVisible = true;
  private cursorTimer?: Phaser.Time.TimerEvent;
  private keyboardHandler?: (event: KeyboardEvent) => void;
  private resizeHandler?: (gameSize: Phaser.Structs.Size) => void;

  constructor() {
    super('MenuScene');
  }

  create() {
    this.playerName = '';
    this.step = 1;
    const layout = this.computeLayout(this.scale.width, this.scale.height);

    this.bg = this.add.rectangle(layout.cx, layout.h / 2, layout.w, layout.h, 0x1a1a2e);

    this.titleImage = this.add.image(layout.cx, 0, 'menu-title').setOrigin(0.5);
    this.subtitle = this.add.text(layout.cx, 0, 'Help Wilf and Ruth finish work\n& depart on their honeymoon!', {
      color: '#aaaacc', fontFamily: FONT_FAMILY, align: 'center',
    }).setOrigin(0.5);

    this.nameLabel = this.add.text(layout.cx, 0, 'Your name *', {
      color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.nameBox = this.add.rectangle(layout.cx, 0, 220, 32, 0x2C2C3E)
      .setStrokeStyle(2, 0x4A90D9)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        const name = prompt('Enter your name:', this.playerName);
        if (name !== null) {
          this.playerName = name.substring(0, 20);
          this.updateNameDisplay();
          this.updateNextButton();
        }
      });

    this.nameDisplay = this.add.text(layout.cx, 0, '', {
      color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.cursorTimer = this.time.addEvent({
      delay: 500, loop: true,
      callback: () => { this.cursorVisible = !this.cursorVisible; this.updateNameDisplay(); },
    });

    this.nextBtn = this.add.rectangle(layout.cx, 0, layout.btnW, layout.btnH, 0x555555)
      .setStrokeStyle(2, 0x666666);
    this.nextText = this.add.text(layout.cx, 0, 'NEXT', {
      color: '#999999', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.nameStepObjects = [
      this.nameLabel, this.nameBox, this.nameDisplay, this.nextBtn, this.nextText,
    ];

    this.charLabel = this.add.text(layout.cx, 0, 'Select your spouse:', {
      color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.wilfImage = this.add.image(0, 0, 'menu-wilf');
    this.wilfFrame = this.add.rectangle(0, 0, 100, 100, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(3, 0xFFD700);
    this.wilfName = this.add.text(0, 0, 'WILF', {
      color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.ruthImage = this.add.image(0, 0, 'menu-ruth');
    this.ruthFrame = this.add.rectangle(0, 0, 100, 100, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(3, 0x444466);
    this.ruthName = this.add.text(0, 0, 'RUTH', {
      color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.wilfFrame.on('pointerdown', () => this.selectCharacter('wilf'));
    this.ruthFrame.on('pointerdown', () => this.selectCharacter('ruth'));

    this.playBtn = this.add.rectangle(layout.cx, 0, layout.btnW, layout.btnH, 0x22AA44)
      .setStrokeStyle(2, 0x33CC55)
      .setInteractive({ useHandCursor: true });
    this.playText = this.add.text(layout.cx, 0, 'PLAY', {
      color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.playBtn.on('pointerdown', () => this.startGame());
    this.playBtn.on('pointerover', () => this.playBtn.setFillStyle(0x33BB55));
    this.playBtn.on('pointerout', () => this.playBtn.setFillStyle(0x22AA44));

    this.backText = this.add.text(layout.cx, 0, '← Back', {
      color: '#888899', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.backText.on('pointerdown', () => this.showStep(1));
    this.backText.on('pointerover', () => this.backText.setColor('#aaaacc'));
    this.backText.on('pointerout', () => this.backText.setColor('#888899'));

    this.charStepObjects = [
      this.charLabel, this.wilfImage, this.wilfFrame, this.wilfName,
      this.ruthImage, this.ruthFrame, this.ruthName, this.playBtn, this.playText, this.backText,
    ];

    this.selectCharacter('wilf');
    this.updateNameDisplay();
    this.updateNextButton();
    this.applyLayout(layout);
    this.showStep(1);
    registerUiSound(this);
    playMenuMusic(this);

    this.resizeHandler = (gameSize) => this.applyLayout(this.computeLayout(gameSize.width, gameSize.height));
    this.scale.on('resize', this.resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off('resize', this.resizeHandler);
    });

    createMuteButton(this);
  }

  private computeLayout(w: number, h: number): MenuLayout {
    const cx = w / 2;
    const base = Math.min(w, h);
    const fontSm = Phaser.Math.Clamp(Math.round(base * 0.028), 10, 16);
    const fontMd = Phaser.Math.Clamp(Math.round(base * 0.034), 12, 18);
    const fontLg = Phaser.Math.Clamp(Math.round(base * 0.04), 14, 20);
    const fontBtn = Phaser.Math.Clamp(Math.round(base * 0.048), 16, 24);
    const btnH = Phaser.Math.Clamp(Math.round(base * 0.06), 38, 50);
    const btnW = Phaser.Math.Clamp(Math.round(w * 0.42), 140, 200);

    const titleAspect = 1458 / 1208;
    const titleY = h * 0.02;
    const titleHeight = Math.min(
      Math.min(h * 0.18, 140) * 2.5,
      h * 0.28,
      (w * 0.92) / titleAspect,
    );
    const titleWidth = titleHeight * titleAspect;
    const subtitleSize = fontMd;
    const subtitleY = titleY + titleHeight + Math.max(10, h * 0.012);
    const subtitleBlock = subtitleSize * 2 + 8;
    const footerReserve = btnH + fontSm + Math.max(24, h * 0.04);
    const contentTop = subtitleY + subtitleBlock / 2 + Math.max(12, h * 0.02);
    const contentHeight = Math.max(120, h - contentTop - footerReserve);
    const btnY = h - footerReserve + btnH / 2 + Math.max(8, h * 0.01);

    return {
      w, h, cx, titleY, titleHeight, titleWidth, subtitleY, subtitleSize,
      contentTop, contentHeight, btnY, btnW, btnH, fontSm, fontMd, fontLg, fontBtn,
    };
  }

  private applyLayout(layout: MenuLayout) {
    const {
      w, h, cx, contentTop, contentHeight, btnY, btnW, btnH,
      fontSm, fontMd, fontLg, fontBtn,
    } = layout;

    this.bg.setPosition(cx, h / 2).setSize(w, h);

    this.titleImage
      .setPosition(cx, layout.titleY + layout.titleHeight / 2)
      .setDisplaySize(layout.titleWidth, layout.titleHeight);

    this.subtitle
      .setPosition(cx, layout.subtitleY)
      .setFontSize(`${layout.subtitleSize}px`)
      .setLineSpacing(Math.round(layout.subtitleSize * 0.35));

    const nameBlockHeight = fontMd + fontLg + 40;
    const nameY = contentTop + (contentHeight - nameBlockHeight) / 2 + fontMd / 2;

    this.nameLabel.setPosition(cx, nameY).setFontSize(`${fontMd}px`);
    this.nameBox.setPosition(cx, nameY + fontMd / 2 + 20).setSize(Math.min(260, w * 0.7), btnH * 0.7);
    this.nameDisplay.setPosition(cx, nameY + fontMd / 2 + 20).setFontSize(`${fontLg}px`);
    this.nextBtn.setPosition(cx, btnY).setSize(btnW, btnH);
    this.nextText.setPosition(cx, btnY).setFontSize(`${fontBtn}px`);

    const labelGap = Math.max(16, contentHeight * 0.06);
    const nameGap = Math.max(12, fontSm + 4);
    const horizontalGap = Math.max(20, w * 0.05);
    const labelHeight = fontMd + 4;
    const nameLabelHeight = fontSm + 8;
    const maxPortraitByWidth = (w * 0.92 - horizontalGap) / 2;
    const maxPortraitByHeight = contentHeight - labelHeight - nameLabelHeight - labelGap - nameGap;
    const portraitSize = Phaser.Math.Clamp(
      Math.min(maxPortraitByWidth, maxPortraitByHeight),
      56,
      160,
    );
    const frameSize = portraitSize + 10;
    const spacing = portraitSize + horizontalGap;

    const charBlockHeight = labelHeight + labelGap + portraitSize + nameGap + nameLabelHeight;
    const charBlockTop = contentTop + Math.max(0, (contentHeight - charBlockHeight) / 2);
    const charLabelY = charBlockTop + labelHeight / 2;
    const charY = charBlockTop + labelHeight + labelGap + portraitSize / 2;
    const charNameY = charY + portraitSize / 2 + nameGap + nameLabelHeight / 2;

    this.charLabel.setPosition(cx, charLabelY).setFontSize(`${fontMd}px`);

    this.wilfImage.setPosition(cx - spacing / 2, charY).setDisplaySize(portraitSize, portraitSize);
    this.wilfFrame.setPosition(cx - spacing / 2, charY).setSize(frameSize, frameSize);
    this.wilfName.setPosition(cx - spacing / 2, charNameY).setFontSize(`${fontSm}px`);

    this.ruthImage.setPosition(cx + spacing / 2, charY).setDisplaySize(portraitSize, portraitSize);
    this.ruthFrame.setPosition(cx + spacing / 2, charY).setSize(frameSize, frameSize);
    this.ruthName.setPosition(cx + spacing / 2, charNameY).setFontSize(`${fontSm}px`);

    this.playBtn.setPosition(cx, btnY).setSize(btnW, btnH);
    this.playText.setPosition(cx, btnY).setFontSize(`${fontBtn}px`);
    this.backText.setPosition(cx, btnY + btnH / 2 + fontSm + 6).setFontSize(`${fontSm}px`);
  }

  private showStep(step: 1 | 2) {
    this.step = step;
    this.nameStepObjects.forEach((obj) => obj.setVisible(step === 1));
    this.charStepObjects.forEach((obj) => obj.setVisible(step === 2));

    if (this.keyboardHandler) {
      this.input.keyboard?.off('keydown', this.keyboardHandler);
    }

    this.keyboardHandler = (event: KeyboardEvent) => {
      if (step === 1) {
        if (event.key === 'Backspace') this.playerName = this.playerName.slice(0, -1);
        else if (event.key === 'Enter') { this.goToCharStep(); return; }
        else if (event.key.length === 1 && this.playerName.length < 20) this.playerName += event.key;
        this.updateNameDisplay();
        this.updateNextButton();
      } else if (event.key === 'Enter') {
        this.startGame();
      }
    };
    this.input.keyboard?.on('keydown', this.keyboardHandler);
  }

  private updateNameDisplay() {
    const cursor = this.cursorVisible ? '|' : '';
    if (this.playerName.length === 0 && !this.cursorVisible) {
      this.nameDisplay.setText('Enter name...');
      this.nameDisplay.setColor('#666688');
    } else {
      this.nameDisplay.setText(this.playerName + cursor);
      this.nameDisplay.setColor('#ffffff');
    }
  }

  private updateNextButton() {
    const hasName = this.playerName.trim().length > 0;
    if (hasName) {
      this.nextBtn.setFillStyle(0x22AA44).setStrokeStyle(2, 0x33CC55).setInteractive({ useHandCursor: true });
      this.nextText.setColor('#ffffff');
      this.nextBtn.off('pointerdown');
      this.nextBtn.on('pointerdown', () => this.goToCharStep());
      this.nextBtn.on('pointerover', () => this.nextBtn.setFillStyle(0x33BB55));
      this.nextBtn.on('pointerout', () => this.nextBtn.setFillStyle(0x22AA44));
    } else {
      this.nextBtn.setFillStyle(0x555555).setStrokeStyle(2, 0x666666).removeInteractive();
      this.nextText.setColor('#999999');
    }
  }

  private goToCharStep() {
    if (!this.playerName.trim()) return;
    this.showStep(2);
  }

  private selectCharacter(character: 'wilf' | 'ruth') {
    this.selectedCharacter = character;
    this.wilfFrame.setStrokeStyle(3, character === 'wilf' ? 0xFFD700 : 0x444466);
    this.ruthFrame.setStrokeStyle(3, character === 'ruth' ? 0xFFD700 : 0x444466);
  }

  private startGame() {
    const name = this.playerName.trim();
    if (!name) return;
    this.registry.set('playerName', name);
    this.registry.set('character', this.selectedCharacter);
    if (this.cursorTimer) this.cursorTimer.destroy();
    if (this.keyboardHandler) this.input.keyboard?.off('keydown', this.keyboardHandler);
    this.scene.start('IntroScene');
  }
}
