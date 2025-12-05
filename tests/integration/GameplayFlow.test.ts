import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player } from '../../src/entities/characters/Player';
import { ComboSystem } from '../../src/systems/combat/ComboSystem';
import { CombatSystem } from '../../src/systems/combat/CombatSystem';
import { InputManager } from '../../src/systems/input/InputManager';

describe('Gameplay Flow Integration', () => {
  let mockScene: any;
  let player: Player;
  let comboSystem: ComboSystem;
  let combatSystem: CombatSystem;
  let inputManager: InputManager;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    comboSystem = new ComboSystem(mockScene);
    combatSystem = new CombatSystem(mockScene);
    inputManager = new InputManager(mockScene);
    
    player = new Player(
      mockScene,
      100,
      200,
      'axel',
      0,
      undefined,
      comboSystem
    );
  });

  describe('Combo Flow', () => {
    it('should perform combo when attack is mashed', () => {
      const input = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        attack: true,
        special: false
      };
      
      // First attack starts combo
      player.handleInput(input);
      expect(comboSystem.hasActiveCombo(0)).toBe(true);
    });
  });

  describe('Combat Flow', () => {
    it('should register hitbox when attack is performed', () => {
      mockScene.events.emit = vi.fn();
      
      const input = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        attack: true,
        special: false
      };
      
      player.handleInput(input);
      
      expect(mockScene.events.emit).toHaveBeenCalledWith('hitboxCreated', expect.anything());
    });
  });
});

