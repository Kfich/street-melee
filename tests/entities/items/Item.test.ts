import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Item } from '../../../src/entities/items/Item';

describe('Item', () => {
  let mockScene: any;
  let item: Item;
  let mockCharacter: any;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    item = new Item(mockScene, 100, 200, 'apple');
    mockCharacter = {
      getHealth: vi.fn(() => 80),
      getMaxHealth: vi.fn(() => 100),
      takeDamage: vi.fn(),
      sprite: { x: 100, y: 200 }
    };
  });

  describe('Initialization', () => {
    it('should create item with correct type', () => {
      expect(item.getItemType()).toBe('apple');
    });

    it('should not be collected initially', () => {
      expect(item.isCollected()).toBe(false);
    });
  });

  describe('Collection', () => {
    it('should be collected when character picks it up', () => {
      const result = item.collect(mockCharacter);
      expect(result).toBe(true);
      expect(item.isCollected()).toBe(true);
    });

    it('should restore health for health items', () => {
      item.collect(mockCharacter);
      expect(mockCharacter.takeDamage).toHaveBeenCalledWith(-20); // Negative = healing
    });

    it('should emit events for point items', () => {
      const moneyBag = new Item(mockScene, 100, 200, 'moneyBag');
      mockScene.events.emit = vi.fn();
      moneyBag.collect(mockCharacter);
      
      expect(mockScene.events.emit).toHaveBeenCalledWith('itemCollected', expect.objectContaining({
        type: 'moneyBag',
        points: 500
      }));
    });

    it('should emit events for life items', () => {
      const oneUp = new Item(mockScene, 100, 200, 'oneUp');
      mockScene.events.emit = vi.fn();
      oneUp.collect(mockCharacter);
      
      expect(mockScene.events.emit).toHaveBeenCalledWith('lifeGained', expect.objectContaining({
        type: 'oneUp',
        lives: 1
      }));
    });
  });

  describe('Item Types', () => {
    it('should have different effects for different types', () => {
      const apple = new Item(mockScene, 100, 200, 'apple');
      const chicken = new Item(mockScene, 100, 200, 'chicken');
      
      expect(apple.getStats().effect.healthRestore).toBe(20);
      expect(chicken.getStats().effect.healthRestore).toBe(50);
    });
  });
});

