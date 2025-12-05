import { describe, it, expect, beforeEach } from 'vitest';
import { InputManager } from '../../../src/systems/input/InputManager';

describe('InputManager', () => {
  let mockScene: any;
  let inputManager: InputManager;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    inputManager = new InputManager(mockScene);
  });

  describe('Input Retrieval', () => {
    it('should return empty input when no keys pressed', () => {
      const input = inputManager.getPlayerInput(0);
      expect(input.left).toBe(false);
      expect(input.right).toBe(false);
      expect(input.jump).toBe(false);
      expect(input.attack).toBe(false);
      expect(input.special).toBe(false);
    });

    it('should handle multiple players', () => {
      const player1Input = inputManager.getPlayerInput(0);
      const player2Input = inputManager.getPlayerInput(1);
      
      expect(player1Input).toBeDefined();
      expect(player2Input).toBeDefined();
    });
  });

  describe('Key State Checking', () => {
    it('should check if key was just pressed', () => {
      const wasPressed = inputManager.wasKeyJustPressed(0, 'attack');
      expect(typeof wasPressed).toBe('boolean');
    });
  });
});

