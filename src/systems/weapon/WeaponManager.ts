import Phaser from 'phaser';
import { Weapon, WeaponType } from '../../entities/weapons/Weapon';
import { BaseCharacter } from '../../entities/characters/BaseCharacter';

/**
 * Manages weapon spawning, pickup, and usage
 */
export class WeaponManager {
  private scene: Phaser.Scene;
  private weapons: Weapon[] = [];
  private cachedAll: Weapon[] | null = null;
  private isDirty: boolean = true;
  // Removed unused weaponSpawnPoints

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Mark cache as dirty
   */
  private markDirty(): void {
    this.isDirty = true;
    this.cachedAll = null;
  }

  /**
   * Spawn a weapon at a location
   */
  spawnWeapon(x: number, y: number, weaponType: WeaponType = 'pipe'): Weapon {
    // Use object pool if available, otherwise create new
    const weaponPool = (this.scene as any).weaponPool;
    const weapon = weaponPool 
      ? weaponPool.acquire(x, y, weaponType)
      : new Weapon(this.scene, x, y, weaponType);
    this.weapons.push(weapon);
    this.markDirty();
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
    const toRemove: Weapon[] = [];
    
    this.weapons.forEach(weapon => {
      if (weapon.shouldDestroy()) {
        toRemove.push(weapon);
      } else {
        weapon.update();
      }
    });
    
    // Remove destroyed weapons
    if (toRemove.length > 0) {
      const weaponPool = (this.scene as any).weaponPool;
      toRemove.forEach(weapon => {
        const index = this.weapons.indexOf(weapon);
        if (index > -1) {
          this.weapons.splice(index, 1);
          // Release to pool if available, otherwise destroy
          if (weaponPool) {
            weaponPool.release(weapon);
          } else {
            weapon.destroy();
          }
        }
      });
      this.markDirty();
    }
  }

  /**
   * Get all weapons (cached)
   */
  getAll(): Weapon[] {
    if (this.isDirty || this.cachedAll === null) {
      this.cachedAll = this.weapons.filter(weapon => !weapon.shouldDestroy());
      this.isDirty = false;
    }
    return this.cachedAll;
  }

  /**
   * Clear all weapons
   */
  clear() {
    const weaponPool = (this.scene as any).weaponPool;
    this.weapons.forEach(weapon => {
      if (weaponPool) {
        weaponPool.release(weapon);
      } else {
        weapon.destroy();
      }
    });
    this.weapons = [];
    this.markDirty();
  }
}

