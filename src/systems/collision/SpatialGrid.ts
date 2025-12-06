import Phaser from 'phaser';
import { BaseEntity } from '../../entities/base/BaseEntity';
import { Hitbox } from '../combat/Hitbox';

/**
 * Spatial grid for efficient collision detection
 * Divides the game world into cells and only checks collisions between entities in the same or adjacent cells
 */
export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, GridCell>;
  // worldBounds stored for setWorldBounds method, may be used in future implementations
  // @ts-ignore - Stored for API consistency, set by setWorldBounds()
  private worldBounds: Phaser.Geom.Rectangle;

  constructor(cellSize: number = 200, worldBounds?: Phaser.Geom.Rectangle) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.worldBounds = worldBounds || new Phaser.Geom.Rectangle(0, 0, 2000, 1000);
  }


  /**
   * Get or create a grid cell
   */
  private getCell(key: string): GridCell {
    if (!this.grid.has(key)) {
      this.grid.set(key, {
        hitboxes: new Set(),
        entities: new Set()
      });
    }
    return this.grid.get(key)!;
  }

  /**
   * Get all cell keys that a rectangle overlaps
   */
  private getOverlappingCells(bounds: Phaser.Geom.Rectangle): string[] {
    const minX = Math.floor(bounds.x / this.cellSize);
    const maxX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const minY = Math.floor(bounds.y / this.cellSize);
    const maxY = Math.floor((bounds.y + bounds.height) / this.cellSize);

    const keys: string[] = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        keys.push(`${x},${y}`);
      }
    }
    return keys;
  }

  /**
   * Insert a hitbox into the grid
   */
  insertHitbox(hitbox: Hitbox): void {
    if (!hitbox.active) return;

    const bounds = hitbox.getWorldBounds();
    const cellKeys = this.getOverlappingCells(bounds);

    cellKeys.forEach(key => {
      const cell = this.getCell(key);
      cell.hitboxes.add(hitbox);
    });
  }

  /**
   * Insert an entity into the grid
   */
  insertEntity(entity: BaseEntity): void {
    if (!entity || !entity.sprite || !entity.sprite.active) return;

    const body = entity.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const bounds = new Phaser.Geom.Rectangle(
      body.x,
      body.y,
      body.width,
      body.height
    );

    const cellKeys = this.getOverlappingCells(bounds);

    cellKeys.forEach(key => {
      const cell = this.getCell(key);
      cell.entities.add(entity);
    });
  }

  /**
   * Get potential collision pairs (hitbox, entity) from the grid
   * Only returns pairs that are in the same or adjacent cells
   */
  getCollisionPairs(): Array<{ hitbox: Hitbox; entity: BaseEntity }> {
    const pairs: Array<{ hitbox: Hitbox; entity: BaseEntity }> = [];
    const processedPairs = new Set<string>();

    // Check each cell
    this.grid.forEach((cell, _cellKey) => {
      // Check hitboxes against entities in the same cell
      cell.hitboxes.forEach(hitbox => {
        if (!hitbox.active) return;
        if (!hitbox.owner || !hitbox.owner.active) return;

        cell.entities.forEach(entity => {
          if (!entity || !entity.sprite || !entity.sprite.active) return;

          // Skip if hitting self
          if (entity.sprite === hitbox.owner) return;

          // Create unique pair key to avoid duplicates
          // Use a more reliable key based on object references
          const hitboxId = `${hitbox.owner.x}_${hitbox.owner.y}_${hitbox.x}_${hitbox.y}`;
          const entityId = `${entity.sprite.x}_${entity.sprite.y}`;
          const pairKey = `${hitboxId}_${entityId}`;
          
          if (processedPairs.has(pairKey)) return;
          processedPairs.add(pairKey);

          pairs.push({ hitbox, entity });
        });
      });
    });

    return pairs;
  }

  /**
   * Get all entities in cells that overlap with a given rectangle
   * Useful for area queries (pickup detection, AI awareness, etc.)
   */
  queryEntities(bounds: Phaser.Geom.Rectangle): BaseEntity[] {
    const results: BaseEntity[] = [];
    const cellKeys = this.getOverlappingCells(bounds);
    const seenEntities = new Set<BaseEntity>();

    cellKeys.forEach(key => {
      const cell = this.grid.get(key);
      if (!cell) return;

      cell.entities.forEach(entity => {
        if (!seenEntities.has(entity)) {
          seenEntities.add(entity);
          results.push(entity);
        }
      });
    });

    return results;
  }

  /**
   * Clear the grid
   */
  clear(): void {
    this.grid.forEach(cell => {
      cell.hitboxes.clear();
      cell.entities.clear();
    });
    this.grid.clear();
  }

  /**
   * Update world bounds (useful when room size changes)
   */
  setWorldBounds(bounds: Phaser.Geom.Rectangle): void {
    this.worldBounds = bounds;
  }

  /**
   * Get grid statistics for debugging
   */
  getStats(): { cellCount: number; totalHitboxes: number; totalEntities: number } {
    let totalHitboxes = 0;
    let totalEntities = 0;

    this.grid.forEach(cell => {
      totalHitboxes += cell.hitboxes.size;
      totalEntities += cell.entities.size;
    });

    return {
      cellCount: this.grid.size,
      totalHitboxes,
      totalEntities
    };
  }
}

/**
 * Represents a single cell in the spatial grid
 */
interface GridCell {
  hitboxes: Set<Hitbox>;
  entities: Set<BaseEntity>;
}

