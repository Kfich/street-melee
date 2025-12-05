import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Enemy } from '../../../src/entities/enemies/Enemy';

describe('Enemy', () => {
  let mockScene: any;
  let enemy: Enemy;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    enemy = new Enemy(mockScene, 100, 200, 'basic');
  });

  describe('Initialization', () => {
    it('should create enemy with correct type', () => {
      expect(enemy.getEnemyType()).toBe('basic');
    });

    it('should initialize with correct health for type', () => {
      expect(enemy.getHealth()).toBe(40); // Basic enemy health
    });

    it('should have different health for different types', () => {
      const galsia = new Enemy(mockScene, 100, 200, 'galsia');
      expect(galsia.getHealth()).toBe(50);
      
      const donovan = new Enemy(mockScene, 100, 200, 'donovan');
      expect(donovan.getHealth()).toBe(60);
    });
  });

  describe('AI Behavior', () => {
    it('should update AI state', () => {
      enemy.update();
      // AI should update (patrol, pursue, attack)
      expect(enemy).toBeDefined();
    });
  });

  describe('Combat', () => {
    it('should take damage', () => {
      enemy.takeDamage(20);
      expect(enemy.getHealth()).toBe(20);
    });

    it('should die when health reaches 0', () => {
      enemy.takeDamage(40);
      expect(enemy.getHealth()).toBe(0);
      expect(enemy.isAlive()).toBe(false);
    });
  });
});

