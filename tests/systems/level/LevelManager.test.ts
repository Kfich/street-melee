import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LevelManager, LevelData } from '../../../src/systems/level/LevelManager';

// Build a minimal LevelData that won't spawn any entities or create background layers
const makeLevelData = (overrides: Partial<LevelData> = {}): LevelData => ({
  id: 'test_level',
  name: 'Test Level',
  width: 2000,
  height: 576,
  backgroundLayers: 0, // 0 → createBackground() loop does nothing
  scrollSpeed: 0,
  cameraBounds: { minX: 0, maxX: 2000, minY: 0, maxY: 576 },
  spawnPoints: [],    // empty → initializeSpawns() is a no-op
  waves: [],
  checkpoints: [],
  ...overrides,
});

describe('LevelManager', () => {
  let mockScene: any;
  let lm: LevelManager;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    mockScene.time.now = 0;
    lm = new LevelManager(mockScene, makeLevelData());
  });

  // ── Basic getters ─────────────────────────────────────────────────────────

  describe('basic getters', () => {
    it('returns the level id', () => {
      expect(lm.getLevelId()).toBe('test_level');
    });

    it('returns the level name', () => {
      expect(lm.getLevelName()).toBe('Test Level');
    });

    it('returns the level width', () => {
      expect(lm.getLevelWidth()).toBe(2000);
    });

    it('returns the level height', () => {
      expect(lm.getLevelHeight()).toBe(576);
    });

    it('returns the raw level data object', () => {
      expect(lm.getLevelData().id).toBe('test_level');
    });

    it('starts at level number 1', () => {
      expect(lm.getCurrentLevel()).toBe(1);
    });

    it('starts at wave 0', () => {
      expect(lm.getCurrentWave()).toBe(0);
    });

    it('starts with 0 enemies spawned', () => {
      expect(lm.getTotalEnemiesSpawned()).toBe(0);
      expect(lm.getRemainingEnemiesCount()).toBe(0);
    });
  });

  // ── Checkpoints ───────────────────────────────────────────────────────────

  describe('checkpoints', () => {
    beforeEach(() => {
      lm = new LevelManager(mockScene, makeLevelData({
        checkpoints: [
          { x: 500, y: 476, id: 'cp1', activated: false },
          { x: 1000, y: 476, id: 'cp2', activated: false },
        ],
      }));
    });

    it('activates a checkpoint and returns true', () => {
      expect(lm.activateCheckpoint('cp1')).toBe(true);
    });

    it('does not activate an already-activated checkpoint', () => {
      lm.activateCheckpoint('cp1');
      expect(lm.activateCheckpoint('cp1')).toBe(false);
    });

    it('returns false for non-existent checkpoint id', () => {
      expect(lm.activateCheckpoint('ghost')).toBe(false);
    });

    it('finds a nearby checkpoint by X position', () => {
      const cp = lm.getCheckpointAt(500, 476, 50);
      expect(cp?.id).toBe('cp1');
    });

    it('returns null when no checkpoint is within range', () => {
      expect(lm.getCheckpointAt(9999, 476, 50)).toBeNull();
    });

    it('returns null for already-activated checkpoints', () => {
      lm.activateCheckpoint('cp1');
      expect(lm.getCheckpointAt(500, 476, 50)).toBeNull();
    });

    it('getActiveCheckpoint returns the highest-X activated checkpoint', () => {
      lm.activateCheckpoint('cp1');
      lm.activateCheckpoint('cp2');
      expect(lm.getActiveCheckpoint()?.id).toBe('cp2');
    });

    it('getActiveCheckpoint returns null when nothing is activated', () => {
      expect(lm.getActiveCheckpoint()).toBeNull();
    });
  });

  // ── Wave management ───────────────────────────────────────────────────────

  describe('wave management', () => {
    it('areAllWavesComplete returns true when no waves defined', () => {
      expect(lm.areAllWavesComplete()).toBe(true);
    });

    it('areAllWavesComplete returns false when waves have not been triggered', () => {
      const lm2 = new LevelManager(mockScene, makeLevelData({
        waves: [{ waveNumber: 1, triggerX: 500, enemies: [] }],
      }));
      expect(lm2.areAllWavesComplete()).toBe(false);
    });

    it('isLevelComplete returns true with no waves and all enemies defeated', () => {
      // No waves → areAllWavesComplete() is true; allEnemiesDefeated is true
      expect(lm.isLevelComplete(true)).toBe(true);
    });

    it('isLevelComplete returns false when waves are not done', () => {
      const lm2 = new LevelManager(mockScene, makeLevelData({
        waves: [{ waveNumber: 1, triggerX: 500, enemies: [] }],
        requiresAllWaves: true,
      }));
      expect(lm2.isLevelComplete(true)).toBe(false);
    });
  });

  // ── onEnemyDefeated ───────────────────────────────────────────────────────

  describe('onEnemyDefeated', () => {
    it('does not throw for an id that was never tracked', () => {
      expect(() => lm.onEnemyDefeated('phantom_id')).not.toThrow();
    });
  });

  // ── activateNextBoss ──────────────────────────────────────────────────────

  describe('activateNextBoss', () => {
    it('returns false when no boss spawn points exist', () => {
      expect(lm.activateNextBoss()).toBe(false);
    });

    it('returns true and defers spawn when an inactive boss exists with delay', () => {
      // Use a large delay so spawnEntity is queued via delayedCall, not called immediately
      const lm2 = new LevelManager(mockScene, makeLevelData({
        spawnPoints: [
          { x: 1500, y: 476, type: 'boss', bossType: 'blizz', active: false, delay: 99999 },
        ],
      }));
      expect(lm2.activateNextBoss()).toBe(true);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('runs without error', () => {
      expect(() => lm.update(0, 100)).not.toThrow();
    });

    it('emits levelEndReached when player passes endTriggerX', () => {
      const lm2 = new LevelManager(mockScene, makeLevelData({ endTriggerX: 1000 }));
      const spy = vi.spyOn(mockScene.events, 'emit');
      lm2.update(1000, 1200);
      expect(spy).toHaveBeenCalledWith('levelEndReached');
    });

    it('only emits levelEndReached once across multiple frames', () => {
      const lm2 = new LevelManager(mockScene, makeLevelData({ endTriggerX: 500 }));
      const spy = vi.spyOn(mockScene.events, 'emit');
      lm2.update(500, 600);
      lm2.update(500, 700);
      const hits = spy.mock.calls.filter(c => c[0] === 'levelEndReached');
      expect(hits.length).toBe(1);
    });
  });

  // ── destroy ───────────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('cleans up without throwing', () => {
      expect(() => lm.destroy()).not.toThrow();
    });
  });
});
