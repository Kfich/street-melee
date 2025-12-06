import Phaser from 'phaser';
import { MenuTheme } from './MenuTheme';

/**
 * Interactive menu button component
 */
export class MenuButton {
  private scene: Phaser.Scene;
  private theme: MenuTheme;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private glow: Phaser.GameObjects.Graphics;
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

    // Create glow effect (initially invisible) - rounded
    this.glow = scene.add.graphics();
    this.glow.fillStyle(theme.colors.selected, 0);
    this.glow.fillRoundedRect(
      -(theme.button.width + 20) / 2,
      -(theme.button.height + 20) / 2,
      theme.button.width + 20,
      theme.button.height + 20,
      theme.button.borderRadius + 4
    );
    this.glow.setBlendMode(Phaser.BlendModes.ADD);

    // Create background with rounded corners
    this.background = scene.add.graphics();
    this.background.fillStyle(theme.colors.primary, theme.colors.backgroundAlpha);
    this.background.fillRoundedRect(
      -theme.button.width / 2,
      -theme.button.height / 2,
      theme.button.width,
      theme.button.height,
      theme.button.borderRadius
    );
    this.background.lineStyle(theme.button.strokeWidth, theme.button.strokeColor, 1);
    this.background.strokeRoundedRect(
      -theme.button.width / 2,
      -theme.button.height / 2,
      theme.button.width,
      theme.button.height,
      theme.button.borderRadius
    );

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

    // Set up interactivity - use container for hit area
    const hitArea = new Phaser.Geom.Rectangle(
      -this.theme.button.width / 2,
      -this.theme.button.height / 2,
      this.theme.button.width,
      this.theme.button.height
    );
    this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    if (this.container.input) {
      this.container.input.cursor = 'pointer';
    }
    this.container.on('pointerdown', () => this.handleClick());
    this.container.on('pointerover', () => this.handleHover());
    this.container.on('pointerout', () => this.handleOut());

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

    // Update colors - redraw rounded rectangle
    this.background.clear();
    this.background.fillStyle(color, this.theme.colors.backgroundAlpha);
    this.background.fillRoundedRect(
      -this.theme.button.width / 2,
      -this.theme.button.height / 2,
      this.theme.button.width,
      this.theme.button.height,
      this.theme.button.borderRadius
    );
    this.background.lineStyle(this.theme.button.strokeWidth, this.theme.button.strokeColor, 1);
    this.background.strokeRoundedRect(
      -this.theme.button.width / 2,
      -this.theme.button.height / 2,
      this.theme.button.width,
      this.theme.button.height,
      this.theme.button.borderRadius
    );
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
    if (!enabled) {
      // Redraw with disabled color
      this.background.clear();
      this.background.fillStyle(this.theme.colors.disabled, this.theme.colors.backgroundAlpha);
      this.background.fillRoundedRect(
        -this.theme.button.width / 2,
        -this.theme.button.height / 2,
        this.theme.button.width,
        this.theme.button.height,
        this.theme.button.borderRadius
      );
      this.background.lineStyle(this.theme.button.strokeWidth, this.theme.button.strokeColor, 1);
      this.background.strokeRoundedRect(
        -this.theme.button.width / 2,
        -this.theme.button.height / 2,
        this.theme.button.width,
        this.theme.button.height,
        this.theme.button.borderRadius
      );
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

