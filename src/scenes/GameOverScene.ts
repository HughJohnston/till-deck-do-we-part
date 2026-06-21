import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { registerAudioConsole } from '../ui/AudioConsole';
import { UiButton, createButton } from '../ui/Button';
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
  private selectedCharacter: 'wilf' | 'ruth' = 'wilf';
  private wilfToggleBtn?: UiButton;
  private ruthToggleBtn?: UiButton;

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

    this.selectedCharacter = character === 'ruth' ? 'ruth' : 'wilf';
    this.registry.set('character', this.selectedCharacter);

    const gameOverData: GameOverData = {
      score, scoreLabel, character: this.selectedCharacter, playerName, gameMode, skipTicketOnce,
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
    const btnGap = Phaser.Math.Clamp(Math.round(base * 0.018), 10, 16);
    const btnStep = btnH + btnGap;
    const spouseToggleY = h * 0.62;
    const circleBackY = spouseToggleY + btnStep;
    const leaderboardY = circleBackY + btnStep;
    const mainMenuY = leaderboardY + btnStep;

    const toggleGap = 6;
    const halfW = (btnW - toggleGap) / 2;
    this.wilfToggleBtn = createButton(this, {
      x: cx - halfW / 2 - toggleGap / 2, y: spouseToggleY, width: halfW, height: btnH,
      label: 'WILF', variant: this.selectedCharacter === 'wilf' ? 'secondary' : 'tertiary', fontSize: fontBtn,
      onClick: () => this.selectSpouse('wilf'),
    });
    this.ruthToggleBtn = createButton(this, {
      x: cx + halfW / 2 + toggleGap / 2, y: spouseToggleY, width: halfW, height: btnH,
      label: 'RUTH', variant: this.selectedCharacter === 'ruth' ? 'secondary' : 'tertiary', fontSize: fontBtn,
      onClick: () => this.selectSpouse('ruth'),
    });

    createButton(this, {
      x: cx, y: circleBackY, width: btnW, height: btnH,
      label: 'CIRCLE BACK', variant: 'primary', fontSize: fontBtn,
      onClick: () => this.scene.start('GameScene'),
    });

    const lbButton = createButton(this, {
      x: cx, y: leaderboardY, width: btnW, height: btnH,
      label: 'LEADERBOARD', variant: 'secondary', fontSize: fontBtn,
      onClick: () => this.scene.start('LeaderboardScene', gameOverData),
    });

    createButton(this, {
      x: cx, y: mainMenuY, width: btnW, height: btnH,
      label: 'MAIN MENU', variant: 'tertiary', fontSize: fontBtn,
      onClick: () => this.scene.start('MenuScene'),
    });

    if (this.textures.exists('ui-trophy')) {
      const trophy = this.add.image(0, leaderboardY, 'ui-trophy').setOrigin(0.5);
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

  private selectSpouse(character: 'wilf' | 'ruth') {
    if (this.selectedCharacter === character) return;
    this.selectedCharacter = character;
    this.registry.set('character', character);
    this.gameOverData = { ...this.gameOverData, character };
    this.updateSpouseToggle();
  }

  private updateSpouseToggle() {
    this.wilfToggleBtn?.setVariant(this.selectedCharacter === 'wilf' ? 'secondary' : 'tertiary');
    this.ruthToggleBtn?.setVariant(this.selectedCharacter === 'ruth' ? 'secondary' : 'tertiary');
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
