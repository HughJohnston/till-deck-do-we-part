import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/gameConfig';
import { createMuteButton } from '../ui/MuteButton';
import { registerUiSound } from '../ui/uiSound';
import { registerAudioConsole } from '../ui/AudioConsole';
import { UiButton, createButton } from '../ui/Button';
import { fetchTopScores, LeaderboardEntry } from '../services/LeaderboardService';
import type { GameOverData } from './GameOverScene';

const GOLD = '#FFD700';

export class LeaderboardScene extends Phaser.Scene {
  private returnData?: GameOverData;
  private entries: LeaderboardEntry[] = [];
  private loaded = false;

  private bg!: Phaser.GameObjects.Image;
  private title!: Phaser.GameObjects.Text;
  private panel!: Phaser.GameObjects.Rectangle;
  private statusText!: Phaser.GameObjects.Text;
  private backButton!: UiButton;

  private listContainer?: Phaser.GameObjects.Container;
  private maskGfx?: Phaser.GameObjects.Graphics;

  // Scroll state / current viewport geometry.
  private scrollY = 0;
  private maxScroll = 0;
  private viewTop = 0;
  private viewHeight = 0;
  private rowHeight = 0;
  private listLeft = 0;
  private listWidth = 0;

  private dragging = false;
  private dragStartPointerY = 0;
  private dragStartScroll = 0;

  private resizeHandler?: (size: Phaser.Structs.Size) => void;

  constructor() {
    super('LeaderboardScene');
  }

  init(data: GameOverData) {
    this.returnData = data;
    this.entries = [];
    this.loaded = false;
    this.scrollY = 0;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    this.bg = this.add.image(cx, h / 2, 'menu-home-faded').setOrigin(0.5);

    this.title = this.add.text(cx, h * 0.1, 'LEADERBOARD', {
      fontSize: '28px', color: GOLD, fontFamily: FONT_FAMILY,
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.panel = this.add.rectangle(cx, h / 2, 10, 10, 0x1a1a2e, 0.62)
      .setStrokeStyle(2, 0x4A90D9, 0.8);

    this.statusText = this.add.text(cx, h / 2, 'Loading...', {
      fontSize: '16px', color: '#ffffff', fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);

    const base = Math.min(w, h);
    const fontBtn = Phaser.Math.Clamp(Math.round(base * 0.048), 16, 24);
    const btnH = Phaser.Math.Clamp(Math.round(base * 0.06), 38, 50);
    const btnW = Phaser.Math.Clamp(Math.round(w * 0.42), 140, 200);

    this.backButton = createButton(this, {
      x: cx, y: h * 0.92, width: btnW, height: btnH,
      label: '← Back', variant: 'secondary', fontSize: fontBtn,
      onClick: () => this.scene.start('GameOverScene', this.returnData),
    });

    this.setupScrollInput();
    this.relayout();

    createMuteButton(this);
    registerUiSound(this);
    registerAudioConsole(this);

    this.resizeHandler = () => this.relayout();
    this.scale.on('resize', this.resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off('resize', this.resizeHandler);
    });

    fetchTopScores(100).then((rows) => {
      this.entries = rows;
      this.loaded = true;
      this.relayout();
    });
  }

  private setupScrollInput() {
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.applyScroll(this.scrollY + dy);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isInView(pointer.y)) {
        this.dragging = true;
        this.dragStartPointerY = pointer.y;
        this.dragStartScroll = this.scrollY;
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging && pointer.isDown) {
        this.applyScroll(this.dragStartScroll - (pointer.y - this.dragStartPointerY));
      }
    });
    const endDrag = () => { this.dragging = false; };
    this.input.on('pointerup', endDrag);
    this.input.on('pointerupoutside', endDrag);
  }

  private isInView(y: number): boolean {
    return y >= this.viewTop && y <= this.viewTop + this.viewHeight;
  }

  private applyScroll(value: number) {
    this.scrollY = Phaser.Math.Clamp(value, 0, this.maxScroll);
    if (this.listContainer) this.listContainer.y = this.viewTop - this.scrollY;
  }

  private relayout() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const base = Math.min(w, h);

    this.bg.setPosition(cx, h / 2);
    this.bg.setScale(Math.max(w / this.bg.width, h / this.bg.height));

    this.title.setPosition(cx, h * 0.1);

    this.listWidth = Math.min(w * 0.9, 520);
    this.listLeft = cx - this.listWidth / 2;
    this.viewTop = h * 0.2;
    const viewBottom = h * 0.84;
    this.viewHeight = Math.max(60, viewBottom - this.viewTop);
    this.rowHeight = Phaser.Math.Clamp(Math.round(base * 0.07), 30, 48);

    this.panel.setPosition(cx, this.viewTop + this.viewHeight / 2)
      .setSize(this.listWidth, this.viewHeight);

    const btnH = Phaser.Math.Clamp(Math.round(base * 0.06), 38, 50);
    const btnW = Phaser.Math.Clamp(Math.round(w * 0.42), 140, 200);
    const fontBtn = Phaser.Math.Clamp(Math.round(base * 0.048), 16, 24);
    this.backButton.setPosition(cx, h * 0.92).setSize(btnW, btnH).setFontSize(fontBtn);

    this.buildList();
  }

  private buildList() {
    this.listContainer?.destroy();
    this.listContainer = undefined;
    this.maskGfx?.destroy();
    this.maskGfx = undefined;

    if (!this.loaded) {
      this.statusText.setText('Loading...').setVisible(true)
        .setPosition(this.scale.width / 2, this.viewTop + this.viewHeight / 2);
      return;
    }

    if (this.entries.length === 0) {
      this.statusText.setText('No scores yet —\nbe the first!')
        .setAlign('center').setVisible(true)
        .setPosition(this.scale.width / 2, this.viewTop + this.viewHeight / 2);
      return;
    }

    this.statusText.setVisible(false);

    const base = Math.min(this.scale.width, this.scale.height);
    const fontSize = Phaser.Math.Clamp(Math.round(base * 0.035), 13, 20);
    const pad = Math.max(10, this.listWidth * 0.04);
    const rankX = this.listLeft + pad;
    const nameX = this.listLeft + pad + this.listWidth * 0.16;
    const scoreX = this.listLeft + this.listWidth - pad;

    const container = this.add.container(0, this.viewTop);

    this.entries.forEach((entry, i) => {
      const rowY = i * this.rowHeight + this.rowHeight / 2;
      const isTop = i === 0;

      if (i % 2 === 1) {
        container.add(
          this.add.rectangle(
            this.listLeft + this.listWidth / 2, rowY,
            this.listWidth, this.rowHeight, 0xffffff, 0.05,
          ),
        );
      }

      const rankText = this.add.text(rankX, rowY, `${i + 1}`, {
        fontSize: `${fontSize}px`, color: isTop ? GOLD : '#aaaacc', fontFamily: FONT_FAMILY,
      }).setOrigin(0, 0.5);
      container.add(rankText);

      let labelX = nameX;
      if (isTop && this.textures.exists('ui-trophy')) {
        const trophy = this.add.image(nameX, rowY, 'ui-trophy').setOrigin(0, 0.5);
        trophy.setScale((this.rowHeight * 0.7) / trophy.height);
        container.add(trophy);
        labelX = nameX + trophy.displayWidth + 8;
      }

      const nameText = this.add.text(labelX, rowY, entry.name ?? '???', {
        fontSize: `${fontSize}px`,
        color: isTop ? GOLD : '#ffffff',
        fontFamily: FONT_FAMILY,
        fontStyle: isTop ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);
      // Keep the name from overlapping the score column.
      const maxNameWidth = scoreX - labelX - this.listWidth * 0.18;
      if (nameText.width > maxNameWidth) nameText.setText(this.truncate(entry.name ?? '???', maxNameWidth, fontSize));
      container.add(nameText);

      const scoreText = this.add.text(scoreX, rowY, `${Math.floor(entry.score)}`, {
        fontSize: `${fontSize}px`, color: isTop ? GOLD : '#ffffff', fontFamily: FONT_FAMILY,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      container.add(scoreText);
    });

    // Clip the list to the viewport with a geometry mask.
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0xffffff);
    gfx.fillRect(this.listLeft, this.viewTop, this.listWidth, this.viewHeight);
    container.setMask(gfx.createGeometryMask());

    this.listContainer = container;
    this.maskGfx = gfx;

    const contentHeight = this.entries.length * this.rowHeight;
    this.maxScroll = Math.max(0, contentHeight - this.viewHeight);
    this.applyScroll(this.scrollY);
  }

  private truncate(text: string, maxWidth: number, fontSize: number): string {
    const probe = this.add.text(0, 0, '', {
      fontSize: `${fontSize}px`, fontFamily: FONT_FAMILY,
    }).setVisible(false);
    let result = text;
    while (result.length > 1) {
      probe.setText(`${result}…`);
      if (probe.width <= maxWidth) break;
      result = result.slice(0, -1);
    }
    probe.destroy();
    return `${result}…`;
  }
}
