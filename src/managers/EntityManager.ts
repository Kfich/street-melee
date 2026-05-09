import { BaseEntity } from '../entities/base/BaseEntity';
import { Player } from '../entities/characters/Player';
import { Enemy } from '../entities/enemies/Enemy';
import { Boss } from '../entities/bosses/Boss';
import { Weapon } from '../entities/weapons/Weapon';
import { Item } from '../entities/items/Item';

/**
 * Manages all game entities with optimized caching
 */
export class EntityManager {
  private entities: Set<BaseEntity> = new Set();
  
  // Cached arrays with dirty flags
  private cachedAll: BaseEntity[] | null = null;
  private cachedPlayers: Player[] | null = null;
  private cachedEnemies: Enemy[] | null = null;
  private cachedBosses: Boss[] | null = null;
  private cachedWeapons: Weapon[] | null = null;
  private cachedItems: Item[] | null = null;
  private isDirty: boolean = true;

  /**
   * Add an entity
   */
  add(entity: BaseEntity): void {
    this.entities.add(entity);
    this.markDirty();
  }

  /**
   * Remove an entity (and destroy its sprite)
   */
  remove(entity: BaseEntity): void {
    this.entities.delete(entity);
    entity.destroy();
    this.markDirty();
  }

  /**
   * Detach an entity from tracking without destroying it.
   * Use this before running a death/exit animation so the entity stops
   * receiving AI updates but its sprite remains alive for the tween.
   */
  detach(entity: BaseEntity): void {
    this.entities.delete(entity);
    this.markDirty();
  }

  /**
   * Update all entities
   */
  update(): void {
    // Clean up destroyed entities during update
    const toRemove: BaseEntity[] = [];
    this.entities.forEach(entity => {
      if (entity.sprite && entity.sprite.active) {
        entity.update();
      } else {
        toRemove.push(entity);
      }
    });
    
    // Remove destroyed entities
    if (toRemove.length > 0) {
      toRemove.forEach(entity => {
        this.entities.delete(entity);
      });
      this.markDirty();
    }
  }

  /**
   * Get all entities (cached)
   */
  getAll(): BaseEntity[] {
    if (this.isDirty || this.cachedAll === null) {
      this.cachedAll = Array.from(this.entities);
    }
    return this.cachedAll;
  }

  /**
   * Get all players (cached)
   */
  getPlayers(): Player[] {
    if (this.isDirty || this.cachedPlayers === null) {
      this.cachedPlayers = Array.from(this.entities).filter(
        (e): e is Player => e instanceof Player && e.sprite && e.sprite.active
      );
    }
    return this.cachedPlayers;
  }

  /**
   * Get all enemies (cached)
   */
  getEnemies(): Enemy[] {
    if (this.isDirty || this.cachedEnemies === null) {
      this.cachedEnemies = Array.from(this.entities).filter(
        (e): e is Enemy => e instanceof Enemy && e.sprite && e.sprite.active
      );
    }
    return this.cachedEnemies;
  }

  /**
   * Get all bosses (cached)
   */
  getBosses(): Boss[] {
    if (this.isDirty || this.cachedBosses === null) {
      this.cachedBosses = Array.from(this.entities).filter(
        (e): e is Boss => e instanceof Boss && e.sprite && e.sprite.active
      );
    }
    return this.cachedBosses;
  }

  /**
   * Get all weapons (cached)
   */
  getWeapons(): Weapon[] {
    if (this.isDirty || this.cachedWeapons === null) {
      const weapons: Weapon[] = [];
      for (const e of this.entities) {
        if (e instanceof Weapon && e.sprite && e.sprite.active) {
          weapons.push(e);
        }
      }
      this.cachedWeapons = weapons;
    }
    return this.cachedWeapons;
  }

  /**
   * Get all items (cached)
   */
  getItems(): Item[] {
    if (this.isDirty || this.cachedItems === null) {
      this.cachedItems = Array.from(this.entities).filter(
        (e): e is Item => e instanceof Item && e.sprite && e.sprite.active
      );
    }
    return this.cachedItems;
  }

  /**
   * Mark cache as dirty (needs refresh)
   */
  private markDirty(): void {
    this.isDirty = true;
    this.cachedAll = null;
    this.cachedPlayers = null;
    this.cachedEnemies = null;
    this.cachedBosses = null;
    this.cachedWeapons = null;
    this.cachedItems = null;
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.forEach(entity => entity.destroy());
    this.entities.clear();
    this.markDirty();
  }

  /**
   * Get entity count
   */
  getCount(): number {
    return this.entities.size;
  }

  /**
   * Get active entity count (entities with active sprites)
   */
  getActiveCount(): number {
    let count = 0;
    this.entities.forEach(entity => {
      if (entity.sprite && entity.sprite.active) {
        count++;
      }
    });
    return count;
  }
}

