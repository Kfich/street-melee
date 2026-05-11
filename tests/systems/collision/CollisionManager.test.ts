import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionManager } from '../../../src/systems/collision/CollisionManager';

const makeEntity = (x: number, y: number, active = true) => ({
  sprite: { x, y, active },
});

describe('CollisionManager', () => {
  let mockScene: any;
  let manager: CollisionManager;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    manager = new CollisionManager(mockScene);
  });

  describe('areEntitiesNear', () => {
    it('returns true when entities are within the given distance', () => {
      const e1 = makeEntity(0, 0);
      const e2 = makeEntity(50, 0);
      expect(manager.areEntitiesNear(e1 as any, e2 as any, 100)).toBe(true);
    });

    it('returns false when distance exceeds maxDistance', () => {
      const e1 = makeEntity(0, 0);
      const e2 = makeEntity(200, 0);
      expect(manager.areEntitiesNear(e1 as any, e2 as any, 100)).toBe(false);
    });

    it('returns false when entity1 is null', () => {
      expect(manager.areEntitiesNear(null as any, makeEntity(0, 0) as any, 100)).toBe(false);
    });

    it('returns false when entity1 sprite is inactive', () => {
      expect(manager.areEntitiesNear(makeEntity(0, 0, false) as any, makeEntity(10, 0) as any, 100)).toBe(false);
    });

    it('returns false when entity2 sprite is inactive', () => {
      expect(manager.areEntitiesNear(makeEntity(0, 0) as any, makeEntity(10, 0, false) as any, 100)).toBe(false);
    });

    it('returns true when entities are exactly at maxDistance', () => {
      const e1 = makeEntity(0, 0);
      const e2 = makeEntity(100, 0);
      // Distance = 100, maxDistance = 100 → distance <= maxDistance → true
      expect(manager.areEntitiesNear(e1 as any, e2 as any, 100)).toBe(true);
    });
  });

  describe('getSpatialGrid', () => {
    it('returns a spatial grid with expected methods', () => {
      const sg = manager.getSpatialGrid();
      expect(sg).toBeDefined();
      expect(typeof sg.insertEntity).toBe('function');
      expect(typeof sg.insertHitbox).toBe('function');
      expect(typeof sg.getCollisionPairs).toBe('function');
    });
  });

  describe('getStats', () => {
    it('returns an object with cellCount, totalHitboxes, totalEntities', () => {
      const s = manager.getStats();
      expect(s).toHaveProperty('cellCount');
      expect(s).toHaveProperty('totalHitboxes');
      expect(s).toHaveProperty('totalEntities');
    });
  });

  describe('setWorldBounds', () => {
    it('accepts new bounds without throwing', () => {
      const b = new (global.Phaser as any).Geom.Rectangle(0, 0, 4000, 2000);
      expect(() => manager.setWorldBounds(b)).not.toThrow();
    });
  });

  describe('clear', () => {
    it('empties the spatial grid', () => {
      manager.clear();
      expect(manager.getStats().totalEntities).toBe(0);
    });
  });

  describe('getEntitiesNearPosition', () => {
    it('returns an array (stub implementation returns [])', () => {
      const result = manager.getEntitiesNearPosition(100, 100, 200);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
