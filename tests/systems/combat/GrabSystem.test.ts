import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GrabSystem } from '../../../src/systems/combat/GrabSystem';
import { BaseCharacter } from '../../../src/entities/characters/BaseCharacter';

describe('GrabSystem', () => {
  let mockScene: any;
  let grabSystem: GrabSystem;
  let mockGraber: any;
  let mockTarget: any;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    grabSystem = new GrabSystem(mockScene);
    
    mockGraber = {
      sprite: { x: 100, y: 200, flipX: false },
      getState: vi.fn(() => 'idle'),
      setState: vi.fn(),
      isFacingRight: vi.fn(() => true),
      isAlive: vi.fn(() => true)
    };
    
    mockTarget = {
      sprite: { x: 120, y: 200, body: { setVelocity: vi.fn() } },
      getState: vi.fn(() => 'idle'),
      setState: vi.fn(),
      takeDamage: vi.fn(),
      isAlive: vi.fn(() => true)
    };
  });

  describe('Grab Attempt', () => {
    it('should attempt grab when in range', () => {
      // Mock distance calculation
      vi.spyOn(global.Phaser.Math.Distance, 'Between').mockReturnValue(20);
      
      const result = grabSystem.attemptGrab(mockGraber, mockTarget, 35);
      expect(result).toBe(true);
      expect(grabSystem.isGrabbing(mockGraber)).toBe(true);
    });

    it('should fail grab when out of range', () => {
      vi.spyOn(global.Phaser.Math.Distance, 'Between').mockReturnValue(50);
      
      const result = grabSystem.attemptGrab(mockGraber, mockTarget, 35);
      expect(result).toBe(false);
    });

    it('should not grab if already grabbing', () => {
      vi.spyOn(global.Phaser.Math.Distance, 'Between').mockReturnValue(20);
      grabSystem.attemptGrab(mockGraber, mockTarget, 35);
      
      const result = grabSystem.attemptGrab(mockGraber, mockTarget, 35);
      expect(result).toBe(false);
    });
  });

  describe('Throw Mechanics', () => {
    beforeEach(() => {
      vi.spyOn(global.Phaser.Math.Distance, 'Between').mockReturnValue(20);
      grabSystem.attemptGrab(mockGraber, mockTarget, 35);
    });

    it('should perform left throw', () => {
      const result = grabSystem.performThrow(mockGraber, 'left', false);
      expect(result).toBe(true);
      expect(mockTarget.takeDamage).toHaveBeenCalledWith(20);
      expect(grabSystem.isGrabbing(mockGraber)).toBe(false);
    });

    it('should perform right throw', () => {
      const result = grabSystem.performThrow(mockGraber, 'right', false);
      expect(result).toBe(true);
      expect(mockTarget.takeDamage).toHaveBeenCalled();
    });

    it('should perform slam throw with screen shake', () => {
      mockScene.cameras.main.shake = vi.fn();
      const result = grabSystem.performThrow(mockGraber, 'down', true);
      
      expect(result).toBe(true);
      expect(mockTarget.takeDamage).toHaveBeenCalledWith(30);
      expect(mockScene.cameras.main.shake).toHaveBeenCalled();
      expect(mockTarget.setState).toHaveBeenCalledWith('knockedDown');
    });

    it('should perform up throw', () => {
      const result = grabSystem.performThrow(mockGraber, 'up', false);
      expect(result).toBe(true);
      expect(mockTarget.takeDamage).toHaveBeenCalledWith(25);
    });
  });

  describe('Vault Mechanics', () => {
    beforeEach(() => {
      vi.spyOn(global.Phaser.Math.Distance, 'Between').mockReturnValue(20);
      grabSystem.attemptGrab(mockGraber, mockTarget, 35);
    });

    it('should vault to switch grab position', () => {
      const grabInfo = grabSystem.getGrabInfo(mockGraber);
      const initialType = grabInfo?.type;
      
      const result = grabSystem.vault(mockGraber);
      expect(result).toBe(true);
      
      const newGrabInfo = grabSystem.getGrabInfo(mockGraber);
      expect(newGrabInfo?.type).not.toBe(initialType);
    });
  });
});

