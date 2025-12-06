import Phaser from 'phaser';
import { Item, ItemType } from '../../entities/items/Item';
import { BaseCharacter } from '../../entities/characters/BaseCharacter';
import { RewardSystem } from '../reward/RewardSystem';

/**
 * Manages item spawning, collection, and effects
 */
export class ItemManager {
  private scene: Phaser.Scene;
  private items: Item[] = [];
  private cachedAll: Item[] | null = null;
  private isDirty: boolean = true;
  private score: number = 0;
  private lives: number = 3;
  // rewardSystem is passed to constructor but Items access it via scene.rewardSystem
  // Parameter kept for API consistency but not stored
  private magneticCollectionEnabled: boolean = true;
  private magneticRange: number = 50; // Range for magnetic collection

  constructor(scene: Phaser.Scene, _rewardSystem?: RewardSystem) {
    this.scene = scene;
    // Items access rewardSystem via scene.rewardSystem, not stored here
    this.setupEventListeners();
  }

  /**
   * Mark cache as dirty
   */
  private markDirty(): void {
    this.isDirty = true;
    this.cachedAll = null;
  }

  /**
   * Setup event listeners for item effects
   */
  private setupEventListeners() {
    this.scene.events.on('itemCollected', (data: { type: ItemType; points: number }) => {
      this.score += data.points;
      this.scene.events.emit('scoreUpdated', this.score);
      // Audio is handled in GameScene
    });

    this.scene.events.on('lifeGained', (data: { type: ItemType; lives: number }) => {
      this.lives += data.lives;
      this.scene.events.emit('livesUpdated', this.lives);
    });
  }

  /**
   * Spawn an item at a location
   */
  spawnItem(x: number, y: number, itemType: ItemType): Item {
    // Use object pool if available, otherwise create new
    const itemPool = (this.scene as any).itemPool;
    const item = itemPool 
      ? itemPool.acquire(x, y, itemType)
      : new Item(this.scene, x, y, itemType);
    this.items.push(item);
    this.markDirty();
    
    // Emit spawn event for tracking
    this.scene.events.emit('itemSpawned', item);
    
    return item;
  }

  /**
   * Spawn a random item
   */
  spawnRandomItem(x: number, y: number): Item {
    const types: ItemType[] = ['apple', 'chicken', 'moneyBag', 'goldBar', 'oneUp', 'powerUp'];
    const weights = [0.3, 0.2, 0.25, 0.1, 0.05, 0.1]; // Probability weights
    
    let random = Math.random();
    let cumulative = 0;
    let selectedType: ItemType = 'apple';
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        selectedType = types[i];
        break;
      }
    }
    
    return this.spawnItem(x, y, selectedType);
  }

  /**
   * Check for item collection with magnetic effect
   */
  checkCollection(character: BaseCharacter, collectionRange: number = 25): Item | null {
    const characterSprite = character.sprite;
    
    for (const item of this.items) {
      if (item.isCollected()) continue;
      
      const distance = Phaser.Math.Distance.Between(
        characterSprite.x,
        characterSprite.y,
        item.sprite.x,
        item.sprite.y
      );
      
      // Magnetic collection - pull items toward player
      if (this.magneticCollectionEnabled && distance < this.magneticRange) {
        (item as any).applyMagneticPull(character, 0.15);
      }
      
      // Direct collection
      if (distance < collectionRange) {
        item.collect(character);
        this.markDirty(); // Item collected, cache needs update
        return item;
      }
    }
    
    return null;
  }
  
  /**
   * Enable/disable magnetic collection
   */
  setMagneticCollection(enabled: boolean): void {
    this.magneticCollectionEnabled = enabled;
  }
  
  /**
   * Set magnetic collection range
   */
  setMagneticRange(range: number): void {
    this.magneticRange = range;
  }

  /**
   * Update all items
   */
  update(players?: BaseCharacter[]) {
    const toRemove: Item[] = [];
    
    this.items.forEach(item => {
      if (item.isCollected() || !item.sprite.active) {
        toRemove.push(item);
      } else {
        item.update();
        
        // Check magnetic collection for all players
        if (this.magneticCollectionEnabled && players) {
          for (const player of players) {
            if ((item as any).checkCollectionRange(player)) {
              (item as any).applyMagneticPull(player, 0.1);
              break; // Only pull toward nearest player
            }
          }
        }
      }
    });
    
    // Remove collected/destroyed items
    if (toRemove.length > 0) {
      const itemPool = (this.scene as any).itemPool;
      toRemove.forEach(item => {
        const index = this.items.indexOf(item);
        if (index > -1) {
          this.items.splice(index, 1);
          // Release to pool if available, otherwise destroy
          if (itemPool) {
            itemPool.release(item);
          } else {
            item.destroy();
          }
        }
      });
      this.markDirty();
    }
  }

  /**
   * Get all items (cached)
   */
  getAll(): Item[] {
    if (this.isDirty || this.cachedAll === null) {
      this.cachedAll = this.items.filter(item => !item.isCollected());
      this.isDirty = false;
    }
    return this.cachedAll;
  }

  /**
   * Get count of active items
   */
  getActiveCount(): number {
    return this.getAll().length;
  }

  /**
   * Get count of items by type
   */
  getCountByType(): Map<ItemType, number> {
    const counts = new Map<ItemType, number>();
    const allItems = this.getAll();
    
    allItems.forEach(item => {
      const type = item.getItemType();
      const count = counts.get(type) || 0;
      counts.set(type, count + 1);
    });
    
    return counts;
  }

  /**
   * Get total items spawned (including collected)
   */
  getTotalSpawned(): number {
    return this.items.length;
  }

  /**
   * Get total items collected
   */
  getTotalCollected(): number {
    return this.items.filter(item => item.isCollected()).length;
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Get current lives
   */
  getLives(): number {
    return this.lives;
  }

  /**
   * Clear all items
   */
  clear() {
    const itemPool = (this.scene as any).itemPool;
    this.items.forEach(item => {
      if (itemPool) {
        itemPool.release(item);
      } else {
        item.destroy();
      }
    });
    this.items = [];
    this.markDirty();
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    this.scene.events.off('itemCollected');
    this.scene.events.off('lifeGained');
    this.clear();
  }
}

