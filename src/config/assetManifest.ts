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

export const playerSprites: SpriteSheetDef[] = [];

export interface AnimFrameDef {
  key: string;
  path: string;
}

export interface CharacterAnimFrames {
  run: AnimFrameDef[];
  jump: AnimFrameDef[];
  doubleJump: AnimFrameDef[];
}

const WILF_ANIM_BASE = 'assets/sprites/Players/Wilf/wilf_animations/A_guy_with_messy_brown/animations';

export const wilfAnimFrames: CharacterAnimFrames = {
  run: Array.from({ length: 6 }, (_, i): AnimFrameDef => ({
    key: `wilf-run-${i}`,
    path: `${WILF_ANIM_BASE}/Running/east/frame_${String(i).padStart(3, '0')}.png`,
  })),
  jump: Array.from({ length: 8 }, (_, i): AnimFrameDef => ({
    key: `wilf-jump-${i}`,
    path: `${WILF_ANIM_BASE}/Running_Jump/east/frame_${String(i).padStart(3, '0')}.png`,
  })),
  doubleJump: Array.from({ length: 7 }, (_, i): AnimFrameDef => ({
    key: `wilf-flip-${i}`,
    path: `${WILF_ANIM_BASE}/Front_Flip/east/frame_${String(i).padStart(3, '0')}.png`,
  })),
};

const RUTH_ANIM_BASE = 'assets/sprites/Players/Ruth/ruth_animations/animations';

export const ruthAnimFrames: CharacterAnimFrames = {
  run: Array.from({ length: 6 }, (_, i): AnimFrameDef => ({
    key: `ruth-run-${i}`,
    path: `${RUTH_ANIM_BASE}/Running/east/frame_${String(i).padStart(3, '0')}.png`,
  })),
  jump: Array.from({ length: 8 }, (_, i): AnimFrameDef => ({
    key: `ruth-jump-${i}`,
    path: `${RUTH_ANIM_BASE}/Running_Jump/east/frame_${String(i).padStart(3, '0')}.png`,
  })),
  doubleJump: Array.from({ length: 9 }, (_, i): AnimFrameDef => ({
    key: `ruth-flip-${i}`,
    path: `${RUTH_ANIM_BASE}/Front_Flip/east/frame_${String(i).padStart(3, '0')}.png`,
  })),
};

export const workGoodImages: ImageDef[] = [
  { key: 'work-linkedin-good', path: 'assets/sprites/Work/linkedin_good.png', width: 96, height: 96 },
  { key: 'work-slide-good', path: 'assets/sprites/Work/slide_good.png', width: 96, height: 96 },
  { key: 'work-spreadsheet-good', path: 'assets/sprites/Work/spreadsheet_good.png', width: 96, height: 96 },
];

export const workBadImages: ImageDef[] = [
  { key: 'work-linkedin-bad', path: 'assets/sprites/Work/linkedin_bad.png', width: 96, height: 96 },
  { key: 'work-slide-bad', path: 'assets/sprites/Work/slide_bad.png', width: 96, height: 96 },
  { key: 'work-spreadsheet-bad', path: 'assets/sprites/Work/spreadsheet_bad.png', width: 96, height: 96 },
];

export const playGoodImages: ImageDef[] = [
  { key: 'play-burger-good', path: 'assets/sprites/Play/burger_good.png', width: 96, height: 96 },
  { key: 'play-negroni-good', path: 'assets/sprites/Play/negroni_good.png', width: 96, height: 96 },
  { key: 'play-olives-good', path: 'assets/sprites/Play/olives_good.png', width: 96, height: 96 },
];

export const playBadImages: ImageDef[] = [
  { key: 'play-burger-bad', path: 'assets/sprites/Play/burger_bad.png', width: 96, height: 96 },
  { key: 'play-negroni-bad', path: 'assets/sprites/Play/negroni_bad.png', width: 96, height: 96 },
  { key: 'play-olives-bad', path: 'assets/sprites/Play/olives_bad.png', width: 96, height: 96 },
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
  { key: 'bg-sky', path: 'assets/backgrounds/sky.png', width: 516, height: 172 },
  { key: 'bg-street', path: 'assets/backgrounds/street.png', width: 1600, height: 400 },
  { key: 'bg-ground', path: 'assets/backgrounds/ground.png', width: 800, height: 250 },
  { key: 'bg-gap', path: 'assets/backgrounds/bg_gap.png', width: 196, height: 400 },
  { key: 'bg-ryelane', path: 'assets/backgrounds/bg_ryelane.png', width: 1600, height: 400 },
  { key: 'bg-wingfield', path: 'assets/backgrounds/bg_wingfield.png', width: 1600, height: 400 },
  { key: 'bg-pubs', path: 'assets/backgrounds/bg_pubs.png', width: 1134, height: 400 },
  { key: 'bg-ryelane2', path: 'assets/backgrounds/bg_ryelane2.png', width: 978, height: 400 },
  { key: 'bg-honeymoon-sky', path: 'assets/backgrounds/Honeymoon mode/SKY.png', width: 516, height: 132 },
  { key: 'bg-honeymoon-shore', path: 'assets/backgrounds/Honeymoon mode/SHORE.png', width: 516, height: 79 },
  { key: 'bg-honeymoon-sand', path: 'assets/backgrounds/Honeymoon mode/BEACH.png', width: 276, height: 86 },
];

export const uiImages: ImageDef[] = [
  { key: 'ui-title', path: 'assets/ui/title.png', width: 400, height: 120 },
  { key: 'ui-button', path: 'assets/ui/button.png', width: 200, height: 60 },
  { key: 'ui-card', path: 'assets/ui/card.png', width: 600, height: 350 },
  { key: 'ui-charframe', path: 'assets/ui/charframe.png', width: 100, height: 120 },
  { key: 'ui-trophy', path: 'assets/ui/trophy.png', width: 64, height: 64 },
  { key: 'honeymoon-locked', path: 'assets/ui/honeymoon tickets/honeymoon_locked.png', width: 700, height: 550 },
  { key: 'honeymoon-unlocked', path: 'assets/ui/honeymoon tickets/honeymoon_unlocked.png', width: 700, height: 550 },
];

export const menuImages: ImageDef[] = [
  { key: 'menu-title', path: 'assets/png/Game_title.png', width: 1458, height: 1208 },
  { key: 'menu-wilf', path: 'assets/png/Wilf_profile_picture.png', width: 256, height: 256 },
  { key: 'menu-ruth', path: 'assets/png/Ruth_profile_picture.png', width: 256, height: 256 },
  { key: 'menu-home', path: 'assets/ui/Home_page.png', width: 1100, height: 699 },
  { key: 'menu-home-faded', path: 'assets/ui/Home_page_faded.png', width: 1356, height: 862 },
];

export const comicImages: ImageDef[] = [
  { key: 'comic-1', path: 'assets/ui/Comic/1_working.png', width: 500, height: 500 },
  { key: 'comic-2', path: 'assets/ui/Comic/2_late.png', width: 500, height: 500 },
  { key: 'comic-3', path: 'assets/ui/Comic/3_manySlides.png', width: 500, height: 500 },
  { key: 'comic-4', path: 'assets/ui/Comic/4_productivity.png', width: 500, height: 500 },
  { key: 'comic-5', path: 'assets/ui/Comic/5_distractions.png', width: 500, height: 500 },
  { key: 'comic-6', path: 'assets/ui/Comic/6_honeymoon.png', width: 500, height: 500 },
];
