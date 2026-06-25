import { GROUND_HEIGHT_RATIO, PLAYER_X_RATIO } from '../config/dimensions';

// Helpers that compute positions from actual scene dimensions
export function getGroundY(h: number): number {
  return h * (1 - GROUND_HEIGHT_RATIO);
}

export function getGroundHeight(h: number): number {
  return h * GROUND_HEIGHT_RATIO;
}

export function getPlayerX(w: number): number {
  return w * PLAYER_X_RATIO;
}

export const JUMP_VELOCITY = -700;
export const PLAYER_SIZE = 192;

export const COLLECTABLE_Y_JUMP_MIN = 200;
export const COLLECTABLE_Y_JUMP_MAX = 240;
export const COLLECTABLE_Y_DOUBLE_JUMP_MIN = 300;
export const COLLECTABLE_Y_DOUBLE_JUMP_MAX = 360;

// Obstacle height tiers above ground line (px). Mid/high float in the jump arc.
export const OBSTACLE_Y_MID_MIN = 85;
export const OBSTACLE_Y_MID_MAX = 130;
export const OBSTACLE_Y_HIGH_MIN = 155;
export const OBSTACLE_Y_HIGH_MAX = 210;
