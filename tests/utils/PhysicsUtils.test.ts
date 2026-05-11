import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PhysicsUtils } from '../../src/utils/PhysicsUtils';

describe('PhysicsUtils', () => {
  let mockSprite: any;

  beforeEach(() => {
    mockSprite = {
      x: 0, y: 0,
      active: true,
      setDepth: vi.fn().mockReturnThis(),
      body: {
        x: 0, y: 0,
        width: 32, height: 48,
        touching: { down: false },
        velocity: { x: 0, y: 0 },
        setVelocityX: vi.fn((v: number) => { mockSprite.body.velocity.x = v; }),
      },
    };
  });

  describe('isGrounded', () => {
    it('returns true when body is touching down', () => {
      mockSprite.body.touching.down = true;
      expect(PhysicsUtils.isGrounded(mockSprite)).toBe(true);
    });

    it('returns false when not touching down', () => {
      mockSprite.body.touching.down = false;
      expect(PhysicsUtils.isGrounded(mockSprite)).toBe(false);
    });
  });

  describe('applyKnockback', () => {
    it('applies positive X velocity for right direction', () => {
      PhysicsUtils.applyKnockback(mockSprite, 'right', 200);
      expect(mockSprite.body.setVelocityX).toHaveBeenCalledWith(200);
    });

    it('applies negative X velocity for left direction', () => {
      PhysicsUtils.applyKnockback(mockSprite, 'left', 200);
      expect(mockSprite.body.setVelocityX).toHaveBeenCalledWith(-200);
    });

    it('uses default force of 200 when omitted', () => {
      PhysicsUtils.applyKnockback(mockSprite, 'right');
      expect(mockSprite.body.setVelocityX).toHaveBeenCalledWith(200);
    });
  });

  describe('checkCollision', () => {
    it('returns true for overlapping sprites', () => {
      const s1: any = { body: { x: 0,   y: 0,   width: 32, height: 32 } };
      const s2: any = { body: { x: 16,  y: 16,  width: 32, height: 32 } };
      expect(PhysicsUtils.checkCollision(s1, s2)).toBe(true);
    });

    it('returns false for non-overlapping sprites', () => {
      const s1: any = { body: { x: 0,   y: 0,   width: 32, height: 32 } };
      const s2: any = { body: { x: 200, y: 200, width: 32, height: 32 } };
      expect(PhysicsUtils.checkCollision(s1, s2)).toBe(false);
    });

    it('returns false when sprites are adjacent but not touching', () => {
      const s1: any = { body: { x: 0,  y: 0, width: 32, height: 32 } };
      const s2: any = { body: { x: 32, y: 0, width: 32, height: 32 } };
      // x: 0 + 32 = 32, which is NOT > 32 → no overlap
      expect(PhysicsUtils.checkCollision(s1, s2)).toBe(false);
    });
  });

  describe('updateDepth', () => {
    it('sets depth to sprite y value', () => {
      mockSprite.y = 350;
      PhysicsUtils.updateDepth(mockSprite);
      expect(mockSprite.setDepth).toHaveBeenCalledWith(350);
    });

    it('does nothing for inactive sprites', () => {
      mockSprite.active = false;
      PhysicsUtils.updateDepth(mockSprite);
      expect(mockSprite.setDepth).not.toHaveBeenCalled();
    });
  });
});
