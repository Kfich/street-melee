import Phaser from 'phaser';
import { WeaponType } from '../entities/weapons/Weapon';

/**
 * Weapon indicator UI component
 */
export class WeaponIndicator {
  private scene: Phaser.Scene;
  private icon?: Phaser.GameObjects.Rectangle;
  private text?: Phaser.GameObjects.Text;
  private durabilityBar?: Phaser.GameObjects.Graphics;
  private durabilityText?: Phaser.GameObjects.Text;
  private x: number;
  private y: number;
  // Removed unused weaponType property

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.createIndicator();
  }

  private createIndicator() {
    // Weapon icon (colored rectangle placeholder)
    this.icon = this.scene.add.rectangle(this.x, this.y, 24, 24, 0x888888, 0.8);
    this.icon.setStrokeStyle(2, 0xffffff);
    this.icon.setVisible(false);
    this.icon.setDepth(1000);

    // Weapon name text
    this.text = this.scene.add.text(this.x + 20, this.y, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.text.setOrigin(0, 0.5);
    this.text.setVisible(false);
    this.text.setDepth(1000);

    // Durability bar (hidden initially)
    this.durabilityBar = this.scene.add.graphics();
    this.durabilityBar.setVisible(false);
    this.durabilityBar.setDepth(1000);

    // Durability text
    this.durabilityText = this.scene.add.text(this.x + 20, this.y + 15, '', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.durabilityText.setOrigin(0, 0.5);
    this.durabilityText.setVisible(false);
    this.durabilityText.setDepth(1000);
  }

  /**
   * Update weapon display
   */
  updateWeapon(weaponType: WeaponType | null, throwCount?: number, maxThrows?: number) {
    if (weaponType && this.icon && this.text) {
      // Weapon colors
      const colors: Record<WeaponType, number> = {
        pipe: 0x888888,    // Gray
        knife: 0xcccccc,   // Light gray
        bottle: 0x00ff00,  // Green
        bat: 0x8b4513      // Brown
      };

      const names: Record<WeaponType, string> = {
        pipe: 'PIPE',
        knife: 'KNIFE',
        bottle: 'BOTTLE',
        bat: 'BAT'
      };

      this.icon.setFillStyle(colors[weaponType]);
      this.icon.setVisible(true);
      
      this.text.setText(names[weaponType]);
      this.text.setVisible(true);

      // Update durability display if weapon has durability info
      if (throwCount !== undefined && maxThrows !== undefined && maxThrows > 0) {
        this.updateDurability(throwCount, maxThrows);
      } else {
        this.hideDurability();
      }
    } else {
      this.hide();
    }
  }

  /**
   * Update durability display
   */
  private updateDurability(throwCount: number, maxThrows: number) {
    if (!this.durabilityBar || !this.durabilityText) return;

    const remaining = maxThrows - throwCount;
    const durabilityRatio = remaining / maxThrows;

    // Show durability bar
    this.durabilityBar.clear();
    this.durabilityBar.setVisible(true);

    const barWidth = 60;
    const barHeight = 4;
    const barX = this.x + 20;
    const barY = this.y + 15;

    // Background (gray)
    this.durabilityBar.fillStyle(0x333333, 0.8);
    this.durabilityBar.fillRect(barX, barY - barHeight / 2, barWidth, barHeight);

    // Durability fill (color based on remaining uses)
    let durabilityColor = 0x00ff00; // Green
    if (durabilityRatio < 0.33) {
      durabilityColor = 0xff0000; // Red (low)
    } else if (durabilityRatio < 0.66) {
      durabilityColor = 0xffff00; // Yellow (medium)
    }

    this.durabilityBar.fillStyle(durabilityColor, 1);
    this.durabilityBar.fillRect(barX, barY - barHeight / 2, barWidth * durabilityRatio, barHeight);

    // Durability text
    this.durabilityText.setText(`${remaining}/${maxThrows}`);
    this.durabilityText.setColor(durabilityRatio < 0.33 ? '#ff0000' : durabilityRatio < 0.66 ? '#ffff00' : '#00ff00');
    this.durabilityText.setVisible(true);
  }

  /**
   * Hide durability display
   */
  private hideDurability() {
    if (this.durabilityBar) {
      this.durabilityBar.setVisible(false);
    }
    if (this.durabilityText) {
      this.durabilityText.setVisible(false);
    }
  }

  /**
   * Hide weapon indicator
   */
  hide() {
    if (this.icon) {
      this.icon.setVisible(false);
    }
    if (this.text) {
      this.text.setVisible(false);
    }
    this.hideDurability();
  }

  /**
   * Update position
   */
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    if (this.icon) {
      this.icon.setPosition(x, y);
    }
    if (this.text) {
      this.text.setPosition(x + 20, y);
    }
  }

  /**
   * Destroy indicator
   */
  destroy() {
    if (this.icon) {
      this.icon.destroy();
    }
    if (this.text) {
      this.text.destroy();
    }
    if (this.durabilityBar) {
      this.durabilityBar.destroy();
    }
    if (this.durabilityText) {
      this.durabilityText.destroy();
    }
  }
}

