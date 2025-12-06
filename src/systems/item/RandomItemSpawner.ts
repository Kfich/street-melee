import Phaser from 'phaser';
import { ItemManager } from './ItemManager';
import { ItemType } from '../../entities/items/Item';

/**
 * Configuration for random item spawning
 */
export interface ItemSpawnConfig {
  minDistance: number; // Minimum distance between items
  maxDistance: number; // Maximum distance between items
  spawnAheadDistance: number; // How far ahead of player to spawn items
  spawnBehindDistance: number; // How far behind player to despawn items
  groundY: number; // Y position for ground level items
  itemHeightOffset: number; // Height offset above ground for floating items
  spawnChunkSize: number; // Number of items to spawn at once
  spawnChunkInterval: number; // Distance interval for spawning chunks
}

/**
 * Random item spawner that generates pickups throughout rooms
 */
export class RandomItemSpawner {
  private itemManager: ItemManager;
  private config: ItemSpawnConfig;
  private lastSpawnX: number = 0;
  private spawnedItems: Array<{ x: number; y: number; itemType: ItemType }> = [];
  private levelWidth: number = 0;

  // Item type weights for random spawning (higher = more common)
  private itemWeights: Map<ItemType, number> = new Map([
    ['apple', 0.35],      // 35% - Most common
    ['chicken', 0.25],    // 25% - Common
    ['moneyBag', 0.20],   // 20% - Uncommon
    ['goldBar', 0.10],    // 10% - Rare
    ['powerUp', 0.08],    // 8% - Rare
    ['oneUp', 0.02]       // 2% - Epic (very rare)
  ]);

  constructor(
    _scene: Phaser.Scene,
    itemManager: ItemManager,
    config?: Partial<ItemSpawnConfig>
  ) {
    this.itemManager = itemManager;
    
    // Default configuration
    this.config = {
      minDistance: 150,
      maxDistance: 400,
      spawnAheadDistance: 800,
      spawnBehindDistance: 400,
      groundY: 476, // Default ground level for height 576
      itemHeightOffset: 30, // Items float 30px above ground
      spawnChunkSize: 3,
      spawnChunkInterval: 500,
      ...config
    };
  }

  /**
   * Initialize spawner with level dimensions
   */
  initialize(levelWidth: number, _levelHeight: number, groundY?: number): void {
    this.levelWidth = levelWidth;
    if (groundY !== undefined) {
      this.config.groundY = groundY;
    }
    this.lastSpawnX = 0;
    this.spawnedItems = [];
  }

  /**
   * Update spawner based on player position
   */
  update(playerX: number, _playerY?: number): void {
    // Calculate spawn range
    const spawnEndX = Math.min(this.levelWidth, playerX + this.config.spawnAheadDistance);

    // Spawn items in chunks ahead of player
    if (spawnEndX > this.lastSpawnX + this.config.spawnChunkInterval) {
      this.spawnChunk(spawnEndX);
    }

    // Clean up items that are too far behind
    this.cleanupBehindPlayer(playerX);
  }

  /**
   * Spawn a chunk of random items
   */
  private spawnChunk(maxX: number): void {
    const chunkStartX = this.lastSpawnX;
    const chunkEndX = Math.min(maxX, this.lastSpawnX + this.config.spawnChunkInterval);
    
    // Spawn items in this chunk
    let currentX = chunkStartX;
    let itemsInChunk = 0;

    while (currentX < chunkEndX && itemsInChunk < this.config.spawnChunkSize) {
      // Random distance between items
      const distance = Phaser.Math.Between(
        this.config.minDistance,
        this.config.maxDistance
      );
      
      currentX += distance;
      
      if (currentX >= chunkEndX) break;
      
      // Random Y position (slightly above ground with variation)
      const yVariation = Phaser.Math.Between(-20, 20);
      const itemY = this.config.groundY - this.config.itemHeightOffset + yVariation;
      
      // Spawn random item
      const itemType = this.getRandomItemType();
      this.spawnItem(currentX, itemY, itemType);
      // Item is tracked via ItemManager's spawnItem event emission
      
      itemsInChunk++;
    }

    this.lastSpawnX = chunkEndX;
  }

  /**
   * Spawn a single item
   */
  private spawnItem(x: number, y: number, itemType: ItemType): void {
    // Check if position is too close to existing items
    const tooClose = this.spawnedItems.some(item => {
      const distance = Math.abs(item.x - x);
      return distance < this.config.minDistance;
    });

    if (tooClose) return;

    // Spawn item using ItemManager (emits itemSpawned event automatically)
    this.itemManager.spawnItem(x, y, itemType);
    
    // Track spawned item
    this.spawnedItems.push({ x, y, itemType });
  }

  /**
   * Get random item type based on weights
   */
  private getRandomItemType(): ItemType {
    const random = Math.random();
    let cumulative = 0;

    for (const [itemType, weight] of this.itemWeights.entries()) {
      cumulative += weight;
      if (random <= cumulative) {
        return itemType;
      }
    }

    // Fallback to apple
    return 'apple';
  }

  /**
   * Clean up items that are far behind the player
   */
  private cleanupBehindPlayer(playerX: number): void {
    const cleanupX = playerX - this.config.spawnBehindDistance * 2;
    
    // Remove items that are too far behind (they'll be cleaned up by ItemManager)
    this.spawnedItems = this.spawnedItems.filter(item => {
      return item.x >= cleanupX;
    });
  }

  /**
   * Spawn items at specific positions (for manual placement)
   */
  spawnAt(x: number, y: number, itemType?: ItemType): void {
    const type = itemType || this.getRandomItemType();
    this.spawnItem(x, y, type);
  }

  /**
   * Spawn items along a path
   */
  spawnAlongPath(startX: number, endX: number, y: number, count: number): void {
    const step = (endX - startX) / (count + 1);
    
    for (let i = 1; i <= count; i++) {
      const x = startX + (step * i);
      const itemType = this.getRandomItemType();
      this.spawnItem(x, y, itemType);
    }
  }

  /**
   * Set item weights for random spawning
   */
  setItemWeights(weights: Map<ItemType, number>): void {
    this.itemWeights = weights;
  }

  /**
   * Get current spawn statistics
   */
  getStats(): {
    totalSpawned: number;
    byType: Map<ItemType, number>;
  } {
    const byType = new Map<ItemType, number>();
    let total = 0;

    this.spawnedItems.forEach(item => {
      total++;
      const count = byType.get(item.itemType) || 0;
      byType.set(item.itemType, count + 1);
    });

    return {
      totalSpawned: total,
      byType
    };
  }

  /**
   * Reset spawner for new level
   */
  reset(): void {
    this.lastSpawnX = 0;
    this.spawnedItems = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ItemSpawnConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

