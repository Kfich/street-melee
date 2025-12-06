import Phaser from 'phaser';
import { BaseWidget } from './BaseWidget';

/**
 * Continue Widget
 * Displays when all enemies in a room are defeated
 */
export class ContinueWidget extends BaseWidget {
  private continueText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private isShowing: boolean = false;
  private pulseTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
  }

  protected createWidget(): void {
    // Create background with glow effect
    const bg = this.createRoundedRect(
      0, 
      0, 
      300, 
      100, 
      this.theme.colors.background, 
      0.9,
      this.theme.colors.success,
      3
    );
    this.container.add(bg);

    // Create continue text
    this.continueText = this.createText(
      0, 
      -15, 
      'ROOM CLEARED!', 
      this.theme.typography.fontSize.large,
      `#${this.theme.colors.success.toString(16).padStart(6, '0')}`
    );
    this.container.add(this.continueText);

    // Create prompt text
    this.promptText = this.createText(
      0, 
      20, 
      'Press ENTER to Continue', 
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.secondary.toString(16).padStart(6, '0')}`
    );
    this.container.add(this.promptText);

    // Initially hidden
    this.hide(false);
  }

  /**
   * Show continue prompt
   */
  showContinue(): void {
    if (this.isShowing) return;
    
    this.isShowing = true;
    this.show(true);

    // Pulse animation for continue text
    this.pulseTween = this.scene.tweens.add({
      targets: this.continueText,
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 800,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });

    // Blink animation for prompt text
    this.scene.tweens.add({
      targets: this.promptText,
      alpha: { from: 0.5, to: 1 },
      duration: 600,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });

    // Bounce effect
    this.bounce();
  }

  /**
   * Hide continue prompt
   */
  hideContinue(): void {
    if (!this.isShowing) return;
    
    this.isShowing = false;
    
    // Stop pulse animation
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = undefined;
    }

    this.hide(true);
  }

  /**
   * Check if continue is showing
   */
  isContinueShowing(): boolean {
    return this.isShowing;
  }
}

