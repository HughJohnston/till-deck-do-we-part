import Phaser from 'phaser';

const AUDIO_DEFAULTS: { key: string; volume: number }[] = [
  { key: 'bgm', volume: 0.45 },
  { key: 'menu-bgm', volume: 0.03 },
  { key: 'honeymoon-bgm', volume: 0.30 },
  { key: 'sfx-jump', volume: 0.40 },
  { key: 'sfx-run', volume: 0.82 },
  { key: 'sfx-collect', volume: 0.70 },
  { key: 'sfx-grunt-male', volume: 0.85 },
  { key: 'sfx-grunt-female', volume: 0.75 },
  { key: 'sfx-ui', volume: 0.60 },
  { key: 'sfx-synergy', volume: 0.85 },
];

const PANEL_BG = 0x111122;
const ROW_H = 28;
const FONT = 'monospace';
const COL_NAME_X = 16;
const COL_VOL_X = 200;
const COL_BTN_X = 290;
const PANEL_W = 340;

interface AudioRow {
  label: Phaser.GameObjects.Text;
  volText: Phaser.GameObjects.Text;
  btnText: Phaser.GameObjects.Text;
  btnBg: Phaser.GameObjects.Rectangle;
  minusBg: Phaser.GameObjects.Rectangle;
  minusText: Phaser.GameObjects.Text;
  plusBg: Phaser.GameObjects.Rectangle;
  plusText: Phaser.GameObjects.Text;
  volume: number;
  key: string;
}

let consoleScene: AudioConsoleScene | null = null;

export function getAudioVolume(key: string): number {
  const entry = AUDIO_DEFAULTS.find((a) => a.key === key);
  return entry ? entry.volume : 0.5;
}

export class AudioConsoleScene extends Phaser.Scene {
  private rows: AudioRow[] = [];
  private bg!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('AudioConsole');
  }

  create() {
    consoleScene = this;
    const h = AUDIO_DEFAULTS.length * ROW_H + 52;
    const y = 40;

    this.bg = this.add.rectangle(8, y, PANEL_W, h, PANEL_BG, 0.92)
      .setOrigin(0, 0).setStrokeStyle(1, 0x4488aa);

    const titleY = y + 14;
    this.add.text(COL_NAME_X, titleY, 'AUDIO CONSOLE  (M to close)', {
      fontSize: '11px', color: '#00ffcc', fontFamily: FONT,
    });

    AUDIO_DEFAULTS.forEach(({ key, volume: defaultVol }, i) => {
      const rowY = y + 34 + i * ROW_H;
      const exists = this.cache.audio.exists(key);
      const color = exists ? '#ffffff' : '#666666';

      const label = this.add.text(COL_NAME_X, rowY, key, {
        fontSize: '11px', color, fontFamily: FONT,
      });

      const minusBg = this.add.rectangle(COL_VOL_X - 18, rowY + 6, 16, 16, 0x333355)
        .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x556688);
      const minusText = this.add.text(COL_VOL_X - 18, rowY + 6, '-', {
        fontSize: '11px', color: '#aaaacc', fontFamily: FONT,
      }).setOrigin(0.5);

      const volText = this.add.text(COL_VOL_X, rowY, defaultVol.toFixed(2), {
        fontSize: '11px', color: '#aaaacc', fontFamily: FONT,
      });

      const plusBg = this.add.rectangle(COL_VOL_X + 44, rowY + 6, 16, 16, 0x333355)
        .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x556688);
      const plusText = this.add.text(COL_VOL_X + 44, rowY + 6, '+', {
        fontSize: '11px', color: '#aaaacc', fontFamily: FONT,
      }).setOrigin(0.5);

      const btnBg = this.add.rectangle(COL_BTN_X, rowY + 6, 40, 18, 0x225533)
        .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x33aa55);
      const btnText = this.add.text(COL_BTN_X, rowY + 6, 'PLAY', {
        fontSize: '10px', color: '#44dd66', fontFamily: FONT,
      }).setOrigin(0.5);

      const row: AudioRow = {
        label, volText, btnText, btnBg, minusBg, minusText, plusBg, plusText,
        volume: defaultVol, key,
      };
      this.rows.push(row);

      if (!exists) {
        btnBg.setVisible(false);
        btnText.setVisible(false);
        minusBg.setVisible(false);
        minusText.setVisible(false);
        plusBg.setVisible(false);
        plusText.setVisible(false);
        volText.setVisible(false);
        return;
      }

      btnBg.on('pointerdown', () => this.toggleSound(row));
      minusBg.on('pointerdown', () => this.adjustVolume(row, -0.05));
      plusBg.on('pointerdown', () => this.adjustVolume(row, 0.05));
    });
  }

  private toggleSound(row: AudioRow) {
    let sound = this.sound.get(row.key);
    if (sound && sound.isPlaying) {
      sound.stop();
      row.btnText.setText('PLAY');
      row.btnText.setColor('#44dd66');
      row.btnBg.setFillStyle(0x225533).setStrokeStyle(1, 0x33aa55);
    } else {
      if (!sound) {
        const isLoop = row.key === 'bgm' || row.key === 'menu-bgm' || row.key === 'sfx-run';
        sound = this.sound.add(row.key, { loop: isLoop, volume: row.volume });
      }
      sound.play({ volume: row.volume });
      row.btnText.setText('STOP');
      row.btnText.setColor('#ff6644');
      row.btnBg.setFillStyle(0x553322).setStrokeStyle(1, 0xaa5533);
    }
  }

  private adjustVolume(row: AudioRow, delta: number) {
    row.volume = Phaser.Math.Clamp(row.volume + delta, 0, 1);
    row.volText.setText(row.volume.toFixed(2));
    const sound = this.sound.get(row.key);
    if (sound && sound.isPlaying) {
      (sound as Phaser.Sound.WebAudioSound).setVolume(row.volume);
    }
  }

  update() {
    for (const row of this.rows) {
      const sound = this.sound.get(row.key);
      const playing = sound?.isPlaying ?? false;
      if (playing) {
        row.btnText.setText('STOP');
        row.btnText.setColor('#ff6644');
        row.btnBg.setFillStyle(0x553322).setStrokeStyle(1, 0xaa5533);
      } else {
        row.btnText.setText('PLAY');
        row.btnText.setColor('#44dd66');
        row.btnBg.setFillStyle(0x225533).setStrokeStyle(1, 0x33aa55);
      }
    }
  }
}

export function registerAudioConsole(scene: Phaser.Scene) {
  scene.input.keyboard?.on('keydown-M', (event: KeyboardEvent) => {
    if (!event.shiftKey) return;
    const game = scene.game;
    if (game.scene.isActive('AudioConsole')) {
      game.scene.stop('AudioConsole');
      consoleScene = null;
    } else {
      game.scene.start('AudioConsole');
    }
  });
}
