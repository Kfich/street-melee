import Phaser from 'phaser';
import { WeaponType } from '../entities/weapons/Weapon';

/**
 * Weapon indicator UI component
 */
export class WeaponIndicator {
  private scene: Phaser.Scene;
  private icon?: Phaser.GameObjects.Rectangle;
  private text?: Phaser.GameObjects.Text;
  private x: number;
  private y: number;
  private weaponType: WeaponType | null = null;

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
  }

  /**
   * Update weapon display
   */
  updateWeapon(weaponType: WeaponType | null) {
    this.weaponType = weaponType;

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
    } else {
      this.hide();
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
  }
}

