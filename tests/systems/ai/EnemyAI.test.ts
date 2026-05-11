import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnemyAI } from '../../../src/systems/ai/EnemyAI';

// Minimal mock factories — avoid importing real Enemy/Player/EntityManager

const makePlayer = (x: number, y: number, active = true) => ({
  sprite: { x, y, active, getData: vi.fn() },
});

const makeEnemy = (x: number, y: number, health = 100, maxHealth = 100, speed = 80) => ({
  sprite: {
    x, y,
    active: true,
    body: {
      velocity: { x: 0, y: 0 },
      blocked: { left: false, right: false },
    },
    getData: vi.fn((key: string) => (key === 'isEnemy' ? true : undefined)),
  },
  getHealth: vi.fn(() => health),
  getMaxHealth: vi.fn(() => maxHealth),
  stats: { speed },
});

const makeEntityManager = (players: any[] = [], all: any[] = []) => ({
  getPlayers: vi.fn(() => players),
  getAll: vi.fn(() => all),
});

describe('EnemyAI', () => {
  let entityManager: ReturnType<typeof makeEntityManager>;
  let ai: EnemyAI;

  beforeEach(() => {
    entityManager = makeEntityManager();
    ai = new EnemyAI(entityManager as any);
  });

  describe('findBestTarget', () => {
    it('returns null when no players exist', () => {
      const enemy = makeEnemy(100, 200);
      expect(ai.findBestTarget(enemy as any)).toBeNull();
    });

    it('returns the closest active player', () => {
      const far  = makePlayer(500, 200);
      const near = makePlayer(150, 200);
      entityManager.getPlayers.mockReturnValue([far, near]);

      const enemy = makeEnemy(100, 200);
      expect(ai.findBestTarget(enemy as any)).toBe(near);
    });

    it('skips inactive players', () => {
      const inactive = makePlayer(110, 200, false);
      const active   = makePlayer(300, 200, true);
      entityManager.getPlayers.mockReturnValue([inactive, active]);

      const enemy = makeEnemy(100, 200);
      expect(ai.findBestTarget(enemy as any)).toBe(active);
    });

    it('returns null when all players are inactive', () => {
      entityManager.getPlayers.mockReturnValue([makePlayer(200, 200, false)]);
      expect(ai.findBestTarget(makeEnemy(100, 200) as any)).toBeNull();
    });
  });

  describe('enhanceMovement', () => {
    it('returns base velocity when enemy sprite is inactive', () => {
      const enemy = { sprite: { active: false } };
      expect(ai.enhanceMovement(enemy as any, 80)).toBe(80);
    });

    it('returns base velocity when enemy has no physics body', () => {
      const enemy = { sprite: { active: true, x: 0, y: 0, body: null } };
      expect(ai.enhanceMovement(enemy as any, 80)).toBe(80);
    });

    it('clamps enhanced velocity to the enemy max speed', () => {
      const enemy = makeEnemy(100, 200, 100, 100, 80);
      const result = ai.enhanceMovement(enemy as any, 9999);
      expect(Math.abs(result)).toBeLessThanOrEqual(80);
    });

    it('returns negative clamped velocity for large negative input', () => {
      const enemy = makeEnemy(100, 200, 100, 100, 80);
      const result = ai.enhanceMovement(enemy as any, -9999);
      expect(result).toBeGreaterThanOrEqual(-80);
    });

    it('triggers retreat when health ratio is below 30%', () => {
      // health=25, maxHealth=100 → 25% → retreat
      const player = makePlayer(50, 200);
      entityManager.getPlayers.mockReturnValue([player]);

      // Enemy is to the right of player; retreat should move right (+)
      const enemy = makeEnemy(200, 200, 25, 100, 80);
      const result = ai.enhanceMovement(enemy as any, 0);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('setSpatialGrid', () => {
    it('accepts a spatial grid without throwing', () => {
      const mockGrid = { queryEntities: vi.fn(() => []) };
      expect(() => ai.setSpatialGrid(mockGrid as any)).not.toThrow();
    });

    it('uses spatial grid for nearby entity queries after setting', () => {
      const mockGrid = { queryEntities: vi.fn(() => []) };
      ai.setSpatialGrid(mockGrid as any);

      // Call enhanceMovement — it internally calls getNearbyEntities
      const enemy = makeEnemy(100, 200);
      ai.enhanceMovement(enemy as any, 50);
      expect(mockGrid.queryEntities).toHaveBeenCalled();
    });
  });
});
