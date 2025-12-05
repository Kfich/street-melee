import { BaseEntity } from '../entities/base/BaseEntity';

/**
 * Manages all game entities
 */
export class EntityManager {
  private entities: Set<BaseEntity> = new Set();

  /**
   * Add an entity
   */
  add(entity: BaseEntity): void {
    this.entities.add(entity);
  }

  /**
   * Remove an entity
   */
  remove(entity: BaseEntity): void {
    this.entities.delete(entity);
    entity.destroy();
  }

  /**
   * Update all entities
   */
  update(): void {
    this.entities.forEach(entity => entity.update());
  }

  /**
   * Get all entities
   */
  getAll(): BaseEntity[] {
    return Array.from(this.entities);
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.forEach(entity => entity.destroy());
    this.entities.clear();
  }

  /**
   * Get entity count
   */
  getCount(): number {
    return this.entities.size;
  }
}

