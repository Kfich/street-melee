import Phaser from 'phaser';
import { Weapon, WeaponType } from '../../entities/weapons/Weapon';
import { BaseCharacter } from '../../entities/characters/BaseCharacter';

/**
 * Manages weapon spawning, pickup, and usage
 */
export class WeaponManager {
  private scene: Phaser.Scene;
  private weapons: Weapon[] = [];
  private weaponSpawnPoints: { x: number; y: number }[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Spawn a weapon at a location
   */
  spawnWeapon(x: number, y: number, weaponType: WeaponType = 'pipe'): Weapon {
    const weapon = new Weapon(this.scene, x, y, weaponType);
    this.weapons.push(weapon);
    return weapon;
  }

  /**
   * Check for weapon pickup
   */
  checkPickup(character: BaseCharacter, pickupRange: number = 30): Weapon | null {
    const characterSprite = character.sprite;
    
    for (const weapon of this.weapons) {
      if (weapon.isHeld() || weapon.shouldDestroy()) continue;
      
      const distance = Phaser.Math.Distance.Between(
        characterSprite.x,
        characterSprite.y,
        weapon.sprite.x,
        weapon.sprite.y
      );
      
      if (distance < pickupRange) {
        return weapon;
      }
    }
    
    return null;
  }

  /**
   * Update all weapons
   */
  update() {
    this.weapons.forEach(weapon => {
      if (!weapon.shouldDestroy()) {
        weapon.update();
      }
    });
    
    // Remove destroyed weapons
    this.weapons = this.weapons.filter(weapon => !weapon.shouldDestroy());
  }

  /**
   * Get all weapons
   */
  getAll(): Weapon[] {
    return this.weapons.filter(weapon => !weapon.shouldDestroy());
  }

  /**
   * Clear all weapons
   */
  clear() {
    this.weapons.forEach(weapon => weapon.destroy());
    this.weapons = [];
  }
}

