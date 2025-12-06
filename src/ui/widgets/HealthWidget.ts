import Phaser from 'phaser';
import { BaseWidget } from './BaseWidget';
import { Player } from '../../entities/characters/Player';

/**
 * Health Widget
 * Displays player health bar
 */
export class HealthWidget extends BaseWidget {
  private healthLabel!: Phaser.GameObjects.Text;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthBarFill!: Phaser.GameObjects.Graphics;
  private player: Player | null = null;
  private maxWidth: number = 150;
  private barHeight: number = 16;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
  }

  protected createWidget(): void {
    // Create health label
    this.healthLabel = this.createText(
      -this.maxWidth / 2 - 5,
      0,
      'HEALTH:',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.success.toString(16).padStart(6, '0')}`
    );
    this.healthLabel.setOrigin(1, 0.5);
    this.container.add(this.healthLabel);

    // Create health bar background
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.fillStyle(this.theme.colors.background, 0.8);
    this.healthBarBg.fillRoundedRect(
      -this.maxWidth / 2,
      -this.barHeight / 2,
      this.maxWidth,
      this.barHeight,
      2
    );
    this.healthBarBg.setPosition(0, 0);
    this.container.add(this.healthBarBg);

    // Create health bar fill
    this.healthBarFill = this.scene.add.graphics();
    this.updateHealthBar(1.0);
    this.container.add(this.healthBarFill);
  }

  /**
   * Set player to track
   */
  setPlayer(player: Player | null): void {
    this.player = player;
    this.updateHealthBar(1.0);
  }

  /**
   * Update health bar display
   */
  update(): void {
    if (this.player && this.player.sprite && this.player.sprite.active) {
      const healthPercent = this.player.getHealth() / this.player.getMaxHealth();
      this.updateHealthBar(healthPercent);
    } else if (this.player === null || (this.player && (!this.player.sprite || !this.player.sprite.active))) {
      // Player is dead or doesn't exist - show empty health bar
      this.updateHealthBar(0);
    }
  }

  private updateHealthBar(healthPercent: number): void {
    if (!this.healthBarFill) return;

    this.healthBarFill.clear();
    
    const fillWidth = this.maxWidth * Math.max(0, Math.min(1, healthPercent));
    const healthColor = healthPercent > 0.5 
      ? this.theme.colors.success 
      : healthPercent > 0.25 
      ? this.theme.colors.warning 
      : this.theme.colors.danger;

    // Draw health bar fill
    this.healthBarFill.fillStyle(healthColor, 1);
    this.healthBarFill.fillRoundedRect(
      -this.maxWidth / 2,
      -this.barHeight / 2,
      fillWidth,
      this.barHeight,
      2
    );

    // Pulse effect when health is low
    if (healthPercent > 0 && healthPercent <= 0.25) {
      this.scene.tweens.add({
        targets: this.healthBarFill,
        alpha: { from: 0.7, to: 1 },
        duration: 500,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }
}

