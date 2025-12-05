import { describe, it, expect, beforeEach } from 'vitest';
import { SpecialMoveSystem } from '../../../src/systems/combat/SpecialMoveSystem';

describe('SpecialMoveSystem', () => {
  let mockScene: any;
  let specialMoveSystem: SpecialMoveSystem;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    specialMoveSystem = new SpecialMoveSystem(mockScene);
  });

  describe('Special Move Retrieval', () => {
    it('should get forward special move for Axel', () => {
      const move = specialMoveSystem.getSpecialMove('axel', true);
      expect(move).not.toBeNull();
      expect(move?.name).toBe('Dragon Smash');
      expect(move?.damage).toBe(30);
    });

    it('should get neutral special move for Axel', () => {
      const move = specialMoveSystem.getSpecialMove('axel', false);
      expect(move).not.toBeNull();
      expect(move?.name).toBe('Tornado Kick');
    });

    it('should have different moves for different characters', () => {
      const axelMove = specialMoveSystem.getSpecialMove('axel', true);
      const blazeMove = specialMoveSystem.getSpecialMove('blaze', true);
      
      expect(axelMove?.name).not.toBe(blazeMove?.name);
    });

    it('should have character-specific damage values', () => {
      const maxMove = specialMoveSystem.getSpecialMove('max', true);
      expect(maxMove?.damage).toBe(35); // Max has highest damage
      
      const sammyMove = specialMoveSystem.getSpecialMove('sammy', true);
      expect(sammyMove?.damage).toBe(20); // Sammy has lower damage
    });
  });

  describe('Hitbox Creation', () => {
    it('should create hitbox for special move', () => {
      const mockOwner = {
        x: 100,
        y: 200,
        flipX: false,
        body: {}
      };
      
      const hitbox = specialMoveSystem.createSpecialMoveHitbox(
        'axel',
        mockOwner as any,
        true,
        true
      );
      
      expect(hitbox).not.toBeNull();
      expect(hitbox?.damage).toBe(30);
    });
  });
});

