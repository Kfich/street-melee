import Phaser from 'phaser';
import { MenuTheme } from './MenuTheme';

/**
 * Interactive menu button component
 */
export class MenuButton {
  private scene: Phaser.Scene;
  private theme: MenuTheme;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;
  private glow: Phaser.GameObjects.Rectangle;
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

    // Create container
    this.container = scene.add.container(x, y);

    // Create glow effect (initially invisible)
    this.glow = scene.add.rectangle(
      0,
      0,
      theme.button.width + 20,
      theme.button.height + 20,
      theme.colors.selected,
      0
    );
    this.glow.setBlendMode(Phaser.BlendModes.ADD);

    // Create background
    this.background = scene.add.rectangle(
      0,
      0,
      theme.button.width,
      theme.button.height,
      theme.colors.primary,
      theme.colors.backgroundAlpha
    );
    this.background.setStrokeStyle(theme.button.strokeWidth, theme.button.strokeColor);

    // Create text
    this.text = scene.add.text(0, 0, label, {
      fontSize: theme.typography.itemSize,
      fontFamily: theme.typography.itemFont,
      color: `#${theme.colors.text.toString(16).padStart(6, '0')}`,
      stroke: `#000000`,
      strokeThickness: theme.typography.itemStroke,
      fontStyle: 'bold',
    });
    this.text.setOrigin(0.5);

    // Add to container
    this.container.add([this.glow, this.background, this.text]);

    // Set up interactivity
    this.background.setInteractive({ useHandCursor: true });
    this.background.on('pointerdown', () => this.handleClick());
    this.background.on('pointerover', () => this.handleHover());
    this.background.on('pointerout', () => this.handleOut());

    // Set depth
    this.container.setDepth(1000);
  }

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

  setSelected(selected: boolean) {
    if (this.isSelected !== selected) {
      this.isSelected = selected;
      this.updateVisualState();
    }
  }

  private updateVisualState() {
    const scale = this.isSelected
      ? this.theme.effects.selectScale
      : this.isHovered
      ? this.theme.effects.hoverScale
      : 1.0;

    const color = this.isSelected
      ? this.theme.colors.selected
      : this.isHovered
      ? this.theme.colors.hover
      : this.theme.colors.primary;

    const textColor = this.isSelected
      ? this.theme.colors.selected
      : this.isHovered
      ? this.theme.colors.hover
      : this.theme.colors.text;

    // Animate scale
    this.scene.tweens.add({
      targets: this.container,
      scaleX: scale,
      scaleY: scale,
      duration: this.theme.effects.transitionDuration,
      ease: 'Power2',
    });

    // Update colors
    this.background.setFillStyle(color, this.theme.colors.backgroundAlpha);
    this.text.setColor(`#${textColor.toString(16).padStart(6, '0')}`);

    // Update glow
    if (this.isSelected || this.isHovered) {
      this.scene.tweens.add({
        targets: this.glow,
        alpha: this.theme.effects.glowIntensity,
        duration: this.theme.effects.transitionDuration,
      });
    } else {
      this.scene.tweens.add({
        targets: this.glow,
        alpha: 0,
        duration: this.theme.effects.transitionDuration,
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.background.setInteractive(enabled ? { useHandCursor: true } : undefined);
    if (!enabled) {
      this.background.setFillStyle(this.theme.colors.disabled, this.theme.colors.backgroundAlpha);
      this.text.setColor(`#${this.theme.colors.disabled.toString(16).padStart(6, '0')}`);
    } else {
      this.updateVisualState();
    }
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.container.destroy();
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  getX(): number {
    return this.container.x;
  }

  getY(): number {
    return this.container.y;
  }
}

