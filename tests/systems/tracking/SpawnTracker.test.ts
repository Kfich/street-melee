import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpawnTracker } from '../../../src/systems/tracking/SpawnTracker';

describe('SpawnTracker', () => {
  let mockScene: any;
  let tracker: SpawnTracker;
  let eventHandlers: Record<string, Function>;

  beforeEach(() => {
    eventHandlers = {};
    mockScene = {
      events: {
        on: vi.fn((event: string, handler: Function) => {
          eventHandlers[event] = handler;
        }),
        off: vi.fn(),
        emit: vi.fn(),
      },
    };
    tracker = new SpawnTracker(mockScene as any);
  });

  describe('event listener registration', () => {
    it('registers all four event listeners on construction', () => {
      expect(mockScene.events.on).toHaveBeenCalledWith('weaponSpawned', expect.any(Function));
      expect(mockScene.events.on).toHaveBeenCalledWith('itemSpawned', expect.any(Function));
      expect(mockScene.events.on).toHaveBeenCalledWith('itemCollected', expect.any(Function));
      expect(mockScene.events.on).toHaveBeenCalledWith('weaponPickedUp', expect.any(Function));
    });
  });

  describe('trackWeaponSpawn', () => {
    it('increments weapon spawn count', () => {
      tracker.setSceneId('s1');
      tracker.trackWeaponSpawn({ getWeaponType: () => 'pipe' });
      expect(tracker.getCurrentSceneStats()?.weapons.spawned).toBe(1);
    });

    it('tracks counts by weapon type', () => {
      tracker.setSceneId('s1');
      tracker.trackWeaponSpawn({ getWeaponType: () => 'pipe' });
      tracker.trackWeaponSpawn({ getWeaponType: () => 'pipe' });
      tracker.trackWeaponSpawn({ getWeaponType: () => 'bat' });
      const stats = tracker.getCurrentSceneStats();
      expect(stats?.weapons.byType.get('pipe')).toBe(2);
      expect(stats?.weapons.byType.get('bat')).toBe(1);
    });

    it('handles weapon without getWeaponType gracefully', () => {
      tracker.setSceneId('s1');
      expect(() => tracker.trackWeaponSpawn({})).not.toThrow();
    });
  });

  describe('trackItemSpawn', () => {
    it('increments item spawn count', () => {
      tracker.setSceneId('s1');
      tracker.trackItemSpawn({ getItemType: () => 'apple' });
      expect(tracker.getCurrentSceneStats()?.items.spawned).toBe(1);
    });

    it('tracks counts by item type', () => {
      tracker.setSceneId('s1');
      tracker.trackItemSpawn({ getItemType: () => 'apple' });
      tracker.trackItemSpawn({ getItemType: () => 'apple' });
      const stats = tracker.getCurrentSceneStats();
      expect(stats?.items.byType.get('apple')).toBe(2);
    });
  });

  describe('setSceneId', () => {
    it('creates fresh stats for a new scene', () => {
      tracker.setSceneId('s1');
      expect(tracker.getCurrentSceneStats()).toBeDefined();
    });

    it('resets counters when switching scenes', () => {
      tracker.setSceneId('s1');
      tracker.trackWeaponSpawn({ getWeaponType: () => 'pipe' });
      tracker.setSceneId('s2');
      expect(tracker.getCurrentSceneStats()?.weapons.spawned).toBe(0);
    });

    it('preserves the previous scene stats after switching', () => {
      tracker.setSceneId('s1');
      tracker.trackWeaponSpawn({ getWeaponType: () => 'pipe' });
      tracker.setSceneId('s2');
      expect(tracker.getSceneStats('s1')?.weapons.spawned).toBe(1);
    });
  });

  describe('updateActiveCounts', () => {
    it('updates active weapon and item counts', () => {
      tracker.setSceneId('s1');
      tracker.updateActiveCounts(5, 3);
      const stats = tracker.getCurrentSceneStats();
      expect(stats?.weapons.active).toBe(5);
      expect(stats?.items.active).toBe(3);
    });
  });

  describe('global totals across scenes', () => {
    it('sums weapon spawns across scenes', () => {
      tracker.setSceneId('s1');
      tracker.trackWeaponSpawn({ getWeaponType: () => 'pipe' });
      tracker.setSceneId('s2');
      tracker.trackWeaponSpawn({ getWeaponType: () => 'bat' });
      expect(tracker.getTotalWeaponsSpawned()).toBe(2);
    });

    it('sums item spawns across scenes', () => {
      tracker.setSceneId('s1');
      tracker.trackItemSpawn({ getItemType: () => 'apple' });
      tracker.setSceneId('s2');
      tracker.trackItemSpawn({ getItemType: () => 'chicken' });
      expect(tracker.getTotalItemsSpawned()).toBe(2);
    });
  });

  describe('event-driven collection tracking', () => {
    it('increments item collection count on itemCollected event', () => {
      tracker.setSceneId('s1');
      eventHandlers['itemCollected']?.();
      expect(tracker.getCurrentSceneStats()?.items.collected).toBe(1);
    });

    it('increments weapon collection count on weaponPickedUp event', () => {
      tracker.setSceneId('s1');
      eventHandlers['weaponPickedUp']?.();
      expect(tracker.getCurrentSceneStats()?.weapons.collected).toBe(1);
    });

    it('tracks weapon spawns via scene event', () => {
      tracker.setSceneId('s1');
      eventHandlers['weaponSpawned']?.({ getWeaponType: () => 'knife' });
      expect(tracker.getCurrentSceneStats()?.weapons.spawned).toBe(1);
    });
  });

  describe('getAllSceneStats', () => {
    it('returns a map containing all registered scenes', () => {
      tracker.setSceneId('s1');
      tracker.setSceneId('s2');
      expect(tracker.getAllSceneStats().size).toBe(2);
    });
  });

  describe('reset', () => {
    it('clears all stats and counters', () => {
      tracker.setSceneId('s1');
      tracker.trackWeaponSpawn({ getWeaponType: () => 'pipe' });
      tracker.reset();
      expect(tracker.getTotalWeaponsSpawned()).toBe(0);
      expect(tracker.getAllSceneStats().size).toBe(0);
    });
  });

  describe('destroy', () => {
    it('unregisters all event listeners', () => {
      tracker.destroy();
      expect(mockScene.events.off).toHaveBeenCalledWith('weaponSpawned');
      expect(mockScene.events.off).toHaveBeenCalledWith('itemSpawned');
      expect(mockScene.events.off).toHaveBeenCalledWith('itemCollected');
      expect(mockScene.events.off).toHaveBeenCalledWith('weaponPickedUp');
    });
  });
});
