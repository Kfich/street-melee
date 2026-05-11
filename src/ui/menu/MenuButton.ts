import Phaser from 'phaser';
import { MenuTheme } from './MenuTheme';

/**
 * Interactive menu button — 90s arcade style.
 *
 * Selected item:  ▶  yellow text  +  yellow top/bottom border lines
 * Hovered item:       cyan text   +  subtle cyan border
 * Normal item:        white text  +  dim border
 */
export class MenuButton {
  private scene: Phaser.Scene;
  private theme: MenuTheme;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private cursor: Phaser.GameObjects.Text;   // ▶ arcade cursor
  private text: Phaser.GameObjects.Text;
  private isSelected: boolean = false;
  private isHovered: boolean = false;
  private onClickCallback?: () => void;
  private onHoverCallback?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    theme: MenuTheme,
    onClick?: () => void,
    onHover?: () => void
  ) {
    this.scene = scene;
    this.theme = theme;
    this.onClickCallback = onClick;
    this.onHoverCallback = onHover;

    this.container = scene.add.container(x, y);

    // Background fill + border (redrawn on state change)
    this.background = scene.add.graphics();

    // Arcade cursor arrow — hidden until selected
    this.cursor = scene.add.text(
      -theme.button.width / 2 - 20,
      0,
      '▶',
      {
        fontSize: theme.typography.itemSize,
        fontFamily: theme.typography.itemFont,
        color: `#${theme.colors.selected.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    this.cursor.setOrigin(0.5).setVisible(false);

    // Label
    this.text = scene.add.text(0, 0, label, {
      fontSize: theme.typography.itemSize,
      fontFamily: theme.typography.itemFont,
      color: `#${theme.colors.text.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: theme.typography.itemStroke,
    });
    this.text.setOrigin(0.5);

    this.container.add([this.background, this.cursor, this.text]);
    this.container.setDepth(1000);

    // Draw initial state
    this.redrawBackground(false, false);

    // Interactivity
    const hitArea = new Phaser.Geom.Rectangle(
      -theme.button.width / 2,
      -theme.button.height / 2,
      theme.button.width,
      theme.button.height
    );
    this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    if (this.container.input) {
      this.container.input.cursor = 'pointer';
    }
    this.container.on('pointerdown', () => this.handleClick());
    this.container.on('pointerover', () => this.handleHover());
    this.container.on('pointerout', () => this.handleOut());
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private handleClick() {
    if (this.onClickCallback) {
      this.onClickCallback();
    }
  }

  private handleHover() {
    if (!this.isHovered) {
      this.isHovered = true;
      this.updateVisualState();
      if (this.onHoverCallback) {
        this.onHoverCallback();
      }
    }
  }

  private handleOut() {
    if (this.isHovered) {
      this.isHovered = false;
      this.updateVisualState();
    }
  }

  /** Redraw the sharp rectangular background + border. */
  private redrawBackground(selected: boolean, hovered: boolean) {
    const { width, height } = this.theme.button;
    const bg = this.background;
    bg.clear();

    if (selected) {
      // Yellow-tinted fill + bright yellow border
      bg.fillStyle(0x1a1a00, 1);
      bg.fillRect(-width / 2, -height / 2, width, height);
      bg.lineStyle(2, this.theme.colors.selected, 1);
      bg.strokeRect(-width / 2, -height / 2, width, height);
      // Top + bottom accent lines (classic arcade border)
      bg.lineStyle(1, this.theme.colors.selected, 0.6);
      bg.lineBetween(-width / 2 + 4, -height / 2 + 3, width / 2 - 4, -height / 2 + 3);
      bg.lineBetween(-width / 2 + 4, height / 2 - 3, width / 2 - 4, height / 2 - 3);
    } else if (hovered) {
      // Cyan tinted
      bg.fillStyle(0x001a1a, 1);
      bg.fillRect(-width / 2, -height / 2, width, height);
      bg.lineStyle(2, this.theme.colors.hover, 0.9);
      bg.strokeRect(-width / 2, -height / 2, width, height);
    } else {
      // Normal — very subtle dark fill, dim border
      bg.fillStyle(this.theme.colors.primary, 1);
      bg.fillRect(-width / 2, -height / 2, width, height);
      bg.lineStyle(1, this.theme.button.strokeColor, 0.7);
      bg.strokeRect(-width / 2, -height / 2, width, height);
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  private updateVisualState() {
    this.scene.tweens.killTweensOf(this.container);

    const selected = this.isSelected;
    const hovered  = this.isHovered;

    // Redraw background border
    this.redrawBackground(selected, hovered);

    // Text color
    const textColor = selected
      ? this.theme.colors.selected
      : hovered
      ? this.theme.colors.hover
      : this.theme.colors.text;
    this.text.setColor(`#${textColor.toString(16).padStart(6, '0')}`);

    // Cursor arrow visibility + blink
    this.cursor.setVisible(selected);
    if (selected) {
      // Blink the cursor
      this.scene.tweens.killTweensOf(this.cursor);
      this.scene.tweens.add({
        targets: this.cursor,
        alpha: { from: 1, to: 0.2 },
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.scene.tweens.killTweensOf(this.cursor);
      this.cursor.setAlpha(1);
    }

    // Subtle scale bump on hover only (not on selection)
    const scale = hovered && !selected ? this.theme.effects.hoverScale : 1.0;
    this.scene.tweens.add({
      targets: this.container,
      scaleX: scale,
      scaleY: scale,
      duration: this.theme.effects.transitionDuration,
      ease: 'Power2',
    });
  }

  setSelected(selected: boolean) {
    if (this.isSelected !== selected) {
      this.isSelected = selected;
      this.updateVisualState();
    }
  }

  setEnabled(enabled: boolean) {
    if (!enabled) {
      this.redrawBackground(false, false);
      this.background.clear();
      const { width, height } = this.theme.button;
      this.background.fillStyle(this.theme.colors.primary, 0.5);
      this.background.fillRect(-width / 2, -height / 2, width, height);
      this.background.lineStyle(1, this.theme.colors.disabled, 0.5);
      this.background.strokeRect(-width / 2, -height / 2, width, height);
      this.text.setColor(`#${this.theme.colors.disabled.toString(16).padStart(6, '0')}`);
      this.cursor.setVisible(false);
    } else {
      this.updateVisualState();
    }
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.cursor);
    this.container.destroy();
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  getX(): number { return this.container.x; }
  getY(): number { return this.container.y; }
}
