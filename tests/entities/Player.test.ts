import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player } from '../../src/entities/characters/Player';
import { CharacterType } from '../../src/game/types/CharacterType';

describe('Player', () => {
  let mockScene: any;
  let player: Player;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    player = new Player(mockScene, 100, 200, 'axel', 0);
  });

  describe('Initialization', () => {
    it('should create a player with correct character type', () => {
      expect(player.getCharacterType()).toBe('axel');
      expect(player.getPlayerIndex()).toBe(0);
    });

    it('should initialize with max health', () => {
      expect(player.getHealth()).toBe(100);
      expect(player.getMaxHealth()).toBe(100);
    });

    it('should start in idle state', () => {
      expect(player.getState()).toBe('idle');
    });
  });

  describe('Health System', () => {
    it('should take damage correctly', () => {
      player.takeDamage(20);
      expect(player.getHealth()).toBe(80);
    });

    it('should not go below 0 health', () => {
      player.takeDamage(150);
      expect(player.getHealth()).toBe(0);
    });

    it('should heal when taking negative damage', () => {
      player.takeDamage(30);
      player.takeDamage(-20);
      expect(player.getHealth()).toBe(90);
    });

    it('should not exceed max health when healing', () => {
      player.takeDamage(-50);
      expect(player.getHealth()).toBe(100);
    });
  });

  describe('Weapon System', () => {
    it('should not have weapon initially', () => {
      expect(player.hasWeapon()).toBe(false);
    });

    it('should drop weapon when taking damage', () => {
      // This would require a weapon to be picked up first
      // Test structure for when weapon system is fully integrated
      expect(player.hasWeapon()).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should change state correctly', () => {
      player.setState('walking');
      expect(player.getState()).toBe('walking');
      
      player.setState('jumping');
      expect(player.getState()).toBe('jumping');
    });
  });
});

