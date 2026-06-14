import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { playMenuMusic } from '../ui/menuMusic';

interface GameOverData {
  score: number;
  scoreLabel: string;
  character: string;
  playerName: string;
}

function getTopScore(): number {
  try { return parseInt(localStorage.getItem('tilldeck_topscore') || '0', 10); } catch { return 0; }
}

function saveTopScore(score: number) {
  try { localStorage.setItem('tilldeck_topscore', String(score)); } catch { /* */ }
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data: GameOverData) {
    this.data.set('score', data.score);
    this.data.set('scoreLabel', data.scoreLabel);
    this.data.set('character', data.character);
    this.data.set('playerName', data.playerName);
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    const score = this.data.get('score') as number;
    const scoreLabel = this.data.get('scoreLabel') as string;
    const playerName = this.data.get('playerName') as string;

    const previousTop = getTopScore();
    const isNewRecord = score > previousTop;
    if (isNewRecord) saveTopScore(score);
    const topScore = Math.max(score, previousTop);

    this.add.rectangle(cx, h / 2, w, h, 0x1a1a2e);

    this.add.text(cx, h * 0.15, 'GAME OVER', {
      fontSize: '28px', color: '#FF4444', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.add.text(cx, h * 0.28, playerName, {
      fontSize: '18px', color: '#FFD700', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.add.text(cx, h * 0.37, `${scoreLabel}: ${score}`, {
      fontSize: '22px', color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.add.text(cx, h * 0.44, `${isNewRecord ? 'NEW BEST! ' : 'Best: '}${topScore}`, {
      fontSize: '14px', color: isNewRecord ? '#FFD700' : '#aaaacc', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    const playAgainBtn = this.add.rectangle(cx, h * 0.56, 200, 45, 0x22AA44)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x33CC55);
    this.add.text(cx, h * 0.56, 'PLAY AGAIN', {
      fontSize: '16px', color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);
    playAgainBtn.on('pointerover', () => playAgainBtn.setFillStyle(0x33BB55));
    playAgainBtn.on('pointerout', () => playAgainBtn.setFillStyle(0x22AA44));
    playAgainBtn.on('pointerdown', () => this.scene.start('GameScene'));

    const menuBtn = this.add.rectangle(cx, h * 0.68, 200, 45, 0x4A90D9)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x5AA0E9);
    this.add.text(cx, h * 0.68, 'MENU', {
      fontSize: '16px', color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x5AA0E9));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x4A90D9));
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    this.add.text(cx, h * 0.82, 'Leaderboard coming soon...', {
      fontSize: '10px', color: '#666688', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    createMuteButton(this);
    registerUiSound(this);
    playMenuMusic(this);
  }
}
