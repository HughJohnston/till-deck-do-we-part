import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface VariantStyle {
  fill: number;
  fillAlpha: number;
  hoverFill: number;
  stroke: number;
  strokeAlpha: number;
  text: string;
  hoverText: string;
}

const VARIANT_STYLES: Record<ButtonVariant, VariantStyle> = {
  primary: {
    fill: 0x22aa44, fillAlpha: 1, hoverFill: 0x33bb55,
    stroke: 0x33cc55, strokeAlpha: 1, text: '#ffffff', hoverText: '#ffffff',
  },
  secondary: {
    fill: 0x4a90d9, fillAlpha: 1, hoverFill: 0x5aa0e9,
    stroke: 0x5aa0e9, strokeAlpha: 1, text: '#ffffff', hoverText: '#ffffff',
  },
  // Borderless: same dimensions/hit area as the others, just nothing drawn.
  tertiary: {
    fill: 0x000000, fillAlpha: 0, hoverFill: 0x000000,
    stroke: 0x000000, strokeAlpha: 0, text: '#888899', hoverText: '#aaaacc',
  },
};

const DISABLED_STYLE = {
  fill: 0x555555,
  stroke: 0x666666,
  text: '#999999',
};

export interface ButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  variant?: ButtonVariant;
  fontSize?: number;
  disabled?: boolean;
  onClick?: () => void;
}

export class UiButton {
  readonly rect: Phaser.GameObjects.Rectangle;
  readonly text: Phaser.GameObjects.Text;
  private variant: ButtonVariant;
  private enabled: boolean;
  private onClick?: () => void;

  constructor(scene: Phaser.Scene, opts: ButtonOptions) {
    this.variant = opts.variant ?? 'primary';
    this.enabled = !opts.disabled;
    this.onClick = opts.onClick;

    this.rect = scene.add.rectangle(opts.x, opts.y, opts.width, opts.height);
    this.text = scene.add.text(opts.x, opts.y, opts.label, {
      fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);
    if (opts.fontSize) this.text.setFontSize(`${opts.fontSize}px`);

    this.rect.on('pointerover', () => {
      if (!this.enabled) return;
      const style = VARIANT_STYLES[this.variant];
      this.rect.setFillStyle(style.hoverFill, style.fillAlpha);
      this.text.setColor(style.hoverText);
    });
    this.rect.on('pointerout', () => {
      if (!this.enabled) return;
      this.applyStyle();
    });
    this.rect.on('pointerdown', () => {
      if (this.enabled && this.onClick) this.onClick();
    });

    if (this.enabled) this.rect.setInteractive({ useHandCursor: true });
    this.applyStyle();
  }

  private applyStyle() {
    if (!this.enabled) {
      this.rect.setFillStyle(DISABLED_STYLE.fill, 1).setStrokeStyle(2, DISABLED_STYLE.stroke, 1);
      this.text.setColor(DISABLED_STYLE.text);
      return;
    }
    const style = VARIANT_STYLES[this.variant];
    this.rect.setFillStyle(style.fill, style.fillAlpha);
    this.rect.setStrokeStyle(2, style.stroke, style.strokeAlpha);
    this.text.setColor(style.text);
  }

  setPosition(x: number, y: number): this {
    this.rect.setPosition(x, y);
    this.text.setPosition(x, y);
    return this;
  }

  setSize(width: number, height: number): this {
    this.rect.setSize(width, height);
    // Refresh the interactive hit area to match the new size.
    if (this.enabled) this.rect.setInteractive({ useHandCursor: true });
    return this;
  }

  setFontSize(px: number): this {
    this.text.setFontSize(`${px}px`);
    return this;
  }

  setLabel(label: string): this {
    this.text.setText(label);
    return this;
  }

  setOnClick(fn: () => void): this {
    this.onClick = fn;
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    if (enabled) this.rect.setInteractive({ useHandCursor: true });
    else this.rect.disableInteractive();
    this.applyStyle();
    return this;
  }

  setVisible(visible: boolean): this {
    this.rect.setVisible(visible);
    this.text.setVisible(visible);
    return this;
  }

  getObjects(): Phaser.GameObjects.GameObject[] {
    return [this.rect, this.text];
  }

  destroy() {
    this.rect.destroy();
    this.text.destroy();
  }
}

export function createButton(scene: Phaser.Scene, opts: ButtonOptions): UiButton {
  return new UiButton(scene, opts);
}
