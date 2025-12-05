import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeaponManager } from '../../../src/systems/weapon/WeaponManager';

describe('WeaponManager', () => {
  let mockScene: any;
  let weaponManager: WeaponManager;
  let mockCharacter: any;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    weaponManager = new WeaponManager(mockScene);
    
    mockCharacter = {
      sprite: { x: 100, y: 200 },
      hasWeapon: vi.fn(() => false)
    };
  });

  describe('Weapon Spawning', () => {
    it('should spawn weapon at location', () => {
      const weapon = weaponManager.spawnWeapon(100, 200, 'pipe');
      expect(weapon).toBeDefined();
      expect(weapon.getWeaponType()).toBe('pipe');
    });

    it('should track spawned weapons', () => {
      weaponManager.spawnWeapon(100, 200, 'pipe');
      weaponManager.spawnWeapon(200, 200, 'bat');
      
      const all = weaponManager.getAll();
      expect(all.length).toBe(2);
    });
  });

  describe('Weapon Pickup', () => {
    it('should detect weapon in range', () => {
      const weapon = weaponManager.spawnWeapon(100, 200, 'pipe');
      const pickedUp = weaponManager.checkPickup(mockCharacter, 30);
      
      expect(pickedUp).toBe(weapon);
    });

    it('should not detect weapon out of range', () => {
      weaponManager.spawnWeapon(200, 200, 'pipe');
      const pickedUp = weaponManager.checkPickup(mockCharacter, 30);
      
      expect(pickedUp).toBeNull();
    });
  });

  describe('Weapon Updates', () => {
    it('should update all weapons', () => {
      const weapon = weaponManager.spawnWeapon(100, 200, 'pipe');
      const updateSpy = vi.spyOn(weapon, 'update');
      
      weaponManager.update();
      expect(updateSpy).toHaveBeenCalled();
    });
  });
});

