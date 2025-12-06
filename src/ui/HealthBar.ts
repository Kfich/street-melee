import Phaser from 'phaser';
import { BaseEntity } from '../entities/base/BaseEntity';

/**
 * Health bar UI component
 */
export class HealthBar {
  private entity: BaseEntity;
  private bar: Phaser.GameObjects.Graphics;
  private background: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private offsetY: number = -60; // Offset above entity
  private currentDisplayHealth: number; // For smooth animation
  private scene: Phaser.Scene;
  private lowHealthPulse?: Phaser.Tweens.Tween;
  private damageFlash?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, entity: BaseEntity, x: number, y: number, width: number = 60, height: number = 8) {
    this.entity = entity;
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.currentDisplayHealth = entity.getHealth();

    // Create background
    this.background = scene.add.graphics();
    this.background.fillStyle(0x000000, 0.5);
    this.background.fillRect(x, y, width, height);

    // Create health bar
    this.bar = scene.add.graphics();
    this.update();
  }

  /**
   * Update health bar display with smooth animations
   */
  update() {
    if (!this.entity || !this.entity.sprite || !this.entity.sprite.active) {
      return;
    }

    const health = this.entity.getHealth();
    const maxHealth = this.entity.getMaxHealth();
    const actualPercentage = Math.max(0, health / maxHealth);
    
    // Smoothly animate health decrease
    const healthDiff = health - this.currentDisplayHealth;
    if (Math.abs(healthDiff) > 0.1) {
      // Animate to new health value with smoother easing
      const animationDuration = healthDiff < 0 ? 400 : 200; // Slower decrease, faster increase
      this.scene.tweens.add({
        targets: this,
        currentDisplayHealth: health,
        duration: animationDuration,
        ease: healthDiff < 0 ? 'Power2.easeOut' : 'Power2.easeIn'
      });
      
      // Flash effect when taking damage
      if (healthDiff < 0) {
        this.flashDamage();
      }
    }
    
    const displayPercentage = Math.max(0, this.currentDisplayHealth / maxHealth);
    this.updateDisplay(displayPercentage, actualPercentage);
    
    // Check for low health warning
    if (actualPercentage < 0.3 && actualPercentage > 0) {
      this.startLowHealthPulse();
    } else {
      this.stopLowHealthPulse();
    }
  }
  
  /**
   * Update the visual display of the health bar
   */
  private updateDisplay(displayPercentage: number, actualPercentage: number) {
    // Clear previous drawing
    this.bar.clear();

    // Draw health bar with border
    const barWidth = this.width * displayPercentage;
    
    // Smooth color transition based on health percentage
    let color = this.getHealthColor(actualPercentage);

    // Draw border
    this.bar.lineStyle(1, 0xffffff, 1);
    this.bar.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);

    // Draw health fill
    this.bar.fillStyle(color, 1);
    this.bar.fillRect(this.x, this.y, barWidth, this.height);
  }
  
  /**
   * Get health color with smooth transitions
   */
  private getHealthColor(percentage: number): number {
    if (percentage >= 0.6) {
      // Green to yellow transition (60-100%)
      const t = (percentage - 0.6) / 0.4;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xffff00), // Yellow
        Phaser.Display.Color.ValueToColor(0x00ff00), // Green
        100,
        Math.floor(t * 100)
      );
      return Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    } else if (percentage >= 0.3) {
      // Yellow to red transition (30-60%)
      const t = (percentage - 0.3) / 0.3;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xff0000), // Red
        Phaser.Display.Color.ValueToColor(0xffff00), // Yellow
        100,
        Math.floor(t * 100)
      );
      return Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    } else {
      // Red for low health
      return 0xff0000;
    }
  }
  
  /**
   * Flash effect when taking damage
   */
  private flashDamage() {
    if (this.damageFlash) {
      this.damageFlash.stop();
    }
    
    this.damageFlash = this.scene.tweens.add({
      targets: this.bar,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this.bar.setAlpha(1);
      }
    });
  }
  
  /**
   * Start low health pulsing warning
   */
  private startLowHealthPulse() {
    if (this.lowHealthPulse && this.lowHealthPulse.isPlaying()) {
      return; // Already pulsing
    }
    
    this.lowHealthPulse = this.scene.tweens.add({
      targets: this.bar,
      alpha: { from: 0.5, to: 1.0 },
      duration: 400,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }
  
  /**
   * Stop low health pulsing
   */
  private stopLowHealthPulse() {
    if (this.lowHealthPulse) {
      this.lowHealthPulse.stop();
      this.lowHealthPulse = undefined;
      this.bar.setAlpha(1);
    }
  }

  /**
   * Update position to follow entity
   */
  updatePosition() {
    const sprite = this.entity.sprite;
    this.x = sprite.x - this.width / 2;
    this.y = sprite.y + this.offsetY;
    
    this.background.setPosition(this.x, this.y);
    this.update();
  }

  /**
   * Destroy health bar
   */
  destroy() {
    if (this.lowHealthPulse) {
      this.lowHealthPulse.stop();
    }
    if (this.damageFlash) {
      this.damageFlash.stop();
    }
    this.bar.destroy();
    this.background.destroy();
  }
}

