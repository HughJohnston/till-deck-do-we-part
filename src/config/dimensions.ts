// Reference dimensions for asset creation — actual game fills the viewport
export const REF_WIDTH = 800;
export const REF_HEIGHT = 450;

// These are relative ratios, not fixed pixels
export const GROUND_HEIGHT_RATIO = 0.13;
export const PLAYER_X_RATIO = 0.15;

// Native texture heights of the background layers (px)
export const BG_TEXTURE_HEIGHTS = {
  sky: 172,
  street: 400,
  ground: 250,
} as const;

// Tunable environment layout. The datum is the running surface line.
// Ground top + street bottom both anchor to the datum. Mutated live by test mode.
export const ENV_LAYOUT = {
  datumRatio: 0.815,
  streetBandRatio: 0.55,
  skyBandRatio: 0.67,
  scroll: {
    sky: 0.1,
    street: 0.9,
    ground: 1.0,
  },
};
