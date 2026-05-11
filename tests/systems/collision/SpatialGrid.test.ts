import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpatialGrid } from '../../../src/systems/collision/SpatialGrid';

// Minimal mock helpers — avoid depending on real Hitbox/Entity constructors

const makeHitbox = (x: number, y: number, w = 30, h = 30, ownerX = x, ownerY = y) => ({
  active: true,
  x, y,
  owner: { x: ownerX, y: ownerY, active: true },
  getWorldBounds: () => new (global.Phaser as any).Geom.Rectangle(x, y, w, h),
});

const makeEntity = (x: number, y: number, w = 32, h = 48, active = true) => ({
  sprite: {
    x, y,
    active,
    body: { x, y, width: w, height: h },
    getData: vi.fn(),
  },
});

describe('SpatialGrid', () => {
  let grid: SpatialGrid;

  beforeEach(() => {
    grid = new SpatialGrid(200); // 200-px cells
  });

  describe('insertHitbox', () => {
    it('adds an active hitbox to the grid', () => {
      grid.insertHitbox(makeHitbox(50, 50) as any);
      expect(grid.getStats().totalHitboxes).toBeGreaterThan(0);
    });

    it('ignores inactive hitboxes', () => {
      const hb = { ...makeHitbox(50, 50), active: false };
      grid.insertHitbox(hb as any);
      expect(grid.getStats().totalHitboxes).toBe(0);
    });
  });

  describe('insertEntity', () => {
    it('adds an active entity to the grid', () => {
      grid.insertEntity(makeEntity(100, 100) as any);
      expect(grid.getStats().totalEntities).toBeGreaterThan(0);
    });

    it('ignores entities with inactive sprites', () => {
      grid.insertEntity(makeEntity(100, 100, 32, 48, false) as any);
      expect(grid.getStats().totalEntities).toBe(0);
    });

    it('ignores null entity gracefully', () => {
      expect(() => grid.insertEntity(null as any)).not.toThrow();
      expect(grid.getStats().totalEntities).toBe(0);
    });
  });

  describe('getCollisionPairs', () => {
    it('returns a pair when hitbox and entity share a cell', () => {
      // Both at 50,50 → cell (0,0) with 200-px cells
      grid.insertHitbox(makeHitbox(50, 50) as any);
      grid.insertEntity(makeEntity(60, 60) as any);
      expect(grid.getCollisionPairs().length).toBeGreaterThan(0);
    });

    it('skips pairs where entity sprite === hitbox owner', () => {
      const ownerSprite = {
        x: 100, y: 100, active: true,
        body: { x: 100, y: 100, width: 32, height: 48 },
        getData: vi.fn(),
      };
      const hitbox = {
        active: true,
        x: 100, y: 100,
        owner: ownerSprite,
        getWorldBounds: () => new (global.Phaser as any).Geom.Rectangle(100, 100, 30, 30),
      };
      // Entity whose sprite IS the owner
      const entity = { sprite: ownerSprite };
      grid.insertHitbox(hitbox as any);
      grid.insertEntity(entity as any);
      expect(grid.getCollisionPairs().length).toBe(0);
    });

    it('returns empty array when grid is empty', () => {
      expect(grid.getCollisionPairs()).toEqual([]);
    });
  });

  describe('queryEntities', () => {
    it('returns entities whose cell overlaps the query bounds', () => {
      grid.insertEntity(makeEntity(100, 100) as any);
      const bounds = new (global.Phaser as any).Geom.Rectangle(0, 0, 300, 300);
      const results = grid.queryEntities(bounds);
      expect(results.length).toBe(1);
    });

    it('does not return entities outside the query region', () => {
      // entity at (500,500) → cell (2,2); query (0,0–100,100) → cell (0,0)
      const entity = makeEntity(500, 500);
      grid.insertEntity(entity as any);
      const bounds = new (global.Phaser as any).Geom.Rectangle(0, 0, 100, 100);
      const results = grid.queryEntities(bounds);
      expect(results).not.toContain(entity);
    });

    it('deduplicates entities that span multiple cells', () => {
      // Large entity (100×100) starting at 150,150 overlaps cells (0,0) and (1,1)
      grid.insertEntity(makeEntity(150, 150, 100, 100) as any);
      const bounds = new (global.Phaser as any).Geom.Rectangle(0, 0, 500, 500);
      expect(grid.queryEntities(bounds).length).toBe(1);
    });
  });

  describe('clear', () => {
    it('removes all cells, hitboxes, and entities', () => {
      grid.insertEntity(makeEntity(100, 100) as any);
      grid.insertHitbox(makeHitbox(100, 100) as any);
      grid.clear();
      const s = grid.getStats();
      expect(s.cellCount).toBe(0);
      expect(s.totalEntities).toBe(0);
      expect(s.totalHitboxes).toBe(0);
    });
  });

  describe('getStats', () => {
    it('reports correct cell count and totals', () => {
      grid.insertEntity(makeEntity(100, 100) as any);
      grid.insertHitbox(makeHitbox(50, 50) as any);
      const s = grid.getStats();
      expect(s.cellCount).toBeGreaterThan(0);
      expect(s.totalEntities).toBeGreaterThan(0);
      expect(s.totalHitboxes).toBeGreaterThan(0);
    });
  });

  describe('setWorldBounds', () => {
    it('updates bounds without throwing', () => {
      const bounds = new (global.Phaser as any).Geom.Rectangle(0, 0, 4000, 2000);
      expect(() => grid.setWorldBounds(bounds)).not.toThrow();
    });
  });
});
