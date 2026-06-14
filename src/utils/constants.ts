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

export const JUMP_VELOCITY = -550;
export const PLAYER_SIZE = 64;
