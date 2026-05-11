import { describe, it, expect, beforeEach } from 'vitest';
import { ComboSystem } from '../../../src/systems/combat/ComboSystem';

describe('ComboSystem', () => {
  let mockScene: any;
  let comboSystem: ComboSystem;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    comboSystem = new ComboSystem(mockScene);
  });

  describe('Combo Initialization', () => {
    it('should initialize with combo chains for all characters', () => {
      const axelCombo = comboSystem.startCombo(0, 'axel');
      expect(axelCombo).not.toBeNull();
      expect(axelCombo?.name).toBe('Jab');
    });

    it('should have different combos for different characters', () => {
      const axelCombo = comboSystem.startCombo(0, 'axel');
      const blazeCombo = comboSystem.startCombo(1, 'blaze');
      
      expect(axelCombo?.name).toBe('Jab');
      expect(blazeCombo?.name).toBe('Palm');
    });
  });

  describe('Combo Progression', () => {
    it('should start combo on first attack', () => {
      const move = comboSystem.startCombo(0, 'axel');
      expect(move).not.toBeNull();
      expect(comboSystem.hasActiveCombo(0)).toBe(true);
    });

    it('should continue combo within time window', () => {
      comboSystem.startCombo(0, 'axel');
      // Simulate quick follow-up
      const nextMove = comboSystem.continueCombo(0);
      expect(nextMove).not.toBeNull();
      expect(nextMove?.name).toBe('Jab'); // Second move in combo
    });

    it('should reset combo after time window expires', async () => {
      comboSystem.startCombo(0, 'axel');
      // Wait longer than combo window (500ms)
      await new Promise(resolve => setTimeout(resolve, 600));
      const nextMove = comboSystem.continueCombo(0);
      expect(nextMove).toBeNull();
      expect(comboSystem.hasActiveCombo(0)).toBe(false);
    });

    it('should complete combo after all moves', () => {
      comboSystem.startCombo(0, 'axel');
      // Continue through all moves (Axel has 5 moves)
      let move = comboSystem.continueCombo(0);
      expect(move).not.toBeNull();
      expect(move?.name).toBe('Jab');
      
      move = comboSystem.continueCombo(0);
      expect(move).not.toBeNull();
      expect(move?.name).toBe('Straight');
      
      move = comboSystem.continueCombo(0);
      expect(move).not.toBeNull();
      expect(move?.name).toBe('Mid-Kick');
      
      move = comboSystem.continueCombo(0);
      expect(move).not.toBeNull();
      expect(move?.name).toBe('High Kick');
      expect(move?.isKnockdown).toBe(true); // Final move is knockdown
      
      // Final move should complete combo
      move = comboSystem.continueCombo(0);
      expect(move).toBeNull();
      expect(comboSystem.hasActiveCombo(0)).toBe(false);
    });
  });

  describe('Combo Damage Scaling', () => {
    it('should have increasing damage through combo', () => {
      const firstMove = comboSystem.startCombo(0, 'axel');
      const secondMove = comboSystem.continueCombo(0);
      
      expect(firstMove?.damage).toBe(10);
      expect(secondMove?.damage).toBe(10);
      
      // Later moves should have more damage
      comboSystem.continueCombo(0);
      const laterMove = comboSystem.continueCombo(0);
      expect(laterMove?.damage).toBeGreaterThan(10);
    });

    it('should have knockdown on final combo hit', () => {
      comboSystem.startCombo(0, 'axel');
      // Axel has 5 moves (0-4). startCombo returns move 0; advance to move 3
      // so the next continueCombo call lands on move 4 (High Kick, isKnockdown).
      for (let i = 0; i < 3; i++) {
        comboSystem.continueCombo(0);
      }
      const finalMove = comboSystem.continueCombo(0);
      expect(finalMove?.isKnockdown).toBe(true);
    });
  });
});

