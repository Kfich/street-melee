import Phaser from 'phaser';
import { Weapon, WeaponType } from '../entities/weapons/Weapon';
import { ObjectPool } from '../utils/ObjectPool';

/**
 * Object pool for Weapon entities to reduce garbage collection
 */
export class WeaponPool {
  private pools: Map<WeaponType, ObjectPool<Weapon>> = new Map();
  private scene: Phaser.Scene;
  private initialSize: number;
  private maxSize: number;

  constructor(scene: Phaser.Scene, initialSize: number = 5, maxSize: number = 30) {
    this.scene = scene;
    this.initialSize = initialSize;
    this.maxSize = maxSize;
    
    // Initialize pools for each weapon type
    const weaponTypes: WeaponType[] = ['pipe', 'knife', 'bottle', 'bat'];
    weaponTypes.forEach(type => {
      this.pools.set(type, new ObjectPool<Weapon>(
        () => this.createWeapon(type),
        (weapon) => this.resetWeapon(weapon),
        initialSize,
        maxSize
      ));
    });
  }

  /**
   * Create a new weapon (used by pool)
   */
  private createWeapon(type: WeaponType): Weapon {
    // Create at (0, 0) - will be repositioned when acquired
    return new Weapon(this.scene, 0, 0, type);
  }

  /**
   * Reset weapon state for reuse
   * Note: This is called by the pool, but the weapon type is already set in the weapon
   * We'll use the weapon's current type when resetting
   */
  private resetWeapon(weapon: Weapon): void {
    // Reset at (0, 0) - will be repositioned when acquired
    // Use the weapon's current type (it was set when created)
    const weaponType = weapon.getWeaponType();
    weapon.reset(0, 0, weaponType);
  }

  /**
   * Acquire a weapon from the pool
   */
  acquire(x: number, y: number, type: WeaponType = 'pipe'): Weapon {
    const pool = this.pools.get(type);
    if (!pool) {
      // Fallback: create new weapon if pool doesn't exist
      return new Weapon(this.scene, x, y, type);
    }
    
    const weapon = pool.acquire();
    
    // Reset weapon to new position (this will reinitialize all state)
    // Use the requested type (in case weapon was reused from different type pool)
    weapon.reset(x, y, type);
    
    return weapon;
  }

  /**
   * Release a weapon back to the pool
   */
  release(weapon: Weapon): void {
    if (!weapon || !weapon.sprite) return;
    
    const weaponType = weapon.getWeaponType();
    const pool = this.pools.get(weaponType);
    
    if (pool) {
      // Deactivate sprite
      weapon.sprite.setActive(false);
      weapon.sprite.setVisible(false);
      
      // Release to pool
      pool.release(weapon);
    } else {
      // Pool doesn't exist, destroy the weapon
      weapon.destroy();
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): Map<WeaponType, { poolSize: number; totalSize: number }> {
    const stats = new Map<WeaponType, { poolSize: number; totalSize: number }>();
    this.pools.forEach((pool, type) => {
      stats.set(type, {
        poolSize: pool.getPoolSize(),
        totalSize: pool.getTotalSize()
      });
    });
    return stats;
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.pools.forEach(pool => pool.clear());
  }

  /**
   * Warm up pools by pre-allocating objects
   */
  warmUp(count: number): void {
    this.pools.forEach(pool => pool.warmUp(count));
  }
}

