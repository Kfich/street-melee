import Phaser from 'phaser';
import { BaseWidget } from './BaseWidget';

/**
 * Score Widget
 * Displays player score
 */
export class ScoreWidget extends BaseWidget {
  private scoreLabel!: Phaser.GameObjects.Text;
  private scoreValue!: Phaser.GameObjects.Text;
  private currentScore: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
  }

  protected createWidget(): void {
    // Create score label
    this.scoreLabel = this.createText(
      -30,
      0,
      'SCORE:',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.secondary.toString(16).padStart(6, '0')}`
    );
    this.scoreLabel.setOrigin(1, 0.5);
    this.container.add(this.scoreLabel);

    // Create score value
    this.scoreValue = this.createText(
      10,
      0,
      '0',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.secondary.toString(16).padStart(6, '0')}`
    );
    this.scoreValue.setOrigin(0, 0.5);
    this.container.add(this.scoreValue);
  }

  /**
   * Set score
   */
  setScore(score: number): void {
    if (score !== this.currentScore) {
      this.currentScore = score;
      
      // Animate score change
      this.scene.tweens.add({
        targets: this.scoreValue,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
      });

      // Update text
      this.scoreValue.setText(score.toString());
    }
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.currentScore;
  }

  /**
   * Add to score
   */
  addScore(points: number): void {
    this.setScore(this.currentScore + points);
  }
}

