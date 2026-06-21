import Phaser from 'phaser';
import { FONT_FAMILY, GAME_VERSION } from '../config/gameConfig';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { registerAudioConsole } from '../ui/AudioConsole';
import { playMenuMusic } from '../ui/menuMusic';
import { UiButton, createButton } from '../ui/Button';

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
  private bg!: Phaser.GameObjects.Image;
  private titleImage!: Phaser.GameObjects.Image;
  private nameLabel!: Phaser.GameObjects.Text;
  private nameBox!: Phaser.GameObjects.Rectangle;
  private nameDisplay!: Phaser.GameObjects.Text;
  private nextButton!: UiButton;
  private charLabel!: Phaser.GameObjects.Text;
  private wilfImage!: Phaser.GameObjects.Image;
  private ruthImage!: Phaser.GameObjects.Image;
  private wilfFrame!: Phaser.GameObjects.Rectangle;
  private ruthFrame!: Phaser.GameObjects.Rectangle;
  private wilfName!: Phaser.GameObjects.Text;
  private ruthName!: Phaser.GameObjects.Text;
  private playButton!: UiButton;
  private backButton!: UiButton;
  private nameStepObjects: VisibleGameObject[] = [];
  private charStepObjects: VisibleGameObject[] = [];
  private playerName = '';
  private cursorVisible = true;
  private cursorTimer?: Phaser.Time.TimerEvent;
  private keyboardHandler?: (event: KeyboardEvent) => void;
  private resizeHandler?: (gameSize: Phaser.Structs.Size) => void;
  private isTouch = false;
  private nameInput?: HTMLInputElement;
  private nameInputHandler?: (event: Event) => void;
  private nameInputKeyHandler?: (event: KeyboardEvent) => void;

  constructor() {
    super('MenuScene');
  }

  create() {
    this.playerName = '';
    this.step = 1;
    this.isTouch = this.sys.game.device.input.touch;
    const layout = this.computeLayout(this.scale.width, this.scale.height);

    this.bg = this.add.image(layout.cx, layout.h / 2, 'menu-home').setOrigin(0.5);

    this.titleImage = this.add.image(layout.cx, 0, 'menu-title').setOrigin(0.5);

    this.nameLabel = this.add.text(layout.cx, 0, 'Enter Nickname', {
      color: '#000000', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.nameBox = this.add.rectangle(layout.cx, 0, 220, 32, 0x2C2C3E)
      .setStrokeStyle(2, 0x4A90D9)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // Focus must happen synchronously inside the pointer event so mobile
        // browsers open the on-screen keyboard.
        if (this.isTouch && this.nameInput) this.nameInput.focus();
      });

    if (this.isTouch) this.createNameInput();

    this.nameDisplay = this.add.text(layout.cx, 0, '', {
      color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.cursorTimer = this.time.addEvent({
      delay: 500, loop: true,
      callback: () => { this.cursorVisible = !this.cursorVisible; this.updateNameDisplay(); },
    });

    this.nextButton = createButton(this, {
      x: layout.cx, y: 0, width: layout.btnW, height: layout.btnH,
      label: 'NEXT', variant: 'primary', disabled: true,
      onClick: () => this.goToCharStep(),
    });

    this.nameStepObjects = [
      this.nameLabel, this.nameBox, this.nameDisplay,
    ];

    this.charLabel = this.add.text(layout.cx, 0, 'Select your spouse:', {
      color: '#000000', fontFamily: FONT_FAMILY,
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

    this.playButton = createButton(this, {
      x: layout.cx, y: 0, width: layout.btnW, height: layout.btnH,
      label: 'PLAY', variant: 'primary',
      onClick: () => this.startGame(),
    });

    this.backButton = createButton(this, {
      x: layout.cx, y: 0, width: layout.btnW, height: layout.btnH,
      label: '← Back', variant: 'tertiary',
      onClick: () => this.showStep(1),
    });

    this.charStepObjects = [
      this.charLabel, this.wilfImage, this.wilfFrame, this.wilfName,
      this.ruthImage, this.ruthFrame, this.ruthName,
    ];

    this.selectCharacter('wilf');
    this.updateNameDisplay();
    this.updateNextButton();
    this.applyLayout(layout);
    this.showStep(1);
    registerUiSound(this);
    registerAudioConsole(this);
    playMenuMusic(this);

    const versionText = this.add.text(8, this.scale.height - 6, GAME_VERSION, {
      fontSize: '12px', color: '#000000', fontFamily: FONT_FAMILY,
    }).setOrigin(0, 1).setAlpha(0.5).setDepth(1000);

    this.resizeHandler = (gameSize) => {
      this.applyLayout(this.computeLayout(gameSize.width, gameSize.height));
      versionText.setY(gameSize.height - 6);
    };
    this.scale.on('resize', this.resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off('resize', this.resizeHandler);
      this.destroyNameInput();
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
      h * 0.38,
      (w * 0.92) / titleAspect,
    );
    const titleWidth = titleHeight * titleAspect;
    const subtitleSize = fontMd;
    const subtitleY = titleY + titleHeight + Math.max(10, h * 0.012) + 64;
    // Reserve room for two stacked, full-size buttons (primary + tertiary).
    const stackGap = Math.max(10, h * 0.015);
    const footerReserve = btnH * 2 + stackGap + Math.max(24, h * 0.04);
    const contentTop = subtitleY + Math.max(12, h * 0.02);
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

    const bgScale = Math.max(h / 699, w / 1100);
    this.bg.setPosition(cx, h / 2).setScale(bgScale);

    this.titleImage
      .setPosition(cx, layout.titleY + layout.titleHeight / 2)
      .setDisplaySize(layout.titleWidth, layout.titleHeight);

    const titleBottom = layout.titleY + layout.titleHeight;
    const nameGapFromTitle = Math.max(12, h * 0.025);
    const nameY = titleBottom + nameGapFromTitle + fontMd / 2;
    const nameBoxY = nameY + fontMd / 2 + 20;

    const stackGap = Math.max(10, h * 0.015);

    this.nameLabel.setPosition(cx, nameY).setFontSize(`${fontMd}px`);
    this.nameBox.setPosition(cx, nameBoxY).setSize(Math.min(260, w * 0.7), btnH * 0.7);
    this.nameDisplay.setPosition(cx, nameBoxY).setFontSize(`${fontLg}px`);
    this.nextButton.setPosition(cx, btnY).setSize(btnW, btnH).setFontSize(fontBtn);

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

    const charBlockTop = titleBottom + nameGapFromTitle;
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

    this.playButton.setPosition(cx, btnY).setSize(btnW, btnH).setFontSize(fontBtn);
    this.backButton.setPosition(cx, btnY + btnH + stackGap).setSize(btnW, btnH).setFontSize(fontBtn);

    this.positionNameInput();
  }

  private createNameInput() {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 20;
    input.autocomplete = 'off';
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('aria-label', 'Enter nickname');
    Object.assign(input.style, {
      position: 'fixed',
      opacity: '0',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      padding: '0',
      margin: '0',
      // Overlaid on the name box so focusing it does not scroll the page.
      zIndex: '10',
    } as Partial<CSSStyleDeclaration>);

    this.nameInputHandler = () => {
      this.playerName = input.value.substring(0, 20);
      this.updateNameDisplay();
      this.updateNextButton();
    };
    this.nameInputKeyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        input.blur();
        this.goToCharStep();
      }
    };
    input.addEventListener('input', this.nameInputHandler);
    input.addEventListener('keydown', this.nameInputKeyHandler);

    document.body.appendChild(input);
    this.nameInput = input;
    this.positionNameInput();
  }

  private positionNameInput() {
    if (!this.nameInput) return;
    const canvas = this.game.canvas;
    const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
    const w = this.nameBox.width;
    const h = this.nameBox.height;
    Object.assign(this.nameInput.style, {
      left: `${rect.left + this.nameBox.x - w / 2}px`,
      top: `${rect.top + this.nameBox.y - h / 2}px`,
      width: `${w}px`,
      height: `${h}px`,
    } as Partial<CSSStyleDeclaration>);
  }

  private destroyNameInput() {
    if (!this.nameInput) return;
    if (this.nameInputHandler) this.nameInput.removeEventListener('input', this.nameInputHandler);
    if (this.nameInputKeyHandler) this.nameInput.removeEventListener('keydown', this.nameInputKeyHandler);
    this.nameInput.blur();
    this.nameInput.remove();
    this.nameInput = undefined;
  }

  private showStep(step: 1 | 2) {
    this.step = step;
    this.nameStepObjects.forEach((obj) => obj.setVisible(step === 1));
    this.charStepObjects.forEach((obj) => obj.setVisible(step === 2));
    this.nextButton.setVisible(step === 1);
    this.playButton.setVisible(step === 2);
    this.backButton.setVisible(step === 2);

    if (this.nameInput) {
      this.nameInput.style.display = step === 1 ? 'block' : 'none';
      if (step !== 1) this.nameInput.blur();
    }

    if (this.keyboardHandler) {
      this.input.keyboard?.off('keydown', this.keyboardHandler);
    }

    this.keyboardHandler = (event: KeyboardEvent) => {
      if (step === 1) {
        // On touch devices the hidden HTML input is the source of truth, so
        // skip char append/backspace here to avoid double-entry.
        if (!this.isTouch) {
          if (event.key === 'Backspace') this.playerName = this.playerName.slice(0, -1);
          else if (event.key === 'Enter') { this.goToCharStep(); return; }
          else if (event.key.length === 1 && this.playerName.length < 20) this.playerName += event.key;
          this.updateNameDisplay();
          this.updateNextButton();
        } else if (event.key === 'Enter') {
          this.goToCharStep();
        }
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
    this.nextButton.setEnabled(this.playerName.trim().length > 0);
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
    this.destroyNameInput();
    this.scene.start('IntroScene');
  }
}
