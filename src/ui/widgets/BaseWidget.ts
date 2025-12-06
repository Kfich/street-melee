import Phaser from 'phaser';
import { WIDGET_THEME } from './WidgetTheme';

/**
 * Base class for all game widgets
 * Provides common functionality, styling, and animations
 */
export abstract class BaseWidget {
  protected scene: Phaser.Scene;
  protected container: Phaser.GameObjects.Container;
  protected isVisible: boolean = true;
  protected theme = WIDGET_THEME;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.container.setDepth(10000); // Very high depth to appear above everything
    this.container.setScrollFactor(0, 0); // Fixed to camera
    this.container.setVisible(true); // Ensure visible
    this.container.setActive(true); // Ensure active
    this.container.setAlpha(1); // Ensure fully opaque
    // Bring container to top of display list
    scene.children.bringToTop(this.container);
    this.createWidget();
  }

  /**
   * Create the widget UI elements
   * Must be implemented by subclasses
   */
  protected abstract createWidget(): void;

  /**
   * Update widget state
   * Can be overridden by subclasses
   */
  update(): void {
    // Default implementation - can be overridden
  }

  /**
   * Show widget with animation
   */
  show(animate: boolean = true): void {
    this.isVisible = true;
    this.container.setVisible(true);
    this.container.setActive(true);

    if (animate) {
      this.container.setAlpha(0);
      this.scene.tweens.add({
        targets: this.container,
        alpha: 1,
        duration: this.theme.animations.fadeIn.duration,
        ease: this.theme.animations.fadeIn.ease,
      });
    } else {
      this.container.setAlpha(1);
    }
  }

  /**
   * Hide widget with animation
   */
  hide(animate: boolean = true): void {
    if (animate) {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: this.theme.animations.fadeOut.duration,
        ease: this.theme.animations.fadeOut.ease,
        onComplete: () => {
          this.isVisible = false;
          this.container.setVisible(false);
          this.container.setActive(false);
        },
      });
    } else {
      this.isVisible = false;
      this.container.setVisible(false);
      this.container.setActive(false);
      this.container.setAlpha(0);
    }
  }

  /**
   * Pulse animation
   */
  pulse(): void {
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: this.theme.animations.pulse.duration / 2,
      yoyo: true,
      ease: this.theme.animations.pulse.ease,
    });
  }

  /**
   * Bounce animation
   */
  bounce(): void {
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: this.theme.animations.bounce.duration,
      yoyo: true,
      ease: this.theme.animations.bounce.ease,
    });
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  /**
   * Get position
   */
  getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  /**
   * Destroy widget
   */
  destroy(): void {
    this.container.destroy(true);
  }

  /**
   * Create styled text
   */
  protected createText(
    x: number,
    y: number,
    text: string,
    fontSize: string = this.theme.typography.fontSize.medium,
    color: string = `#${this.theme.colors.text.toString(16).padStart(6, '0')}`
  ): Phaser.GameObjects.Text {
    const textObj = this.scene.add.text(x, y, text, {
      fontFamily: this.theme.typography.fontFamily,
      fontSize: fontSize,
      color: color,
      stroke: `#${this.theme.colors.textShadow.toString(16).padStart(6, '0')}`,
      strokeThickness: this.theme.typography.strokeThickness,
    });
    textObj.setOrigin(0.5, 0.5);
    return textObj;
  }

  /**
   * Create styled rectangle with rounded corners
   */
  protected createRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number = this.theme.colors.background,
    fillAlpha: number = 0.8,
    strokeColor: number = this.theme.colors.border,
    strokeWidth: number = 2
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillRoundedRect(
      x - width / 2,
      y - height / 2,
      width,
      height,
      this.theme.borderRadius
    );
    graphics.lineStyle(strokeWidth, strokeColor, 1);
    graphics.strokeRoundedRect(
      x - width / 2,
      y - height / 2,
      width,
      height,
      this.theme.borderRadius
    );
    return graphics;
  }
}

