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
    
    // Emit spawn event for tracking
    this.scene.events.emit('weaponSpawned', weapon);
    
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
        // Emit pickup event for tracking
        this.scene.events.emit('weaponPickedUp', {
          weapon: weapon,
          weaponType: weapon.getWeaponType(),
          character: character
        });
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
      this.cachedAll = this.weapons.filter(weapon => !weapon.shouldDestroy() && !weapon.isHeld());
      this.isDirty = false;
    }
    return this.cachedAll;
  }

  /**
   * Get count of active weapons
   */
  getActiveCount(): number {
    return this.getAll().length;
  }

  /**
   * Get count of weapons by type
   */
  getCountByType(): Map<WeaponType, number> {
    const counts = new Map<WeaponType, number>();
    const allWeapons = this.getAll();
    
    allWeapons.forEach(weapon => {
      const type = weapon.getWeaponType();
      const count = counts.get(type) || 0;
      counts.set(type, count + 1);
    });
    
    return counts;
  }

  /**
   * Get total weapons spawned (including held/destroyed)
   */
  getTotalSpawned(): number {
    return this.weapons.length;
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

