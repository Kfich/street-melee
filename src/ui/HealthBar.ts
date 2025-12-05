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

  constructor(scene: Phaser.Scene, entity: BaseEntity, x: number, y: number, width: number = 60, height: number = 8) {
    this.entity = entity;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // Create background
    this.background = scene.add.graphics();
    this.background.fillStyle(0x000000, 0.5);
    this.background.fillRect(x, y, width, height);

    // Create health bar
    this.bar = scene.add.graphics();
    this.update();
  }

  /**
   * Update health bar display
   */
  update() {
    if (!this.entity || !this.entity.sprite || !this.entity.sprite.active) {
      return;
    }

    const health = this.entity.getHealth();
    const maxHealth = this.entity.getMaxHealth();
    const percentage = Math.max(0, health / maxHealth);

    // Clear previous drawing
    this.bar.clear();

    // Draw health bar with border
    const barWidth = this.width * percentage;
    
    // Color based on health percentage
    let color = 0x00ff00; // Green
    if (percentage < 0.3) {
      color = 0xff0000; // Red
    } else if (percentage < 0.6) {
      color = 0xffff00; // Yellow
    }

    // Draw border
    this.bar.lineStyle(1, 0xffffff, 1);
    this.bar.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);

    // Draw health fill
    this.bar.fillStyle(color, 1);
    this.bar.fillRect(this.x, this.y, barWidth, this.height);

    // Draw health percentage text (optional, for debugging)
    // Can be removed if too cluttered
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
    this.bar.destroy();
    this.background.destroy();
  }
}

