import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hitbox } from '../../../src/systems/combat/Hitbox';

describe('Hitbox', () => {
  let mockOwner: any;
  let hitbox: Hitbox;

  beforeEach(() => {
    mockOwner = {
      x: 100,
      y: 200,
      flipX: false,
      body: {}
    };
    hitbox = new Hitbox(mockOwner, 20, -10, 30, 40, 20, { x: 150, y: 0 }, false);
  });

  describe('Initialization', () => {
    it('should create hitbox with correct properties', () => {
      expect(hitbox.damage).toBe(20);
      expect(hitbox.width).toBe(30);
      expect(hitbox.height).toBe(40);
      expect(hitbox.isKnockdown).toBe(false);
    });

    it('should be inactive initially', () => {
      expect(hitbox.active).toBe(false);
    });
  });

  describe('Activation', () => {
    it('should activate hitbox', () => {
      hitbox.activate();
      expect(hitbox.active).toBe(true);
    });

    it('should deactivate hitbox', () => {
      hitbox.activate();
      hitbox.deactivate();
      expect(hitbox.active).toBe(false);
    });
  });

  describe('World Bounds', () => {
    it('should calculate world bounds correctly', () => {
      const bounds = hitbox.getWorldBounds();
      expect(bounds.x).toBe(120); // owner.x + offsetX (facing right)
      expect(bounds.y).toBe(190); // owner.y + offsetY
      expect(bounds.width).toBe(30);
      expect(bounds.height).toBe(40);
    });

    it('should adjust bounds for left-facing owner', () => {
      mockOwner.flipX = true;
      const bounds = hitbox.getWorldBounds();
      expect(bounds.x).toBeLessThan(100); // Should be to the left
    });
  });

  describe('Intersection', () => {
    it('should check intersection with sprite', () => {
      const mockSprite = {
        body: {
          x: 120,
          y: 190,
          width: 32,
          height: 48
        }
      };
      
      vi.spyOn(global.Phaser.Geom.Rectangle, 'Overlaps').mockReturnValue(true);
      const intersects = hitbox.intersects(mockSprite as any);
      expect(intersects).toBe(true);
    });
  });
});

