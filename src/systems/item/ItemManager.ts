import Phaser from 'phaser';
import { Item, ItemType } from '../../entities/items/Item';
import { BaseCharacter } from '../../entities/characters/BaseCharacter';

/**
 * Manages item spawning, collection, and effects
 */
export class ItemManager {
  private scene: Phaser.Scene;
  private items: Item[] = [];
  private score: number = 0;
  private lives: number = 3;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupEventListeners();
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
    const item = new Item(this.scene, x, y, itemType);
    this.items.push(item);
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
        return item;
      }
    }
    
    return null;
  }

  /**
   * Update all items
   */
  update() {
    this.items.forEach(item => {
      if (!item.isCollected()) {
        item.update();
      }
    });
    
    // Remove collected/destroyed items
    this.items = this.items.filter(item => !item.isCollected() && item.sprite.active);
  }

  /**
   * Get all items
   */
  getAll(): Item[] {
    return this.items.filter(item => !item.isCollected());
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
    this.items.forEach(item => item.destroy());
    this.items = [];
  }
}

