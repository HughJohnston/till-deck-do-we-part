import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { registerAudioConsole } from '../ui/AudioConsole';
import { createButton } from '../ui/Button';
import { hasSeenInterstitial, isUnlocked, unlockHoneymoon } from '../services/HoneymoonProgressService';
import { GameMode } from './GameScene';

export interface GameOverData {
  score: number;
  scoreLabel: string;
  character: string;
  playerName: string;
  gameMode?: GameMode;
  skipTicketOnce?: boolean;
}

function getTopScore(): number {
  try { return parseInt(localStorage.getItem('tilldeck_topscore') || '0', 10); } catch { return 0; }
}

function saveTopScore(score: number) {
  try { localStorage.setItem('tilldeck_topscore', String(score)); } catch { /* */ }
}

export class GameOverScene extends Phaser.Scene {
  private ticketIcon?: Phaser.GameObjects.Image;
  private gameOverData!: GameOverData;
  private unlockKeyHandler?: (event: KeyboardEvent) => void;

  constructor() {
    super('GameOverScene');
  }

  init(data: GameOverData) {
    this.data.set('score', data.score);
    this.data.set('scoreLabel', data.scoreLabel);
    this.data.set('character', data.character);
    this.data.set('playerName', data.playerName);
    this.data.set('gameMode', data.gameMode ?? 'normal');
    this.data.set('skipTicketOnce', data.skipTicketOnce ?? false);
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    const score = this.data.get('score') as number;
    const scoreLabel = this.data.get('scoreLabel') as string;
    const character = this.data.get('character') as string;
    const playerName = this.data.get('playerName') as string;
    const gameMode = (this.data.get('gameMode') as GameMode) ?? 'normal';
    const skipTicketOnce = this.data.get('skipTicketOnce') as boolean;

    const previousTop = getTopScore();
    const isNewRecord = score > previousTop;
    if (isNewRecord) saveTopScore(score);
    const topScore = Math.max(score, previousTop);

    const goBg = this.add.image(cx, h / 2, 'menu-home-faded').setOrigin(0.5);
    goBg.setScale(Math.max(w / goBg.width, h / goBg.height));

    const gameOverData: GameOverData = {
      score, scoreLabel, character, playerName, gameMode, skipTicketOnce,
    };
    this.gameOverData = gameOverData;

    if (hasSeenInterstitial() && !skipTicketOnce) {
      this.addTicketIcon();
    }

    this.add.text(cx, h * 0.13, 'GAME OVER', {
      fontSize: '28px', color: '#FF4444', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    const nameY = h * 0.23;
    const nameText = this.add.text(cx, nameY, playerName, {
      fontSize: '18px', color: '#FFD700', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    const pencil = this.add.text(nameText.x + nameText.width / 2 + 10, nameY, '✏️', {
      fontSize: '16px', fontFamily: FONT_FAMILY,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    pencil.on('pointerdown', () => {
      this.scene.start('MenuScene', {
        mode: 'name',
        returnTo: { scene: 'GameOverScene', data: this.gameOverData },
      });
    });

    const swapBtnW = Phaser.Math.Clamp(Math.round(w * 0.36), 120, 180);
    const swapBtnH = Phaser.Math.Clamp(Math.round(Math.min(w, h) * 0.05), 32, 42);
    createButton(this, {
      x: cx, y: nameY + 28, width: swapBtnW, height: swapBtnH,
      label: 'SWAP PLAYER', variant: 'tertiary',
      fontSize: Phaser.Math.Clamp(Math.round(Math.min(w, h) * 0.032), 12, 16),
      onClick: () => {
        this.scene.start('MenuScene', {
          mode: 'character',
          returnTo: { scene: 'GameOverScene', data: this.gameOverData },
        });
      },
    });

    const numberSize = Phaser.Math.Clamp(Math.round(Math.min(w, h) * 0.12), 40, 80);
    const scoreY = h * 0.42;

    this.add.text(cx, scoreY - numberSize / 2 - 12, scoreLabel, {
      fontSize: '14px', color: '#aaaacc', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.add.text(cx, scoreY, `${score}`, {
      fontSize: `${numberSize}px`, color: '#ffffff', fontFamily: FONT_FAMILY,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, scoreY + numberSize / 2 + 24, `${isNewRecord ? 'NEW BEST! ' : 'Best: '}${topScore}`, {
      fontSize: '18px', color: isNewRecord ? '#FFD700' : '#aaaacc', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    const base = Math.min(w, h);
    const fontBtn = Phaser.Math.Clamp(Math.round(base * 0.048), 16, 24);
    const btnH = Phaser.Math.Clamp(Math.round(base * 0.06), 38, 50);
    const btnW = Phaser.Math.Clamp(Math.round(w * 0.56), 180, 260);

    createButton(this, {
      x: cx, y: h * 0.62, width: btnW, height: btnH,
      label: 'PLAY AGAIN', variant: 'primary', fontSize: fontBtn,
      onClick: () => this.scene.start('GameScene'),
    });

    createButton(this, {
      x: cx, y: h * 0.72, width: btnW, height: btnH,
      label: 'MENU', variant: 'secondary', fontSize: fontBtn,
      onClick: () => this.scene.start('MenuScene'),
    });

    const lbY = h * 0.82;
    const lbButton = createButton(this, {
      x: cx, y: lbY, width: btnW, height: btnH,
      label: 'LEADERBOARD', variant: 'secondary', fontSize: fontBtn,
      onClick: () => this.scene.start('LeaderboardScene', gameOverData),
    });

    if (this.textures.exists('ui-trophy')) {
      const trophy = this.add.image(0, lbY, 'ui-trophy').setOrigin(0.5);
      trophy.setScale((btnH * 0.62) / trophy.height);
      const gap = 8;
      const shift = (trophy.displayWidth + gap) / 2;
      lbButton.text.x += shift;
      trophy.x = lbButton.text.x - lbButton.text.width / 2 - gap - trophy.displayWidth / 2;
    }

    createMuteButton(this);
    registerUiSound(this);
    registerAudioConsole(this);

    this.unlockKeyHandler = (event: KeyboardEvent) => {
      if (!event.shiftKey || event.key.toLowerCase() !== 'u') return;
      if (isUnlocked()) return;
      unlockHoneymoon();
      if (this.ticketIcon) {
        this.ticketIcon.setTexture('honeymoon-unlocked');
      } else if (hasSeenInterstitial()) {
        this.addTicketIcon();
      }
    };
    this.input.keyboard?.on('keydown-U', this.unlockKeyHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.unlockKeyHandler) this.input.keyboard?.off('keydown-U', this.unlockKeyHandler);
    });
  }

  private addTicketIcon() {
    const ticketKey = isUnlocked() ? 'honeymoon-unlocked' : 'honeymoon-locked';
    if (!this.textures.exists(ticketKey)) return;

    const iconH = 52;
    this.ticketIcon = this.add.image(36, 36, ticketKey).setOrigin(0, 0);
    this.ticketIcon.setDisplaySize(iconH * (700 / 550), iconH);
    this.ticketIcon.setInteractive({ useHandCursor: true });
    this.ticketIcon.setDepth(10);

    this.ticketIcon.on('pointerdown', () => {
      this.scene.start('HoneymoonInterstitialScene', { gameOverData: this.gameOverData, fromGameOver: true });
    });
  }
}
