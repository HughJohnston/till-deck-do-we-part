# Art Asset Brief — "Till Deck Do We Part"

All assets should be **pixel art** style. PNGs with transparency where noted.

---

## Player Spritesheets

Each character needs a **horizontal strip spritesheet** with 6 frames at **64×64 pixels each**.
Final image size: **384×64 px**

| Frame | What it shows |
|-------|---------------|
| 0 | Idle (standing still) |
| 1 | Run frame 1 |
| 2 | Run frame 2 |
| 3 | Run frame 3 |
| 4 | Jump (mid-air pose) |
| 5 | Dead (hit by obstacle) |

| Asset | File path | Notes |
|-------|-----------|-------|
| Wilf spritesheet | `assets/sprites/wilf.png` | Male character, office clothes? |
| Ruth spritesheet | `assets/sprites/ruth.png` | Female character, office clothes? |

**Transparent background.** Character should be roughly centered in each 64×64 frame.

---

## Distractors (Obstacles — things that kill you)

Each is a **single static image**. Transparent background.

| Item | File | Size | Notes |
|------|------|------|-------|
| Beergroni | `assets/sprites/distractors/beergroni.png` | 48×48 | Cocktail glass |
| Perelo olives | `assets/sprites/distractors/olives.png` | 40×40 | Jar/bowl of olives |
| Pub | `assets/sprites/distractors/pub.png` | 80×64 | Pub building front (wider obstacle) |
| Shrek DVD | `assets/sprites/distractors/shrek.png` | 40×48 | DVD case |
| Parkrun | `assets/sprites/distractors/parkrun.png` | 56×56 | Running figure / parkrun logo |
| Lido | `assets/sprites/distractors/lido.png` | 64×48 | Swimming pool / lido sign |
| Morly's burger | `assets/sprites/distractors/morlys.png` | 48×48 | Chicken burger |
| Banana milkshake | `assets/sprites/distractors/milkshake.png` | 32×56 | Tall milkshake glass |
| Choir | `assets/sprites/distractors/choir.png` | 72×56 | Choir group / singing figures |

These appear on the ground level. The player runs into them and dies. They are **tinted red** in-game currently but that tint will be removed once real art is swapped in.

---

## Collectables (Good items — give bonus points)

Single static images. Transparent background.

| Item | File | Size | Notes |
|------|------|------|-------|
| .ppt file | `assets/sprites/collectables/ppt.png` | 32×32 | PowerPoint icon |
| .Excel file | `assets/sprites/collectables/excel.png` | 32×32 | Excel spreadsheet icon |
| Post-it notes | `assets/sprites/collectables/postit.png` | 32×32 | Yellow sticky note |
| .Slides | `assets/sprites/collectables/slides.png` | 32×32 | Google Slides icon |
| Sprint Workshop | `assets/sprites/collectables/sprint.png` | 40×32 | Whiteboard / workshop |
| Agile framework | `assets/sprites/collectables/agile.png` | 40×32 | Kanban board / sticky notes |
| LinkedIn post | `assets/sprites/collectables/linkedin.png` | 32×32 | LinkedIn logo / notification |

These float at various heights. Currently **tinted green** in-game — tint removed once real art is in.

---

## S.Y.N.E.R.G.Y. Letters

7 individual letter tiles. Transparent background. Each **32×32 px**.

| Letter | File |
|--------|------|
| S | `assets/sprites/synergy/S.png` |
| Y | `assets/sprites/synergy/Y.png` |
| N | `assets/sprites/synergy/N.png` |
| E | `assets/sprites/synergy/E.png` |
| R | `assets/sprites/synergy/R.png` |
| G | `assets/sprites/synergy/G.png` |
| Y₂ | `assets/sprites/synergy/Y2.png` |

Style: bold letter on a glowing/sparkly background tile. Currently **tinted gold** — tint removed with real art.

---

## Backgrounds

These are used as **TileSprites** — they scroll horizontally to create the parallax effect.

**⚠️ MUST tile horizontally.** The left edge must seamlessly connect to the right edge when the image repeats. Vertical edges don't need to tile.

| Layer | File | Size | Scroll speed | What it shows |
|-------|------|------|-------------|---------------|
| Sky (far) | `assets/backgrounds/sky.png` | 800×450 | Slowest (0.1×) | Peckham Rye sky, distant buildings, clouds. This is the deepest layer. |
| Mid buildings | `assets/backgrounds/mid.png` | 800×450 | Medium (0.3×) | Mid-ground buildings, Peckham skyline, rooftops |
| Street detail | `assets/backgrounds/street.png` | 800×200 | Fast (0.6×) | Street-level details — shops, walls, lampposts. Bottom 45% of screen. |
| Ground | `assets/backgrounds/ground.png` | 800×60 | Full speed (1×) | The ground/pavement the character runs on. Bottom 13% of screen. |

**The sky and mid layers fill the full viewport.** They stretch to cover whatever screen size the player has. Design them at 800×450 but know they may be displayed wider or taller — keep the important content centered and make sure edges tile.

**The street layer** is positioned at the bottom half of the screen above the ground.

**The ground layer** is the actual running surface. Keep it simple — pavement/sidewalk texture.

### Honeymoon mode backgrounds (future/optional)
When the player hits a high score, the setting could shift to a tropical/holiday theme. Same sizes and tiling rules. Different color palette — warm sunset, palm trees, beach. Not needed for v1.

---

## Platforms

Platforms are **generated as colored rectangles** in code (brown with border). No art asset needed unless you want to make a pixel art platform tile. If so:

| Asset | File | Size | Notes |
|-------|------|------|-------|
| Platform tile | (optional) | ~150×16 | Horizontal platform, must tile horizontally. Floating ledge style. |

---

## UI Assets

These are **NOT tiling**. Just single images.

| Asset | File | Size | What it is |
|-------|------|------|------------|
| Title image | `assets/ui/title.png` | 400×120 | "TILL DECK DO WE PART" logo (optional — currently rendered as text) |
| Button background | `assets/ui/button.png` | 200×60 | Generic button 9-slice or flat (optional — currently using rectangles) |
| Story card BG | `assets/ui/card.png` | 600×350 | Intro scene card background (optional) |
| Char select frame | `assets/ui/charframe.png` | 100×120 | Frame around character preview on menu (optional) |

The UI is currently built with Phaser rectangles and text — these image assets are **optional enhancements**.

---

## Audio (already added)

| Asset | File | Status |
|-------|------|--------|
| Background music | `assets/audio/music/Wedding March Chiptune 8 Bit.mp3` | ✅ Done |
| Sound FX | `assets/audio/soundFX/` | Empty — add later |

### Suggested SFX (future)
- Jump sound
- Collectable pickup (coin/ding)
- SYNERGY letter collect
- SYNERGY complete (power-up activation)
- Death/hit sound
- Honeymoon mode activation fanfare

---

## Summary Checklist

| Category | Count | Priority |
|----------|-------|----------|
| Player spritesheets | 2 (Wilf + Ruth) | 🔴 Must have |
| Distractors | 9 | 🔴 Must have |
| Collectables | 7 | 🔴 Must have |
| SYNERGY letters | 7 | 🟡 Nice to have (text works) |
| Backgrounds | 4 | 🔴 Must have |
| Platforms | 1 | 🟢 Optional |
| UI images | 4 | 🟢 Optional |
| Sound FX | ~6 | 🟡 Nice to have |

**Total must-have images: 22**

---

## How to Swap Art In

1. Create your PNG at the exact size listed above
2. Save it to the file path listed in the table
3. It replaces the placeholder automatically — no code changes needed
4. Refresh the browser to see the new art

For spritesheets (Wilf/Ruth), make sure all 6 frames are in a horizontal strip, each frame exactly 64×64.
