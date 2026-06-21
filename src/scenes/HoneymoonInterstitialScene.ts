import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { difficultyConfig } from '../config/difficultyConfig';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { registerAudioConsole } from '../ui/AudioConsole';
import { playMenuMusic } from '../ui/menuMusic';
import { createButton } from '../ui/Button';
import {
  formatSlides,
  getSlidesToGo,
  getTotalSlides,
  hasPlayedHoneymoonOnce,
  isUnlocked,
  markHoneymoonPlayed,
  markInterstitialSeen,
} from '../services/HoneymoonProgressService';
import { GameOverData } from './GameOverScene';
import { GameMode } from './GameScene';
import { spawnConfetti } from '../ui/confetti';

export interface HoneymoonInterstitialData {
  gameOverData: GameOverData;
  fromGameOver?: boolean;
  celebrateUnlock?: boolean;
}

const PANEL_COLOR = 0x4A90D9;
const PANEL_STROKE = 0x6AB0F9;
const BANNER_COLOR = 0x88DD88;
const BANNER_STROKE = 0x44AA44;

export class HoneymoonInterstitialScene extends Phaser.Scene {
  private gameOverData!: GameOverData;
  private fromGameOver = false;
  private celebrateUnlock = false;
  private bg!: Phaser.GameObjects.Image;
  private resizeHandler?: (gameSize: Phaser.Structs.Size) => void;

  constructor() {
    super('HoneymoonInterstitialScene');
  }

  init(data: HoneymoonInterstitialData) {
    this.gameOverData = data.gameOverData;
    this.fromGameOver = data.fromGameOver ?? false;
    this.celebrateUnlock = data.celebrateUnlock ?? false;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const unlocked = isUnlocked();

    this.bg = this.add.image(cx, h / 2, 'menu-home-faded').setOrigin(0.5);
    this.coverBackground(w, h);
    this.resizeHandler = (gameSize) => this.coverBackground(gameSize.width, gameSize.height);
    this.scale.on('resize', this.resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off('resize', this.resizeHandler);
    });

    const base = Math.min(w, h);
    const panelW = Phaser.Math.Clamp(w * 0.82, 280, 520);
    const panelH = Phaser.Math.Clamp(h * 0.62, 340, 520);
    const panelY = h * 0.44;

    this.add.rectangle(cx, panelY, panelW, panelH, PANEL_COLOR, 1)
      .setStrokeStyle(3, PANEL_STROKE);

    const ticketKey = unlocked ? 'honeymoon-unlocked' : 'honeymoon-locked';
    const ticketW = panelW * 0.72;
    const ticketH = ticketW * (550 / 700);
    const ticketY = panelY - panelH / 2 + ticketH / 2 + 24;

    this.add.image(cx, ticketY, ticketKey)
      .setOrigin(0.5)
      .setDisplaySize(ticketW, ticketH);

    const fontTitle = Phaser.Math.Clamp(Math.round(base * 0.038), 14, 22);
    const fontStat = Phaser.Math.Clamp(Math.round(base * 0.028), 11, 16);
    const fontBtn = Phaser.Math.Clamp(Math.round(base * 0.048), 16, 24);
    const btnH = Phaser.Math.Clamp(Math.round(base * 0.06), 38, 50);
    const btnW = Phaser.Math.Clamp(Math.round(w * 0.42), 140, 220);
    const stackGap = Math.max(10, h * 0.015);

    if (unlocked) {
      this.buildUnlockedLayout(cx, panelY, panelH, ticketY, ticketH, fontTitle, fontStat, fontBtn, btnH, btnW, stackGap, w, h);
      if (this.celebrateUnlock) spawnConfetti(this);
    } else {
      this.buildLockedLayout(cx, panelY, panelH, ticketY, ticketH, panelW, fontTitle, fontStat, fontBtn, btnH, btnW, stackGap, w, h);
    }

    createMuteButton(this);
    registerUiSound(this);
    registerAudioConsole(this);
    playMenuMusic(this);
  }

  private buildLockedLayout(
    cx: number, panelY: number, panelH: number, ticketY: number, ticketH: number,
    panelW: number, fontTitle: number, fontStat: number, fontBtn: number,
    btnH: number, btnW: number, stackGap: number, w: number, h: number,
  ) {
    const titleY = ticketY + ticketH / 2 + 28;
    this.add.text(cx, titleY, 'UNLOCK THE HONEYMOON!', {
      fontSize: `${fontTitle}px`, color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    const total = getTotalSlides();
    const toGo = getSlidesToGo();

    const barW = panelW * 0.75;
    const barH = 14;
    const barY = titleY + 36;
    const barLeft = cx - barW / 2;
    const statY = barY + barH / 2 + 10;

    this.add.text(barLeft, statY, `${formatSlides(total)}\nSLIDES MADE`, {
      fontSize: `${fontStat}px`, color: '#ffffff', fontFamily: FONT_FAMILY, align: 'left', lineSpacing: 4,
    }).setOrigin(0, 0);

    this.add.text(barLeft + barW, statY, `${formatSlides(toGo)}\nTO GO`, {
      fontSize: `${fontStat}px`, color: '#ffffff', fontFamily: FONT_FAMILY, align: 'right', lineSpacing: 4,
    }).setOrigin(1, 0);
    const threshold = difficultyConfig.honeymoonUnlockThreshold;
    const progress = Math.min(1, total / threshold);

    this.add.rectangle(cx, barY, barW, barH, 0xffffff, 0.25);
    if (progress > 0) {
      this.add.rectangle(barLeft + (barW * progress) / 2, barY, barW * progress, barH - 2, 0xffffff, 1);
    }

    const actionY = panelY + panelH / 2 + btnH / 2 + stackGap + 8;
    const label = this.fromGameOver ? 'CLOSE' : 'CONTINUE';
    createButton(this, {
      x: cx, y: actionY, width: btnW, height: btnH,
      label, variant: 'primary', fontSize: fontBtn,
      onClick: () => this.dismissToGameOver(),
    });
  }

  private buildUnlockedLayout(
    cx: number, panelY: number, panelH: number, ticketY: number, ticketH: number,
    fontTitle: number, fontStat: number, fontBtn: number,
    btnH: number, btnW: number, stackGap: number, w: number, h: number,
  ) {
    const showBanner = !hasPlayedHoneymoonOnce();
    let contentTop = panelY - panelH / 2 + 16;

    if (showBanner) {
      const bannerW = Phaser.Math.Clamp(w * 0.62, 220, 380);
      const bannerH = 36;
      const bannerY = panelY - panelH / 2 - bannerH / 2 + 4;
      this.add.rectangle(cx, bannerY, bannerW, bannerH, BANNER_COLOR, 1)
        .setStrokeStyle(2, BANNER_STROKE);
      this.add.text(cx, bannerY, 'NEW MODE UNLOCKED!', {
        fontSize: `${fontStat}px`, color: '#226622', fontFamily: FONT_FAMILY,
      }).setOrigin(0.5);
      contentTop = ticketY + ticketH / 2 + 20;
    } else {
      contentTop = ticketY + ticketH / 2 + 28;
    }

    this.add.text(cx, contentTop, 'HONEYMOON UNLOCKED!', {
      fontSize: `${fontTitle}px`, color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.add.text(cx, contentTop + 32, 'ALL 10,000 SLIDES MADE!', {
      fontSize: `${fontStat}px`, color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    const playY = panelY + panelH / 2 - btnH / 2 - 20;
    createButton(this, {
      x: cx, y: playY, width: btnW, height: btnH,
      label: 'PLAY!', variant: 'secondary', fontSize: fontBtn,
      onClick: () => this.startHoneymoon(),
    });

    const skipY = panelY + panelH / 2 + btnH / 2 + stackGap + 8;
    const skipLabel = this.fromGameOver ? 'CLOSE' : 'SKIP';
    createButton(this, {
      x: cx, y: skipY, width: btnW, height: btnH,
      label: skipLabel, variant: 'tertiary', fontSize: fontBtn,
      onClick: () => this.dismissToGameOver(),
    });
  }

  private dismissToGameOver() {
    if (!this.fromGameOver) {
      markInterstitialSeen();
      this.scene.start('GameOverScene', { ...this.gameOverData, skipTicketOnce: true });
    } else {
      this.scene.start('GameOverScene', this.gameOverData);
    }
  }

  private startHoneymoon() {
    if (!this.fromGameOver) markInterstitialSeen();
    markHoneymoonPlayed();
    this.scene.start('GameScene', { gameMode: 'honeymoon' as GameMode });
  }

  private coverBackground(w: number, h: number) {
    this.bg.setPosition(w / 2, h / 2);
    this.bg.setScale(Math.max(w / this.bg.width, h / this.bg.height));
  }
}
