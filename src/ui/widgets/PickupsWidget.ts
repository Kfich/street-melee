import Phaser from 'phaser';
import { BaseWidget } from './BaseWidget';

/**
 * Pickups Widget
 * Displays number of items collected
 */
export class PickupsWidget extends BaseWidget {
  private pickupsLabel!: Phaser.GameObjects.Text;
  private pickupsValue!: Phaser.GameObjects.Text;
  private currentCount: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
  }

  protected createWidget(): void {
    // Create pickups label
    this.pickupsLabel = this.createText(
      -40,
      0,
      'PICKUPS:',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.text.toString(16).padStart(6, '0')}`
    );
    this.pickupsLabel.setOrigin(1, 0.5);
    this.container.add(this.pickupsLabel);

    // Create pickups value
    this.pickupsValue = this.createText(
      10,
      0,
      '0',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.text.toString(16).padStart(6, '0')}`
    );
    this.pickupsValue.setOrigin(0, 0.5);
    this.container.add(this.pickupsValue);
  }

  /**
   * Set pickup count
   */
  setCount(count: number): void {
    if (count !== this.currentCount) {
      this.currentCount = count;
      
      // Animate count change
      this.scene.tweens.add({
        targets: this.pickupsValue,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
      });

      // Update text
      this.pickupsValue.setText(count.toString());
    }
  }

  /**
   * Increment pickup count
   */
  increment(): void {
    this.setCount(this.currentCount + 1);
  }

  /**
   * Get current count
   */
  getCount(): number {
    return this.currentCount;
  }
}

