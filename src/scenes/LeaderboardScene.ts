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

  private viewportContainer?: Phaser.GameObjects.Container;
  private listContainer?: Phaser.GameObjects.Container;
  private maskRect?: Phaser.GameObjects.Rectangle;
  private listMaskFilter?: Phaser.Filters.Mask;

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

  private fetchGeneration = 0;

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
      this.maskRect?.destroy();
    });

    this.fetchGeneration++;
    const generation = this.fetchGeneration;

    fetchTopScores(100).then((rows) => {
      if (!this.scene.isActive() || generation !== this.fetchGeneration) return;
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
    if (this.listContainer) this.listContainer.y = -this.scrollY;
  }

  private getPlayerName(): string {
    return (this.returnData?.playerName ?? (this.registry.get('playerName') as string) ?? '').trim();
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

    const btnH = Phaser.Math.Clamp(Math.round(base * 0.06), 38, 50);
    const btnW = Phaser.Math.Clamp(Math.round(w * 0.42), 140, 200);
    const fontBtn = Phaser.Math.Clamp(Math.round(base * 0.048), 16, 24);
    this.backButton.setPosition(cx, h * 0.92).setSize(btnW, btnH).setFontSize(fontBtn);

    const backTop = h * 0.92 - btnH / 2;
    this.viewTop = h * 0.18;
    this.viewHeight = Math.max(60, backTop - this.viewTop - 16);

    this.rowHeight = Phaser.Math.Clamp(Math.round(base * 0.07), 30, 48);

    this.panel.setPosition(cx, this.viewTop + this.viewHeight / 2)
      .setSize(this.listWidth, this.viewHeight);

    this.maskRect = this.maskRect ?? this.add.rectangle(0, 0, 1, 1, 0xffffff).setVisible(false);
    this.updateMaskBounds();
    this.buildList();
  }

  private updateMaskBounds() {
    if (!this.maskRect) return;
    this.maskRect.setPosition(
      this.listLeft + this.listWidth / 2,
      this.viewTop + this.viewHeight / 2,
    );
    this.maskRect.setSize(this.listWidth, this.viewHeight);
  }

  private buildList() {
    if (this.viewportContainer) {
      if (this.listMaskFilter) {
        this.viewportContainer.filters?.internal?.remove(this.listMaskFilter);
        this.listMaskFilter = undefined;
      }
      this.viewportContainer.removeAll(true);
      this.viewportContainer.destroy();
    }
    this.viewportContainer = undefined;
    this.listContainer = undefined;

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
    const rankX = pad;
    const nameX = pad + this.listWidth * 0.16;
    const scoreX = this.listWidth - pad;
    const playerName = this.getPlayerName();

    const viewport = this.add.container(this.listLeft, this.viewTop).setDepth(6);
    const list = this.add.container(0, 0);
    viewport.add(list);

    this.entries.forEach((entry, i) => {
      const rowY = i * this.rowHeight + this.rowHeight / 2;
      const isTop = i === 0;
      const isSelf = playerName.length > 0 && (entry.name ?? '').trim() === playerName;

      if (i % 2 === 1) {
        const stripe = this.add.rectangle(
          this.listWidth / 2, rowY,
          this.listWidth, this.rowHeight, 0xffffff, 0.05,
        );
        list.add(stripe);
      }

      const rankText = this.add.text(rankX, rowY, `${i + 1}`, {
        fontSize: `${fontSize}px`, color: isTop ? GOLD : '#aaaacc', fontFamily: FONT_FAMILY,
      }).setOrigin(0, 0.5);
      list.add(rankText);

      let labelX = nameX;
      if (isTop && this.textures.exists('ui-trophy')) {
        const trophy = this.add.image(nameX, rowY, 'ui-trophy').setOrigin(0, 0.5);
        trophy.setScale((this.rowHeight * 0.7) / trophy.height);
        list.add(trophy);
        labelX = nameX + trophy.displayWidth + 8;
      }

      const rawName = entry.name ?? '???';
      const displayName = isSelf ? `★ ${rawName}` : rawName;
      const nameText = this.add.text(labelX, rowY, displayName, {
        fontSize: `${fontSize}px`,
        color: isTop ? GOLD : isSelf ? GOLD : '#ffffff',
        fontFamily: FONT_FAMILY,
        fontStyle: isTop || isSelf ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);
      const maxNameWidth = scoreX - labelX - this.listWidth * 0.18;
      if (nameText.width > maxNameWidth) nameText.setText(this.truncate(displayName, maxNameWidth, fontSize));
      list.add(nameText);

      const scoreText = this.add.text(scoreX, rowY, `${Math.floor(entry.score)}`, {
        fontSize: `${fontSize}px`, color: isTop ? GOLD : isSelf ? GOLD : '#ffffff', fontFamily: FONT_FAMILY,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      list.add(scoreText);
    });

    this.updateMaskBounds();
    viewport.enableFilters();
    this.listMaskFilter = viewport.filters!.internal.addMask(
      this.maskRect!,
      false,
      this.cameras.main,
      'world',
    );

    this.viewportContainer = viewport;
    this.listContainer = list;

    const contentHeight = this.entries.length * this.rowHeight;
    this.maxScroll = Math.max(0, contentHeight - this.viewHeight);
    this.applyScroll(Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll));

    this.panel.setDepth(5);
    this.backButton.rect.setDepth(20);
    this.backButton.text.setDepth(20);
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
