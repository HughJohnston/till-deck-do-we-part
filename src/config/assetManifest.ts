export interface SpriteSheetDef {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

export interface ImageDef {
  key: string;
  path: string;
  width: number;
  height: number;
}

export const playerSprites: SpriteSheetDef[] = [
  { key: 'wilf', path: 'assets/sprites/Wilf.png', frameWidth: 64, frameHeight: 64, frameCount: 6 },
  { key: 'ruth', path: 'assets/sprites/Ruth.png', frameWidth: 64, frameHeight: 64, frameCount: 6 },
];

export const obstacleImages: ImageDef[] = [
  { key: 'obstacle-beergroni', path: 'assets/sprites/distractors/beergroni.png', width: 48, height: 48 },
  { key: 'obstacle-olives', path: 'assets/sprites/distractors/olives.png', width: 40, height: 40 },
  { key: 'obstacle-pub', path: 'assets/sprites/distractors/pub.png', width: 80, height: 64 },
  { key: 'obstacle-shrek', path: 'assets/sprites/distractors/shrek.png', width: 40, height: 48 },
  { key: 'obstacle-parkrun', path: 'assets/sprites/distractors/parkrun.png', width: 56, height: 56 },
  { key: 'obstacle-lido', path: 'assets/sprites/distractors/lido.png', width: 64, height: 48 },
  { key: 'obstacle-morlys', path: 'assets/sprites/distractors/morlys.png', width: 48, height: 48 },
  { key: 'obstacle-milkshake', path: 'assets/sprites/distractors/milkshake.png', width: 32, height: 56 },
  { key: 'obstacle-choir', path: 'assets/sprites/distractors/choir.png', width: 72, height: 56 },
];

export const collectableImages: ImageDef[] = [
  { key: 'collect-ppt', path: 'assets/sprites/collectables/ppt.png', width: 32, height: 32 },
  { key: 'collect-excel', path: 'assets/sprites/collectables/excel.png', width: 32, height: 32 },
  { key: 'collect-postit', path: 'assets/sprites/collectables/postit.png', width: 32, height: 32 },
  { key: 'collect-slides', path: 'assets/sprites/collectables/slides.png', width: 32, height: 32 },
  { key: 'collect-sprint', path: 'assets/sprites/collectables/sprint.png', width: 40, height: 32 },
  { key: 'collect-agile', path: 'assets/sprites/collectables/agile.png', width: 40, height: 32 },
  { key: 'collect-linkedin', path: 'assets/sprites/collectables/linkedin.png', width: 32, height: 32 },
];

export const synergyLetters: ImageDef[] = [
  { key: 'synergy-S', path: 'assets/sprites/synergy/S.png', width: 32, height: 32 },
  { key: 'synergy-Y', path: 'assets/sprites/synergy/Y.png', width: 32, height: 32 },
  { key: 'synergy-N', path: 'assets/sprites/synergy/N.png', width: 32, height: 32 },
  { key: 'synergy-E', path: 'assets/sprites/synergy/E.png', width: 32, height: 32 },
  { key: 'synergy-R', path: 'assets/sprites/synergy/R.png', width: 32, height: 32 },
  { key: 'synergy-G', path: 'assets/sprites/synergy/G.png', width: 32, height: 32 },
  { key: 'synergy-Y2', path: 'assets/sprites/synergy/Y2.png', width: 32, height: 32 },
];

export const SYNERGY_SEQUENCE = ['S', 'Y', 'N', 'E', 'R', 'G', 'Y2'] as const;

export const backgroundImages: ImageDef[] = [
  { key: 'bg-sky', path: 'assets/backgrounds/sky.png', width: 800, height: 450 },
  { key: 'bg-mid', path: 'assets/backgrounds/mid.png', width: 800, height: 450 },
  { key: 'bg-street', path: 'assets/backgrounds/street.png', width: 800, height: 200 },
  { key: 'bg-ground', path: 'assets/backgrounds/ground.png', width: 800, height: 250 },
];

export const uiImages: ImageDef[] = [
  { key: 'ui-title', path: 'assets/ui/title.png', width: 400, height: 120 },
  { key: 'ui-button', path: 'assets/ui/button.png', width: 200, height: 60 },
  { key: 'ui-card', path: 'assets/ui/card.png', width: 600, height: 350 },
  { key: 'ui-charframe', path: 'assets/ui/charframe.png', width: 100, height: 120 },
];

export const menuImages: ImageDef[] = [
  { key: 'menu-title', path: 'assets/png/Game_title.png', width: 1458, height: 1208 },
  { key: 'menu-wilf', path: 'assets/png/Wilf_profile_picture.png', width: 256, height: 256 },
  { key: 'menu-ruth', path: 'assets/png/Ruth_profile_picture.png', width: 256, height: 256 },
];
