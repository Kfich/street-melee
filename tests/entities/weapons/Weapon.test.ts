import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Weapon } from '../../../src/entities/weapons/Weapon';

describe('Weapon', () => {
  let mockScene: any;
  let weapon: Weapon;
  let mockOwner: any;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    weapon = new Weapon(mockScene, 100, 200, 'pipe');
    mockOwner = {
      x: 100,
      y: 200,
      flipX: false,
      body: {}
    };
  });

  describe('Initialization', () => {
    it('should create weapon with correct type', () => {
      expect(weapon.getWeaponType()).toBe('pipe');
    });

    it('should start with 0 throw count', () => {
      expect(weapon.getThrowCount()).toBe(0);
    });

    it('should not be held initially', () => {
      expect(weapon.isHeld()).toBe(false);
    });
  });

  describe('Pickup', () => {
    it('should be held after pickup', () => {
      weapon.pickup(mockOwner);
      expect(weapon.isHeld()).toBe(true);
    });
  });

  describe('Dropping', () => {
    it('should increment throw count on drop', () => {
      weapon.pickup(mockOwner);
      weapon.drop();
      expect(weapon.getThrowCount()).toBe(1);
      expect(weapon.isHeld()).toBe(false);
    });

    it('should destroy after max throws', () => {
      weapon.pickup(mockOwner);
      weapon.drop();
      weapon.pickup(mockOwner);
      weapon.drop();
      weapon.pickup(mockOwner);
      weapon.drop();
      
      expect(weapon.shouldDestroy()).toBe(true);
    });
  });

  describe('Throwing', () => {
    it('should throw weapon in correct direction', () => {
      weapon.pickup(mockOwner);
      weapon.throw('right', 400);
      
      expect(weapon.getThrowCount()).toBe(1);
      expect(weapon.isHeld()).toBe(false);
    });

    it('should create hitbox when thrown', () => {
      weapon.pickup(mockOwner);
      mockScene.events.emit = vi.fn();
      weapon.throw('right', 400);
      
      expect(mockScene.events.emit).toHaveBeenCalledWith('hitboxCreated', expect.anything());
    });
  });

  describe('Attack Hitbox', () => {
    it('should create attack hitbox with correct damage', () => {
      const hitbox = weapon.createAttackHitbox(mockOwner, true);
      expect(hitbox.damage).toBe(20); // Pipe damage
      expect(hitbox.active).toBe(false);
    });
  });
});

