import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ItemManager } from '../../../src/systems/item/ItemManager';

describe('ItemManager', () => {
  let mockScene: any;
  let itemManager: ItemManager;
  let mockCharacter: any;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    itemManager = new ItemManager(mockScene);
    
    mockCharacter = {
      sprite: { x: 100, y: 200 },
      takeDamage: vi.fn(),
      getHealth: vi.fn(() => 80),
      getMaxHealth: vi.fn(() => 100),
    };
  });

  describe('Item Spawning', () => {
    it('should spawn item at location', () => {
      const item = itemManager.spawnItem(100, 200, 'apple');
      expect(item).toBeDefined();
      expect(item.getItemType()).toBe('apple');
    });

    it('should spawn random item', () => {
      const item = itemManager.spawnRandomItem(100, 200);
      expect(item).toBeDefined();
      expect(item.getItemType()).toBeDefined();
    });
  });

  describe('Item Collection', () => {
    it('should detect item in range', () => {
      const item = itemManager.spawnItem(100, 200, 'apple');
      const collected = itemManager.checkCollection(mockCharacter, 25);
      
      expect(collected).toBe(item);
    });

    it('should not detect item out of range', () => {
      itemManager.spawnItem(200, 200, 'apple');
      const collected = itemManager.checkCollection(mockCharacter, 25);
      
      expect(collected).toBeNull();
    });
  });

  describe('Score System', () => {
    it('should track score', () => {
      expect(itemManager.getScore()).toBe(0);
    });

    it('should update score on item collection', () => {
      mockScene.events.emit = vi.fn();
      const item = itemManager.spawnItem(100, 200, 'moneyBag');
      item.collect(mockCharacter);
      
      // Score should be updated via event
      expect(mockScene.events.emit).toHaveBeenCalled();
    });
  });

  describe('Lives System', () => {
    it('should track lives', () => {
      expect(itemManager.getLives()).toBe(3);
    });
  });
});

