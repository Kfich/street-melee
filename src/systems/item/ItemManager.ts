import Phaser from 'phaser';
import { Item, ItemType } from '../../entities/items/Item';
import { BaseCharacter } from '../../entities/characters/BaseCharacter';

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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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
   * Check for item collection
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
      
      if (distance < collectionRange) {
        item.collect(character);
        this.markDirty(); // Item collected, cache needs update
        return item;
      }
    }
    
    return null;
  }

  /**
   * Update all items
   */
  update() {
    const toRemove: Item[] = [];
    
    this.items.forEach(item => {
      if (item.isCollected() || !item.sprite.active) {
        toRemove.push(item);
      } else {
        item.update();
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

