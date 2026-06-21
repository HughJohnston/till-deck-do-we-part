import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { registerAudioConsole } from '../ui/AudioConsole';
import { createButton } from '../ui/Button';
import { submitScore } from '../services/LeaderboardService';

export interface GameOverData {
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
    const character = this.data.get('character') as string;
    const playerName = this.data.get('playerName') as string;

    const previousTop = getTopScore();
    const isNewRecord = score > previousTop;
    if (isNewRecord) saveTopScore(score);
    const topScore = Math.max(score, previousTop);

    // Save this run to the global leaderboard (fire-and-forget; never blocks UI).
    submitScore({ name: playerName, score, character });

    // Faded home backdrop, cover-scaled from the texture's real size (keeps
    // aspect, no letterbox bars regardless of the source image dimensions).
    const goBg = this.add.image(cx, h / 2, 'menu-home-faded').setOrigin(0.5);
    goBg.setScale(Math.max(w / goBg.width, h / goBg.height));

    this.add.text(cx, h * 0.13, 'GAME OVER', {
      fontSize: '28px', color: '#FF4444', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    this.add.text(cx, h * 0.23, playerName, {
      fontSize: '18px', color: '#FFD700', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    const numberSize = Phaser.Math.Clamp(Math.round(Math.min(w, h) * 0.12), 40, 80);
    const scoreY = h * 0.42;

    // Small label sits just above the large, bold score number.
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
    // Wider than the menu buttons so the centered LEADERBOARD label clears the
    // trophy icon pinned to the left edge.
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
    const leaderboardData: GameOverData = { score, scoreLabel, character, playerName };
    const lbButton = createButton(this, {
      x: cx, y: lbY, width: btnW, height: btnH,
      label: 'LEADERBOARD', variant: 'secondary', fontSize: fontBtn,
      onClick: () => this.scene.start('LeaderboardScene', leaderboardData),
    });

    // Treat [trophy][gap][label] as one group and centre it in the button, so
    // the trophy never overlaps the text regardless of label/button width.
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
  }
}
