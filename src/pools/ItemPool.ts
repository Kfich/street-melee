import Phaser from 'phaser';
import { Item, ItemType } from '../entities/items/Item';
import { ObjectPool } from '../utils/ObjectPool';

/**
 * Object pool for Item entities to reduce garbage collection
 */
export class ItemPool {
  private pools: Map<ItemType, ObjectPool<Item>> = new Map();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, initialSize: number = 5, maxSize: number = 30) {
    this.scene = scene;
    
    // Initialize pools for each item type
    const itemTypes: ItemType[] = ['apple', 'chicken', 'moneyBag', 'goldBar', 'oneUp', 'powerUp'];
    itemTypes.forEach(type => {
      this.pools.set(type, new ObjectPool<Item>(
        () => this.createItem(type),
        (item) => this.resetItem(item),
        initialSize,
        maxSize
      ));
    });
  }

  /**
   * Create a new item (used by pool)
   */
  private createItem(type: ItemType): Item {
    // Create at (0, 0) - will be repositioned when acquired
    return new Item(this.scene, 0, 0, type);
  }

  /**
   * Reset item state for reuse
   */
  private resetItem(item: Item): void {
    // Reset at (0, 0) - will be repositioned when acquired
    item.reset(0, 0, item.getItemType());
  }

  /**
   * Acquire an item from the pool
   */
  acquire(x: number, y: number, type: ItemType = 'apple'): Item {
    const pool = this.pools.get(type);
    if (!pool) {
      // Fallback: create new item if pool doesn't exist
      return new Item(this.scene, x, y, type);
    }
    
    const item = pool.acquire();
    
    // Reset item to new position and type (this will reinitialize all state)
    item.reset(x, y, type);
    
    return item;
  }

  /**
   * Release an item back to the pool
   */
  release(item: Item): void {
    if (!item || !item.sprite) return;
    
    const itemType = item.getItemType();
    const pool = this.pools.get(itemType);
    
    if (pool) {
      // Deactivate sprite
      item.sprite.setActive(false);
      item.sprite.setVisible(false);
      
      // Release to pool
      pool.release(item);
    } else {
      // Pool doesn't exist, destroy the item
      item.destroy();
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): Map<ItemType, { poolSize: number; totalSize: number }> {
    const stats = new Map<ItemType, { poolSize: number; totalSize: number }>();
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

