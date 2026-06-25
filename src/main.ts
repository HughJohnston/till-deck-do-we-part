import { inject } from '@vercel/analytics';
import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { initPlayerStatsTracking } from './services/PlayerStatsService';

inject();
initPlayerStatsTracking();

const game = new Phaser.Game(gameConfig);
(window as any).__GAME = game;
