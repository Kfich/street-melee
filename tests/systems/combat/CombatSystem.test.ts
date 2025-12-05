import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CombatSystem } from '../../../src/systems/combat/CombatSystem';
import { Hitbox } from '../../../src/systems/combat/Hitbox';
import { BaseEntity } from '../../../src/entities/base/BaseEntity';

describe('CombatSystem', () => {
  let mockScene: any;
  let combatSystem: CombatSystem;
  let mockEntity1: any;
  let mockEntity2: any;
  let mockHitbox: Hitbox;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    combatSystem = new CombatSystem(mockScene);
    
    // Create mock entities
    mockEntity1 = {
      sprite: {
        x: 100,
        y: 200,
        body: { velocity: { x: 0, y: 0 } },
        flipX: false
      },
      takeDamage: vi.fn(),
      getState: vi.fn(() => 'idle'),
      setState: vi.fn(),
      getHealth: vi.fn(() => 100),
      isAlive: vi.fn(() => true)
    };
    
    mockEntity2 = {
      sprite: {
        x: 150,
        y: 200,
        body: { velocity: { x: 0, y: 0 } },
        flipX: false
      },
      takeDamage: vi.fn(),
      getState: vi.fn(() => 'idle'),
      setState: vi.fn(),
      getHealth: vi.fn(() => 100),
      isAlive: vi.fn(() => true)
    };

    // Create mock hitbox
    const mockOwner = {
      x: 100,
      y: 200,
      flipX: false,
      body: {}
    };
    mockHitbox = new Hitbox(mockOwner as any, 20, -10, 30, 40, 20, { x: 150, y: 0 }, false);
  });

  describe('Hitbox Registration', () => {
    it('should register a hitbox', () => {
      combatSystem.registerHitbox(mockHitbox);
      // Hitbox should be active
      expect(mockHitbox.active).toBe(true);
    });
  });

  describe('Damage Application', () => {
    it('should apply damage when hitbox intersects target', () => {
      // Mock intersection
      vi.spyOn(mockHitbox, 'intersects').mockReturnValue(true);
      
      combatSystem.registerHitbox(mockHitbox);
      combatSystem.update([mockEntity1, mockEntity2]);
      
      // Should apply damage
      expect(mockEntity1.takeDamage).toHaveBeenCalledWith(20);
    });

    it('should not damage the hitbox owner', () => {
      // Owner should not be damaged
      const ownerEntity = {
        sprite: mockHitbox.owner,
        takeDamage: vi.fn(),
        getState: vi.fn(() => 'idle'),
        setState: vi.fn(),
        getHealth: vi.fn(() => 100),
        isAlive: vi.fn(() => true)
      };
      
      vi.spyOn(mockHitbox, 'intersects').mockReturnValue(true);
      combatSystem.registerHitbox(mockHitbox);
      combatSystem.update([ownerEntity]);
      
      // Owner should not take damage from own hitbox
      expect(ownerEntity.takeDamage).not.toHaveBeenCalled();
    });

    it('should apply knockback on hit', () => {
      vi.spyOn(mockHitbox, 'intersects').mockReturnValue(true);
      
      combatSystem.registerHitbox(mockHitbox);
      combatSystem.update([mockEntity1]);
      
      // Should apply knockback (velocity change)
      expect(mockEntity1.sprite.body.velocity.x).not.toBe(0);
    });

    it('should handle knockdown damage', () => {
      const knockdownHitbox = new Hitbox(
        mockHitbox.owner,
        20,
        -10,
        30,
        40,
        50,
        { x: 150, y: 0 },
        true // Knockdown
      );
      
      vi.spyOn(knockdownHitbox, 'intersects').mockReturnValue(true);
      
      combatSystem.registerHitbox(knockdownHitbox);
      combatSystem.update([mockEntity1]);
      
      // Should set knocked down state
      expect(mockEntity1.setState).toHaveBeenCalledWith('knockedDown');
    });
  });

  describe('Hit Prevention', () => {
    it('should not hit same target twice with same hitbox', () => {
      vi.spyOn(mockHitbox, 'intersects').mockReturnValue(true);
      
      combatSystem.registerHitbox(mockHitbox);
      combatSystem.update([mockEntity1]);
      combatSystem.update([mockEntity1]); // Second update
      
      // Should only hit once
      expect(mockEntity1.takeDamage).toHaveBeenCalledTimes(1);
    });
  });
});

