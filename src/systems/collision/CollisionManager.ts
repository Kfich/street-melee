import Phaser from 'phaser';
import { BaseEntity } from '../../entities/base/BaseEntity';
import { SpatialGrid } from './SpatialGrid';
import { GameConfig } from '../../config/GameConfig';

/**
 * Centralized collision management system
 * Handles all collision detection types in the game
 */
export class CollisionManager {
  private scene: Phaser.Scene;
  private spatialGrid: SpatialGrid;
  private worldBounds: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, worldBounds?: Phaser.Geom.Rectangle) {
    this.scene = scene;
    this.worldBounds = worldBounds || new Phaser.Geom.Rectangle(0, 0, 2000, 1000);
    this.spatialGrid = new SpatialGrid(GameConfig.SPATIAL_GRID_CELL_SIZE, this.worldBounds);
  }

  /**
   * Update world bounds (call when room size changes)
   */
  setWorldBounds(bounds: Phaser.Geom.Rectangle): void {
    this.worldBounds = bounds;
    this.spatialGrid.setWorldBounds(bounds);
  }

  /**
   * Get entities near a position (for AI, pickup detection, etc.)
   */
  getEntitiesNearPosition(
    x: number,
    y: number,
    radius: number,
    filter?: (entity: BaseEntity) => boolean
  ): BaseEntity[] {
    const results: BaseEntity[] = [];
    const radiusSquared = radius * radius;

    // Get cells that overlap with the search radius
    const searchBounds = new Phaser.Geom.Rectangle(
      x - radius,
      y - radius,
      radius * 2,
      radius * 2
    );

    // This is a simplified version - in a full implementation, we'd query the spatial grid
    // For now, we'll use the spatial grid's internal structure
    // Note: This requires exposing some internal methods or restructuring

    return results;
  }

  /**
   * Check if two entities are within a certain distance
   */
  areEntitiesNear(
    entity1: BaseEntity,
    entity2: BaseEntity,
    maxDistance: number
  ): boolean {
    if (!entity1 || !entity1.sprite || !entity1.sprite.active) return false;
    if (!entity2 || !entity2.sprite || !entity2.sprite.active) return false;

    const distance = Phaser.Math.Distance.Between(
      entity1.sprite.x,
      entity1.sprite.y,
      entity2.sprite.x,
      entity2.sprite.y
    );

    return distance <= maxDistance;
  }

  /**
   * Get the spatial grid (for systems that need direct access)
   */
  getSpatialGrid(): SpatialGrid {
    return this.spatialGrid;
  }

  /**
   * Get statistics for debugging
   */
  getStats() {
    return this.spatialGrid.getStats();
  }

  /**
   * Clear the collision manager
   */
  clear(): void {
    this.spatialGrid.clear();
  }
}

