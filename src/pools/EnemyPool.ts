import Phaser from 'phaser';
import { Enemy, EnemyType } from '../entities/enemies/Enemy';
import { ObjectPool } from '../utils/ObjectPool';

/**
 * Object pool for Enemy entities to reduce garbage collection
 */
export class EnemyPool {
  private pools: Map<EnemyType, ObjectPool<Enemy>> = new Map();
  private scene: Phaser.Scene;
  private initialSize: number;
  private maxSize: number;

  constructor(scene: Phaser.Scene, initialSize: number = 10, maxSize: number = 50) {
    this.scene = scene;
    this.initialSize = initialSize;
    this.maxSize = maxSize;
    
    // Initialize pools for each enemy type
    const enemyTypes: EnemyType[] = ['basic', 'galsia', 'donovan'];
    enemyTypes.forEach(type => {
      this.pools.set(type, new ObjectPool<Enemy>(
        () => this.createEnemy(type),
        (enemy) => this.resetEnemy(enemy),
        initialSize,
        maxSize
      ));
    });
  }

  /**
   * Create a new enemy (used by pool)
   */
  private createEnemy(type: EnemyType): Enemy {
    // Create at (0, 0) - will be repositioned when acquired
    return new Enemy(this.scene, 0, 0, type);
  }

  /**
   * Reset enemy state for reuse
   */
  private resetEnemy(enemy: Enemy): void {
    // Reset at (0, 0) - will be repositioned when acquired
    enemy.reset(0, 0);
  }

  /**
   * Acquire an enemy from the pool
   */
  acquire(x: number, y: number, type: EnemyType = 'basic'): Enemy {
    const pool = this.pools.get(type);
    if (!pool) {
      // Fallback: create new enemy if pool doesn't exist
      return new Enemy(this.scene, x, y, type);
    }
    
    const enemy = pool.acquire();
    
    // Reset enemy to new position (this will reinitialize all state)
    enemy.reset(x, y);
    
    return enemy;
  }

  /**
   * Release an enemy back to the pool
   */
  release(enemy: Enemy): void {
    if (!enemy || !enemy.sprite) return;
    
    const enemyType = (enemy as any).enemyType as EnemyType || 'basic';
    const pool = this.pools.get(enemyType);
    
    if (pool) {
      // Deactivate sprite
      enemy.sprite.setActive(false);
      enemy.sprite.setVisible(false);
      
      // Release to pool
      pool.release(enemy);
    } else {
      // Pool doesn't exist, destroy the enemy
      enemy.destroy();
    }
  }


  /**
   * Get pool statistics
   */
  getStats(): Map<EnemyType, { poolSize: number; totalSize: number }> {
    const stats = new Map<EnemyType, { poolSize: number; totalSize: number }>();
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

